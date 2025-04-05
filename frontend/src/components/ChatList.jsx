import React, { useEffect, useState } from 'react';
import './ChatList.css';

const ChatList = ({ openChat, blockedNpcs = [] }) => {
  const [chats, setChats] = useState([]);
  const [npcData, setNpcData] = useState([]);

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then(res => res.json())
      .then(npcs => {
        setNpcData(npcs);
  
        fetch("http://localhost:8000/mensagens/")
          .then(res => res.json())
          .then(conversas => {
            const allChats = Object.entries(conversas).map(([id, mensagens]) => {
              const npc = npcs.find(n => n.id === parseInt(id));
              if (!npc || mensagens.length === 0) return null;
  
              const ultima = mensagens[mensagens.length - 1];
  
              return {
                id: npc.id,
                nome: npc.nome,
                foto: npc.foto,
                distancia: npc.distancia,
                ultimaMsg: `${ultima.from === 'user' ? 'Você' : npc.nome}: ${ultima.text || '[imagem]'}`,
                timestamp: ultima.timestamp,
              };
              
            }).filter(Boolean);
  
            setChats(allChats);
          });
      });
  }, []);
  
  const formatarDataRelativa = (isoString) => {
    const data = new Date(isoString);
    const agora = new Date();
  
    const diffMs = agora - data;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHoras = Math.floor(diffMin / 60);
    const diffDias = Math.floor(diffHoras / 24);
  
    if (diffMin < 2) return "Agora";
    if (diffMin < 60) return `${diffMin} min atrás`;
    if (diffHoras < 2) return "1h atrás";
    if (diffHoras < 24) return `${diffHoras}h atrás`;
    if (diffDias === 1) return "Ontem";
    if (diffDias < 7) return `${diffDias} dias atrás`;
  
    return data.toLocaleDateString('pt-BR', {
      day: 'numeric',
      month: 'short',
    });
  };  

  return (
    <div className="chat-list">
      {chats.filter(chat => !blockedNpcs.some(b => b.id === chat.id)).length > 0 ? (
        chats
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
                <div className="chat-header-line">
                  <strong>{chat.nome}</strong>
                  <span className="chat-timestamp">
                    {formatarDataRelativa(chat.timestamp)}
                  </span>
                </div>
                <p>{chat.ultimaMsg}</p>
              </div>
            </div>
          ))
      ) : (
        <div className="empty-chat-box">
          <p className="empty-text">
            💬 Você ainda não conversou com ninguém.<br />
            Que tal iniciar uma conversa com alguém interessante?
          </p>
        </div>
      )}
    </div>
  );
  
};

export default ChatList;
