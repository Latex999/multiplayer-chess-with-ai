import React from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';

const GameInfo = ({ game }) => {
  const { 
    name, 
    status, 
    createdAt, 
    lastMoveAt, 
    timeControl, 
    moveHistory = []
  } = game;
  
  // Format time control display
  const formatTimeControl = (minutes) => {
    if (minutes >= 60) {
      return `${minutes / 60} ${minutes === 60 ? 'hour' : 'hours'}`;
    }
    return `${minutes} minutes`;
  };
  
  // Format status display
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
  
  // Format move history in a readable way
  const formatMoveHistory = () => {
    if (!moveHistory || moveHistory.length === 0) {
      return [];
    }
    
    // Group moves by turn number (white and black move pairs)
    const formattedMoves = [];
    
    for (let i = 0; i < moveHistory.length; i += 2) {
      const turnNumber = Math.floor(i / 2) + 1;
      const whiteMove = moveHistory[i];
      const blackMove = moveHistory[i + 1];
      
      formattedMoves.push({
        turnNumber,
        whiteMove: whiteMove ? whiteMove.san : '',
        blackMove: blackMove ? blackMove.san : ''
      });
    }
    
    return formattedMoves;
  };
  
  return (
    <div className="game-info">
      <h3 className="game-title">{name}</h3>
      
      <div className="game-status">
        <p>Status: <span className={`status-${status}`}>{getStatusDisplay()}</span></p>
        {timeControl && <p>Time Control: {formatTimeControl(timeControl)}</p>}
        
        <p>
          {status === 'waiting' 
            ? `Created ${formatDistanceToNow(new Date(createdAt))} ago`
            : `Last move ${formatDistanceToNow(new Date(lastMoveAt || createdAt))} ago`
          }
        </p>
      </div>
      
      <div className="move-history">
        <h4>Move History</h4>
        {moveHistory.length === 0 ? (
          <p className="no-moves">No moves yet</p>
        ) : (
          <div className="move-history-table">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>White</th>
                  <th>Black</th>
                </tr>
              </thead>
              <tbody>
                {formatMoveHistory().map((turn) => (
                  <tr key={turn.turnNumber}>
                    <td>{turn.turnNumber}.</td>
                    <td>{turn.whiteMove}</td>
                    <td>{turn.blackMove}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

GameInfo.propTypes = {
  game: PropTypes.object.isRequired
};

export default GameInfo;