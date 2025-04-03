import React, { useState } from 'react';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import BottomNav from './components/BottomNav';
import NpcProfile from './pages/NpcProfile';
import Chat from './pages/Chat';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedNpc, setSelectedNpc] = useState(null); // novo estado
  const [favoritedNpcs, setFavoritedNpcs] = useState([]);
  const [blockedNpcs, setBlockedNpcs] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
  const [returnToChat, setReturnToChat] = useState(null);

  // Função pra mostrar perfil
  const openNpcProfile = (npc) => {
    setSelectedNpc(npc);
  };

  // Função pra voltar da tela de perfil
  const closeNpcProfile = () => {
    if (returnToChat) {
      setSelectedNpc(null);
      setActiveChat(returnToChat);
      setReturnToChat(null);
    } else {
      setSelectedNpc(null);
    }
  };

  const toggleFavorite = (npc) => {
    setFavoritedNpcs(prev =>
      prev.some(fav => fav.id === npc.id)
        ? prev.filter(fav => fav.id !== npc.id)
        : [...prev, npc]
    );
  };
  
  const toggleBlock = (npc) => {
    setBlockedNpcs(prev =>
      prev.some(blocked => blocked.id === npc.id)
        ? prev.filter(blocked => blocked.id !== npc.id)
        : [...prev, npc]
    );
  };

  return (
    <div className="app">
      {activeChat ? (
        <Chat
        npc={activeChat}
        goBack={() => setActiveChat(null)}
        openProfile={() => {
          setReturnToChat(activeChat);      // ← lembrar que o perfil veio do chat
          setActiveChat(null);              // fecha o chat
          setSelectedNpc(activeChat);       // abre o perfil
        }}
      />
      ) : selectedNpc ? (
        <NpcProfile
          npc={selectedNpc}
          goBack={closeNpcProfile}
          isFavorited={favoritedNpcs.some(n => n.id === selectedNpc.id)}
          isBlocked={blockedNpcs.some(n => n.id === selectedNpc.id)}
          onToggleFavorite={() => toggleFavorite(selectedNpc)}
          onToggleBlock={() => toggleBlock(selectedNpc)}
          onStartChat={() => setActiveChat(selectedNpc)}
        />
      ) : (
        <>
          {currentPage === 'home' && <Home openNpcProfile={openNpcProfile} />}
          {currentPage === 'favorites' && (
            <Favorites
              favorites={favoritedNpcs}
              openNpcProfile={openNpcProfile}
            />
          )}
          {currentPage === 'messages' && <Messages openChat={setActiveChat} />}
          <BottomNav
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
          />
        </>
      )}
    </div>
  );
}

export default App;
