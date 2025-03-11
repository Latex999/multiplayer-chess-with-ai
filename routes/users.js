const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');

// @route   GET api/users
// @desc    Get user profile
// @access  Private
router.get('/profile', auth, async (req, res) => {
  try {
    // If database is not set up, return mock data
    if (!process.env.MONGODB_URI) {
      return res.json({
        profile: {
          id: req.user.id,
          name: 'Demo User',
          email: req.user.email || 'user@example.com',
          chessRating: 1200,
          totalGames: 15,
          wins: 8,
          losses: 5,
          draws: 2,
          memberSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
          lastActive: new Date().toISOString()
        }
      });
    }

    // Find user and populate stats from a real database
    // const user = await User.findById(req.user.id).select('-password');
    // const stats = await UserStats.findOne({ user: req.user.id });
    
    // Respond with mock data
    res.json({
      profile: {
        id: req.user.id,
        name: 'Demo User',
        email: req.user.email || 'user@example.com',
        chessRating: 1200,
        totalGames: 15,
        wins: 8,
        losses: 5,
        draws: 2,
        memberSince: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
        lastActive: new Date().toISOString()
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   GET api/users/leaderboard
// @desc    Get top users by rating
// @access  Public
router.get('/leaderboard', async (req, res) => {
  try {
    // If database is not set up, return mock data
    if (!process.env.MONGODB_URI) {
      const mockLeaderboard = [
        {
          id: 'user-1',
          name: 'Chess Master',
          chessRating: 2100,
          wins: 48,
          losses: 10
        },
        {
          id: 'user-2',
          name: 'Queen Expert',
          chessRating: 1950,
          wins: 42,
          losses: 15
        },
        {
          id: 'user-3',
          name: 'Knight Rider',
          chessRating: 1800,
          wins: 36,
          losses: 20
        },
        {
          id: 'user-4',
          name: 'Bishop King',
          chessRating: 1650,
          wins: 30,
          losses: 22
        },
        {
          id: 'user-5',
          name: 'Pawn Star',
          chessRating: 1500,
          wins: 25,
          losses: 25
        },
        {
          id: 'user-6',
          name: 'Rook Rookie',
          chessRating: 1350,
          wins: 18,
          losses: 30
        },
        {
          id: 'user-7',
          name: 'Checkmate Charlie',
          chessRating: 1300,
          wins: 15,
          losses: 35
        },
        {
          id: 'user-8',
          name: 'Demo User',
          chessRating: 1200,
          wins: 8,
          losses: 5
        },
        {
          id: 'user-9',
          name: 'Chess Newbie',
          chessRating: 1100,
          wins: 5,
          losses: 15
        },
        {
          id: 'user-10',
          name: 'Beginner Bob',
          chessRating: 1000,
          wins: 2,
          losses: 20
        }
      ];

      return res.json({
        leaderboard: mockLeaderboard
      });
    }

    // Find top users from a real database
    // const users = await User.find()
    //   .sort({ chessRating: -1 })
    //   .limit(10)
    //   .select('name chessRating stats');
    
    // Return mock data for now
    const mockLeaderboard = [
      {
        id: 'user-1',
        name: 'Chess Master',
        chessRating: 2100,
        wins: 48,
        losses: 10
      },
      {
        id: 'user-2',
        name: 'Queen Expert',
        chessRating: 1950,
        wins: 42,
        losses: 15
      },
      {
        id: 'user-3',
        name: 'Knight Rider',
        chessRating: 1800,
        wins: 36,
        losses: 20
      },
      {
        id: 'user-4',
        name: 'Bishop King',
        chessRating: 1650,
        wins: 30,
        losses: 22
      },
      {
        id: 'user-5',
        name: 'Pawn Star',
        chessRating: 1500,
        wins: 25,
        losses: 25
      }
    ];

    res.json({
      leaderboard: mockLeaderboard
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route   PUT api/users/settings
// @desc    Update user settings
// @access  Private
router.put('/settings', auth, async (req, res) => {
  const { name, email, boardTheme, pieceTheme, soundEnabled } = req.body;

  try {
    // If database is not set up, return success response
    if (!process.env.MONGODB_URI) {
      return res.json({
        success: true,
        settings: {
          name: name || 'Demo User',
          email: email || req.user.email,
          boardTheme: boardTheme || 'classic',
          pieceTheme: pieceTheme || 'standard',
          soundEnabled: soundEnabled !== undefined ? soundEnabled : true
        }
      });
    }

    // Update user in a real database
    // const user = await User.findById(req.user.id);
    // if (!user) {
    //   return res.status(404).json({ msg: 'User not found' });
    // }
    
    // if (name) user.name = name;
    // if (email) user.email = email;
    
    // const settings = await UserSettings.findOneAndUpdate(
    //   { user: req.user.id },
    //   { 
    //     boardTheme: boardTheme || 'classic',
    //     pieceTheme: pieceTheme || 'standard',
    //     soundEnabled: soundEnabled !== undefined ? soundEnabled : true
    //   },
    //   { new: true, upsert: true }
    // );
    
    // await user.save();
    
    res.json({
      success: true,
      settings: {
        name: name || 'Demo User',
        email: email || req.user.email,
        boardTheme: boardTheme || 'classic',
        pieceTheme: pieceTheme || 'standard',
        soundEnabled: soundEnabled !== undefined ? soundEnabled : true
      }
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;