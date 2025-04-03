import React, { useState } from 'react';
import Tabs from '../components/Tabs';
import ChatList from '../components/ChatList';

const Messages = ({ openChat }) => {
    const [activeTab, setActiveTab] = useState('mensagens');

  return (
    <div className="messages-page">
      <h2 style={{ padding: '10px' }}>Caixa de Entrada</h2>
      <Tabs activeTab={activeTab} setActiveTab={setActiveTab} />
      {activeTab === 'mensagens' && <ChatList openChat={openChat} />}
      {activeTab === 'toques' && <div style={{ padding: '20px' }}>Você não recebeu toques ainda.</div>}
      {activeTab === 'álbuns' && <div style={{ padding: '20px' }}>Nenhum álbum compartilhado.</div>}
    </div>
  );
};

export default Messages;
