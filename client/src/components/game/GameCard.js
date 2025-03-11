import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import GameContext from '../../context/game/gameContext';
import AuthContext from '../../context/auth/authContext';
import { formatDistanceToNow } from 'date-fns';

const GameCard = ({ game }) => {
  const gameContext = useContext(GameContext);
  const { joinGame } = gameContext;
  
  const authContext = useContext(AuthContext);
  const { user } = authContext;

  const {
    _id,
    name,
    createdBy,
    white,
    black,
    status,
    timeControl,
    createdAt,
    lastMoveAt,
    isPrivate
  } = game;

  // Check if the current user is already in this game
  const isUserInGame = user && (
    (white && white.player === user._id) || 
    (black && black.player === user._id)
  );

  // Format time control display
  const formatTimeControl = (minutes) => {
    if (minutes >= 60) {
      return `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`;
    }
    return `${minutes} minutes`;
  };

  // Get game status display
  const getStatusDisplay = () => {
    switch(status) {
      case 'waiting':
        return 'Waiting for opponent';
      case 'active':
        return 'Game in progress';
      case 'completed':
        return 'Game completed';
      case 'draw':
        return 'Game ended in draw';
      case 'resigned':
        return 'Game resigned';
      case 'abandoned':
        return 'Game abandoned';
      default:
        return status;
    }
  };

  // Format player name with rating
  const formatPlayer = (player) => {
    if (!player) return 'Waiting...';
    return `${player.name} (${player.rating})`;
  };

  // Handle join game click
  const handleJoinGame = () => {
    joinGame(_id);
  };

  return (
    <div className={`game-card ${status}`}>
      <div className="game-card-header">
        <h3 className="game-name">{name}</h3>
        <div className="game-status">{getStatusDisplay()}</div>
      </div>
      
      <div className="game-info">
        <div className="game-players">
          <div className="player white">
            <span className="piece">♔</span>
            <span className="player-name">{white ? formatPlayer(white) : 'Waiting...'}</span>
          </div>
          <div className="vs">vs</div>
          <div className="player black">
            <span className="piece">♚</span>
            <span className="player-name">{black ? formatPlayer(black) : 'Waiting...'}</span>
          </div>
        </div>
        
        <div className="game-details">
          <div className="time-control">
            <i className="fas fa-clock"></i> {formatTimeControl(timeControl)}
          </div>
          {isPrivate && (
            <div className="private-flag">
              <i className="fas fa-lock"></i> Private
            </div>
          )}
          <div className="created-by">
            Created by: {createdBy && createdBy.name}
          </div>
          <div className="time-info">
            {status === 'waiting' 
              ? `Created ${formatDistanceToNow(new Date(createdAt))} ago`
              : `Last move ${formatDistanceToNow(new Date(lastMoveAt || createdAt))} ago`
            }
          </div>
        </div>
      </div>
      
      <div className="game-actions">
        {status === 'waiting' && !isUserInGame && !isPrivate && (
          <button 
            onClick={handleJoinGame} 
            className="btn btn-primary join-game"
          >
            Join Game
          </button>
        )}
        
        {status === 'active' && isUserInGame && (
          <Link to={`/game/${_id}`} className="btn btn-primary">
            Continue Game
          </Link>
        )}
        
        {(status === 'active' && !isUserInGame) && (
          <Link to={`/game/${_id}/spectate`} className="btn btn-outline">
            Spectate
          </Link>
        )}
        
        {['completed', 'draw', 'resigned', 'abandoned'].includes(status) && (
          <Link to={`/game/${_id}/review`} className="btn btn-outline">
            Review Game
          </Link>
        )}
      </div>
    </div>
  );
};

GameCard.propTypes = {
  game: PropTypes.object.isRequired
};

export default GameCard;