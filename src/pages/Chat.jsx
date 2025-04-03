import React, { useState } from 'react';
import './Chat.css';

const Chat = ({ npc, goBack, openProfile }) => {
    const [messages, setMessages] = useState([
    { id: 1, from: 'npc', text: 'Oi, tudo bem?' },
    { id: 2, from: 'user', text: 'Oi! Tudo sim e você?' }
  ]);

  const [showOptions, setShowOptions] = useState(false);
  const [input, setInput] = useState('');

  const predefinedMessages = [
    'Você é muito bonito 😍',
    'Vamos conversar?',
    'O que você curte fazer?'
  ];

  const sendMessage = (text) => {
    if (!text.trim()) return;
    setMessages([...messages, { id: Date.now(), from: 'user', text }]);
    setInput('');
    setShowOptions(false);
  };

  return (
    <div className="chat-container">
      <div className="chat-header" onClick={openProfile} style={{ cursor: 'pointer' }}>
        <button onClick={(e) => { e.stopPropagation(); goBack(); }}>←</button>
        <img src={npc.foto} alt={npc.nome} />
        <div className="npc-info">
            <strong>{npc.nome}</strong>
            <span>{npc.distancia}</span>
        </div>
        </div>

      <div className="chat-body">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chat-bubble ${msg.from === 'user' ? 'user' : 'npc'}`}
          >
            {msg.text}
          </div>
        ))}
      </div>

      <div className="chat-bottom">
        <div className="chat-send-bar">
          <div
            className="chat-input"
            onClick={() => setShowOptions(!showOptions)}
          >
            Diga algo...
          </div>
          <button
            className="send-btn"
            onClick={() => sendMessage(input || predefinedMessages[0])}
          >
            ➤
          </button>
        </div>

        {showOptions && (
          <div className="message-options">
            {predefinedMessages.map((msg, idx) => (
              <button key={idx} onClick={() => sendMessage(msg)}>
                {msg}
              </button>
            ))}
          </div>
        )}

        <div className="chat-actions">
          <button>🖼️</button>
          <button>📍</button>
          <button>📷</button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
