import React from 'react';
import './Header.css';

const Header = ({ avatarUrl, name }) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
  const fallbackAvatar = `${backendUrl}/fotos/luan.jpg`;
  const profileImage = avatarUrl && avatarUrl.trim() !== '' ? avatarUrl : fallbackAvatar;
  const altText = name ? `Foto de perfil de ${name}` : 'Foto de perfil do usuário';

  return (
    <header className="header">
      <div className="profile-container">
        <img
          src={profileImage}
          alt={altText}
          className="profile-pic"
        />
      </div>
    </header>
  );
};

export default Header;