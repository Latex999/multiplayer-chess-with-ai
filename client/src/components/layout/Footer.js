import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <p>
        &copy; {new Date().getFullYear()} Multiplayer Chess with AI - All rights reserved
      </p>
      <p>
        <small>
          Chess pieces designed by{' '}
          <a href="https://en.wikipedia.org/wiki/User:Cburnett/GFDL_images/Chess" target="_blank" rel="noopener noreferrer">
            Colin M.L. Burnett
          </a>
        </small>
      </p>
    </footer>
  );
};

export default Footer;