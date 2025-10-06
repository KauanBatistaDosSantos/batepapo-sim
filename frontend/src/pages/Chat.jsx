import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './Chat.css';

const API_BASE = 'http://localhost:8000';

const createMessageId = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizarDialogo = (data) => {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const respostas = Array.isArray(data?.inicio?.respostas)
    ? data.inicio.respostas.filter((resp) => typeof resp === 'string' && resp.trim().length)
    : [];

  const npcBruto = data?.inicio?.npc && typeof data.inicio.npc === 'object'
    ? data.inicio.npc
    : {};

  const padraoJogador = (id) => ({
    tipo: 'texto',
    texto: id,
    url: '',
    legenda: ''
  });

  const padraoResposta = () => ({
    texto: '',
    imagem: '',
    legenda: ''
  });

  const npcFormatado = {};

  const garantirEntrada = (id) => {
    if (!npcFormatado[id]) {
      npcFormatado[id] = {
        player: padraoJogador(id),
        resposta: padraoResposta(),
        proximas: []
      };
    }
    return npcFormatado[id];
  };

  Object.entries(npcBruto).forEach(([id, valores]) => {
    const player = valores?.player && typeof valores.player === 'object'
      ? {
          tipo: valores.player?.tipo === 'imagem' ? 'imagem' : 'texto',
          texto: valores.player?.texto ?? valores.player?.conteudo ?? valores.player?.label ?? id,
          url: valores.player?.url ?? valores.player?.imagem ?? '',
          legenda: valores.player?.legenda ?? valores.player?.caption ?? ''
        }
      : padraoJogador(id);

    const respostaBruta = valores?.resposta;
    const resposta = typeof respostaBruta === 'string'
      ? {
          texto: respostaBruta,
          imagem: '',
          legenda: ''
        }
      : {
          texto: respostaBruta?.texto ?? respostaBruta?.conteudo ?? respostaBruta?.mensagem ?? '',
          imagem: respostaBruta?.imagem ?? respostaBruta?.url ?? '',
          legenda: respostaBruta?.legenda ?? respostaBruta?.caption ?? ''
        };

    const proximas = Array.isArray(valores?.proximas)
      ? valores.proximas.filter((prox) => typeof prox === 'string' && prox.trim().length)
      : [];

    npcFormatado[id] = {
      player,
      resposta,
      proximas
    };
  });

  respostas.forEach((id) => garantirEntrada(id));
  Object.values(npcFormatado).forEach((entrada) => {
    entrada.proximas.forEach((prox) => garantirEntrada(prox));
  });

  return {
    inicio: {
      respostas,
      npc: npcFormatado
    }
  };
};
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

  const fimDoChatRef = useRef(null);

   const persistMessages = useCallback((lista) => {
    fetch(`${API_BASE}/mensagens/${npc.id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        npc_id: npc.id,
        mensagens: lista
      })
    }).catch(() => {});
  }, [npc.id]);

  const updateMessages = useCallback((novasMensagens, persistir = true) => {
    const mensagensArray = Array.isArray(novasMensagens) ? novasMensagens : [novasMensagens];
    const enriquecidas = mensagensArray.map((msg) => ({
      ...msg,
      timestamp: msg.timestamp || new Date().toISOString()
    }));

    setMessages((prev) => {
      const atualizadas = [...prev, ...enriquecidas];
      if (persistir) {
        persistMessages(atualizadas);
      }
      return atualizadas;
    });
  }, [persistMessages]);

  const toggleTimestamp = (id) => {
    setClickedMsgId((prev) => (prev === id ? null : id));
  };

  const playSound = () => {
    const audio = new Audio('/sounds/msg.mp3');
    audio.play().catch(() => {});
  };

  const carregarGaleria = useCallback(() => {
    fetch(`${API_BASE}/fotos?npc_id=${npc.id}`)
      .then((res) => res.json())
      .then((fotos) => {
        const imagensFiltradas = fotos
          .filter((f) => f.autor === 'player' && f.npcId === npc.id)
          .sort((a, b) => new Date(b.data) - new Date(a.data));
        setGaleria(imagensFiltradas);
      });
  }, [npc.id]);

  const carregarGaleriaGlobal = () => {
    const fotos = [];
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (key?.startsWith('chat-npc-')) {
        const stored = JSON.parse(localStorage.getItem(key));
        const imagens = stored.filter((m) => m.type === 'image' && m.from === 'user');
        fotos.push(...imagens);
      }
    }

    const unicas = fotos.filter((foto, index, self) =>
      index === self.findIndex((f) => f.url === foto.url)
    );

    const ordenadas = unicas.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    setGaleriaGlobal(ordenadas);
  };

  const mostrarSetasTemporariamente = () => {
    setShowSetas(true);
    clearTimeout(window.setasTimeout);
    window.setasTimeout = setTimeout(() => setShowSetas(false), 3000);
  };

  const imagensChat = useMemo(() => messages.filter((msg) => msg.type === 'image'), [messages]);

  const abrirImagem = (url, index) => {
    setImagemAberta(url);
    setImagemAbertaIndex(index);
    mostrarSetasTemporariamente();
  };

  const navegarImagem = (direcao) => {
    if (!imagensChat.length) return;
    const novoIndex = (imagemAbertaIndex + direcao + imagensChat.length) % imagensChat.length;
    setImagemAberta(imagensChat[novoIndex].url);
    setImagemAbertaIndex(novoIndex);
    mostrarSetasTemporariamente();
  };
  useEffect(() => {
    if (!messages.length) return;

    const imgs = document.querySelectorAll('.chat-bubble img');
    const promises = Array.from(imgs).map((img) =>
      img.complete
        ? Promise.resolve()
        : new Promise((resolve) => {
            img.onload = img.onerror = resolve;
          })
    );

    Promise.all(promises).then(() => {
      requestAnimationFrame(() => {
        fimDoChatRef.current?.scrollIntoView({ behavior: 'auto' });
      });
    });
  }, [messages]);

  useEffect(() => {
    fetch(`${API_BASE}/npcs`)
      .then((res) => res.json())
      .then((npcs) => {
        const completo = npcs.find((item) => item.id === npc.id);
        if (completo) {
          setNpcInfo(completo);
          setNpcList(npcs);
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

  const groupMessagesByDate = (msgs) =>
    msgs.reduce((acc, msg) => {
      const day = formatDate(msg.timestamp);
      if (!acc[day]) acc[day] = [];
      acc[day].push(msg);
      return acc;
    }, {});

  const persistMessagesAndSet = useCallback((updater) => {
    setMessages((prev) => {
      const updated = updater(prev);
      persistMessages(updated);
      return updated;
    });
  }, [persistMessages]);

  const getOptionFromKey = useCallback((key) => {
    if (!dialogTree?.inicio?.npc?.[key]) return null;
    const node = dialogTree.inicio.npc[key];
    const player = node.player || { tipo: 'texto', texto: key, url: '', legenda: '' };

    if (player.tipo === 'imagem') {
      return {
        id: key,
        tipo: 'imagem',
        url: player.url || '',
        legenda: player.legenda || '',
        texto: player.texto || key
      };
    }

    return {
      id: key,
      tipo: 'texto',
      texto: player.texto || key,
      legenda: player.legenda || ''
    };
  }, [dialogTree]);

  const buildOptions = useCallback((step) => {
    if (!dialogTree?.inicio) return [];
    if (!step || step === 'inicio') {
      return (dialogTree.inicio.respostas || [])
        .map((id) => getOptionFromKey(id))
        .filter(Boolean);
    }

    const node = dialogTree.inicio.npc?.[step];
    if (!node) return [];
    return (node.proximas || [])
      .map((id) => getOptionFromKey(id))
      .filter(Boolean);
  }, [dialogTree, getOptionFromKey]);

  const findStepByMessage = useCallback((msg) => {
    if (!dialogTree?.inicio?.npc) return null;
    const entries = Object.entries(dialogTree.inicio.npc);

    for (let i = 0; i < entries.length; i += 1) {
      const [key, node] = entries[i];
      const player = node.player || {};

      if (msg.type === 'text') {
        const texto = (player.texto || key || '').trim();
        if (texto && msg.text && msg.text.trim() === texto) {
          return key;
        }
      }

      if (msg.type === 'image') {
        const url = player.url || player.imagem || '';
        if (url && msg.url === url) {
          return key;
        }
      }
    }
    return null;
  }, [dialogTree]);

  useEffect(() => {
    if (!dialogTree) return;

    const userMessages = messages.filter((msg) => msg.from === 'user');
    if (!userMessages.length) {
      setCurrentStep('inicio');
      setOptions(buildOptions('inicio'));
      return;
    }

    for (let i = userMessages.length - 1; i >= 0; i -= 1) {
      const step = findStepByMessage(userMessages[i]);
      if (step) {
        setCurrentStep(step);
        setOptions(buildOptions(step));
        return;
      }
    }

    setCurrentStep('inicio');
    setOptions(buildOptions('inicio'));
  }, [dialogTree, messages, buildOptions, findStepByMessage]);

  useEffect(() => {
    fetch(`${API_BASE}/mensagens/${npc.id}`)
      .then((res) => res.json())
      .then((data) => setMessages(Array.isArray(data) ? data : []));

    fetch(`${API_BASE}/dialogos/${npc.id}`)
      .then((res) => res.json())
      .then((data) => setDialogTree(normalizarDialogo(data)));

    carregarGaleria();
  }, [npc, carregarGaleria]);

  useEffect(() => {
    try {
      const storageKey = `chat-npc-${npc.id}`;
      if (!messages.length) {
        localStorage.removeItem(storageKey);
        return;
      }
      localStorage.setItem(storageKey, JSON.stringify(messages));
    } catch (error) {
      console.error('Não foi possível salvar histórico no navegador', error);
    }
  }, [messages, npc.id]);

  const enviarImagem = (url) => {
    if (!url) return;
    const foto = galeria.find((img) => img.url === url);
    const legenda = foto?.legenda || '';
    updateMessages({
      id: createMessageId(),
      from: 'user',
      type: 'image',
      url,
      caption: legenda
    });
    setShowGallery(false);
  };

  const sendMessage = (option) => {
    if (!option) return;
    if (option.tipo === 'imagem' && !option.url) {
      alert('Esta opção de foto não possui uma URL configurada.');
      return;
    }

    const timestamp = new Date().toISOString();
    const base = {
      id: createMessageId(),
      from: 'user',
      timestamp
    };

    const userMsg = option.tipo === 'imagem'
      ? {
          ...base,
          type: 'image',
          url: option.url,
          caption: option.legenda || option.texto || ''
        }
      : {
          ...base,
          type: 'text',
          text: option.texto || option.id
        };

    updateMessages(userMsg);
    setShowOptions(false);
    setCurrentStep(option.id);

    const typing = { id: 'typing', from: 'npc', type: 'text', text: '...' };
    updateMessages(typing, false);

    const delay = Math.floor(1500 + Math.random() * 1000);
    setTimeout(() => {
      persistMessagesAndSet((prev) => {
        const withoutTyping = prev.filter((m) => m.id !== 'typing');
        const node = dialogTree?.inicio?.npc?.[option.id];
        const resposta = node?.resposta || { texto: '', imagem: '', legenda: '' };

        const novasMensagens = [...withoutTyping];
        const agora = new Date().toISOString();

        if (resposta.texto && resposta.texto.trim()) {
          novasMensagens.push({
            id: createMessageId(),
            from: 'npc',
            type: 'text',
            text: resposta.texto.trim(),
            timestamp: agora
          });
        }

        if (resposta.imagem) {
          novasMensagens.push({
            id: createMessageId(),
            from: 'npc',
            type: 'image',
            url: resposta.imagem,
            caption: resposta.legenda || '',
            timestamp: agora
          });
        }

        const proximas = buildOptions(option.id);
        setOptions(proximas);
        if (resposta.texto || resposta.imagem) {
          playSound();
        }

        return novasMensagens;
      });
    }, delay);
  };
  return (
    <div className="chat-container">
      <div
        className="chat-header"
        onClick={() => {
          if (npcInfo && npcInfo.sobre) {
            openProfile(npcInfo, npcList);
          } else {
            alert('Carregando perfil completo...');
          }
        }}
        style={{ cursor: 'pointer' }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            goBack();
          }}
        >
          ←
        </button>
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
              <button className="close-img-btn" onClick={() => setImagemAberta(null)}>
                ❌
              </button>
            </div>
          </div>
        )}

        {Object.entries(groupMessagesByDate(messages)).map(([day, msgs]) => (
          <div key={day}>
            <div className="chat-date-divider">{day}</div>
            {msgs.map((msg, idx) => {
              const isImage = msg.type === 'image';
              const isUser = msg.from === 'user';
              const imageIndex = imagensChat.findIndex((m) => m === msg);

              return (
                <div
                  key={idx}
                  className={`chat-bubble ${isUser ? 'user' : 'npc'}`}
                  onClick={() => toggleTimestamp(msg.id)}
                >
                  {isImage ? (
                    <>
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
                      {msg.caption && <div className="image-caption">{msg.caption}</div>}
                    </>
                  ) : (
                    <>{msg.text}</>
                  )}
                  {clickedMsgId === msg.id && (
                    <div className="timestamp">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
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
          <button className="close-gallery-btn" onClick={() => setShowGallery(false)}>
            ❌
          </button>
          <p className="gallery-title">Sua galeria</p>
          <div className="gallery-grid">
            {galeria.map((img, index) => (
              <img
                key={index}
                src={img.url}
                alt="galeria"
                title={img.legenda || 'Sem legenda'}
                onClick={() => enviarImagem(img.url)}
                className="gallery-thumb"
              />
            ))}
          </div>
        </div>
      )}

      {showGaleriaGlobal && (
        <div className="chat-gallery" onClick={(e) => e.stopPropagation()}>
          <button className="close-gallery-btn" onClick={() => setShowGaleriaGlobal(false)}>
            ❌
          </button>
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
            className={`chat-input ${options.length ? '' : 'chat-input--disabled'}`}
            onClick={() => {
              if (options.length) {
                setShowOptions((prev) => !prev);
              }
            }}
          >
            {options.length ? 'Diga algo...' : 'Nenhuma opção disponível agora'}
          </div>
          <button
            className="send-btn"
            onClick={() => options[0] && sendMessage(options[0])}
            disabled={!options.length}
          >
            ➤
          </button>
        </div>

        {showOptions && options.length > 0 && (
          <div className="message-options">
            {options.map((option) => (
              <button
                key={option.id}
                type="button"
                className={`message-option ${option.tipo === 'imagem' ? 'message-option--image' : ''}`}
                onClick={() => sendMessage(option)}
              >
                {option.tipo === 'imagem' ? (
                  <>
                    <span className="message-option__thumb" aria-hidden>
                      <img src={option.url} alt="miniatura" />
                    </span>
                    <span className="message-option__content">
                      <strong>{option.legenda || 'Enviar foto'}</strong>
                      {option.texto && <small>{option.texto}</small>}
                    </span>
                  </>
                ) : (
                  option.texto
                )}
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
                setShowGallery(false);
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
                setShowGaleriaGlobal(false);
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