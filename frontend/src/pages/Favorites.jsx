import React, { useEffect, useState } from 'react';
import ProfileGrid from '../components/ProfileGrid';

const Favorites = ({ openNpcProfile }) => {
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    fetch("http://localhost:8000/npcs/favoritos")
      .then(res => res.json())
      .then(data => setFavorites(data))
      .catch(err => {
        console.error("Erro ao carregar favoritos:", err);
        setFavorites([]);
      });
  }, []);

  return (
    <div className="favorites-page">
      <h2 style={{ padding: '10px' }}>Favoritos</h2>
      {favorites.length > 0 ? (
        <ProfileGrid
          npcs={favorites}
          openNpcProfile={openNpcProfile}
          showStar={true}
        />
      ) : (
        <p style={{ padding: '20px' }}>
          Você ainda não favoritou ninguém.
        </p>
      )}
    </div>
  );
};

export default Favorites;
