import React from 'react';
import './ProfileGrid.css';

const ProfileGrid = ({ npcs, openNpcProfile, showStar = false }) => {
    return (
      <div className="profile-grid">
        {npcs.map(npc => (
          <div
            key={npc.id}
            className="profile-card"
            onClick={() => openNpcProfile(npc)}
          >
            <img src={npc.foto} alt={npc.nome} className="profile-image" />
            <p className="profile-name">
                {npc.online && <span className="online-dot" />}
                {npc.nome}
            </p>
            {showStar && <div className="favorite-badge">⭐</div>}
           </div>
        ))}
      </div>
    );
  };

export default ProfileGrid;
