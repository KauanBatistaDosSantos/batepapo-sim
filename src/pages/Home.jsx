import React from 'react';
import Header from '../components/Header';
import Filters from '../components/Filters';
import ProfileGrid from '../components/ProfileGrid';

const npcs = [
    { id: 1, nome: 'Lucas', foto: 'https://i.pravatar.cc/150?img=1' },
    { id: 2, nome: 'Rafael', foto: 'https://i.pravatar.cc/150?img=11' },
    { id: 3, nome: 'Thiago', foto: 'https://i.pravatar.cc/150?img=3' },
    { id: 4, nome: 'Matheus', foto: 'https://i.pravatar.cc/150?img=12' },
    { id: 5, nome: 'Carlos', foto: 'https://i.pravatar.cc/150?img=13' },
    { id: 6, nome: 'João', foto: 'https://i.pravatar.cc/150?img=14' },
    { id: 7, nome: 'Bruno', foto: 'https://i.pravatar.cc/150?img=7' },
    { id: 8, nome: 'Igor', foto: 'https://i.pravatar.cc/150?img=8' },
  ];

const Home = ({ openNpcProfile }) => {
  return (
    <div className="home-page">
      <Header />
      <Filters />
      <ProfileGrid npcs={npcs} openNpcProfile={openNpcProfile} />
    </div>
  );
};

export default Home;
