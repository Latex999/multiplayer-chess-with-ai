import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Chess } from 'chess.js';
import Chessboard from 'chessboardjsx';
import GameContext from '../../context/game/gameContext';
import AuthContext from '../../context/auth/authContext';
import GameInfo from './GameInfo';
import GameChat from './GameChat';
import { toast } from 'react-toastify';

const GameBoard = ({ spectateMode = false }) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const gameContext = useContext(GameContext);
  const { 
    gameData, 
    loading, 
    getGame, 
    makeMove, 
    sendMessage,
    error 
  } = gameContext;

  const authContext = useContext(AuthContext);
  const { user } = authContext;

  // Local chess game instance for move validation
  const [game, setGame] = useState(null);
  const [boardOrientation, setBoardOrientation] = useState('white');
  const [isPlayerTurn, setIsPlayerTurn] = useState(false);
  const [moveFrom, setMoveFrom] = useState('');
  const [moveTo, setMoveTo] = useState('');
  const [showPromotionDialog, setShowPromotionDialog] = useState(false);
  
  // Timer refs
  const whiteTimerRef = useRef(null);
  const blackTimerRef = useRef(null);
  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState(0);
  const [blackTimeRemaining, setBlackTimeRemaining] = useState(0);

  // Load game data when component mounts
  useEffect(() => {
    getGame(id);
    // eslint-disable-next-line
  }, [id]);

  // Set up game when data is loaded
  useEffect(() => {
    if (gameData && !loading) {
      // Create chess instance with current FEN
      try {
        const chessInstance = new Chess(gameData.fen || 'start');
        setGame(chessInstance);

        // Set player orientation
        if (!spectateMode && user) {
          if (gameData.white && gameData.white.player === user._id) {
            setBoardOrientation('white');
          } else if (gameData.black && gameData.black.player === user._id) {
            setBoardOrientation('black');
          }
        }

        // Set up timers
        if (gameData.timeControl) {
          updateTimers();
        }

        // Check if it's the player's turn
        if (!spectateMode && user && gameData.status === 'active') {
          const isPlayerWhite = gameData.white && gameData.white.player === user._id;
          const isPlayerBlack = gameData.black && gameData.black.player === user._id;
          const isTurnWhite = chessInstance.turn() === 'w';
          
          setIsPlayerTurn((isPlayerWhite && isTurnWhite) || (isPlayerBlack && !isTurnWhite));
        } else {
          setIsPlayerTurn(false);
        }
      } catch (err) {
        console.error("Error setting up chess game:", err);
        toast.error("Error setting up the game board");
      }
    }
    // eslint-disable-next-line
  }, [gameData, loading, user, spectateMode]);

  // Error handling
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  // Clean up timers when component unmounts
  useEffect(() => {
    return () => {
      if (whiteTimerRef.current) clearInterval(whiteTimerRef.current);
      if (blackTimerRef.current) clearInterval(blackTimerRef.current);
    };
  }, []);

  // Update time remaining for both players
  const updateTimers = () => {
    if (!gameData || !gameData.timeControl) return;

    clearTimers();

    // Calculate time remaining based on timeControl and elapsed time
    const timeControlSeconds = gameData.timeControl * 60;
    
    // Set initial values
    if (gameData.white && gameData.white.timeRemaining !== undefined) {
      setWhiteTimeRemaining(gameData.white.timeRemaining);
    } else {
      setWhiteTimeRemaining(timeControlSeconds);
    }
    
    if (gameData.black && gameData.black.timeRemaining !== undefined) {
      setBlackTimeRemaining(gameData.black.timeRemaining);
    } else {
      setBlackTimeRemaining(timeControlSeconds);
    }

    // Start running timer for active player if game is in progress
    if (gameData.status === 'active') {
      if (game.turn() === 'w') {
        startWhiteTimer();
      } else {
        startBlackTimer();
      }
    }
  };

  const clearTimers = () => {
    if (whiteTimerRef.current) clearInterval(whiteTimerRef.current);
    if (blackTimerRef.current) clearInterval(blackTimerRef.current);
  };

  const startWhiteTimer = () => {
    if (blackTimerRef.current) clearInterval(blackTimerRef.current);
    whiteTimerRef.current = setInterval(() => {
      setWhiteTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(whiteTimerRef.current);
          // Handle time out
          if (!spectateMode && user && gameData.white && gameData.white.player === user._id) {
            toast.error('You lost on time!');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startBlackTimer = () => {
    if (whiteTimerRef.current) clearInterval(whiteTimerRef.current);
    blackTimerRef.current = setInterval(() => {
      setBlackTimeRemaining(prev => {
        if (prev <= 0) {
          clearInterval(blackTimerRef.current);
          // Handle time out
          if (!spectateMode && user && gameData.black && gameData.black.player === user._id) {
            toast.error('You lost on time!');
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  // Format seconds to mm:ss
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Handle square click for two-click move
  const handleSquareClick = (square) => {
    if (spectateMode || !isPlayerTurn || !game) return;

    if (!moveFrom) {
      // First click - select piece
      const piece = game.get(square);
      const isPlayerPiece = 
        (piece && piece.color === 'w' && boardOrientation === 'white') ||
        (piece && piece.color === 'b' && boardOrientation === 'black');

      if (isPlayerPiece) {
        setMoveFrom(square);
      }
    } else {
      // Second click - attempt move
      setMoveTo(square);
      
      // Check if this is a pawn promotion move
      const moveObj = {
        from: moveFrom,
        to: square
      };
      
      // Check if this is a pawn promotion move
      const isPromotion = game.moves({ verbose: true }).some(
        move => move.from === moveFrom && move.to === square && move.flags.includes('p')
      );
      
      if (isPromotion) {
        setShowPromotionDialog(true);
      } else {
        // Regular move
        attemptMove(moveObj);
        setMoveFrom('');
        setMoveTo('');
      }
    }
  };

  // Handle piece promotion selection
  const handlePromotion = (promotionPiece) => {
    if (moveFrom && moveTo) {
      setShowPromotionDialog(false);
      
      const moveObj = {
        from: moveFrom,
        to: moveTo,
        promotion: promotionPiece
      };
      
      attemptMove(moveObj);
      setMoveFrom('');
      setMoveTo('');
    }
  };

  // Close promotion dialog
  const closePromotionDialog = () => {
    setShowPromotionDialog(false);
    setMoveFrom('');
    setMoveTo('');
  };

  // Attempt to make a move
  const attemptMove = (moveObj) => {
    try {
      // Verify move is legal using the local chess instance
      const result = game.move(moveObj);
      
      if (result) {
        // If legal, send move to server
        makeMove(gameData._id, {
          from: moveObj.from,
          to: moveObj.to,
          promotion: moveObj.promotion || undefined
        });
        
        // Update local game state
        setGame(new Chess(game.fen()));
        
        // Switch timers
        if (game.turn() === 'w') {
          startWhiteTimer();
        } else {
          startBlackTimer();
        }
        
        // No longer player's turn until server confirms
        setIsPlayerTurn(false);
      }
    } catch (err) {
      console.error("Invalid move:", err);
      toast.error("Invalid move");
    }
  };

  // Handle piece drag
  const handleDrop = ({ sourceSquare, targetSquare }) => {
    if (spectateMode || !isPlayerTurn || !game) return false;
    
    try {
      // Check if this is a pawn promotion move
      const moveObj = {
        from: sourceSquare,
        to: targetSquare
      };
      
      // Check if this is a pawn promotion
      const isPromotion = game.moves({ verbose: true }).some(
        move => move.from === sourceSquare && move.to === targetSquare && move.flags.includes('p')
      );
      
      if (isPromotion) {
        setMoveFrom(sourceSquare);
        setMoveTo(targetSquare);
        setShowPromotionDialog(true);
        return false;
      }
      
      attemptMove(moveObj);
      return true;
    } catch (err) {
      return false;
    }
  };

  // Handle chat message submission
  const handleSendMessage = (message) => {
    if (message.trim()) {
      sendMessage(gameData._id, message);
    }
  };

  // Handle game resignation
  const handleResign = () => {
    if (spectateMode) return;
    
    if (window.confirm('Are you sure you want to resign this game?')) {
      // Call resign function
      // resignGame(gameData._id);
      toast.info('You resigned the game');
    }
  };

  // Handle draw offer
  const handleOfferDraw = () => {
    if (spectateMode) return;
    
    // offerDraw(gameData._id);
    toast.info('Draw offered to opponent');
  };

  // Calculate board width based on window size
  const calcBoardWidth = () => {
    const width = window.innerWidth;
    if (width < 500) return width * 0.9;
    if (width < 800) return width * 0.6;
    return 560;
  };

  // Loading state
  if (loading || !game) {
    return <div className="loading-container">Loading game...</div>;
  }

  // Game not found
  if (!gameData) {
    return (
      <div className="error-container">
        <h2>Game not found</h2>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="game-board-container">
      <div className="game-layout">
        <div className="game-main">
          <div className="player-info top">
            {boardOrientation === 'white' ? (
              <div className="player black">
                <div className="player-avatar">
                  <span className="piece">♚</span>
                </div>
                <div className="player-details">
                  <div className="player-name">
                    {gameData.black ? gameData.black.name : 'Waiting for opponent'}
                  </div>
                  {gameData.black && (
                    <div className="player-rating">Rating: {gameData.black.rating}</div>
                  )}
                </div>
                <div className="player-time">
                  {formatTime(blackTimeRemaining)}
                </div>
              </div>
            ) : (
              <div className="player white">
                <div className="player-avatar">
                  <span className="piece">♔</span>
                </div>
                <div className="player-details">
                  <div className="player-name">
                    {gameData.white ? gameData.white.name : 'Waiting for opponent'}
                  </div>
                  {gameData.white && (
                    <div className="player-rating">Rating: {gameData.white.rating}</div>
                  )}
                </div>
                <div className="player-time">
                  {formatTime(whiteTimeRemaining)}
                </div>
              </div>
            )}
          </div>

          <div className="chessboard-wrapper">
            <Chessboard
              id="gameBoard"
              width={calcBoardWidth()}
              position={game.fen()}
              onDrop={handleDrop}
              onSquareClick={handleSquareClick}
              boardStyle={{
                borderRadius: '5px',
                boxShadow: '0 5px 15px rgba(0, 0, 0, 0.2)'
              }}
              squareStyles={{
                ...(moveFrom ? { [moveFrom]: { backgroundColor: 'rgba(255, 255, 0, 0.4)' } } : {}),
                ...(isPlayerTurn && game.inCheck() && game.turn() === (boardOrientation === 'white' ? 'w' : 'b') ? 
                  { [game.kingSquare(game.turn())]: { backgroundColor: 'rgba(255, 0, 0, 0.4)' } } : {})
              }}
              lightSquareStyle={{ backgroundColor: '#f0d9b5' }}
              darkSquareStyle={{ backgroundColor: '#b58863' }}
              orientation={boardOrientation}
              draggable={!spectateMode && isPlayerTurn}
            />
          </div>

          <div className="player-info bottom">
            {boardOrientation === 'white' ? (
              <div className="player white">
                <div className="player-avatar">
                  <span className="piece">♔</span>
                </div>
                <div className="player-details">
                  <div className="player-name">
                    {gameData.white ? gameData.white.name : 'Waiting for opponent'}
                  </div>
                  {gameData.white && (
                    <div className="player-rating">Rating: {gameData.white.rating}</div>
                  )}
                </div>
                <div className="player-time">
                  {formatTime(whiteTimeRemaining)}
                </div>
              </div>
            ) : (
              <div className="player black">
                <div className="player-avatar">
                  <span className="piece">♚</span>
                </div>
                <div className="player-details">
                  <div className="player-name">
                    {gameData.black ? gameData.black.name : 'Waiting for opponent'}
                  </div>
                  {gameData.black && (
                    <div className="player-rating">Rating: {gameData.black.rating}</div>
                  )}
                </div>
                <div className="player-time">
                  {formatTime(blackTimeRemaining)}
                </div>
              </div>
            )}
          </div>

          {!spectateMode && gameData.status === 'active' && (
            <div className="game-actions">
              <button onClick={handleResign} className="btn btn-danger">
                Resign
              </button>
              <button onClick={handleOfferDraw} className="btn btn-outline">
                Offer Draw
              </button>
            </div>
          )}
        </div>

        <div className="game-sidebar">
          <GameInfo game={gameData} />
          <GameChat 
            messages={gameData.chat || []} 
            onSendMessage={handleSendMessage}
            disabled={spectateMode}
          />
        </div>
      </div>

      {showPromotionDialog && (
        <div className="promotion-dialog">
          <div className="promotion-content">
            <h3>Promote pawn to:</h3>
            <div className="promotion-options">
              <button onClick={() => handlePromotion('q')}>Queen</button>
              <button onClick={() => handlePromotion('r')}>Rook</button>
              <button onClick={() => handlePromotion('b')}>Bishop</button>
              <button onClick={() => handlePromotion('n')}>Knight</button>
            </div>
            <button onClick={closePromotionDialog} className="btn-cancel">
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default GameBoard;