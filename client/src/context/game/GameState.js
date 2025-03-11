import React, { useReducer, useEffect, useCallback } from 'react';
import axios from 'axios';
import io from 'socket.io-client';
import { v4 as uuidv4 } from 'uuid';
import { Chess } from 'chess.js';
import gameContext from './gameContext';
import gameReducer from './gameReducer';
import {
  CREATE_GAME,
  JOIN_GAME,
  GAME_JOINED,
  GAME_STARTED,
  MAKE_MOVE,
  MOVE_MADE,
  GAME_OVER,
  CREATE_AI_GAME,
  REQUEST_AI_MOVE,
  RESIGN_GAME,
  OFFER_DRAW,
  DRAW_OFFERED,
  RESPOND_TO_DRAW,
  DRAW_RESPONSE,
  SET_FEN,
  CLEAR_GAME,
  GAME_ERROR,
  PLAYER_DISCONNECTED,
  PLAYER_RECONNECTED,
  MESSAGE_SENT,
  MESSAGE_RECEIVED,
  CLEAR_MESSAGES,
  GET_HISTORY,
  GET_ACTIVE_GAMES,
  LOADING,
  CLEAR_LOADING
} from '../types';

// Socket.io client
let socket;

const GameState = props => {
  const initialState = {
    gameId: null,
    playerId: localStorage.getItem('playerId') || null,
    playerName: localStorage.getItem('playerName') || null,
    playerColor: null,
    opponentName: null,
    opponentId: null,
    isAgainstAI: false,
    aiLevel: 3,
    fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1', // Starting position
    status: null, // waiting, active, checkmate, draw, stalemate, etc.
    result: null, // 1-0, 0-1, 1/2-1/2
    turn: 'w',
    drawOffer: null,
    isSpectator: false,
    spectatorCount: 0,
    moveHistory: [],
    messages: [],
    gameHistory: [],
    activeGames: [],
    loading: false,
    error: null
  };

  const [state, dispatch] = useReducer(gameReducer, initialState);

  // Initialize socket connection
  useEffect(() => {
    // Connect to the server
    // In development, socket will use the proxy from package.json
    // In production, it will use the current host
    const socketUrl = process.env.NODE_ENV === 'production' 
      ? window.location.origin
      : 'http://localhost:5000';
    
    socket = io(socketUrl);

    // Clean up on unmount
    return () => {
      if (socket) socket.disconnect();
    };
  }, []);

  // Setup socket listeners when socket is available
  useEffect(() => {
    if (!socket) return;

    // Game joined
    socket.on('gameJoined', data => {
      dispatch({
        type: GAME_JOINED,
        payload: data
      });
    });

    // Game started
    socket.on('gameStarted', data => {
      dispatch({
        type: GAME_STARTED,
        payload: data
      });
    });

    // Move made
    socket.on('moveMade', data => {
      dispatch({
        type: MOVE_MADE,
        payload: data
      });

      // If it's an AI game and it's AI's turn, request an AI move
      if (state.isAgainstAI && data.turn === 'b' && !data.gameOver) {
        socket.emit('requestAiMove', { gameId: state.gameId });
      }
    });

    // Game over
    socket.on('gameOver', data => {
      dispatch({
        type: GAME_OVER,
        payload: data
      });
    });

    // Draw offered
    socket.on('drawOffered', data => {
      dispatch({
        type: DRAW_OFFERED,
        payload: data
      });
    });

    // Draw response
    socket.on('drawDeclined', data => {
      dispatch({
        type: DRAW_RESPONSE,
        payload: { accepted: false, by: data.by }
      });
    });

    // Player disconnected
    socket.on('playerDisconnected', data => {
      dispatch({
        type: PLAYER_DISCONNECTED,
        payload: data
      });
    });

    // Player reconnected
    socket.on('opponentReconnected', data => {
      dispatch({
        type: PLAYER_RECONNECTED,
        payload: data
      });
    });

    // Chat message received
    socket.on('messageReceived', data => {
      dispatch({
        type: MESSAGE_RECEIVED,
        payload: data
      });
    });

    // Spectator join notification
    socket.on('spectatorJoined', data => {
      console.log('Spectator joined:', data);
    });

    // Socket errors
    socket.on('error', data => {
      dispatch({
        type: GAME_ERROR,
        payload: data.message
      });
    });

    // Handle socket reconnection
    socket.on('reconnect', () => {
      if (state.gameId && state.playerId) {
        joinGame(state.gameId, state.playerName, state.playerId);
      }
    });
  }, [state.gameId, state.playerId, state.playerName, state.isAgainstAI]);

  // Create a multiplayer game
  const createGame = async (playerName, timeControl = 'none') => {
    setLoading();
    
    try {
      const res = await axios.post('/api/games/create', {
        gameType: 'multiplayer',
        timeControl
      });

      const playerId = localStorage.getItem('playerId') || uuidv4();
      localStorage.setItem('playerId', playerId);
      localStorage.setItem('playerName', playerName);

      dispatch({
        type: CREATE_GAME,
        payload: {
          gameId: res.data.game.id,
          playerId,
          playerName
        }
      });

      // Join the game via socket
      socket.emit('joinGame', {
        gameId: res.data.game.id,
        playerName,
        playerId
      });

      return res.data.game.id;
    } catch (err) {
      dispatch({
        type: GAME_ERROR,
        payload: err.response?.data.msg || 'Error creating game'
      });
    }
  };

  // Join an existing game
  const joinGame = (gameId, playerName, playerId = null) => {
    setLoading();
    
    if (!playerId) {
      playerId = uuidv4();
      localStorage.setItem('playerId', playerId);
    }
    
    localStorage.setItem('playerName', playerName);

    dispatch({
      type: JOIN_GAME,
      payload: {
        gameId,
        playerId,
        playerName
      }
    });

    // Join the game via socket
    socket.emit('joinGame', {
      gameId,
      playerName,
      playerId
    });

    return gameId;
  };

  // Make a move
  const makeMove = (move) => {
    if (!state.gameId || !state.playerId) return;

    // Validate turn
    if ((state.playerColor === 'w' && state.turn !== 'w') ||
        (state.playerColor === 'b' && state.turn !== 'b')) {
      return;
    }

    dispatch({
      type: MAKE_MOVE,
      payload: move
    });

    // Send move to server
    socket.emit('makeMove', {
      gameId: state.gameId,
      move,
      playerId: state.playerId
    });
  };

  // Create a game against AI
  const createAIGame = (playerName, aiLevel = 3) => {
    setLoading();
    
    const playerId = localStorage.getItem('playerId') || uuidv4();
    localStorage.setItem('playerId', playerId);
    localStorage.setItem('playerName', playerName);

    dispatch({
      type: CREATE_AI_GAME,
      payload: {
        playerId,
        playerName,
        aiLevel
      }
    });

    // Create AI game via socket
    socket.emit('createAiGame', {
      playerName,
      playerId,
      aiLevel
    });
  };

  // Request an AI move
  const requestAIMove = useCallback(() => {
    if (!state.gameId || !state.isAgainstAI) return;

    dispatch({
      type: REQUEST_AI_MOVE
    });

    // Request AI move via socket
    socket.emit('requestAiMove', {
      gameId: state.gameId
    });
  }, [state.gameId, state.isAgainstAI]);

  // Resign from a game
  const resignGame = () => {
    if (!state.gameId || !state.playerId) return;

    dispatch({
      type: RESIGN_GAME
    });

    // Send resignation to server
    socket.emit('resign', {
      gameId: state.gameId,
      playerId: state.playerId
    });
  };

  // Offer a draw
  const offerDraw = () => {
    if (!state.gameId || !state.playerId) return;

    dispatch({
      type: OFFER_DRAW
    });

    // Send draw offer to server
    socket.emit('offerDraw', {
      gameId: state.gameId,
      playerId: state.playerId
    });
  };

  // Respond to a draw offer
  const respondToDraw = (accepted) => {
    if (!state.gameId || !state.playerId) return;

    dispatch({
      type: RESPOND_TO_DRAW,
      payload: { accepted }
    });

    // Send draw response to server
    socket.emit('respondToDraw', {
      gameId: state.gameId,
      playerId: state.playerId,
      accepted
    });
  };

  // Send a chat message
  const sendMessage = (message) => {
    if (!state.gameId || !state.playerId) return;

    const messageData = {
      playerId: state.playerId,
      playerName: state.playerName,
      message,
      timestamp: new Date().toISOString()
    };

    dispatch({
      type: MESSAGE_SENT,
      payload: messageData
    });

    // Send message to server
    socket.emit('sendMessage', {
      gameId: state.gameId,
      playerId: state.playerId,
      message
    });
  };

  // Get user's game history
  const getGameHistory = async () => {
    setLoading();
    
    try {
      const res = await axios.get('/api/games/user/history');

      dispatch({
        type: GET_HISTORY,
        payload: res.data.games
      });
    } catch (err) {
      dispatch({
        type: GAME_ERROR,
        payload: err.response?.data.msg || 'Error getting game history'
      });
    }
  };

  // Get active games
  const getActiveGames = async () => {
    setLoading();
    
    try {
      const res = await axios.get('/api/games/status/active');

      dispatch({
        type: GET_ACTIVE_GAMES,
        payload: res.data.games
      });
    } catch (err) {
      dispatch({
        type: GAME_ERROR,
        payload: err.response?.data.msg || 'Error getting active games'
      });
    }
  };

  // Set loading
  const setLoading = () => dispatch({ type: LOADING });

  // Clear game
  const clearGame = () => dispatch({ type: CLEAR_GAME });

  // Clear messages
  const clearMessages = () => dispatch({ type: CLEAR_MESSAGES });

  // Clear errors
  const clearError = () => dispatch({ type: CLEAR_LOADING });

  return (
    <gameContext.Provider
      value={{
        gameId: state.gameId,
        playerId: state.playerId,
        playerName: state.playerName,
        playerColor: state.playerColor,
        opponentName: state.opponentName,
        opponentId: state.opponentId,
        isAgainstAI: state.isAgainstAI,
        aiLevel: state.aiLevel,
        fen: state.fen,
        status: state.status,
        result: state.result,
        turn: state.turn,
        drawOffer: state.drawOffer,
        isSpectator: state.isSpectator,
        spectatorCount: state.spectatorCount,
        moveHistory: state.moveHistory,
        messages: state.messages,
        gameHistory: state.gameHistory,
        activeGames: state.activeGames,
        loading: state.loading,
        error: state.error,
        createGame,
        joinGame,
        makeMove,
        createAIGame,
        requestAIMove,
        resignGame,
        offerDraw,
        respondToDraw,
        sendMessage,
        getGameHistory,
        getActiveGames,
        clearGame,
        clearMessages,
        clearError
      }}
    >
      {props.children}
    </gameContext.Provider>
  );
};

export default GameState;