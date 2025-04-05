import React from 'react';
import './Header.css';

const Header = () => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";

  return (
    <header className="header">
      <div className="profile-container">
        <img
          src={`${backendUrl}/fotos/luan.jpg`}
          alt="User"
          className="profile-pic"
        />
      </div>
    </header>
  );
};

export default Header;
