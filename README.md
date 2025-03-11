# Multiplayer Chess with AI

A feature-rich online chess platform with both multiplayer support and AI opponent options. Play against friends in real-time or challenge the computer at various difficulty levels.

![Chess Game Preview](screenshots/chess-game-preview.png)

## Features

- **Beautiful, responsive chess board** that works on desktop and mobile
- **Real-time multiplayer** with live game updates
- **AI opponents** with multiple difficulty levels
- **Game history** and move notation
- **Undo/Redo** functionality
- **Game save/load** capability
- **Legal move highlighting** for better usability
- **Check/Checkmate/Stalemate** detection
- **Time controls** for timed games
- **Account system** for tracking stats and game history

## Live Demo

Visit the live demo at: [https://multiplayer-chess-ai.herokuapp.com](https://multiplayer-chess-ai.herokuapp.com)

## Tech Stack

- **Frontend**: React, TypeScript, CSS
- **Backend**: Node.js, Express
- **Database**: MongoDB
- **WebSockets**: Socket.io for real-time communication
- **Chess Logic**: chess.js
- **AI**: Stockfish chess engine via stockfish.js

## Quick Start

### Prerequisites

- Node.js (v14+)
- npm or yarn
- MongoDB (optional, for user accounts)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Latex999/multiplayer-chess-with-ai.git
   cd multiplayer-chess-with-ai
   ```

2. Install dependencies for both frontend and backend:
   ```bash
   # Install backend dependencies
   npm install
   
   # Install frontend dependencies
   cd client
   npm install
   cd ..
   ```

3. Set up environment variables:
   - Create a `.env` file in the root directory with:
     ```
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/chess-app
     JWT_SECRET=your_jwt_secret
     ```

4. Start the development servers:
   ```bash
   # Start both frontend and backend with concurrently
   npm run dev
   ```

5. Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

## Deployment

The app is configured for easy deployment to Heroku:

1. Create a Heroku account and install the Heroku CLI
2. Log in to Heroku: `heroku login`
3. Create a new Heroku app: `heroku create your-app-name`
4. Set up environment variables on Heroku dashboard or via CLI:
   ```bash
   heroku config:set MONGODB_URI=your_mongodb_uri
   heroku config:set JWT_SECRET=your_jwt_secret
   ```
5. Deploy: `git push heroku main`

## Playing the Game

### Against an AI Opponent

1. Select "Play vs Computer" from the main menu
2. Choose your preferred AI difficulty level
3. Play your moves by clicking and dragging pieces

### Against a Friend

1. Select "Play vs Friend" from the main menu
2. Share the generated game link with your friend
3. Once they join, the game will start automatically

### Game Controls

- Use the control panel to:
  - Resign the game
  - Offer/accept draws
  - View move history
  - Flip the board
  - Toggle move highlighting
  - Adjust time settings (if applicable)
  - Save or load games

## Customization

You can customize various aspects of the app without editing code:

- **AI Difficulty**: Adjust engine depth and thinking time in the settings menu
- **Board Themes**: Choose from multiple board and piece themes
- **Time Controls**: Set time limits for games

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Chess pieces designed by [Colin M.L. Burnett](https://en.wikipedia.org/wiki/User:Cburnett/GFDL_images/Chess)
- Game logic powered by [chess.js](https://github.com/jhlywa/chess.js)
- AI powered by [Stockfish](https://stockfishchess.org/)