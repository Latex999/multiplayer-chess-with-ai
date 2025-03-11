import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../../context/auth/authContext';
import { toast } from 'react-toastify';

const Register = () => {
  const authContext = useContext(AuthContext);
  const { register, error, clearErrors, isAuthenticated } = authContext;
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
    name: '',
    email: '',
    password: '',
    password2: ''
  });

  const { name, email, password, password2 } = user;

  const onChange = e => setUser({ ...user, [e.target.name]: e.target.value });

  const onSubmit = e => {
    e.preventDefault();
    if (name === '' || email === '' || password === '') {
      toast.error('Please enter all fields');
    } else if (password !== password2) {
      toast.error('Passwords do not match');
    } else if (password.length < 6) {
      toast.error('Password must be at least 6 characters');
    } else {
      register({
        name,
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
            <i className="fas fa-user-plus"></i> Register
          </h2>
        </div>
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="name">Name</label>
            <input
              id="name"
              type="text"
              name="name"
              value={name}
              onChange={onChange}
              required
            />
          </div>
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
              minLength="6"
            />
          </div>
          <div className="form-group">
            <label htmlFor="password2">Confirm Password</label>
            <input
              id="password2"
              type="password"
              name="password2"
              value={password2}
              onChange={onChange}
              required
              minLength="6"
            />
          </div>
          <input
            type="submit"
            value="Register"
            className="btn btn-primary btn-block"
          />
        </form>
        <p className="text-center my-1">
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;