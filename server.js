const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const { Chess } = require('chess.js');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const gameRoutes = require('./routes/games');

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(helmet({
  contentSecurityPolicy: false,
}));
app.use(compression());
app.use(morgan('dev'));

// Connect to MongoDB
if (process.env.MONGODB_URI) {
  mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
    .then(() => console.log('MongoDB connected...'))
    .catch(err => console.error('MongoDB connection error:', err));
} else {
  console.log('MongoDB connection skipped - running without database');
}

// Define routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/games', gameRoutes);

// Game state storage (in memory for simplicity)
const activeGames = {};
const players = {};

// Socket.io logic for real-time chess
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);

  // Handle player joining a game
  socket.on('joinGame', ({ gameId, playerName, playerId }) => {
    // Generate a unique ID for new players
    if (!playerId) {
      playerId = uuidv4();
    }

    // Store player information
    players[socket.id] = {
      id: playerId,
      name: playerName || 'Guest',
      gameId: gameId
    };

    // Join the socket room for this game
    socket.join(gameId);

    // If the game doesn't exist yet, create it
    if (!activeGames[gameId]) {
      const newGame = {
        id: gameId,
        players: {},
        spectators: [],
        chess: new Chess(),
        gameType: 'multiplayer',
        moves: [],
        status: 'waiting',
        turn: 'w',
        createdAt: new Date()
      };
      
      activeGames[gameId] = newGame;
      
      // Assign player to white
      activeGames[gameId].players[playerId] = {
        id: playerId,
        name: playerName || 'Guest',
        color: 'w',
        socketId: socket.id
      };
      
      console.log(`Game ${gameId} created by ${playerName || 'Guest'}`);
      
      // Notify the player they're waiting for an opponent
      socket.emit('gameJoined', {
        gameId,
        playerId,
        color: 'w',
        status: 'waiting',
        fen: activeGames[gameId].chess.fen(),
        opponent: null
      });
    } else {
      // The game exists
      const game = activeGames[gameId];
      
      // Check if this is a rejoining player
      let existingPlayer = false;
      for (const pid in game.players) {
        if (pid === playerId) {
          existingPlayer = true;
          game.players[pid].socketId = socket.id;
          
          // Update player with game state
          socket.emit('gameJoined', {
            gameId,
            playerId,
            color: game.players[pid].color,
            status: game.status,
            fen: game.chess.fen(),
            opponent: Object.values(game.players).find(p => p.id !== playerId)
          });
          
          // Notify opponent of reconnection if they exist
          const opponentId = Object.keys(game.players).find(p => p !== playerId);
          if (opponentId && game.players[opponentId].socketId) {
            io.to(game.players[opponentId].socketId).emit('opponentReconnected', {
              name: playerName || 'Guest'
            });
          }
          break;
        }
      }
      
      // If not a rejoining player, check if they can join as a new player
      if (!existingPlayer) {
        // If there's already two players, join as spectator
        if (Object.keys(game.players).length >= 2) {
          game.spectators.push({
            id: playerId,
            name: playerName || 'Spectator',
            socketId: socket.id
          });
          
          socket.emit('gameJoined', {
            gameId,
            playerId,
            isSpectator: true,
            status: game.status,
            fen: game.chess.fen(),
            players: Object.values(game.players)
          });
          
          // Notify existing players of spectator
          io.to(gameId).emit('spectatorJoined', {
            name: playerName || 'Spectator',
            count: game.spectators.length
          });
        } else {
          // Join as the second player (black)
          game.players[playerId] = {
            id: playerId,
            name: playerName || 'Guest',
            color: 'b',
            socketId: socket.id
          };
          
          // Update game status
          game.status = 'active';
          
          // Notify this player that they joined
          socket.emit('gameJoined', {
            gameId,
            playerId,
            color: 'b',
            status: 'active',
            fen: game.chess.fen(),
            opponent: Object.values(game.players).find(p => p.id !== playerId)
          });
          
          // Notify the opponent that game is starting
          const opponent = Object.values(game.players).find(p => p.id !== playerId);
          if (opponent && opponent.socketId) {
            io.to(opponent.socketId).emit('gameStarted', {
              opponent: {
                id: playerId,
                name: playerName || 'Guest',
                color: 'b'
              },
              status: 'active'
            });
          }
        }
      }
    }
  });

  // Handle player making a move
  socket.on('makeMove', ({ gameId, move, playerId }) => {
    const game = activeGames[gameId];
    if (!game) return;
    
    // Verify it's this player's turn
    const playerColor = game.players[playerId]?.color;
    if (!playerColor || playerColor !== game.turn) {
      return socket.emit('error', { message: 'Not your turn' });
    }
    
    try {
      // Attempt to make the move
      const chessMove = game.chess.move(move);
      if (chessMove) {
        // Update game state
        game.moves.push(chessMove);
        game.turn = game.chess.turn();
        
        // Check for game end conditions
        let gameOver = false;
        let result = null;
        
        if (game.chess.isCheckmate()) {
          gameOver = true;
          result = playerColor === 'w' ? '1-0' : '0-1';
          game.status = 'checkmate';
        } else if (game.chess.isDraw()) {
          gameOver = true;
          result = '1/2-1/2';
          if (game.chess.isStalemate()) {
            game.status = 'stalemate';
          } else if (game.chess.isThreefoldRepetition()) {
            game.status = 'threefold repetition';
          } else if (game.chess.isInsufficientMaterial()) {
            game.status = 'insufficient material';
          } else {
            game.status = 'draw';
          }
        }
        
        // Broadcast the move to all players and spectators
        io.to(gameId).emit('moveMade', {
          move: chessMove,
          fen: game.chess.fen(),
          pgn: game.chess.pgn(),
          gameOver,
          result,
          status: game.status,
          turn: game.turn
        });
        
        // If the game is over, update server state
        if (gameOver) {
          // We could save the game to database here if needed
          setTimeout(() => {
            delete activeGames[gameId];
          }, 3600000); // Clean up after 1 hour
        }
      }
    } catch (error) {
      console.error('Move error:', error);
      socket.emit('error', { message: 'Invalid move' });
    }
  });

  // Handle creating an AI game
  socket.on('createAiGame', ({ playerName, playerId, aiLevel }) => {
    const gameId = uuidv4();
    
    // Generate a unique ID for new players
    if (!playerId) {
      playerId = uuidv4();
    }
    
    // Store player information
    players[socket.id] = {
      id: playerId,
      name: playerName || 'Guest',
      gameId
    };
    
    // Join the socket room for this game
    socket.join(gameId);
    
    // Create the game with AI
    const newGame = {
      id: gameId,
      players: {},
      chess: new Chess(),
      gameType: 'ai',
      aiLevel: aiLevel || 3, // AI difficulty level (1-10)
      moves: [],
      status: 'active',
      turn: 'w',
      createdAt: new Date()
    };
    
    activeGames[gameId] = newGame;
    
    // Assign player to white
    activeGames[gameId].players[playerId] = {
      id: playerId,
      name: playerName || 'Guest',
      color: 'w',
      socketId: socket.id
    };
    
    // AI is black
    activeGames[gameId].players['ai'] = {
      id: 'ai',
      name: `Stockfish AI (Level ${aiLevel || 3})`,
      color: 'b',
      isAi: true
    };
    
    console.log(`AI Game ${gameId} created by ${playerName || 'Guest'}`);
    
    // Notify the player the game is ready
    socket.emit('gameJoined', {
      gameId,
      playerId,
      color: 'w',
      status: 'active',
      fen: activeGames[gameId].chess.fen(),
      opponent: {
        id: 'ai',
        name: `Stockfish AI (Level ${aiLevel || 3})`,
        color: 'b',
        isAi: true
      }
    });
  });

  // Handle requesting an AI move
  socket.on('requestAiMove', ({ gameId }) => {
    const game = activeGames[gameId];
    if (!game || game.gameType !== 'ai' || game.chess.turn() !== 'b') return;
    
    // In a real implementation, we would use Stockfish.js to calculate the best move
    // For this example, we'll simulate an AI move with a simple algorithm:
    setTimeout(() => {
      try {
        // Get all legal moves
        const legalMoves = [];
        const board = game.chess.board();
        
        for (let i = 0; i < 8; i++) {
          for (let j = 0; j < 8; j++) {
            const piece = board[i][j];
            if (piece && piece.color === 'b') {
              const square = String.fromCharCode(97 + j) + (8 - i);
              const moves = game.chess.moves({ square, verbose: true });
              moves.forEach(move => {
                legalMoves.push(move);
              });
            }
          }
        }
        
        if (legalMoves.length > 0) {
          // Choose a random move for simplicity
          // In a real app, we would use Stockfish to find the best move based on level
          const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)];
          
          // Make the move
          const chessMove = game.chess.move(randomMove);
          
          if (chessMove) {
            // Update game state
            game.moves.push(chessMove);
            game.turn = game.chess.turn();
            
            // Check for game end conditions
            let gameOver = false;
            let result = null;
            
            if (game.chess.isCheckmate()) {
              gameOver = true;
              result = '0-1'; // AI won
              game.status = 'checkmate';
            } else if (game.chess.isDraw()) {
              gameOver = true;
              result = '1/2-1/2';
              if (game.chess.isStalemate()) {
                game.status = 'stalemate';
              } else if (game.chess.isThreefoldRepetition()) {
                game.status = 'threefold repetition';
              } else if (game.chess.isInsufficientMaterial()) {
                game.status = 'insufficient material';
              } else {
                game.status = 'draw';
              }
            }
            
            // Send the move to the player
            io.to(gameId).emit('moveMade', {
              move: chessMove,
              fen: game.chess.fen(),
              pgn: game.chess.pgn(),
              gameOver,
              result,
              status: game.status,
              turn: game.turn
            });
            
            // If the game is over, update server state
            if (gameOver) {
              setTimeout(() => {
                delete activeGames[gameId];
              }, 3600000); // Clean up after 1 hour
            }
          }
        }
      } catch (error) {
        console.error('AI move error:', error);
      }
    }, 500 + Math.random() * 1000); // Random delay to simulate thinking
  });

  // Handle chat messages
  socket.on('sendMessage', ({ gameId, playerId, message }) => {
    const player = players[socket.id];
    if (!player) return;
    
    const game = activeGames[gameId];
    if (!game) return;
    
    const playerInfo = game.players[playerId] || 
                      game.spectators?.find(s => s.id === playerId);
    
    if (!playerInfo) return;
    
    // Broadcast message to all players and spectators in the game
    io.to(gameId).emit('messageReceived', {
      playerId,
      playerName: playerInfo.name,
      message,
      timestamp: new Date().toISOString()
    });
  });

  // Handle resignation
  socket.on('resign', ({ gameId, playerId }) => {
    const game = activeGames[gameId];
    if (!game) return;
    
    const playerColor = game.players[playerId]?.color;
    if (!playerColor) return;
    
    // Update game state
    game.status = 'resigned';
    const result = playerColor === 'w' ? '0-1' : '1-0';
    
    // Notify all players
    io.to(gameId).emit('gameOver', {
      result,
      status: 'resigned',
      winner: playerColor === 'w' ? 'b' : 'w',
      message: `${game.players[playerId].name} resigned`
    });
    
    // Clean up after a while
    setTimeout(() => {
      delete activeGames[gameId];
    }, 3600000); // 1 hour
  });

  // Handle offer draw
  socket.on('offerDraw', ({ gameId, playerId }) => {
    const game = activeGames[gameId];
    if (!game) return;
    
    const playerInfo = game.players[playerId];
    if (!playerInfo) return;
    
    // Find opponent
    const opponentId = Object.keys(game.players).find(id => id !== playerId && id !== 'ai');
    if (!opponentId) return;
    
    // Notify opponent of draw offer
    if (game.players[opponentId].socketId) {
      io.to(game.players[opponentId].socketId).emit('drawOffered', {
        from: {
          id: playerId,
          name: playerInfo.name
        }
      });
    }
  });

  // Handle draw response
  socket.on('respondToDraw', ({ gameId, playerId, accepted }) => {
    const game = activeGames[gameId];
    if (!game) return;
    
    if (accepted) {
      // Update game state
      game.status = 'draw';
      
      // Notify all players
      io.to(gameId).emit('gameOver', {
        result: '1/2-1/2',
        status: 'draw',
        message: 'Game ended by agreement'
      });
      
      // Clean up after a while
      setTimeout(() => {
        delete activeGames[gameId];
      }, 3600000); // 1 hour
    } else {
      // Find who offered the draw
      const offerId = Object.keys(game.players).find(id => id !== playerId);
      
      // Notify draw was declined
      if (offerId && game.players[offerId].socketId) {
        io.to(game.players[offerId].socketId).emit('drawDeclined', {
          by: {
            id: playerId,
            name: game.players[playerId].name
          }
        });
      }
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    const player = players[socket.id];
    if (player) {
      console.log(`Player disconnected: ${player.name} (${socket.id})`);
      
      const gameId = player.gameId;
      const game = activeGames[gameId];
      
      if (game) {
        // Notify others in the game
        socket.to(gameId).emit('playerDisconnected', {
          playerId: player.id,
          name: player.name
        });
        
        // We keep the game active for a while to allow reconnection
      }
      
      // Clean up this socket's player info
      delete players[socket.id];
    } else {
      console.log('Unknown client disconnected:', socket.id);
    }
  });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('client/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'client', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Server error' });
});

// Start the server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
});

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});