import React, { useEffect, useState } from 'react';
import TreeViewer from './TreeViewer'; // Novo componente visual
import './DialogManager.css';

const DialogoManager = () => {
  const [npcId, setNpcId] = useState('');
  const [npcList, setNpcList] = useState([]);
  const [dialogo, setDialogo] = useState({});
  const [viewMode, setViewMode] = useState('edit'); // 'edit' ou 'tree'

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then(res => res.json())
      .then(setNpcList);
  }, []);

  const fetchDialogo = async () => {
    const res = await fetch(`http://localhost:8000/dialogos/${npcId}`);
    const data = await res.json();
    setDialogo(data);
  };

  const handleChange = (key, value) => {
    setDialogo(prev => ({
      ...prev,
      inicio: {
        ...prev.inicio,
        respostas: value,
      }
    }));
  };

  const updateFala = (fala, prop, value) => {
    setDialogo(prev => ({
      ...prev,
      inicio: {
        ...prev.inicio,
        npc: {
          ...prev.inicio.npc,
          [fala]: {
            ...prev.inicio.npc[fala],
            [prop]: value
          }
        }
      }
    }));
  };

  const removeFala = (fala) => {
    const novoNpc = { ...dialogo.inicio.npc };
    delete novoNpc[fala];
    setDialogo(prev => ({
      ...prev,
      inicio: {
        respostas: prev.inicio.respostas.filter(f => f !== fala),
        npc: novoNpc
      }
    }));
  };

  const salvarDialogo = async () => {
    await fetch(`http://localhost:8000/dialogos/${npcId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(dialogo)
    });
    alert('Salvo!');
  };

  const moveFala = (index, direction) => {
    setDialogo(prev => {
      const respostas = Array.isArray(prev.inicio?.respostas)
        ? [...prev.inicio.respostas]
        : [];
      const destino = index + direction;

      if (destino < 0 || destino >= respostas.length) {
        return prev;
      }

      [respostas[index], respostas[destino]] = [respostas[destino], respostas[index]];

      return {
        ...prev,
        inicio: {
          ...prev.inicio,
          respostas,
        }
      };
    });
  };

  return (
    <div className="dialogo-manager">
      <h2>Gerenciar Diálogo</h2>
      <select onChange={e => setNpcId(e.target.value)} value={npcId}>
        <option value="">-- Selecione um NPC --</option>
        {npcList.map(n => <option key={n.id} value={n.id}>{n.nome}</option>)}
      </select>
      <button onClick={fetchDialogo}>🔄 Carregar Diálogo</button>

      {dialogo.inicio && (
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
            <button
              onClick={() => {
                const fala = prompt('Digite a fala do jogador:');
                if (!fala) return;
                const resposta = prompt('Digite a resposta do NPC:') || '';
                setDialogo(prev => ({
                  ...prev,
                  inicio: {
                    respostas: [...prev.inicio.respostas, fala],
                    npc: {
                      ...prev.inicio.npc,
                      [fala]: {
                        resposta: resposta,
                        proximas: []
                      }
                    }
                  }
                }));
              }}
              style={{ marginBottom: '15px' }}
            >➕ Adicionar grupo de fala</button>
      
            {/* Nível 1 - como já estava */}
            <div className="falas-list">
              {dialogo.inicio.respostas
                .filter((f) => f && typeof f === 'string') // evita valores inválidos
                .map((fala, index) => (
                  <div key={`fala-${index}`} className="fala-card">
                    <div className="fala-controles">
                      <button
                        type="button"
                        onClick={() => moveFala(index, -1)}
                        disabled={index === 0}
                        className="btn-mover"
                        aria-label="Mover fala para cima"
                      >↑</button>
                      <button
                        type="button"
                        onClick={() => moveFala(index, 1)}
                        disabled={index === dialogo.inicio.respostas.length - 1}
                        className="btn-mover"
                        aria-label="Mover fala para baixo"
                      >↓</button>
                    </div>
                    <div className="jogador-fala">
                      <label>🎮 Fala do jogador:</label>
                      <input
                        value={fala}
                        onChange={e => {
                          const novaFala = e.target.value;
                          const atualizadas = [...dialogo.inicio.respostas];
                          atualizadas[index] = novaFala;
                          const npcAtualizado = { ...dialogo.inicio.npc };
                          npcAtualizado[novaFala] = npcAtualizado[fala];
                          delete npcAtualizado[fala];
                          setDialogo(prev => ({
                            ...prev,
                            inicio: { respostas: atualizadas, npc: npcAtualizado }
                          }));
                        }}
                      />
                    </div>

                    <div className="npc-resposta">
                      <label>🤖 Resposta do NPC:</label>
                      <textarea
                        value={dialogo.inicio.npc[fala]?.resposta || ''}
                        onChange={e => updateFala(fala, 'resposta', e.target.value)}
                      />
                    </div>

                    <div className="proximas-falas">
                      <label>📌 Próximas falas possíveis:</label>
                      {(dialogo.inicio.npc[fala]?.proximas || []).map((prox, i) => (
                        <div key={i} className="prox-item">
                          <input
                            type="text"
                            value={prox}
                            onChange={(e) => {
                              const novas = [...dialogo.inicio.npc[fala].proximas];
                              novas[i] = e.target.value;
                              updateFala(fala, 'proximas', novas);
                            }}
                          />
                          <button
                            onClick={() => {
                              const novas = dialogo.inicio.npc[fala].proximas.filter((_, idx) => idx !== i);
                              updateFala(fala, 'proximas', novas);
                            }}
                            className="btn-remove"
                          >❌</button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const novas = [...(dialogo.inicio.npc[fala]?.proximas || []), ''];
                          updateFala(fala, 'proximas', novas);
                        }}
                        style={{ marginTop: '4px' }}
                      >➕ Nova próxima fala</button>
                    </div>

                    <button onClick={() => removeFala(fala)} className="btn-remove">❌ Remover fala inteira</button>
                  </div>
                ))}
            </div>
          </div>
        )}
      
        {(viewMode === 'nivel2') && (
          <div className="dialogo-editor">
            <h3>Falas em sequência (nível 2+)</h3>
            <div className="grupo-falas-jogador" style={{ borderColor: '#95a5a6', background: '#f4f6f6' }}>
              {Object.entries(dialogo.inicio.npc).map(([fala, dados]) => (
                (dados.proximas || []).map((prox, i) => (
                  <div key={`${fala}-${i}`} className="fala-card" style={{ borderLeft: '4px solid #95a5a6' }}>
                    <div className="jogador-fala">
                      <label>🎮 Fala do jogador (seguinte):</label>
                      <input
                        value={prox}
                        onChange={e => {
                            const novo = e.target.value;
                            const novas = [...dados.proximas];
                            novas[i] = novo;
                          
                            updateFala(fala, 'proximas', novas); // <- Atualiza corretamente a fala pai
                          
                            // Se o novo ainda não existe no NPC, cria ele
                            if (!dialogo.inicio.npc[novo]) {
                              setDialogo(prev => ({
                                ...prev,
                                inicio: {
                                  ...prev.inicio,
                                  npc: {
                                    ...prev.inicio.npc,
                                    [novo]: {
                                      resposta: '',
                                      proximas: []
                                    }
                                  }
                                }
                              }));
                            }
                          }}
                      />
                    </div>
      
                    <div className="npc-resposta">
                      <label>🤖 Resposta do NPC:</label>
                      <textarea
                        value={dialogo.inicio.npc[prox]?.resposta || ''}
                        onChange={e => updateFala(prox, 'resposta', e.target.value)}
                      />
                    </div>
      
                    <div className="proximas-falas">
                      <label>📌 Próximas falas:</label>
                      {(dialogo.inicio.npc[prox]?.proximas || []).map((prox2, j) => (
                        <div key={j} className="prox-item">
                          <input
                            type="text"
                            value={prox2}
                            onChange={(e) => {
                              const novas = [...dialogo.inicio.npc[prox].proximas];
                              novas[j] = e.target.value;
                              updateFala(prox, 'proximas', novas);
                            }}
                          />
                          <button
                            onClick={() => {
                              const novas = dialogo.inicio.npc[prox].proximas.filter((_, idx) => idx !== j);
                              updateFala(prox, 'proximas', novas);
                            }}
                            className="btn-remove"
                          >❌</button>
                        </div>
                      ))}
                      <button
                        onClick={() => {
                          const novas = [...(dialogo.inicio.npc[prox]?.proximas || []), ''];
                          updateFala(prox, 'proximas', novas);
                        }}
                        style={{ marginTop: '4px' }}
                      >➕ Nova próxima fala</button>
                    </div>
                  </div>
                ))
              ))}
            </div>
          </div>
        )}
      
        {viewMode === 'tree' && (
          <div style={{ height: '600px', marginTop: '20px', border: '1px solid #ddd' }}>
            <TreeViewer respostas={dialogo.inicio.respostas} npc={dialogo.inicio.npc} />
          </div>
        )}
      
        <br />
        <button className="btn-salvar" onClick={salvarDialogo}>💾 Salvar diálogo</button>
      </>
      )}
    </div>
  );
};

export default DialogoManager;
