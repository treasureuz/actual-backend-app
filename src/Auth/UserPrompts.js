// UserPrompts.js
import React, { useState } from 'react';
import './UserPrompts.css';

const UserPrompts = ({ prompts, onSubmit }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (input.trim() !== '') {
      onSubmit(input.trim());
      setInput('');
    }
  };

  return (
    <div className="user-prompts-container">
      <form onSubmit={handleSubmit} className="user-prompts-form">
        <input
          type="text"
          placeholder="What do you wanna know?"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="user-prompts-input"
        />
        <button type="submit" className="user-prompts-button">
          Submit
        </button>
      </form>

      {/* Output Box for Displaying Prompts */}
      <div className="prompts-output">
        <h2>Your Prompts:</h2>
        {prompts.length > 0 ? (
          <ul className="prompts-list">
            {prompts.map((prompt, index) => (
              <li key={index} className="prompt-item">
                {prompt}
              </li>
            ))}
          </ul>
        ) : (
          <p className="no-prompts">No prompts yet. Start by adding one!</p>
        )}
      </div>
    </div>
  );
};

export default UserPrompts;
