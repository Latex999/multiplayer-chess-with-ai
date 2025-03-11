import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import { toast } from 'react-toastify';

const Login = () => {
  const authContext = useContext(AuthContext);
  const { login, error, clearErrors, isAuthenticated } = authContext;
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect if already authenticated
    if (isAuthenticated) {
      navigate('/dashboard');
    }

    if (error) {
      toast.error(error);
      clearErrors();
    }
    // eslint-disable-next-line
  }, [error, isAuthenticated, navigate]);

  const [user, setUser] = useState({
    email: '',
    password: ''
  });

  const { email, password } = user;

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = e => {
    e.preventDefault();
    if (email === '' || password === '') {
      toast.error('Please fill in all fields');
    } else {
      login({
        email,
        password
      });
    }
  };

  return (
    <div className="form-container">
      <div className="card">
        <div className="card-header">
          <h2 className="text-center">
            <i className="fas fa-sign-in-alt"></i> Login
          </h2>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              name="email"
              value={email}
              onChange={onChange}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              name="password"
              value={password}
              onChange={onChange}
              required
            />
          </div>
          <input
            type="submit"
            value="Login"
            className="btn btn-primary btn-block"
          />
        </form>
        <p className="text-center my-1">
          Don't have an account? <Link to="/register">Register</Link>
        </p>
        <p className="text-center my-1">
          <small>
            Demo login: <br />
            Email: demo@example.com <br />
            Password: password123
          </small>
        </p>
      </div>
    </div>
  );
};

export default Login;