import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import GameContext from '../../context/game/gameContext';

const Home = () => {
  const authContext = useContext(AuthContext);
  const gameContext = useContext(GameContext);
  const { isAuthenticated, loadUser } = authContext;
  const { createGame, getActiveGames, activeGames, loading } = gameContext;

  const [playerName, setPlayerName] = useState(localStorage.getItem('playerName') || '');
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (localStorage.token) {
      loadUser();
    }
    getActiveGames();
    // eslint-disable-next-line
  }, []);

  const handlePlayVsComputer = () => {
    navigate('/play-ai');
  };

  const handlePlayVsFriend = async () => {
    try {
      setIsCreatingGame(true);
      const gameId = await createGame(playerName || 'Guest');
      if (gameId) {
        navigate(`/game/${gameId}`);
      }
    } catch (error) {
      console.error('Error creating game:', error);
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = (gameId) => {
    navigate(`/game/${gameId}`);
  };

  return (
    <div className="home-container">
      <h1 className="home-title">Multiplayer Chess with AI</h1>
      <p className="home-description">
        Play chess against friends online or challenge our AI at different difficulty levels.
        Improve your skills, track your progress, and have fun!
      </p>

      {!isAuthenticated && (
        <div className="card mb-2">
          <div className="card-header">
            <h3>Enter Your Name</h3>
          </div>
          <div className="form-group">
            <input
              type="text"
              placeholder="Your Name"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                localStorage.setItem('playerName', e.target.value);
              }}
              className="form-control"
            />
            <small className="form-text">
              You can also <Link to="/register">register</Link> to save your games and track your progress.
            </small>
          </div>
        </div>
      )}

      <div className="game-options">
        <div className="game-option" onClick={handlePlayVsComputer}>
          <i className="fas fa-robot"></i>
          <h3>Play vs Computer</h3>
          <p>Challenge our AI opponent at different difficulty levels</p>
        </div>

        <div className="game-option" onClick={handlePlayVsFriend}>
          <i className="fas fa-user-friends"></i>
          <h3>Play vs Friend</h3>
          <p>Create a game and invite a friend to play</p>
          {isCreatingGame && (
            <div className="spinner"></div>
          )}
        </div>

        <div className="game-option">
          <Link to="/leaderboard" style={{ textDecoration: 'none', color: 'inherit' }}>
            <i className="fas fa-trophy"></i>
            <h3>Leaderboard</h3>
            <p>See top players and rankings</p>
          </Link>
        </div>
      </div>

      {activeGames && activeGames.length > 0 && (
        <div className="card mt-2">
          <div className="card-header">
            <h3>Active Games</h3>
          </div>
          <table className="table">
            <thead>
              <tr>
                <th>White</th>
                <th>Black</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {activeGames.map(game => (
                <tr key={game.id}>
                  <td>{game.playerWhite}</td>
                  <td>{game.playerBlack === 'waiting...' ? <em>Waiting for opponent</em> : game.playerBlack}</td>
                  <td>{game.status === 'waiting' ? 'Waiting' : 'In progress'}</td>
                  <td>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => handleJoinGame(game.id)}
                    >
                      {game.status === 'waiting' ? 'Join' : 'Spectate'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Home;