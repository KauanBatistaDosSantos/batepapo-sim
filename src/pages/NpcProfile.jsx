import React from 'react';
import './NpcProfile.css';

const npc = {
  nome: 'Tony Junqueira',
  idade: 25,
  altura: '1,80m',
  peso: '100kg',
  corpo: 'Parrudo',
  genero: 'Homem Ele/Dele',
  sexualidade: 'Gay Branco',
  status: 'Solteiro',
  papel: 'Ativo',
  estilo: 'Discreto',
  interesse: 'Diversão casual',
  fumante: 'Fumante',
  signo: 'Virginiano',
  instagram: '@tony.junqueirav7',
  sobre: 'Sou tranquilo, adoro sair, conversar e conhecer gente nova. Sem pressa, sem pressão.',
  online: true,
  ultimaOnline: '12 minutos atrás',
  distancia: '300m de distância',
  foto: 'https://i.pravatar.cc/600?img=12'
};

const NpcProfile = ({
    npc,
    goBack,
    isFavorited,
    isBlocked,
    onToggleFavorite,
    onToggleBlock,
    onStartChat,
  }) => {
    if (!npc) return null;
    
  return (
    <div className="npc-profile">
      <div className="npc-image-container">
        <img src={npc.foto} alt={npc.nome} className="npc-image" />

        <div className="npc-overlay">
          <button className="overlay-btn" onClick={goBack}>←</button>
          <div className="right-icons">
            <button className="overlay-btn" onClick={onToggleBlock}>
                {isBlocked ? '🚫 Bloqueado' : '🚫'}
            </button>
            <button className="overlay-btn" onClick={onToggleFavorite}>
                {isFavorited ? '⭐ Favorito' : '⭐'}
        </button>
          </div>
        </div>
      </div>

      <div className="npc-infos">
        <h2>{npc.nome}, {npc.idade}</h2>
        <p className="status">
          {npc.online ? 'Online agora' : `Online ${npc.ultimaOnline}`}
          &nbsp;&bull;&nbsp;{npc.distancia}
        </p>
        <p className="summary">{npc.papel} • {npc.altura} • {npc.peso} • {npc.corpo}</p>

        <h3>SOBRE MIM</h3>
        <div className="sobre-box">{npc.sobre}</div>

        <h3>INFORMAÇÕES PESSOAIS</h3>
        <p>{npc.idade} anos<br />{npc.altura} {npc.peso} {npc.corpo}<br />{npc.genero}<br />{npc.sexualidade}</p>

        <h3>DETALHES ADICIONAIS</h3>
        <p>{npc.status}<br />{npc.papel}<br />{npc.estilo}<br />{npc.interesse}<br />{npc.fumante}<br />{npc.signo}<br />{npc.instagram}</p>
      </div>

      <div className="npc-message-bar">
        <input type="text" placeholder="Diga algo..." />
        <button onClick={onStartChat}>💬</button>
      </div>
    </div>
  );
};

export default NpcProfile;
