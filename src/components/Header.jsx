import React from 'react';
import './Header.css';

const Header = () => {
  return (
    <header className="header">
      <div className="profile-container">
        <img
          src="/fotos/luan.jpg"
          alt="User"
          className="profile-pic"
        />
      </div>
    </header>
  );
};

export default Header;
