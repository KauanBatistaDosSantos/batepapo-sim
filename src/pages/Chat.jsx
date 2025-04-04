import React, { useEffect, useState } from 'react';
import { useMemo } from 'react';
import { useRef } from 'react';
import './Chat.css';

const Chat = ({ npc, goBack, openProfile }) => {
  const [messages, setMessages] = useState([]);
  const [dialogTree, setDialogTree] = useState(null);
  const [options, setOptions] = useState([]);
  const [showOptions, setShowOptions] = useState(false);
  const [currentStep, setCurrentStep] = useState('inicio');
  const [galeria, setGaleria] = useState([]);
  const [showGallery, setShowGallery] = useState(false);
  const [imagemAberta, setImagemAberta] = useState(null);
  const [imagemAbertaIndex, setImagemAbertaIndex] = useState(0);
  const [showSetas, setShowSetas] = useState(false);

  const storageKey = `chat-npc-${npc.id}`;
  const fimDoChatRef = useRef(null);

  const scrollParaFim = () => {
    fimDoChatRef.current?.scrollIntoView({ behavior: 'auto' });
  };  

  const playSound = () => {
    const audio = new Audio('/sounds/msg.mp3');
    audio.play();
  };

  const mostrarSetasTemporariamente = () => {
    setShowSetas(true);
    clearTimeout(window.setasTimeout);
    window.setasTimeout = setTimeout(() => setShowSetas(false), 3000);
  };  

  const imagensChat = useMemo(() => {
    return messages.filter(msg => msg.type === 'image');
  }, [messages]);  

  const abrirImagem = (url, index) => {
    setImagemAberta(url);
    setImagemAbertaIndex(index);
    mostrarSetasTemporariamente();
  };  

  const enviarImagem = (url) => {
    const imagem = {
      id: Date.now(),
      from: 'user',
      type: 'image',
      url
    };
    updateMessages(imagem);
    setShowGallery(false);
  };

  const navegarImagem = (direcao) => {
    if (!imagensChat.length) return;
  
    const novoIndex = (imagemAbertaIndex + direcao + imagensChat.length) % imagensChat.length;
    setImagemAberta(imagensChat[novoIndex].url);
    setImagemAbertaIndex(novoIndex);
  
    mostrarSetasTemporariamente();
  };  

  // Função para adicionar mensagem e salvar
  const updateMessages = (newMsg) => {
    setMessages(prev => {
      const updated = [...prev, newMsg];
      localStorage.setItem(storageKey, JSON.stringify(updated));
      return updated;
    });
  };

  // Carregar histórico salvo e árvore de diálogo
// 1️⃣ Carrega dados do NPC e mensagens
    useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      setMessages(JSON.parse(saved));
    }
  
    fetch('/data/dialogo-fluxo.json')
      .then(res => res.json())
      .then(data => {
        const npcTree = data[npc.id];
        if (npcTree && npcTree.inicio) {
          setDialogTree(npcTree);
          setOptions(npcTree.inicio.respostas);
          setCurrentStep('inicio');
        }
      });
  
    carregarGaleria();
  }, [npc]);
  
  // 2️⃣ Scrolla para o final sempre que as mensagens mudarem
  useEffect(() => {
    scrollParaFim();
  }, [messages]);  
  
  const carregarGaleria = () => {
    fetch('/data/fotos.json')
      .then(res => res.json())
      .then(fotos => {
        const imagensFiltradas = fotos
          .filter(f => f.autor === 'player' && f.npcId === npc.id)
          .sort((a, b) => new Date(b.data) - new Date(a.data));
  
        setGaleria(imagensFiltradas);
      });
  };  

  const sendMessage = (text) => {
    if (!text.trim()) return;

    const userMsg = { id: Date.now(), from: 'user', type: 'text', text };
    updateMessages(userMsg);
    setShowOptions(false);

    const typing = { id: 'typing', from: 'npc', type: 'text', text: '...' };
    updateMessages(typing);

    const delay = Math.floor(1500 + Math.random() * 1000);

    setTimeout(() => {
      setMessages(prev => {
        const withoutTyping = prev.filter(m => m.id !== 'typing');

        const npcReplyData =
          dialogTree?.[currentStep]?.npc?.[text] ||
          dialogTree?.inicio?.npc?.[text] || {
            resposta: 'Interessante!',
            proximas: []
          };

        const npcMsg = {
          id: Date.now() + 1,
          from: 'npc',
          type: 'text',
          text: npcReplyData.resposta
        };

        playSound();
        setOptions(npcReplyData.proximas || []);
        setCurrentStep(text);

        const updated = [...withoutTyping, npcMsg];
        localStorage.setItem(storageKey, JSON.stringify(updated));
        return updated;
      });
    }, delay);
  };

  return (
    <div className="chat-container">
      <div className="chat-header" onClick={openProfile} style={{ cursor: 'pointer' }}>
        <button onClick={(e) => { e.stopPropagation(); goBack(); }}>←</button>
        <img src={npc.foto} alt={npc.nome} />
        <div className="npc-info">
          <strong>{npc.nome}</strong>
          <span>
            {npc.distancia < 1000
                ? `${npc.distancia}m de distância`
                : `${(npc.distancia / 1000).toFixed(1)}km de distância`}
            </span>
        </div>
      </div>

      <div className="chat-body">
      {imagemAberta && (
        <div
            className="imagem-popup-overlay"
            onClick={() => setImagemAberta(null)}
            onMouseMove={mostrarSetasTemporariamente}
        >
            <div className="imagem-popup" onClick={(e) => e.stopPropagation()}>
            <>
            <button
                className={`nav-img left ${showSetas ? 'visivel' : 'invisivel'}`}
                onClick={(e) => {
                e.stopPropagation();
                navegarImagem(-1);
                }}
            >
                ◀
            </button>

            <button
                className={`nav-img right ${showSetas ? 'visivel' : 'invisivel'}`}
                onClick={(e) => {
                e.stopPropagation();
                navegarImagem(1);
                }}
            >
                ▶
            </button>
            </>

            <img src={imagemAberta} alt="ampliada" className="zoom-img" />
            <button className="close-img-btn" onClick={() => setImagemAberta(null)}>❌</button>
            </div>
        </div>
        )}

        {messages.map((msg, idx) => {
        if (msg.type === 'image') {
            const imageIndex = imagensChat.findIndex(m => m === msg);
            return (
            <div key={idx} className={`chat-bubble ${msg.from === 'user' ? 'user' : 'npc'}`}>
                <img
                src={msg.url}
                alt="imagem enviada"
                onClick={() => abrirImagem(msg.url, imageIndex)}
                style={{
                    maxWidth: '200px',
                    borderRadius: '12px',
                    marginTop: '4px',
                    cursor: 'pointer'
                }}
                />
            </div>
            );
        }

        return (
            <div key={idx} className={`chat-bubble ${msg.from === 'user' ? 'user' : 'npc'}`}>
            {msg.text}
            </div>
        );
        })}

        <div ref={fimDoChatRef} />
      </div>

      {showGallery && (
        <div className="chat-gallery" onClick={(e) => e.stopPropagation()}>
            <button className="close-gallery-btn" onClick={() => setShowGallery(false)}>❌</button>
            <p className="gallery-title">Sua galeria</p>
            <div className="gallery-grid">
            {galeria.map((img, index) => (
                <img
                key={index}
                src={img.url}
                alt="galeria"
                onClick={() => enviarImagem(img.url)}
                className="gallery-thumb"
                />
            ))}
            </div>
        </div>
        )}

      <div className="chat-bottom">
        <div className="chat-send-bar">
          <div
            className="chat-input"
            onClick={() => setShowOptions(!showOptions)}
          >
            Diga algo...
          </div>
          <button
            className="send-btn"
            onClick={() => sendMessage(options[0] || 'Oi!')}
          >
            ➤
          </button>
        </div>

        {showOptions && (
          <div className="message-options">
            {options.map((msg, idx) => (
              <button key={idx} onClick={() => sendMessage(msg)}>
                {msg}
              </button>
            ))}
          </div>
        )}

        <div className="chat-actions">
          <button title="Galeria (futuro)">🖼️</button>
          <button title="Localização (futuro)">📍</button>
          <button
            title="Enviar Foto"
            onClick={() => {
                if (showGallery) {
                  setShowGallery(false);
                } else {
                  carregarGaleria();
                  setShowGallery(true);
                }
              }}
            >
            📷
            </button>
        </div>
      </div>
    </div>
  );
};

export default Chat;
