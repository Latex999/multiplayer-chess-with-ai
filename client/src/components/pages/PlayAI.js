import React, { useState, useEffect, useContext, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjsx';
import GameContext from '../../context/game/gameContext';
import AuthContext from '../../context/auth/authContext';
import { toast } from 'react-toastify';

const PlayAI = () => {
  const gameContext = useContext(GameContext);
  const { makeAIMove, resetGame } = gameContext;
  
  const authContext = useContext(AuthContext);
  const { isAuthenticated, user } = authContext;
  
  const navigate = useNavigate();
  
  // Chess game state
  const [game, setGame] = useState(new Chess());
  const [fen, setFen] = useState('start');
  const [history, setHistory] = useState([]);
  const [playerColor, setPlayerColor] = useState('white');
  const [aiLevel, setAiLevel] = useState(3);
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [isGameOver, setIsGameOver] = useState(false);
  const [gameResult, setGameResult] = useState('');
  
  // Game timer state
  const [whiteTime, setWhiteTime] = useState(600); // 10 minutes in seconds
  const [blackTime, setBlackTime] = useState(600);
  const [timerRunning, setTimerRunning] = useState(false);
  
  // Refs for timers
  const timerRef = useRef(null);
  
  useEffect(() => {
    // Reset everything when component mounts
    resetGame();
    setGame(new Chess());
    setFen('start');
    setHistory([]);
    setIsPlayerTurn(playerColor === 'white');
    setIsGameOver(false);
    setGameResult('');
    setWhiteTime(600);
    setBlackTime(600);
    setTimerRunning(false);
    
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
    // eslint-disable-next-line
  }, [playerColor, aiLevel]);
  
  useEffect(() => {
    // If it's AI's turn, request an AI move
    if (!isPlayerTurn && !isGameOver) {
      const timer = setTimeout(() => {
        requestAIMove();
      }, 500); // Small delay for better UX
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line
  }, [isPlayerTurn, isGameOver]);
  
  useEffect(() => {
    // Start or stop timer based on game state
    if (!isGameOver && fen !== 'start') {
      startTimer();
    } else {
      stopTimer();
    }
    // eslint-disable-next-line
  }, [isGameOver, fen]);
  
  // Timer logic
  const startTimer = () => {
    if (!timerRunning) {
      setTimerRunning(true);
      timerRef.current = setInterval(() => {
        if (game.turn() === 'w') {
          setWhiteTime(prev => {
            if (prev <= 0) {
              handleTimeout('white');
              return 0;
            }
            return prev - 1;
          });
        } else {
          setBlackTime(prev => {
            if (prev <= 0) {
              handleTimeout('black');
              return 0;
            }
            return prev - 1;
          });
        }
      }, 1000);
    }
  };
  
  const stopTimer = () => {
    if (timerRunning) {
      clearInterval(timerRef.current);
      setTimerRunning(false);
    }
  };
  
  const handleTimeout = (color) => {
    stopTimer();
    setIsGameOver(true);
    setGameResult(`${color === playerColor ? 'You' : 'AI'} lost on time`);
    
    toast.info(`Game over: ${color === playerColor ? 'You' : 'AI'} lost on time`);
  };
  
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Request AI move from backend
  const requestAIMove = async () => {
    try {
      const currentFen = game.fen();
      const difficulty = aiLevel;
      
      // Call context method to get AI move
      const aiMove = await makeAIMove({ fen: currentFen, difficulty });
      
      if (aiMove && aiMove.from && aiMove.to) {
        makeMove(aiMove);
      }
    } catch (error) {
      toast.error('Error getting AI move');
      console.error('AI move error:', error);
    }
  };
  
  // Make a move on the board
  const makeMove = (move) => {
    try {
      // Create a new game instance to preserve immutability
      const gameCopy = new Chess(game.fen());
      
      // Make the move
      const result = gameCopy.move(move);
      
      // If move is valid
      if (result) {
        // Update game state
        setGame(gameCopy);
        setFen(gameCopy.fen());
        setHistory(gameCopy.history({ verbose: true }));
        
        // Check for game over conditions
        if (gameCopy.isGameOver()) {
          handleGameOver(gameCopy);
        } else {
          // Toggle turn
          setIsPlayerTurn(!isPlayerTurn);
        }
      }
    } catch (error) {
      console.error('Move error:', error);
    }
  };
  
  // Handle game over conditions
  const handleGameOver = (gameInstance) => {
    setIsGameOver(true);
    stopTimer();
    
    let result = '';
    
    if (gameInstance.isCheckmate()) {
      // Check if it's the player's turn (they're in checkmate)
      const playerInCheckmate = (gameInstance.turn() === 'w' && playerColor === 'white') || 
                               (gameInstance.turn() === 'b' && playerColor === 'black');
      
      result = playerInCheckmate ? 'Checkmate! AI wins' : 'Checkmate! You win';
    } else if (gameInstance.isDraw()) {
      if (gameInstance.isStalemate()) {
        result = 'Game drawn by stalemate';
      } else if (gameInstance.isThreefoldRepetition()) {
        result = 'Game drawn by threefold repetition';
      } else if (gameInstance.isInsufficientMaterial()) {
        result = 'Game drawn by insufficient material';
      } else {
        result = 'Game drawn';
      }
    }
    
    setGameResult(result);
    toast.info(`Game over: ${result}`);
  };
  
  // Handle the drop event from Chessboardjsx
  const onDrop = ({ sourceSquare, targetSquare }) => {
    // Only allow moves if it's the player's turn and game is not over
    if (!isPlayerTurn || isGameOver) return;
    
    // Construct the move object
    const move = {
      from: sourceSquare,
      to: targetSquare,
      promotion: 'q' // Always promote to queen for simplicity
    };
    
    // Make the move
    makeMove(move);
  };
  
  // Reset the current game
  const handleResetGame = () => {
    setGame(new Chess());
    setFen('start');
    setHistory([]);
    setIsPlayerTurn(playerColor === 'white');
    setIsGameOver(false);
    setGameResult('');
    setWhiteTime(600);
    setBlackTime(600);
    stopTimer();
    
    toast.info('Game reset');
  };
  
  // Change the player's color
  const handleChangeColor = () => {
    const newColor = playerColor === 'white' ? 'black' : 'white';
    setPlayerColor(newColor);
    
    toast.info(`You are now playing as ${newColor}`);
  };
  
  // Change AI difficulty level
  const handleChangeLevel = (e) => {
    setAiLevel(parseInt(e.target.value, 10));
    
    toast.info(`AI difficulty set to level ${e.target.value}`);
  };
  
  // Calculate board width based on window size
  const calcBoardWidth = () => {
    const width = window.innerWidth;
    if (width < 500) return width * 0.9;
    if (width < 800) return 450;
    return 560;
  };
  
  return (
    <div className="play-ai-container">
      <div className="play-ai-header">
        <h1>Play Against AI</h1>
        <div className="game-status-container">
          {isGameOver ? (
            <div className="game-result">{gameResult}</div>
          ) : (
            <div className="current-turn">
              {isPlayerTurn ? 'Your turn' : 'AI is thinking...'}
            </div>
          )}
        </div>
      </div>
      
      <div className="game-controls">
        <div className="player-info">
          <div className="player-color">
            You: <span className={`color-indicator ${playerColor}`}>{playerColor}</span>
          </div>
          <div className="ai-level">
            AI Level: 
            <select value={aiLevel} onChange={handleChangeLevel} disabled={fen !== 'start'}>
              <option value="1">Easy</option>
              <option value="2">Beginner</option>
              <option value="3">Intermediate</option>
              <option value="4">Advanced</option>
              <option value="5">Expert</option>
            </select>
          </div>
        </div>
        
        <div className="timer-container">
          <div className="timer white">
            White: {formatTime(whiteTime)}
          </div>
          <div className="timer black">
            Black: {formatTime(blackTime)}
          </div>
        </div>
        
        <div className="game-buttons">
          <button 
            onClick={handleResetGame} 
            className="btn btn-outline"
          >
            Reset Game
          </button>
          <button 
            onClick={handleChangeColor} 
            className="btn btn-outline"
            disabled={fen !== 'start'}
          >
            Change Color
          </button>
        </div>
      </div>
      
      <div className="chessboard-container">
        <Chessboard
          width={calcBoardWidth()}
          position={fen}
          onDrop={onDrop}
          boardStyle={{
            borderRadius: '5px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
          }}
          orientation={playerColor}
          draggable={isPlayerTurn && !isGameOver}
          lightSquareStyle={{ backgroundColor: '#f0d9b5' }}
          darkSquareStyle={{ backgroundColor: '#b58863' }}
        />
      </div>
      
      <div className="move-history">
        <h3>Move History</h3>
        <div className="history-list">
          {history.length === 0 ? (
            <p>No moves yet</p>
          ) : (
            <ol>
              {game.history().map((move, index) => (
                <li key={index}>{move}</li>
              ))}
            </ol>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlayAI;