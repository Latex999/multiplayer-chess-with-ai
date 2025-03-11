import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { formatDistanceToNow } from 'date-fns';
import AuthContext from '../../context/auth/authContext';
import { useContext } from 'react';

const GameChat = ({ messages = [], onSendMessage, disabled = false }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  
  const authContext = useContext(AuthContext);
  const { user } = authContext;
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  const handleSubmit = (e) => {
    e.preventDefault();
    if (message.trim() && onSendMessage) {
      onSendMessage(message);
      setMessage('');
    }
  };
  
  return (
    <div className="game-chat">
      <h4>Game Chat</h4>
      
      <div className="chat-messages">
        {messages.length === 0 ? (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        ) : (
          <>
            {messages.map((msg, index) => (
              <div 
                key={index} 
                className={`chat-message ${msg.sender && msg.sender._id === user?._id ? 'own-message' : ''}`}
              >
                <div className="message-header">
                  <span className="sender-name">
                    {msg.sender ? msg.sender.name : 'System'}
                  </span>
                  <span className="message-time">
                    {formatDistanceToNow(new Date(msg.timestamp))} ago
                  </span>
                </div>
                <div className="message-content">{msg.text}</div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="chat-form">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={disabled ? "Chat disabled in spectator mode" : "Type a message..."}
          disabled={disabled}
          className="chat-input"
        />
        <button 
          type="submit" 
          className="chat-send-btn"
          disabled={disabled || !message.trim()}
        >
          <i className="fas fa-paper-plane"></i>
        </button>
      </form>
    </div>
  );
};

GameChat.propTypes = {
  messages: PropTypes.array,
  onSendMessage: PropTypes.func.isRequired,
  disabled: PropTypes.bool
};

export default GameChat;