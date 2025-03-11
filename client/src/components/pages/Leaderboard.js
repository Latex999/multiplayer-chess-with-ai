import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../../context/auth/authContext';
import Spinner from '../layout/Spinner';
import { toast } from 'react-toastify';

const Leaderboard = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('all'); // 'all', 'month', 'week'

  const authContext = useContext(AuthContext);
  const { user } = authContext;

  useEffect(() => {
    fetchLeaderboard();
    // eslint-disable-next-line
  }, [timeRange]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/users/leaderboard?timeRange=${timeRange}`);
      setUsers(res.data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      toast.error("Error loading leaderboard data");
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (e) => {
    setTimeRange(e.target.value);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="leaderboard-container">
      <h1 className="leaderboard-title">
        <i className="fas fa-trophy"></i> Leaderboard
      </h1>

      <div className="leaderboard-filters">
        <div className="time-range-filter">
          <label htmlFor="timeRange">Time Range:</label>
          <select
            id="timeRange"
            value={timeRange}
            onChange={handleTimeRangeChange}
            className="time-range-select"
          >
            <option value="all">All Time</option>
            <option value="month">This Month</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      <div className="leaderboard-table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th className="rank-column">Rank</th>
              <th className="name-column">Player</th>
              <th className="rating-column">Rating</th>
              <th className="games-column">Games</th>
              <th className="wins-column">Wins</th>
              <th className="draws-column">Draws</th>
              <th className="losses-column">Losses</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((player, index) => (
                <tr 
                  key={player._id} 
                  className={player._id === user?._id ? 'current-user-row' : ''}
                >
                  <td className="rank-column">
                    {index + 1}
                    {index < 3 && (
                      <span className={`trophy trophy-${index + 1}`}>
                        {index === 0 && '🥇'}
                        {index === 1 && '🥈'}
                        {index === 2 && '🥉'}
                      </span>
                    )}
                  </td>
                  <td className="name-column">
                    {player.name}
                    {player._id === user?._id && (
                      <span className="current-user-badge"> (You)</span>
                    )}
                  </td>
                  <td className="rating-column">{player.rating}</td>
                  <td className="games-column">{player.stats.games || 0}</td>
                  <td className="wins-column">{player.stats.wins || 0}</td>
                  <td className="draws-column">{player.stats.draws || 0}</td>
                  <td className="losses-column">{player.stats.losses || 0}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="7" className="no-data">
                  No players found for the selected time range
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="leaderboard-info">
        <h3>Rating System</h3>
        <p>
          Players are ranked using the Glicko-2 rating system. Your rating increases when you win
          and decreases when you lose, with the amount depending on your opponent's rating.
        </p>
        <p>
          New players start with a provisional rating of 1200. Your rating becomes official after
          completing 10 rated games.
        </p>
      </div>
    </div>
  );
};

export default Leaderboard;