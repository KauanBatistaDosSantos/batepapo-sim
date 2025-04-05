import React, { useState } from 'react';
import './NpcProfile.css';

const NpcProfile = ({
  npc,
  npcList = [],
  goBack,
  isFavorited,
  isBlocked,
  onToggleFavorite,
  onToggleBlock,
  onStartChat,
  goToNextNpc,
  goToPreviousNpc
}) => {
  if (!npc) return null;

  // Coleta todas as fotos do NPC dinamicamente
  const fotos = Object.entries(npc)
    .filter(([key, value]) => key.startsWith('foto') && value)
    .map(([_, value]) => value);

  const [fotoIndex, setFotoIndex] = useState(0);
  const [ampliada, setAmpliada] = useState(false);

  const fotoAtual = fotos[fotoIndex] || npc.foto;

  const irParaAnterior = () => {
    setFotoIndex((prev) => (prev - 1 + fotos.length) % fotos.length);
  };

  const irParaProxima = () => {
    setFotoIndex((prev) => (prev + 1) % fotos.length);
  };

  const toggleFavorite = async () => {
    try {
      const res = await fetch(`http://localhost:8000/npcs/${npc.id}/favorito`, {
        method: "POST",
      });
      const data = await res.json();
      if (res.ok) {
        npc.favorito = data.favorito;
        onToggleFavorite?.(); // Se quiser manter a lógica local também
      }
    } catch (err) {
      alert("Erro ao favoritar NPC.");
      console.error(err);
    }
  };  

  return (
    <div className="npc-profile">
      <div className="npc-image-container">

        {/* Seta lateral esquerda para navegar fotos */}
        {fotos.length > 1 && (
          <div className="image-nav-left" onClick={(e) => {
            e.stopPropagation();
            irParaAnterior();
          }}>‹</div>
        )}

        {/* Navegação de perfil (apenas se veio da Home) */}
        {!npc.fromChat && typeof goToPreviousNpc === 'function' && (
          <div className="image-nav-left profile-nav" onClick={(e) => {
            e.stopPropagation();
            goToPreviousNpc();
          }}></div>
        )}

        <img
          src={fotoAtual}
          alt={npc.nome}
          className="npc-image"
          onClick={() => setAmpliada(true)}
          style={{ cursor: 'zoom-in' }}
        />

        {!npc.fromChat && typeof goToNextNpc === 'function' && (
          <div className="image-nav-right profile-nav" onClick={(e) => {
            e.stopPropagation();
            goToNextNpc();
          }}></div>
        )}

        {/* Seta lateral direita para navegar fotos */}
        {fotos.length > 1 && (
          <div className="image-nav-right" onClick={(e) => {
            e.stopPropagation();
            irParaProxima();
          }}>›</div>
        )}

        <div className="npc-overlay">
          <button className="overlay-btn" onClick={goBack}>←</button>
          <div className="right-icons">
            <button className="overlay-btn" onClick={onToggleBlock}>
              {isBlocked ? '🚫 Bloqueado' : '🚫'}
            </button>
            <button className="overlay-btn" onClick={toggleFavorite}>
              {npc.favorito ? '⭐ Favorito' : '⭐'}
            </button>
          </div>
        </div>
      </div>

      <div className="npc-infos">
        <h2>{npc.nome}, {npc.idade}</h2>
        <p className="status">
          {npc.online ? 'Online agora' : `Online ${npc.ultimaOnline}`}
          &nbsp;&bull;&nbsp;
          {npc.distancia < 1000
            ? `${npc.distancia}m de distância`
            : `${(npc.distancia / 1000).toFixed(1)}km de distância`}
        </p>
        <p className="summary">
          {[npc.papel, npc.altura, npc.peso, npc.corpo].filter(Boolean).join(' • ')}
        </p>

        <h3>SOBRE MIM</h3>
        <div className="sobre-box">{npc.sobre}</div>

        <h3>INFORMAÇÕES PESSOAIS</h3>
        <p>
          {npc.idade && `${npc.idade} anos`}<br />
          {[npc.altura, npc.peso, npc.corpo].filter(Boolean).join(' ')}<br />
          {npc.genero && <>{npc.genero}<br /></>}
          {npc.sexualidade}
        </p>

        <h3>DETALHES ADICIONAIS</h3>
        <p>
          {npc.status && <>{npc.status}<br /></>}
          {npc.papel && <>{npc.papel}<br /></>}
          {npc.estilo && <>{npc.estilo}<br /></>}
          {npc.interesse && <>{npc.interesse}<br /></>}
          {npc.fumante && <>{npc.fumante}<br /></>}
          {npc.signo && <>{npc.signo}<br /></>}
          {npc.instagram && <>{npc.instagram}</>}
        </p>
      </div>

      <div className="npc-message-bar">
        <input type="text" placeholder="Diga algo..." />
        <button onClick={onStartChat}>💬</button>
      </div>

            {/* 📸 Imagem ampliada */}
            {ampliada && (
        <div className="foto-popup" onClick={() => setAmpliada(false)}>
          <button className="close-popup" onClick={() => setAmpliada(false)}>✖</button>
          <div className="popup-img-wrapper" onClick={e => e.stopPropagation()}>
            <img src={fotoAtual} alt="ampliada" />
            {fotos.length > 1 && (
              <>
                <button className="popup-nav left" onClick={irParaAnterior}>‹</button>
                <button className="popup-nav right" onClick={irParaProxima}>›</button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NpcProfile;
