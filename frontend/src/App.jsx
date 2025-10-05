import React, { useState } from 'react';
import Home from './pages/Home';
import Favorites from './pages/Favorites';
import Messages from './pages/Messages';
import BottomNav from './components/BottomNav';
import NpcProfile from './pages/NpcProfile';
import Chat from './pages/Chat';
import AdminPanel from './pages/AdminPanel';
import { useEffect } from 'react';
import Settings from './pages/Settings';

function App() {
  const [currentPage, setCurrentPage] = useState('home');
  const [selectedNpc, setSelectedNpc] = useState(null);
  const [favoritedNpcs, setFavoritedNpcs] = useState([]);
  const [blockedNpcs, setBlockedNpcs] = useState([]);
  const [activeChat, setActiveChat] = useState(null);
    const [userProfile, setUserProfile] = useState({
    name: 'João Silva',
    email: 'joao.silva@email.com',
    bio: 'Aventureiro digital apaixonado por descobrir novas histórias.',
    avatarUrl: 'https://i.pravatar.cc/150?img=12',
    language: 'pt-BR',
    theme: 'light',
    password: 'senha123',
    notifications: {
      email: true,
      sms: false,
      push: true,
    },
  });

  const [returnToChat, setReturnToChat] = useState(null);
  const [npcList, setNpcList] = useState([]); // ← lista visível no momento

  const openNpcProfile = (npc, list = []) => {
    setSelectedNpc(npc);
    setNpcList(list);
  };  

  const goToNextNpc = () => {
    const currentIndex = npcList.findIndex(n => n.id === selectedNpc.id);
    if (currentIndex < npcList.length - 1) {
      setSelectedNpc(npcList[currentIndex + 1]);
    }
  };
  
  const goToPreviousNpc = () => {
    const currentIndex = npcList.findIndex(n => n.id === selectedNpc.id);
    if (currentIndex > 0) {
      setSelectedNpc(npcList[currentIndex - 1]);
    }
  };  

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

  const updateUserProfile = (updates) => {
    setUserProfile(prev => ({
      ...prev,
      ...updates,
      notifications: updates.notifications
        ? { ...prev.notifications, ...updates.notifications }
        : prev.notifications,
    }));
  };

  const updateUserPassword = (newPassword) => {
    setUserProfile(prev => ({
      ...prev,
      password: newPassword,
    }));
  };

  const toggleBlock = (npc) => {
    setBlockedNpcs(prev =>
      prev.some(blocked => blocked.id === npc.id)
        ? prev.filter(blocked => blocked.id !== npc.id)
        : [...prev, npc]
    );
  };

  useEffect(() => {
    const url = new URLSearchParams(window.location.search);
    if (url.has('admin')) {
      setCurrentPage('admin');
    }
  }, []);  

  return (
    <div className="app">
      {activeChat ? (
        <Chat
        npc={activeChat}
        goBack={() => setActiveChat(null)}
        openProfile={(npcCompleto, lista) => {
          setReturnToChat(activeChat);
          setActiveChat(null);
          setSelectedNpc({ ...npcCompleto, fromChat: true }); // ✅ marca que veio do chat
          setNpcList(lista || []);
        }}
      />
      
      ) : selectedNpc ? (
        <NpcProfile
          npc={selectedNpc}
          npcList={npcList} // 👈 isso estava faltando
          goBack={closeNpcProfile}
          isFavorited={favoritedNpcs.some(n => n.id === selectedNpc.id)}
          isBlocked={blockedNpcs.some(n => n.id === selectedNpc.id)}
          onToggleFavorite={() => toggleFavorite(selectedNpc)}
          onToggleBlock={() => toggleBlock(selectedNpc)}
          onStartChat={() => setActiveChat(selectedNpc)}
          goToNextNpc={goToNextNpc}
          goToPreviousNpc={goToPreviousNpc}
        />

      ) : (
        <>
          {currentPage === 'home' && (
            <Home
              openNpcProfile={openNpcProfile}
              blockedNpcs={blockedNpcs}
              userProfile={userProfile}
            />
          )}

          {currentPage === 'messages' && (
            <Messages
              openChat={setActiveChat}
              blockedNpcs={blockedNpcs}
            />
          )}

          {currentPage === 'admin' && (
            <AdminPanel />
          )}

          {currentPage === 'favorites' && (
            <Favorites
              favorites={favoritedNpcs}
              openNpcProfile={openNpcProfile}
            />
          )}

                    {currentPage === 'settings' && (
            <Settings
              profile={userProfile}
              onSaveProfile={updateUserProfile}
              onChangePassword={updateUserPassword}
            />
          )}

          {currentPage !== 'admin' && (
            <BottomNav
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
            />
          )}

        </>
      )}
    </div>
  );
}

export default App;
