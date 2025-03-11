const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const auth = require('../middleware/auth');

// @route   POST api/games/create
// @desc    Create a new game
// @access  Private
router.post('/create', auth, async (req, res) => {
  try {
    const { gameType, timeControl } = req.body;
    
    // Generate a unique game ID
    const gameId = uuidv4();
    
    // Create a game object (would usually be stored in a database)
    const game = {
      id: gameId,
      creator: req.user.id,
      createdAt: new Date().toISOString(),
      gameType: gameType || 'multiplayer', // multiplayer, ai
      timeControl: timeControl || 'none', // none, blitz, rapid, classical
      status: 'waiting' // waiting, active, completed
    };
    
    // In a real app, we would save this to the database
    // await Game.create(game);
    
    // Return the game ID and URL to join
    res.json({
      success: true,
      game: {
        id: gameId,
        url: `/game/${gameId}`,
        createdAt: game.createdAt,
        gameType: game.gameType,
        timeControl: game.timeControl,
        status: game.status
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/:id
// @desc    Get a game by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // In a real app, we would fetch from the database
    // const game = await Game.findById(id);
    
    // For demo purposes, return a mock game
    // This is just for the API response - actual game state is managed by Socket.io
    const mockGame = {
      id,
      createdAt: new Date().toISOString(),
      status: 'waiting',
      gameType: 'multiplayer',
      timeControl: 'none',
      fen: 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1' // Starting position
    };
    
    res.json({
      success: true,
      game: mockGame
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/user/history
// @desc    Get user's game history
// @access  Private
router.get('/user/history', auth, async (req, res) => {
  try {
    // If database is not set up, return mock data
    if (!process.env.MONGODB_URI) {
      const mockGames = [
        {
          id: 'game-1',
          date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          opponent: 'Chess Master',
          result: 'loss',
          moves: 32
        },
        {
          id: 'game-2',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          opponent: 'Knight Rider',
          result: 'win',
          moves: 25
        },
        {
          id: 'game-3',
          date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          opponent: 'Stockfish AI (Level 3)',
          result: 'win',
          moves: 41
        },
        {
          id: 'game-4',
          date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          opponent: 'Bishop King',
          result: 'draw',
          moves: 60
        },
        {
          id: 'game-5',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          opponent: 'Stockfish AI (Level 5)',
          result: 'loss',
          moves: 28
        },
      ];

      return res.json({
        success: true,
        games: mockGames
      });
    }

    // Find user's games from a real database
    // const games = await Game.find({ 
    //   $or: [{ whitePlayer: req.user.id }, { blackPlayer: req.user.id }] 
    // })
    //   .sort({ createdAt: -1 })
    //   .limit(10);
    
    // Return mock data for now
    const mockGames = [
      {
        id: 'game-1',
        date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        opponent: 'Chess Master',
        result: 'loss',
        moves: 32
      },
      {
        id: 'game-2',
        date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        opponent: 'Knight Rider',
        result: 'win',
        moves: 25
      },
      {
        id: 'game-3',
        date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        opponent: 'Stockfish AI (Level 3)',
        result: 'win',
        moves: 41
      }
    ];

    res.json({
      success: true,
      games: mockGames
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/games/active
// @desc    Get active games list
// @access  Public
router.get('/status/active', async (req, res) => {
  try {
    // If database is not set up, return mock data
    if (!process.env.MONGODB_URI) {
      const mockGames = [
        {
          id: 'game-101',
          playerWhite: 'Chess Master',
          playerBlack: 'waiting...',
          timeControl: 'none',
          started: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
          status: 'waiting'
        },
        {
          id: 'game-102',
          playerWhite: 'Knight Rider',
          playerBlack: 'Bishop King',
          timeControl: 'blitz',
          started: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
          status: 'active',
          moves: 12
        },
        {
          id: 'game-103',
          playerWhite: 'Pawn Star',
          playerBlack: 'waiting...',
          timeControl: 'rapid',
          started: new Date(Date.now() - 1 * 60 * 1000).toISOString(),
          status: 'waiting'
        }
      ];

      return res.json({
        success: true,
        games: mockGames
      });
    }

    // Find active games from a real database
    // const games = await Game.find({ 
    //   status: { $in: ['waiting', 'active'] } 
    // })
    //   .sort({ createdAt: -1 })
    //   .limit(10);
    
    // Return mock data for now
    const mockGames = [
      {
        id: 'game-101',
        playerWhite: 'Chess Master',
        playerBlack: 'waiting...',
        timeControl: 'none',
        started: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
        status: 'waiting'
      },
      {
        id: 'game-102',
        playerWhite: 'Knight Rider',
        playerBlack: 'Bishop King',
        timeControl: 'blitz',
        started: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
        status: 'active',
        moves: 12
      }
    ];

    res.json({
      success: true,
      games: mockGames
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;