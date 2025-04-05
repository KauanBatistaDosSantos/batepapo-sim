import React, { useEffect, useState } from 'react';
import Header from '../components/Header';
import Filters from '../components/Filters';
import ProfileGrid from '../components/ProfileGrid';

const Home = ({ openNpcProfile, blockedNpcs }) => {
  const [npcsOriginais, setNpcsOriginais] = useState([]);
  const [npcsFiltrados, setNpcsFiltrados] = useState([]);
  const [filtrosAtivos, setFiltrosAtivos] = useState([]);
  const [filtrosAvancados, setFiltrosAvancados] = useState({});

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then(res => res.json())
      .then(data => {
        const ordenados = [...data].sort((a, b) => {
          if (a.online === b.online) {
            return a.distancia - b.distancia;
          }
          return b.online - a.online;
        });
        setNpcsOriginais(ordenados);
      });
  }, []);

  useEffect(() => {
    let filtrados = [...npcsOriginais];

    // 🔒 Remove NPCs bloqueados
    if (blockedNpcs && blockedNpcs.length > 0) {
      filtrados = filtrados.filter(npc => !blockedNpcs.some(b => b.id === npc.id));
    }

    // 🔍 Filtros rápidos
    filtrosAtivos.forEach(filtro => {
      switch (filtro) {
        case 'Online agora':
          filtrados = filtrados.filter(npc => npc.online);
          break;
        case 'Com foto':
          filtrados = filtrados.filter(npc => npc.foto);
          break;
        case 'Perto de mim':
          filtrados = filtrados.filter(npc => npc.distancia <= 1000);
          break;
        case 'Novo':
          filtrados = filtrados.filter(npc => npc.novo);
          break;
        case 'Favorito':
          const favoritos = JSON.parse(localStorage.getItem('favoritos')) || [];
          filtrados = filtrados.filter(npc => favoritos.includes(npc.id));
          break;
        default:
          break;
      }
    });

    // 🎯 Filtros avançados
    if (filtrosAvancados.idadeMin) {
      filtrados = filtrados.filter(npc => npc.idade >= Number(filtrosAvancados.idadeMin));
    }
    if (filtrosAvancados.idadeMax) {
      filtrados = filtrados.filter(npc => npc.idade <= Number(filtrosAvancados.idadeMax));
    }
    if (filtrosAvancados.alturaMin) {
      filtrados = filtrados.filter(npc => {
        const alturaNum = parseFloat(npc.altura?.replace(',', '.').replace('m', '')) || 0;
        return alturaNum >= filtrosAvancados.alturaMin / 100;
      });
    }
    if (filtrosAvancados.pesoMax) {
      filtrados = filtrados.filter(npc => {
        const pesoNum = parseInt(npc.peso?.replace('kg', '')) || 0;
        return pesoNum <= filtrosAvancados.pesoMax;
      });
    }

    setNpcsFiltrados(filtrados);
  }, [filtrosAtivos, filtrosAvancados, npcsOriginais, blockedNpcs]);

  return (
    <div className="home-page">
      <Header />
      <Filters
        filtrosAtivos={filtrosAtivos}
        setFiltrosAtivos={setFiltrosAtivos}
        filtrosAvancados={filtrosAvancados}
        setFiltrosAvancados={setFiltrosAvancados}
      />
      <ProfileGrid
            npcs={npcsFiltrados}
            openNpcProfile={(npc) => openNpcProfile(npc, npcsFiltrados)}
      />
    </div>
  );
};

export default Home;
