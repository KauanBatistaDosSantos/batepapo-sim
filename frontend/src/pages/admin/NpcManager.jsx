import React, { useEffect, useState } from 'react';
import './NpcManager.css';

const campos = [
  "nome", "idade", "foto", "altura", "peso", "corpo", "genero", "sexualidade",
  "status", "papel", "estilo", "interesse", "fumante", "signo", "instagram", "sobre", "favorito", "bloqueado", "ultimaOnline"
];

const NpcManager = () => {
  const [npcs, setNpcs] = useState([]);
  const [novoNpc, setNovoNpc] = useState(() => campos.reduce((acc, campo) => ({ ...acc, [campo]: '' }), {}));

  const fetchNpcs = async () => {
    const res = await fetch('http://localhost:8000/npcs');
    const data = await res.json();
    setNpcs(data);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNovoNpc(prev => ({ ...prev, [name]: value }));
  };

  const adicionarNpc = async () => {
    const npcCompleto = {
      ...novoNpc,
      id: Date.now(),
      favorito: false,
      bloqueado: false,
    };

    const atualizado = [...npcs, npcCompleto];
    setNpcs(atualizado);
    setNovoNpc(campos.reduce((acc, campo) => ({ ...acc, [campo]: '' }), {}));

    await fetch('http://localhost:8000/npcs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(npcCompleto), // ← só um NPC, não a lista
    });
  };

  const excluirNpc = async (id) => {
    const atualizado = npcs.filter(n => n.id !== id);
    setNpcs(atualizado);

    await fetch(`http://localhost:8000/npcs/${id}`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' }
    });
  };

  const atualizarCampoNpc = async (id, campo, valor) => {
    const atualizado = npcs.map(n =>
      n.id === id ? { ...n, [campo]: valor } : n
    );
    setNpcs(atualizado);
  
    const npcAtualizado = atualizado.find(n => n.id === id);
  
    await fetch(`http://localhost:8000/npcs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(npcAtualizado),
    });
  };
  

  useEffect(() => {
    fetchNpcs();
  }, []);

  return (
    <div className="npc-manager">
      <h2>Gerenciar NPCs</h2>

      <fieldset style={{ padding: 10, marginBottom: 20 }}>
        <legend><strong>Adicionar novo NPC</strong></legend>
        {campos.map(campo => (
          <input
            key={campo}
            type="text"
            name={campo}
            placeholder={campo}
            value={novoNpc[campo]}
            onChange={handleInputChange}
            style={{ margin: '4px' }}
          />
        ))}
        <button onClick={adicionarNpc}>➕ Adicionar NPC</button>
      </fieldset>

      <h3>NPCs existentes</h3>
      {npcs.map(npc => (
        <div key={npc.id} style={{ marginBottom: 20, borderBottom: '1px solid #ccc', paddingBottom: 10 }}>
          <strong>ID: {npc.id}</strong>
          <button onClick={() => excluirNpc(npc.id)} style={{ marginLeft: 10, color: 'red' }}>Excluir</button>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '6px' }}>
            {campos.map(campo => (
              <input
                key={campo}
                type="text"
                value={npc[campo] || ''}
                onChange={(e) => atualizarCampoNpc(npc.id, campo, e.target.value)}
                placeholder={campo}
                style={{ minWidth: 120 }}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default NpcManager;
