import React, { useEffect, useState } from 'react';
import './ConversationTools.css';

const ConversationTools = () => {
  const [npcList, setNpcList] = useState([]);
  const [npcId, setNpcId] = useState('');
  const [status, setStatus] = useState({ type: 'idle', message: '' });

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then((res) => res.json())
      .then((npcs) => setNpcList(Array.isArray(npcs) ? npcs : []))
      .catch(() => setNpcList([]));
  }, []);

  const resetarConversas = async () => {
    const body = npcId ? { npc_id: Number(npcId) } : {};
    const confirmacao = npcId
      ? window.confirm('Tem certeza que deseja limpar a conversa com este NPC?')
      : window.confirm('Tem certeza que deseja limpar todas as conversas?');

    if (!confirmacao) return;

    try {
      setStatus({ type: 'loading', message: 'Limpando histórico…' });
      const res = await fetch('http://localhost:8000/mensagens/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (!res.ok) {
        throw new Error('Falha ao resetar conversas');
      }
      setStatus({ type: 'success', message: npcId ? 'Histórico deste NPC foi resetado.' : 'Todas as conversas foram limpas.' });
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Não foi possível resetar as conversas.' });
    }
  };

  return (
    <div className="conversation-tools">
      <header className="conversation-tools__header">
        <h3>Reset de Conversas</h3>
        <p>Use esta ferramenta para limpar rapidamente o histórico salvo no backend.</p>
      </header>

      <section className="conversation-tools__card">
        <div className="conversation-tools__controls">
          <label>
            Selecionar NPC (opcional):
            <select value={npcId} onChange={(e) => setNpcId(e.target.value)}>
              <option value="">Todos os NPCs</option>
              {npcList.map((npc) => (
                <option key={npc.id} value={npc.id}>
                  {npc.nome}
                </option>
              ))}
            </select>
          </label>

          <button type="button" onClick={resetarConversas}>
            🔁 Resetar conversas
          </button>
        </div>

        {status.message && (
          <div className={`conversation-tools__status conversation-tools__status--${status.type}`}>
            {status.message}
          </div>
        )}

        <ul className="conversation-tools__dicas">
          <li>Ao selecionar um NPC específico, apenas a conversa com ele será removida.</li>
          <li>Escolha "Todos os NPCs" para limpar completamente o arquivo de mensagens.</li>
          <li>Esta ação não pode ser desfeita, então confirme antes de prosseguir.</li>
        </ul>
      </section>
    </div>
  );
};

export default ConversationTools;