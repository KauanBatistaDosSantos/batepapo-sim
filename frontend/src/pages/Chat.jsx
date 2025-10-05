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
  const [clickedMsgId, setClickedMsgId] = useState(null);
  const [npcList, setNpcList] = useState([]);
  const [npcInfo, setNpcInfo] = useState(npc);
  const [galeriaGlobal, setGaleriaGlobal] = useState([]);
  const [showGaleriaGlobal, setShowGaleriaGlobal] = useState(false);

  const storageKey = `chat-npc-${npc.id}`;
  const fimDoChatRef = useRef(null);

  const toggleTimestamp = (id) => {
    setClickedMsgId(prev => (prev === id ? null : id));
  };

    useEffect(() => {
      fetch('http://localhost:8000/npcs')
        .then(res => res.json())
        .then(npcs => {
        const completo = npcs.find(n => n.id === npc.id);
        if (completo) setNpcInfo(completo);
        });
    }, [npc]);

  const playSound = () => {
    const audio = new Audio('/sounds/msg.mp3');
    audio.play();
  };

  const carregarGaleriaGlobal = () => {
    const fotos = [];
  
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
  
      if (key.startsWith('chat-npc-')) {
        const stored = JSON.parse(localStorage.getItem(key));
        const imagens = stored.filter(m => m.type === 'image' && m.from === 'user');
        fotos.push(...imagens);
      }
    }
  
    // Remove duplicadas (por URL)
    const unicas = fotos.filter((foto, index, self) =>
      index === self.findIndex(f => f.url === foto.url)
    );
  
    // Ordena por data (mais recentes primeiro)
    const ordenadas = unicas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
  
    setGaleriaGlobal(ordenadas);
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

  useEffect(() => {
    if (messages.length === 0) return;
  
    const imgs = document.querySelectorAll('.chat-bubble img');
    const promises = Array.from(imgs).map(img =>
      img.complete ? Promise.resolve() : new Promise(resolve => {
        img.onload = img.onerror = resolve;
      })
    );
  
    Promise.all(promises).then(() => {
      // Espera layout terminar de montar
      requestAnimationFrame(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    });
  }, [messages]);

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then(res => res.json())
      .then(npcs => {
        const completo = npcs.find(n => n.id === npc.id);
        if (completo) {
          setNpcInfo(completo);
          setNpcList(npcs); // 👈 novo estado
        }
      });
  }, [npc]);

  const formatDate = (iso) => {
    const date = new Date(iso);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
  
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
  
    if (isToday) return 'Hoje';
    if (isYesterday) return 'Ontem';
  
    return date.toLocaleDateString();
  };
  
  const groupMessagesByDate = (msgs) => {
    return msgs.reduce((acc, msg) => {
      const day = formatDate(msg.timestamp);
      if (!acc[day]) acc[day] = [];
      acc[day].push(msg);
      return acc;
    }, {});
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
    const messageWithTime = {
      ...newMsg,
      timestamp: new Date().toISOString(),
    };
  
    setMessages(prev => {
      const updated = [...prev, messageWithTime];
  
      fetch(`http://localhost:8000/mensagens/${npc.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          npc_id: npc.id,
          mensagens: updated
        })
      });
  
      return updated;
    });
  };  

  // Carregar histórico salvo e árvore de diálogo
// 1️⃣ Carrega dados do NPC e mensagens
  useEffect(() => {
    fetch(`http://localhost:8000/mensagens/${npc.id}`)
      .then(res => res.json())
      .then(data => setMessages(data));

      fetch(`http://localhost:8000/dialogos/${npc.id}`)
      .then(res => res.json())
      .then(data => {
        if (data && data.inicio) {
          setDialogTree(data);
          setOptions(data.inicio.respostas);
          setCurrentStep('inicio');
        }
      });

    carregarGaleria();
  }, [npc]);

  
  const carregarGaleria = () => {
    fetch(`http://localhost:8000/fotos?npc_id=${npc.id}`)
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
            text: npcReplyData.resposta,
            timestamp: new Date().toISOString(), // 👈 adiciona a hora da resposta
          };          

        playSound();
        setOptions(npcReplyData.proximas || []);
        setCurrentStep(text);

        const updated = [...withoutTyping, npcMsg];

        fetch(`http://localhost:8000/mensagens/${npc.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            npc_id: npc.id,
            mensagens: updated
          })
        });

        return updated;

      });
    }, delay);
  };

  return (
    <div className="chat-container">
        <div className="chat-header"
        onClick={() => {
            if (npcInfo && npcInfo.sobre) {
              openProfile(npcInfo, npcList);
            } else {
              alert("Carregando perfil completo...");
            }
          }}          
        style={{ cursor: 'pointer' }}>
        <button onClick={(e) => { e.stopPropagation(); goBack(); }}>←</button>
        <img src={npcInfo.foto} alt={npcInfo.nome} />
        <div className="npc-info">
        <strong>{npcInfo.nome}</strong>
          <span>
            {npcInfo.distancia < 1000
                ? `${npcInfo.distancia}m de distância`
                : `${(npcInfo.distancia / 1000).toFixed(1)}km de distância`}
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

        {Object.entries(groupMessagesByDate(messages)).map(([day, msgs]) => (
        <div key={day}>
            <div className="chat-date-divider">{day}</div>
            {msgs.map((msg, idx) => {
            const isImage = msg.type === 'image';
            const isUser = msg.from === 'user';
            const imageIndex = imagensChat.findIndex(m => m === msg);

            return (
                <div
                key={idx}
                className={`chat-bubble ${isUser ? 'user' : 'npc'}`}
                onClick={() => toggleTimestamp(msg.id)}
                >
                {isImage ? (
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
                ) : (
                    <>{msg.text}</>
                )}
                {clickedMsgId === msg.id && (
                    <div className="timestamp">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                )}
                </div>
            );
            })}
        </div>
        ))}

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

        {showGaleriaGlobal && (
        <div className="chat-gallery" onClick={(e) => e.stopPropagation()}>
            <button className="close-gallery-btn" onClick={() => setShowGaleriaGlobal(false)}>❌</button>
            <p className="gallery-title">Fotos já enviadas</p>
            <div className="gallery-grid">
            {galeriaGlobal.map((img, index) => (
                <img
                key={index}
                src={img.url}
                alt="enviada"
                onClick={() => {
                    enviarImagem(img.url);
                    setShowGaleriaGlobal(false);
                }}
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
        <button
            title="Galeria de imagens já enviadas"
            onClick={() => {
                if (showGaleriaGlobal) {
                    setShowGaleriaGlobal(false);
                  } else {
                    setShowGallery(false); // ⬅ fecha a outra
                    carregarGaleriaGlobal();
                    setShowGaleriaGlobal(true);
                  }                  
            }}
            >
            🖼️
        </button>
          <button title="Localização (futuro)">📍</button>
          <button
            title="Enviar Foto"
            onClick={() => {
                if (showGallery) {
                    setShowGallery(false);
                  } else {
                    setShowGaleriaGlobal(false); // ⬅ fecha a outra
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
