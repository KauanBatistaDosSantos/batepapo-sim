import React from 'react';
import ProfileGrid from '../components/ProfileGrid';

const Favorites = ({ favorites, openNpcProfile }) => {
  return (
    <div className="favorites-page">
      <h2 style={{ padding: '10px' }}>Favoritos</h2>
      {favorites.length > 0 ? (
        <ProfileGrid npcs={favorites} openNpcProfile={openNpcProfile} showStar={true}/>
      ) : (
        <p style={{ padding: '20px' }}>Você ainda não favoritou ninguém.</p>
      )}
    </div>
  );
};

export default Favorites;
