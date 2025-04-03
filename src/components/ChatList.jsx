import React from 'react';
import './ChatList.css';

const chats = [
  { id: 1, nome: 'Lucas', msg: 'Oi, tudo bem?', foto: 'https://i.pravatar.cc/150?img=1' },
  { id: 2, nome: 'Rafael', msg: 'Curti teu perfil!', foto: 'https://i.pravatar.cc/150?img=2' },
  { id: 3, nome: 'João', msg: 'Vamos marcar algo?', foto: 'https://i.pravatar.cc/150?img=3' },
  { id: 4, nome: 'Igor', msg: 'Boa noite 😏', foto: 'https://i.pravatar.cc/150?img=4' },
];

const ChatList = ({ openChat }) => {
    return (
      <div className="chat-list">
        {chats.map(chat => (
          <div
            key={chat.id}
            className="chat-item"
            onClick={() => openChat(chat)}
          >
            <img src={chat.foto} alt={chat.nome} className="chat-avatar" />
            <div className="chat-info">
              <strong>{chat.nome}</strong>
              <p>{chat.msg}</p>
            </div>
          </div>
        ))}
      </div>
    );
  };

export default ChatList;
