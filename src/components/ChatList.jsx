import React, { useEffect, useState } from 'react';
import './ChatList.css';

const ChatList = ({ openChat, blockedNpcs = [] }) => {
  const [chats, setChats] = useState([]);
  const [npcData, setNpcData] = useState([]);

  useEffect(() => {
    // Carrega todos os NPCs
    fetch('/data/npcs.json')
      .then(res => res.json())
      .then(npcs => {
        setNpcData(npcs);

        const allChats = [];

        for (let i = 1; i <= 100; i++) {
          const key = `chat-npc-${i}`;
          const saved = localStorage.getItem(key);

          if (saved) {
            const mensagens = JSON.parse(saved);
            if (mensagens.length > 0) {
              const ultima = mensagens[mensagens.length - 1];
              const npc = npcs.find(n => n.id === i);

              if (npc) {
                allChats.push({
                  id: i,
                  nome: npc.nome,
                  foto: npc.foto,
                  distancia: npc.distancia,
                  ultimaMsg: ultima.text || '[imagem]',
                });
              }
            }
          }
        }

        setChats(allChats);
      });
  }, []);

  return (
    <div className="chat-list">
      {chats
      .filter(chat => !blockedNpcs.some(b => b.id === chat.id))
      .map(chat => (
        <div
          key={chat.id}
          className="chat-item"
          onClick={() =>
            openChat({
              id: chat.id,
              nome: chat.nome,
              foto: chat.foto,
              distancia: chat.distancia
            })
          }
        >
          <img src={chat.foto} alt={chat.nome} className="chat-avatar" />
          <div className="chat-info">
            <strong>{chat.nome}</strong>
            <p>{chat.ultimaMsg}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default ChatList;
