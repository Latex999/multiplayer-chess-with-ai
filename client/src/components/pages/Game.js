import React, { useContext, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import GameBoard from '../game/GameBoard';
import AuthContext from '../../context/auth/authContext';
import GameContext from '../../context/game/gameContext';
import Spinner from '../layout/Spinner';

const Game = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const isSpectator = location.pathname.includes('/spectate');
  const isReview = location.pathname.includes('/review');
  
  const authContext = useContext(AuthContext);
  const { isAuthenticated, loading: authLoading, user, loadUser } = authContext;
  
  const gameContext = useContext(GameContext);
  const { loading: gameLoading, error, clearErrors } = gameContext;
  
  useEffect(() => {
    // Load user if not loaded
    if (!user) {
      loadUser();
    }
    
    // Handle unauthenticated access
    if (!authLoading && !isAuthenticated && !isSpectator) {
      navigate('/login');
    }
    
    // Clean up errors when component unmounts
    return () => {
      clearErrors();
    };
    // eslint-disable-next-line
  }, [authLoading, isAuthenticated, isSpectator]);
  
  if (authLoading || gameLoading) {
    return <Spinner />;
  }
  
  return (
    <div className="game-page-container">
      <div className="game-mode-banner">
        {isSpectator && (
          <div className="spectator-banner">
            <i className="fas fa-eye"></i> Spectator Mode
          </div>
        )}
        {isReview && (
          <div className="review-banner">
            <i className="fas fa-history"></i> Game Review
          </div>
        )}
      </div>
      
      <GameBoard spectateMode={isSpectator || isReview} />
    </div>
  );
};

export default Game;