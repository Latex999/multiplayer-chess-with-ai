const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { check, validationResult } = require('express-validator');

// Middleware for auth
const auth = require('../middleware/auth');

// Import User model - will be uncommented when DB is enabled
// const User = require('../models/User');

// @route   POST api/auth/register
// @desc    Register a user
// @access  Public
router.post(
  '/register',
  [
    check('name', 'Name is required').not().isEmpty(),
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // If database is not set up, return a mock successful response
      if (!process.env.MONGODB_URI) {
        const token = jwt.sign(
          { id: 'mock-user-123', email },
          process.env.JWT_SECRET || 'mock-secret',
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: 'mock-user-123',
            name,
            email,
            chessRating: 1200
          }
        });
      }

      // Check if user already exists - requires database
      // let user = await User.findOne({ email });
      // if (user) {
      //   return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
      // }

      // Create a new user - requires database
      // user = new User({
      //   name,
      //   email,
      //   password
      // });
      
      // Hash the password - requires database
      // const salt = await bcrypt.genSalt(10);
      // user.password = await bcrypt.hash(password, salt);
      // await user.save();

      // Create JWT token
      const payload = {
        // In a real app with DB, would use user.id from database
        id: 'generated-id-' + Math.floor(Math.random() * 1000),
        email
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'chess-app-secret',
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: payload.id,
              name,
              email,
              chessRating: 1200 // Default rating
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/login',
  [
    check('email', 'Please include a valid email').isEmail(),
    check('password', 'Password is required').exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
      // If database is not set up, return a mock successful response
      if (!process.env.MONGODB_URI) {
        // For demo purposes, accept any login
        const token = jwt.sign(
          { id: 'mock-user-123', email },
          process.env.JWT_SECRET || 'mock-secret',
          { expiresIn: '7d' }
        );

        return res.json({
          token,
          user: {
            id: 'mock-user-123',
            name: 'Demo User',
            email,
            chessRating: 1200
          }
        });
      }

      // Find the user by email - requires database
      // let user = await User.findOne({ email });
      // if (!user) {
      //   return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      // }

      // Check password - requires database
      // const isMatch = await bcrypt.compare(password, user.password);
      // if (!isMatch) {
      //   return res.status(400).json({ errors: [{ msg: 'Invalid credentials' }] });
      // }

      // Create JWT
      const payload = {
        // In a real app with DB, would use user.id from database
        id: 'mock-user-123',
        email
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET || 'chess-app-secret',
        { expiresIn: '7d' },
        (err, token) => {
          if (err) throw err;
          res.json({
            token,
            user: {
              id: payload.id,
              name: 'Demo User',
              email,
              chessRating: 1200 // Mock rating
            }
          });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send('Server error');
    }
  }
);

// @route   GET api/auth/user
// @desc    Get user data from token
// @access  Private
router.get('/user', auth, async (req, res) => {
  try {
    // If database is not set up, return mock user data
    if (!process.env.MONGODB_URI) {
      return res.json({
        id: req.user.id,
        name: 'Demo User',
        email: req.user.email,
        chessRating: 1200
      });
    }

    // Fetch user data from database
    // const user = await User.findById(req.user.id).select('-password');
    // res.json(user);
    
    // Mock response for now
    res.json({
      id: req.user.id,
      name: 'Demo User',
      email: req.user.email || 'user@example.com',
      chessRating: 1200
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;