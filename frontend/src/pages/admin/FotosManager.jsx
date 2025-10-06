import React, { useEffect, useMemo, useState } from 'react';
import './FotosManager.css';

const estadoInicialFormulario = {
  npcId: '',
  autor: 'player',
  url: '',
  legenda: ''
};

const FotosManager = () => {
  const [fotos, setFotos] = useState([]);
  const [npcList, setNpcList] = useState([]);
  const [formulario, setFormulario] = useState(estadoInicialFormulario);
  const [status, setStatus] = useState({ type: 'idle', message: '' });
  const [filtroNpc, setFiltroNpc] = useState('todos');

  const carregarFotos = () => {
    fetch('http://localhost:8000/fotos')
      .then((res) => res.json())
      .then((data) => setFotos(Array.isArray(data) ? data : []))
      .catch(() => setFotos([]));
  };

  useEffect(() => {
    fetch('http://localhost:8000/npcs')
      .then((res) => res.json())
      .then((npcs) => setNpcList(Array.isArray(npcs) ? npcs : []))
      .catch(() => setNpcList([]));
    carregarFotos();
  }, []);

  const fotosFiltradas = useMemo(() => {
    if (filtroNpc === 'todos') return fotos;
    return fotos.filter((foto) => String(foto.npcId) === filtroNpc);
  }, [filtroNpc, fotos]);

  const atualizarCampo = (campo, valor) => {
    setFormulario((prev) => ({
      ...prev,
      [campo]: valor
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!formulario.npcId || !formulario.url) {
      setStatus({ type: 'error', message: 'Selecione um NPC e informe a URL da imagem.' });
      return;
    }

    const payload = {
      npcId: Number(formulario.npcId),
      autor: formulario.autor,
      url: formulario.url,
      legenda: formulario.legenda,
      data: new Date().toISOString()
    };

    try {
      setStatus({ type: 'loading', message: 'Salvando foto…' });
      const res = await fetch('http://localhost:8000/fotos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) {
        throw new Error('Falha ao salvar foto');
      }
      setStatus({ type: 'success', message: 'Foto adicionada com sucesso!' });
      setFormulario(estadoInicialFormulario);
      carregarFotos();
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Não foi possível salvar a foto. Tente novamente.' });
    }
  };

  const removerFoto = async (id) => {
    if (!window.confirm('Tem certeza que deseja remover esta foto?')) return;

    try {
      const res = await fetch(`http://localhost:8000/fotos/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        throw new Error('Falha ao remover foto');
      }
      carregarFotos();
    } catch (error) {
      console.error(error);
      setStatus({ type: 'error', message: 'Não foi possível remover a foto.' });
    }
  };

  return (
    <div className="fotos-manager">
      <header className="fotos-manager__header">
        <h3>Biblioteca de Fotos</h3>
        <p>Cadastre imagens disponíveis para os fluxos de conversa e organize por NPC.</p>
      </header>

      <section className="fotos-manager__form-card">
        <h4>Adicionar nova foto</h4>
        <form onSubmit={handleSubmit} className="fotos-form">
          <div className="fotos-form__row">
            <label>
              NPC:
              <select
                value={formulario.npcId}
                onChange={(e) => atualizarCampo('npcId', e.target.value)}
              >
                <option value="">Selecione…</option>
                {npcList.map((npc) => (
                  <option key={npc.id} value={npc.id}>
                    {npc.nome}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Autor da foto:
              <select
                value={formulario.autor}
                onChange={(e) => atualizarCampo('autor', e.target.value)}
              >
                <option value="player">Jogador</option>
                <option value="npc">NPC</option>
              </select>
            </label>
          </div>

          <label>
            URL da imagem:
            <input
              type="text"
              value={formulario.url}
              onChange={(e) => atualizarCampo('url', e.target.value)}
              placeholder="/fotos/exemplo.jpg"
              required
            />
          </label>

          <label>
            Legenda (opcional):
            <input
              type="text"
              value={formulario.legenda}
              onChange={(e) => atualizarCampo('legenda', e.target.value)}
            />
          </label>

          <button type="submit">💾 Salvar foto</button>
        </form>

        {status.message && (
          <div className={`fotos-status fotos-status--${status.type}`}>{status.message}</div>
        )}
      </section>

      <section className="fotos-manager__listagem">
        <div className="fotos-filtro">
          <label>
            Filtrar por NPC:
            <select value={filtroNpc} onChange={(e) => setFiltroNpc(e.target.value)}>
              <option value="todos">Todos</option>
              {npcList.map((npc) => (
                <option key={`filtro-${npc.id}`} value={npc.id}>
                  {npc.nome}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="fotos-grid">
          {fotosFiltradas.map((foto) => (
            <div key={foto.id} className="fotos-card">
              <div className="fotos-card__thumb">
                <img src={foto.url} alt={foto.legenda || 'Foto cadastrada'} />
              </div>
              <div className="fotos-card__info">
                <strong>{npcList.find((npc) => npc.id === foto.npcId)?.nome || `NPC #${foto.npcId}`}</strong>
                <span className={`fotos-card__tag fotos-card__tag--${foto.autor}`}>
                  {foto.autor === 'npc' ? 'NPC' : 'Jogador'}
                </span>
                {foto.legenda && <p>{foto.legenda}</p>}
                <small>{foto.url}</small>
              </div>
              <button type="button" onClick={() => removerFoto(foto.id)} className="fotos-card__delete">
                Remover
              </button>
            </div>
          ))}

          {!fotosFiltradas.length && (
            <div className="fotos-vazio">Nenhuma foto cadastrada para este filtro.</div>
          )}
        </div>
      </section>
    </div>
  );
};

export default FotosManager;