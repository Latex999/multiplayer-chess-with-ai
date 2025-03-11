import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import GameContext from '../../context/game/gameContext';
import GameCard from '../game/GameCard';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const authContext = useContext(AuthContext);
  const { user, loadUser } = authContext;
  
  const gameContext = useContext(GameContext);
  const { 
    userGames, 
    getUserGames, 
    activeGames, 
    getActiveGames,
    createGame,
    error 
  } = gameContext;

  const [showNewGame, setShowNewGame] = useState(false);
  const [newGame, setNewGame] = useState({
    name: '',
    timeControl: '10',
    isPrivate: false
  });
  
  useEffect(() => {
    loadUser();
    getUserGames();
    getActiveGames();
    
    // Refresh active games every 30 seconds
    const interval = setInterval(() => {
      getActiveGames();
    }, 30000);
    
    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);
  
  useEffect(() => {
    if (error) {
      toast.error(error);
    }
  }, [error]);

  const { name, timeControl, isPrivate } = newGame;

  const onChange = e => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setNewGame({ ...newGame, [e.target.name]: value });
  };

  const onSubmit = e => {
    e.preventDefault();
    if (name.trim() === '') {
      toast.error('Please enter a game name');
    } else {
      createGame({ 
        name: name.trim(), 
        timeControl: parseInt(timeControl, 10),
        isPrivate 
      });
      setNewGame({ name: '', timeControl: '10', isPrivate: false });
      setShowNewGame(false);
    }
  };

  const toggleNewGame = () => {
    setShowNewGame(!showNewGame);
  };

  return (
    <div className="dashboard-container">
      <div className="welcome-section">
        <h1>Welcome, {user && user.name}</h1>
        <p>Your current rating: {user && user.rating || 1200}</p>
      </div>

      <div className="dashboard-actions">
        <button onClick={toggleNewGame} className="btn btn-primary">
          {showNewGame ? 'Cancel' : 'Create New Game'}
        </button>
        <Link to="/play-ai" className="btn btn-outline">Play Against AI</Link>
      </div>

      {showNewGame && (
        <div className="new-game-form card">
          <h3>Create New Game</h3>
          <form onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="name">Game Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                placeholder="Enter a name for your game"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="timeControl">Time Control (minutes)</label>
              <select
                id="timeControl"
                name="timeControl"
                value={timeControl}
                onChange={onChange}
              >
                <option value="3">3 minutes</option>
                <option value="5">5 minutes</option>
                <option value="10">10 minutes</option>
                <option value="15">15 minutes</option>
                <option value="30">30 minutes</option>
                <option value="60">1 hour</option>
              </select>
            </div>
            <div className="form-group checkbox">
              <input
                type="checkbox"
                id="isPrivate"
                name="isPrivate"
                checked={isPrivate}
                onChange={onChange}
              />
              <label htmlFor="isPrivate">Private Game (invite only)</label>
            </div>
            <button type="submit" className="btn btn-primary">Create Game</button>
          </form>
        </div>
      )}

      <div className="games-container">
        <div className="your-games-section">
          <h2>Your Games</h2>
          {userGames && userGames.length > 0 ? (
            <div className="game-cards">
              {userGames.map(game => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          ) : (
            <p>You don't have any active games. Create a new game or join an existing one.</p>
          )}
        </div>

        <div className="active-games-section">
          <h2>Active Games</h2>
          {activeGames && activeGames.length > 0 ? (
            <div className="game-cards">
              {activeGames.map(game => (
                <GameCard key={game._id} game={game} />
              ))}
            </div>
          ) : (
            <p>There are no active games currently available.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;