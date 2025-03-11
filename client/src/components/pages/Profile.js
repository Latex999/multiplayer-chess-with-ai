import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import Spinner from '../layout/Spinner';
import { toast } from 'react-toastify';

const Profile = () => {
  const authContext = useContext(AuthContext);
  const { user, loading, updateUser, loadUser } = authContext;
  const navigate = useNavigate();

  // Profile state
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    bio: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Game history state
  const [gameHistory, setGameHistory] = useState([]);
  const [gamesLoading, setGamesLoading] = useState(true);

  // Stats state
  const [stats, setStats] = useState({
    totalGames: 0,
    wins: 0,
    losses: 0,
    draws: 0,
    winRate: 0
  });

  useEffect(() => {
    // Redirect if not authenticated
    if (!loading && !user) {
      navigate('/login');
    }

    // Load user data if needed
    if (!user) {
      loadUser();
    } else {
      // Populate form with user data
      setFormData({
        name: user.name || '',
        email: user.email || '',
        bio: user.bio || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });

      // Fetch game history
      fetchGameHistory();
    }
    // eslint-disable-next-line
  }, [loading, user]);

  // Fetch user's game history
  const fetchGameHistory = async () => {
    setGamesLoading(true);
    try {
      const res = await axios.get('/api/games/user');
      setGameHistory(res.data);
      
      // Calculate stats
      calculateStats(res.data);
      
      setGamesLoading(false);
    } catch (error) {
      console.error('Error fetching game history:', error);
      toast.error('Could not load game history');
      setGamesLoading(false);
    }
  };

  // Calculate user stats from game history
  const calculateStats = (games) => {
    if (!games || !games.length || !user) return;

    const totalGames = games.length;
    let wins = 0;
    let losses = 0;
    let draws = 0;

    games.forEach(game => {
      if (game.status === 'completed') {
        if (game.winner && game.winner.toString() === user._id) {
          wins++;
        } else if (game.winner) {
          losses++;
        }
      } else if (game.status === 'draw') {
        draws++;
      } else if (game.status === 'resigned') {
        if (game.resignedBy && game.resignedBy.toString() !== user._id) {
          wins++;
        } else {
          losses++;
        }
      }
    });

    const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

    setStats({
      totalGames,
      wins,
      losses,
      draws,
      winRate
    });
  };

  // Handle form input changes
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Handle profile update form submission
  const onSubmitProfile = e => {
    e.preventDefault();
    
    // Prepare update data
    const updateData = {
      name: formData.name,
      bio: formData.bio
    };

    updateUser(updateData);
    toast.success('Profile updated successfully');
  };

  // Handle password change form submission
  const onSubmitPassword = e => {
    e.preventDefault();
    
    const { currentPassword, newPassword, confirmPassword } = formData;
    
    // Validate password inputs
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }
    
    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    
    // Send password update request
    axios.put('/api/users/password', { 
      currentPassword, 
      newPassword 
    })
      .then(res => {
        toast.success('Password updated successfully');
        setFormData({
          ...formData,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      })
      .catch(err => {
        console.error('Password update error:', err);
        toast.error(err.response.data.msg || 'Error updating password');
      });
  };

  // Format date
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Loading state
  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="profile-container">
      <h1 className="profile-title">Your Profile</h1>
      
      <div className="profile-grid">
        {/* Profile Information Section */}
        <div className="profile-info card">
          <div className="profile-header">
            <div className="profile-avatar">
              {/* Display first letter of user's name as avatar */}
              <span>{user && user.name ? user.name.charAt(0).toUpperCase() : 'U'}</span>
            </div>
            <div className="profile-name-rating">
              <h2>{user && user.name}</h2>
              <div className="rating">Rating: {user && user.rating}</div>
            </div>
          </div>

          <form onSubmit={onSubmitProfile}>
            <div className="form-group">
              <label htmlFor="name">Name</label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                name="email"
                id="email"
                value={formData.email}
                disabled
              />
              <small>Email cannot be changed</small>
            </div>
            
            <div className="form-group">
              <label htmlFor="bio">Bio</label>
              <textarea
                name="bio"
                id="bio"
                value={formData.bio}
                onChange={onChange}
                placeholder="Tell us about yourself..."
                rows="3"
              ></textarea>
            </div>
            
            <button type="submit" className="btn btn-primary">
              Update Profile
            </button>
          </form>
        </div>

        {/* Password Change Section */}
        <div className="password-change card">
          <h3>Change Password</h3>
          <form onSubmit={onSubmitPassword}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                name="currentPassword"
                id="currentPassword"
                value={formData.currentPassword}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                name="newPassword"
                id="newPassword"
                value={formData.newPassword}
                onChange={onChange}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                name="confirmPassword"
                id="confirmPassword"
                value={formData.confirmPassword}
                onChange={onChange}
              />
            </div>
            
            <button type="submit" className="btn btn-primary">
              Change Password
            </button>
          </form>
        </div>

        {/* Player Stats Section */}
        <div className="player-stats card">
          <h3>Your Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Games</span>
              <span className="stat-value">{stats.totalGames}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Wins</span>
              <span className="stat-value wins">{stats.wins}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Draws</span>
              <span className="stat-value draws">{stats.draws}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Losses</span>
              <span className="stat-value losses">{stats.losses}</span>
            </div>
            <div className="stat-item win-rate">
              <span className="stat-label">Win Rate</span>
              <span className="stat-value">{stats.winRate}%</span>
            </div>
          </div>
        </div>

        {/* Game History Section */}
        <div className="game-history card">
          <h3>Recent Games</h3>
          
          {gamesLoading ? (
            <div className="center-spinner">
              <Spinner />
            </div>
          ) : gameHistory.length > 0 ? (
            <div className="history-table-container">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Opponent</th>
                    <th>Result</th>
                    <th>Rating Δ</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {gameHistory.map(game => {
                    // Determine opponent and result
                    const isWhite = game.white && game.white.player === user._id;
                    const opponent = isWhite 
                      ? (game.black ? game.black.name : 'Unknown') 
                      : (game.white ? game.white.name : 'Unknown');
                    
                    let result = 'Unknown';
                    let resultClass = '';
                    
                    if (game.status === 'completed') {
                      if (game.winner === user._id) {
                        result = 'Won';
                        resultClass = 'win';
                      } else {
                        result = 'Lost';
                        resultClass = 'loss';
                      }
                    } else if (game.status === 'draw') {
                      result = 'Draw';
                      resultClass = 'draw';
                    } else if (game.status === 'resigned') {
                      if (game.resignedBy === user._id) {
                        result = 'Resigned';
                        resultClass = 'loss';
                      } else {
                        result = 'Won (Opp. Resigned)';
                        resultClass = 'win';
                      }
                    } else if (game.status === 'abandoned') {
                      result = 'Abandoned';
                      resultClass = 'draw';
                    }
                    
                    return (
                      <tr key={game._id}>
                        <td>{formatDate(game.createdAt)}</td>
                        <td>{opponent}</td>
                        <td className={resultClass}>{result}</td>
                        <td className={game.ratingChange > 0 ? 'positive' : game.ratingChange < 0 ? 'negative' : ''}>
                          {game.ratingChange > 0 ? '+' : ''}{game.ratingChange || '-'}
                        </td>
                        <td>
                          <button 
                            onClick={() => navigate(`/game/${game._id}/review`)}
                            className="btn btn-sm btn-outline"
                          >
                            Review
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="no-games">You haven't played any games yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;