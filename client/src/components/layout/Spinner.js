import React from 'react';
import spinner from '../../assets/spinner.gif';

const Spinner = () => {
  return (
    <div className="spinner-container">
      <img 
        src={spinner} 
        alt="Loading..." 
        style={{ width: '100px', margin: 'auto', display: 'block' }} 
      />
    </div>
  );
};

export default Spinner;