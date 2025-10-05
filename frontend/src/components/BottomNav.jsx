import React from 'react';
import './BottomNav.css';

const BottomNav = ({ currentPage, setCurrentPage }) => {
  return (
    <nav className="bottom-nav">
      <button
        className={currentPage === 'favorites' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentPage('favorites')}
      >
        ⭐
        <span>Favoritos</span>
      </button>
      <button
        className={currentPage === 'home' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentPage('home')}
      >
        🏠
        <span>Início</span>
      </button>
      <button
        className={currentPage === 'messages' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentPage('messages')}
      >
        💬
        <span>Conversas</span>
      </button>
            <button
        className={currentPage === 'settings' ? 'nav-btn active' : 'nav-btn'}
        onClick={() => setCurrentPage('settings')}
      >
        ⚙️
        <span>Perfil</span>
      </button>
    </nav>
  );
};

export default BottomNav;
