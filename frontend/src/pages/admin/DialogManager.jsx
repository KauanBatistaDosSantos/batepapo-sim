import React, { useCallback, useEffect, useMemo, useState } from 'react';
import TreeViewer from './TreeViewer';
import './DialogManager.css';

const criarPlayerPadrao = (id) => ({
  tipo: 'texto',
  texto: id,
  url: '',
  legenda: ''
});

const criarRespostaPadrao = () => ({
  texto: '',
  imagem: '',
  legenda: ''
});

const criarEntradaPadrao = (id) => ({
  player: criarPlayerPadrao(id),
  resposta: criarRespostaPadrao(),
  proximas: []
});

const normalizarEntrada = (id, valores) => {
  if (!valores || typeof valores !== 'object') {
    return criarEntradaPadrao(id);
  }

  const playerBruto = valores.player;
  const respostaBruta = valores.resposta;
  const proximasBrutas = Array.isArray(valores.proximas) ? valores.proximas : [];

  const player = playerBruto && typeof playerBruto === 'object'
    ? {
        tipo: playerBruto.tipo === 'imagem' ? 'imagem' : 'texto',
        texto: playerBruto.texto ?? playerBruto.conteudo ?? playerBruto.label ?? id,
        url: playerBruto.url ?? playerBruto.imagem ?? '',
        legenda: playerBruto.legenda ?? playerBruto.caption ?? ''
      }
    : criarPlayerPadrao(id);

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

  const proximas = proximasBrutas
    .filter((prox) => typeof prox === 'string')
    .map((prox) => prox.trim())
    .filter(Boolean);

  return {
    player,
    resposta,
    proximas
  };
};

const prepararDialogo = (data = {}) => {
  const respostas = Array.isArray(data?.inicio?.respostas)
    ? data.inicio.respostas.filter((resp) => typeof resp === 'string' && resp.trim().length)
    : [];

  const npcBruto = data?.inicio?.npc && typeof data.inicio.npc === 'object'
    ? data.inicio.npc
    : {};

  const npcNormalizado = {};

  Object.entries(npcBruto).forEach(([id, valores]) => {
    npcNormalizado[id] = normalizarEntrada(id, valores);
  });

  respostas.forEach((id) => {
    if (!npcNormalizado[id]) {
      npcNormalizado[id] = criarEntradaPadrao(id);
    }
  });

  Object.entries(npcNormalizado).forEach(([id, entrada]) => {
    entrada.proximas.forEach((prox) => {
      if (!npcNormalizado[prox]) {
        npcNormalizado[prox] = criarEntradaPadrao(prox);
      } else {
        npcNormalizado[prox] = normalizarEntrada(prox, npcNormalizado[prox]);
      }
    });
  });

  return {
    ...data,
    inicio: {
      respostas,
      npc: npcNormalizado
    }
  };
};

const DialogoManager = () => {
  const [npcId, setNpcId] = useState('');
  const [npcList, setNpcList] = useState([]);
  const [dialogo, setDialogo] = useState({ inicio: { respostas: [], npc: {} } });
  const [viewMode, setViewMode] = useState('edit');
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [dragState, setDragState] = useState({ activeIndex: null, overIndex: null });
  const [fotosCatalogo, setFotosCatalogo] = useState([]);

  const dialogoInicio = dialogo?.inicio ?? { respostas: [], npc: {} };

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then((res) => res.json())
      .then(setNpcList)
      .catch(() => setStatus({ type: 'error', message: 'Não foi possível carregar a lista de NPCs.' }));
  }, []);

  useEffect(() => {
    fetch('http://localhost:8000/fotos')
      .then((res) => res.json())
      .then((fotos) => setFotosCatalogo(Array.isArray(fotos) ? fotos : []))
      .catch(() => setFotosCatalogo([]));
  }, []);

  const fetchDialogo = async () => {
    if (!npcId) {
      setStatus({ type: 'error', message: 'Selecione um NPC antes de carregar o diálogo.' });
      return;
    }

    try {
      setIsLoading(true);
      setStatus({ type: 'loading', message: 'Carregando diálogo…' });
      const res = await fetch(`http://localhost:8000/dialogos/${npcId}`);
      if (!res.ok) {
        throw new Error('Falha ao carregar diálogo');
      }
      const data = await res.json();
      setDialogo(prepararDialogo(data));
      setStatus({ type: 'success', message: 'Diálogo carregado com sucesso.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Ocorreu um erro ao carregar o diálogo. Tente novamente.' });
    } finally {
      setIsLoading(false);
    }
  };

  const persistirDialogo = (transform) => {
    setDialogo((prev) => {
      const base = prepararDialogo(prev);
      return transform(base);
    });
  };

  const mutateFala = useCallback((fala, transform) => {
    persistirDialogo((atual) => {
      const npcAtual = { ...atual.inicio.npc };
      const entradaAtual = npcAtual[fala]
        ? {
            ...npcAtual[fala],
            player: { ...npcAtual[fala].player },
            resposta: { ...npcAtual[fala].resposta },
            proximas: [...(npcAtual[fala].proximas || [])]
          }
        : criarEntradaPadrao(fala);

      npcAtual[fala] = transform(entradaAtual);

      return {
        ...atual,
        inicio: {
          ...atual.inicio,
          npc: npcAtual
        }
      };
    });
  }, []);

  const renomearFala = useCallback((antigo, novo) => {
    const novoTrim = (novo || '').trim();
    if (!novoTrim || antigo === novoTrim) {
      return;
    }

    persistirDialogo((atual) => {
      const npcAtual = { ...atual.inicio.npc };
      const entrada = npcAtual[antigo];
      if (!entrada) {
        return atual;
      }

      delete npcAtual[antigo];
      const novaEntrada = {
        ...entrada,
        player: {
          ...entrada.player,
          texto:
            entrada.player.tipo === 'texto' && (!entrada.player.texto || entrada.player.texto === antigo)
              ? novoTrim
              : entrada.player.texto
        }
      };
      npcAtual[novoTrim] = novaEntrada;

      Object.keys(npcAtual).forEach((chave) => {
        const dados = npcAtual[chave];
        npcAtual[chave] = {
          ...dados,
          proximas: (dados.proximas || []).map((prox) => (prox === antigo ? novoTrim : prox))
        };
      });

      const respostasAtualizadas = (atual.inicio.respostas || []).map((resp) => (resp === antigo ? novoTrim : resp));

      return {
        ...atual,
        inicio: {
          respostas: respostasAtualizadas,
          npc: npcAtual
        }
      };
    });
  }, []);

  const removeFala = (fala) => {
    persistirDialogo((atual) => {
      const npcAtual = { ...atual.inicio.npc };
      delete npcAtual[fala];
      Object.keys(npcAtual).forEach((chave) => {
        npcAtual[chave] = {
          ...npcAtual[chave],
          proximas: (npcAtual[chave].proximas || []).filter((prox) => prox !== fala)
        };
      });

      return {
        ...atual,
        inicio: {
          respostas: (atual.inicio.respostas || []).filter((resp) => resp !== fala),
          npc: npcAtual
        }
      };
    });
  };
  const moveFala = (index, direction) => {
    persistirDialogo((atual) => {
      const respostas = [...(atual.inicio.respostas || [])];
      const destino = index + direction;
      if (destino < 0 || destino >= respostas.length) {
        return atual;
      }
      [respostas[index], respostas[destino]] = [respostas[destino], respostas[index]];
      return {
        ...atual,
        inicio: {
          ...atual.inicio,
          respostas
        }
      };
    });
  };

  const reorderFalas = useCallback((origem, destino) => {
    persistirDialogo((atual) => {
      const respostas = [...(atual.inicio.respostas || [])];
      if (
        origem === null ||
        destino === null ||
        origem === destino ||
        origem < 0 ||
        destino < 0 ||
        origem >= respostas.length ||
        destino >= respostas.length
      ) {
        return atual;
      }
      const itens = [...respostas];
      const [removido] = itens.splice(origem, 1);
      itens.splice(destino, 0, removido);
      return {
        ...atual,
        inicio: {
          ...atual.inicio,
          respostas: itens
        }
      };
    });
  }, []);

  const dragHelpers = useMemo(
    () => ({
      onDragStart: (index) => (event) => {
        setDragState({ activeIndex: index, overIndex: index });
        event.dataTransfer.effectAllowed = 'move';
        event.dataTransfer.setData('text/plain', String(index));
      },
      onDragEnter: (index) => (event) => {
        event.preventDefault();
        setDragState((prev) => (prev.overIndex === index ? prev : { ...prev, overIndex: index }));
      },
      onDragOver: () => (event) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
      },
      onDrop: (index) => (event) => {
        event.preventDefault();
        const origem = dragState.activeIndex ?? Number(event.dataTransfer.getData('text/plain'));
        reorderFalas(origem, index);
        setDragState({ activeIndex: null, overIndex: null });
      },
      onDragEnd: () => () => {
        setDragState({ activeIndex: null, overIndex: null });
      }
    }),
    [dragState.activeIndex, reorderFalas]
  );

  const salvarDialogo = async () => {
    if (!npcId) {
      setStatus({ type: 'error', message: 'Selecione um NPC antes de salvar.' });
      return;
    }

    try {
      setStatus({ type: 'loading', message: 'Salvando diálogo…' });
      await fetch(`http://localhost:8000/dialogos/${npcId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dialogo)
      });
      setStatus({ type: 'success', message: 'Diálogo salvo com sucesso!' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Não foi possível salvar o diálogo. Verifique sua conexão.' });
    }
  };

  const adicionarGrupoFala = () => {
    const fala = prompt('Digite a fala do jogador:');
    if (!fala) return;
    const resposta = prompt('Digite a resposta do NPC:') || '';

    persistirDialogo((atual) => {
      const respostas = [...(atual.inicio.respostas || []), fala];
      const npcAtual = { ...atual.inicio.npc };
      npcAtual[fala] = {
        player: criarPlayerPadrao(fala),
        resposta: {
          ...criarRespostaPadrao(),
          texto: resposta
        },
        proximas: []
      };
      return {
        ...atual,
        inicio: {
          respostas,
          npc: npcAtual
        }
      };
    });
  };

  const adicionarProximaFala = (fala) => {
    const sugestao = `Nova fala ${Date.now().toString().slice(-4)}`;
    persistirDialogo((atual) => {
      const npcAtual = { ...atual.inicio.npc };
      const entrada = npcAtual[fala] ?? criarEntradaPadrao(fala);
      const novas = [...(entrada.proximas || []), sugestao];
      npcAtual[fala] = {
        ...entrada,
        proximas: novas
      };
      if (!npcAtual[sugestao]) {
        npcAtual[sugestao] = criarEntradaPadrao(sugestao);
      }
      return {
        ...atual,
        inicio: {
          ...atual.inicio,
          npc: npcAtual
        }
      };
    });
  };

  const statusMessage = useMemo(() => {
    if (!status.message) return null;

    return (
      <div className={`dialog-status dialog-status--${status.type}`} role="status">
        {status.message}
      </div>
    );
  }, [status]);
  return (
    <div className="dialogo-manager">
      <datalist id="dialogo-fotos">
        {fotosCatalogo.map((foto) => (
          <option
            key={foto.id ?? `${foto.url}-${foto.autor}`}
            value={foto.url}
          >
            {`${foto.legenda || foto.url} • ${foto.autor === 'npc' ? 'NPC' : 'Jogador'}`}
          </option>
        ))}
      </datalist>

      <h2>Gerenciar Diálogo</h2>
      <select onChange={(e) => setNpcId(e.target.value)} value={npcId}>
        <option value="">-- Selecione um NPC --</option>
        {npcList.map((n) => (
          <option key={n.id} value={n.id}>
            {n.nome}
          </option>
        ))}
      </select>
      <button onClick={fetchDialogo} disabled={isLoading}>
        🔄 Carregar Diálogo
      </button>

      {statusMessage}

      {dialogoInicio && (
        <>
          <div style={{ marginTop: '10px', display: 'flex', gap: '10px' }}>
            <button onClick={() => setViewMode('edit')}>✏️ Edição</button>
            <button onClick={() => setViewMode('nivel1')}>👤 Falas Iniciais</button>
            <button onClick={() => setViewMode('nivel2')}>⏭️ Falas em sequência</button>
            <button onClick={() => setViewMode('tree')}>🌳 Visualização Árvore</button>
          </div>

          {(viewMode === 'edit' || viewMode === 'nivel1') && (
            <div className="dialogo-editor">
              <h3>Falas Iniciais</h3>
              <button onClick={adicionarGrupoFala} style={{ marginBottom: '15px' }}>
                ➕ Adicionar grupo de fala
              </button>

              <div className="falas-list">
                {dialogoInicio.respostas.map((fala, index) => {
                  const entrada = dialogoInicio.npc[fala] || criarEntradaPadrao(fala);
                  const player = entrada.player;
                  const resposta = entrada.resposta;

                  return (
                    <div
                      key={`fala-${fala}-${index}`}
                      className={`fala-card${dragState.overIndex === index ? ' drop-target' : ''}${
                        dragState.activeIndex === index ? ' dragging' : ''
                      }`}
                      onDragEnter={dragHelpers.onDragEnter(index)}
                      onDragOver={dragHelpers.onDragOver(index)}
                      onDrop={dragHelpers.onDrop(index)}
                    >
                      <div
                        className="drag-handle"
                        draggable
                        onDragStart={dragHelpers.onDragStart(index)}
                        onDragEnd={dragHelpers.onDragEnd(index)}
                        aria-label={`Arrastar para reordenar a fala ${index + 1}`}
                      >
                        ⠿
                      </div>
                      <div className="fala-controles">
                        <button
                          type="button"
                          onClick={() => moveFala(index, -1)}
                          disabled={index === 0}
                          className="btn-mover"
                          aria-label="Mover fala para cima"
                        >
                          ↑
                        </button>
                        <button
                          type="button"
                          onClick={() => moveFala(index, 1)}
                          disabled={index === dialogoInicio.respostas.length - 1}
                          className="btn-mover"
                          aria-label="Mover fala para baixo"
                        >
                          ↓
                        </button>
                      </div>
                      <div className="jogador-fala">
                        <label>🎯 Identificador da fala:</label>
                        <input
                          value={fala}
                          onChange={(e) => renomearFala(fala, e.target.value)}
                        />

                        <div className="player-config">
                          <label>Tipo da mensagem do jogador:</label>
                          <select
                            value={player.tipo}
                            onChange={(e) =>
                              mutateFala(fala, (dados) => ({
                                ...dados,
                                player: {
                                  ...dados.player,
                                  tipo: e.target.value
                                }
                              }))
                            }
                          >
                            <option value="texto">Texto</option>
                            <option value="imagem">Imagem</option>
                          </select>

                          <label>{player.tipo === 'imagem' ? 'Texto exibido no botão:' : 'Mensagem do jogador:'}</label>
                          <input
                            value={player.texto}
                            onChange={(e) =>
                              mutateFala(fala, (dados) => ({
                                ...dados,
                                player: {
                                  ...dados.player,
                                  texto: e.target.value
                                }
                              }))
                            }
                          />

                          {player.tipo === 'imagem' && (
                            <>
                              <label>URL da imagem a ser enviada:</label>
                              <input
                                value={player.url}
                                list="dialogo-fotos"
                                onChange={(e) =>
                                  mutateFala(fala, (dados) => ({
                                    ...dados,
                                    player: {
                                      ...dados.player,
                                      url: e.target.value
                                    }
                                  }))
                                }
                              />
                              <label>Legenda da foto (opcional):</label>
                              <input
                                value={player.legenda}
                                onChange={(e) =>
                                  mutateFala(fala, (dados) => ({
                                    ...dados,
                                    player: {
                                      ...dados.player,
                                      legenda: e.target.value
                                    }
                                  }))
                                }
                              />
                            </>
                          )}
                        </div>
                      </div>

                      <div className="npc-resposta">
                        <label>🤖 Resposta do NPC (texto):</label>
                        <textarea
                          value={resposta.texto}
                          onChange={(e) =>
                            mutateFala(fala, (dados) => ({
                              ...dados,
                              resposta: {
                                ...dados.resposta,
                                texto: e.target.value
                              }
                            }))
                          }
                        />
                        <label>📸 Foto enviada pelo NPC (opcional):</label>
                        <input
                          value={resposta.imagem}
                          list="dialogo-fotos"
                          onChange={(e) =>
                            mutateFala(fala, (dados) => ({
                              ...dados,
                              resposta: {
                                ...dados.resposta,
                                imagem: e.target.value
                              }
                            }))
                          }
                        />
                        <label>📝 Legenda da foto do NPC:</label>
                        <input
                          value={resposta.legenda}
                          onChange={(e) =>
                            mutateFala(fala, (dados) => ({
                              ...dados,
                              resposta: {
                                ...dados.resposta,
                                legenda: e.target.value
                              }
                            }))
                          }
                        />
                      </div>

                      <div className="proximas-falas">
                        <label>📌 Próximas falas possíveis:</label>
                        {(entrada.proximas || []).map((prox, i) => {
                          const proxEntrada = dialogoInicio.npc[prox] || criarEntradaPadrao(prox);
                          const proxPlayer = proxEntrada.player;
                          const proxResposta = proxEntrada.resposta;
                          return (
                            <div key={`${fala}-${prox}-${i}`} className="prox-item">
                              <div className="prox-conteudo">
                                <label>Identificador:</label>
                                <input
                                  value={prox}
                                  onChange={(e) => {
                                    const novo = e.target.value.trim();
                                    mutateFala(fala, (dados) => {
                                      const novas = [...(dados.proximas || [])];
                                      novas[i] = novo;
                                      return { ...dados, proximas: novas };
                                    });
                                    if (novo && novo !== prox) {
                                      renomearFala(prox, novo);
                                    }
                                  }}
                                />

                                <div className="player-config">
                                  <label>Tipo da mensagem seguinte:</label>
                                  <select
                                    value={proxPlayer.tipo}
                                    onChange={(e) =>
                                      mutateFala(prox, (dados) => ({
                                        ...dados,
                                        player: {
                                          ...dados.player,
                                          tipo: e.target.value
                                        }
                                      }))
                                    }
                                  >
                                    <option value="texto">Texto</option>
                                    <option value="imagem">Imagem</option>
                                  </select>

                                  <label>{proxPlayer.tipo === 'imagem' ? 'Texto do botão:' : 'Mensagem do jogador:'}</label>
                                  <input
                                    value={proxPlayer.texto}
                                    onChange={(e) =>
                                      mutateFala(prox, (dados) => ({
                                        ...dados,
                                        player: {
                                          ...dados.player,
                                          texto: e.target.value
                                        }
                                      }))
                                    }
                                  />

                                  {proxPlayer.tipo === 'imagem' && (
                                    <>
                                      <label>URL da imagem:</label>
                                      <input
                                        value={proxPlayer.url}
                                        list="dialogo-fotos"
                                        onChange={(e) =>
                                          mutateFala(prox, (dados) => ({
                                            ...dados,
                                            player: {
                                              ...dados.player,
                                              url: e.target.value
                                            }
                                          }))
                                        }
                                      />
                                      <label>Legenda (opcional):</label>
                                      <input
                                        value={proxPlayer.legenda}
                                        onChange={(e) =>
                                          mutateFala(prox, (dados) => ({
                                            ...dados,
                                            player: {
                                              ...dados.player,
                                              legenda: e.target.value
                                            }
                                          }))
                                        }
                                      />
                                    </>
                                  )}
                                </div>

                                <div className="npc-resposta">
                                  <label>Resposta do NPC (texto):</label>
                                  <textarea
                                    value={proxResposta.texto}
                                    onChange={(e) =>
                                      mutateFala(prox, (dados) => ({
                                        ...dados,
                                        resposta: {
                                          ...dados.resposta,
                                          texto: e.target.value
                                        }
                                      }))
                                    }
                                  />
                                  <label>Foto do NPC (opcional):</label>
                                  <input
                                    value={proxResposta.imagem}
                                    list="dialogo-fotos"
                                    onChange={(e) =>
                                      mutateFala(prox, (dados) => ({
                                        ...dados,
                                        resposta: {
                                          ...dados.resposta,
                                          imagem: e.target.value
                                        }
                                      }))
                                    }
                                  />
                                  <label>Legenda da foto:</label>
                                  <input
                                    value={proxResposta.legenda}
                                    onChange={(e) =>
                                      mutateFala(prox, (dados) => ({
                                        ...dados,
                                        resposta: {
                                          ...dados.resposta,
                                          legenda: e.target.value
                                        }
                                      }))
                                    }
                                  />
                                </div>
                              </div>
                              <button
                                onClick={() =>
                                  mutateFala(fala, (dados) => ({
                                    ...dados,
                                    proximas: (dados.proximas || []).filter((_, idx) => idx !== i)
                                  }))
                                }
                                className="btn-remove"
                              >
                                ❌
                              </button>
                            </div>
                          );
                        })}
                        <button onClick={() => adicionarProximaFala(fala)} style={{ marginTop: '4px' }}>
                          ➕ Nova próxima fala
                        </button>
                      </div>

                      <button onClick={() => removeFala(fala)} className="btn-remove">
                        ❌ Remover fala inteira
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {viewMode === 'nivel2' && (
            <div className="dialogo-editor">
              <h3>Falas em sequência (nível 2+)</h3>
              <div className="grupo-falas-jogador" style={{ borderColor: '#95a5a6', background: '#f4f6f6' }}>
                {Object.entries(dialogoInicio.npc).map(([fala, dados]) => (
                  (dados.proximas || []).map((prox, i) => {
                    const proxEntrada = dialogoInicio.npc[prox] || criarEntradaPadrao(prox);
                    const proxPlayer = proxEntrada.player;
                    const proxResposta = proxEntrada.resposta;
                    return (
                      <div key={`${fala}-${prox}-${i}`} className="fala-card" style={{ borderLeft: '4px solid #95a5a6' }}>
                        <div className="jogador-fala">
                          <label>🎮 Fala do jogador (seguinte):</label>
                          <input
                            value={prox}
                            onChange={(e) => {
                              const novo = e.target.value.trim();
                              mutateFala(fala, (dadosFala) => {
                                const novas = [...(dadosFala.proximas || [])];
                                novas[i] = novo;
                                return { ...dadosFala, proximas: novas };
                              });
                              if (novo && novo !== prox) {
                                renomearFala(prox, novo);
                              }
                            }}
                          />

                          <label>Tipo da mensagem:</label>
                          <select
                            value={proxPlayer.tipo}
                            onChange={(e) =>
                              mutateFala(prox, (dadosProx) => ({
                                ...dadosProx,
                                player: {
                                  ...dadosProx.player,
                                  tipo: e.target.value
                                }
                              }))
                            }
                          >
                            <option value="texto">Texto</option>
                            <option value="imagem">Imagem</option>
                          </select>

                          <label>{proxPlayer.tipo === 'imagem' ? 'Texto do botão:' : 'Mensagem:'}</label>
                          <input
                            value={proxPlayer.texto}
                            onChange={(e) =>
                              mutateFala(prox, (dadosProx) => ({
                                ...dadosProx,
                                player: {
                                  ...dadosProx.player,
                                  texto: e.target.value
                                }
                              }))
                            }
                          />

                          {proxPlayer.tipo === 'imagem' && (
                            <>
                              <label>URL da imagem:</label>
                              <input
                                value={proxPlayer.url}
                                list="dialogo-fotos"
                                onChange={(e) =>
                                  mutateFala(prox, (dadosProx) => ({
                                    ...dadosProx,
                                    player: {
                                      ...dadosProx.player,
                                      url: e.target.value
                                    }
                                  }))
                                }
                              />
                              <label>Legenda da foto:</label>
                              <input
                                value={proxPlayer.legenda}
                                onChange={(e) =>
                                  mutateFala(prox, (dadosProx) => ({
                                    ...dadosProx,
                                    player: {
                                      ...dadosProx.player,
                                      legenda: e.target.value
                                    }
                                  }))
                                }
                              />
                            </>
                          )}
                        </div>

                        <div className="npc-resposta">
                          <label>🤖 Resposta do NPC:</label>
                          <textarea
                            value={proxResposta.texto}
                            onChange={(e) =>
                              mutateFala(prox, (dadosProx) => ({
                                ...dadosProx,
                                resposta: {
                                  ...dadosProx.resposta,
                                  texto: e.target.value
                                }
                              }))
                            }
                          />
                          <label>📸 Foto do NPC:</label>
                          <input
                            value={proxResposta.imagem}
                            list="dialogo-fotos"
                            onChange={(e) =>
                              mutateFala(prox, (dadosProx) => ({
                                ...dadosProx,
                                resposta: {
                                  ...dadosProx.resposta,
                                  imagem: e.target.value
                                }
                              }))
                            }
                          />
                          <label>Legenda:</label>
                          <input
                            value={proxResposta.legenda}
                            onChange={(e) =>
                              mutateFala(prox, (dadosProx) => ({
                                ...dadosProx,
                                resposta: {
                                  ...dadosProx.resposta,
                                  legenda: e.target.value
                                }
                              }))
                            }
                          />
                        </div>
                      </div>
                    );
                  })
                ))}
              </div>
            </div>
          )}

          {viewMode === 'tree' && (
            <div style={{ height: '600px', marginTop: '20px', border: '1px solid #ddd' }}>
              <TreeViewer respostas={dialogoInicio.respostas} npc={dialogoInicio.npc} />
            </div>
          )}

          <br />
          <button className="btn-salvar" onClick={salvarDialogo}>
            💾 Salvar diálogo
          </button>
        </>
      )}
    </div>
  );
};

export default DialogoManager;