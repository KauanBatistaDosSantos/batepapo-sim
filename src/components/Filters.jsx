import React, { useState, useRef, useEffect } from 'react';
import './Filters.css';

const filtrosDisponiveis = ['Online agora', 'Com foto', 'Perto de mim', 'Novo', 'Favorito'];

const Filters = ({ filtrosAtivos, setFiltrosAtivos, filtrosAvancados, setFiltrosAvancados }) => {
  const [mostrarAvancado, setMostrarAvancado] = useState(false);
  const menuRef = useRef(null);
  const engrenagemRef = useRef(null);

  // Fecha o menu se clicar fora
  useEffect(() => {
    const handleClickFora = (e) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target) &&
        !engrenagemRef.current.contains(e.target)
      ) {
        setMostrarAvancado(false);
      }
    };

    if (mostrarAvancado) {
      document.addEventListener('mousedown', handleClickFora);
    } else {
      document.removeEventListener('mousedown', handleClickFora);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickFora);
    };
  }, [mostrarAvancado]);

  const toggleFiltro = (filtro) => {
    if (filtrosAtivos.includes(filtro)) {
      setFiltrosAtivos(filtrosAtivos.filter(f => f !== filtro));
    } else {
      setFiltrosAtivos([...filtrosAtivos, filtro]);
    }
  };

  const toggleAvancado = (campo, valor) => {
    setFiltrosAvancados((prev) => {
      const atual = prev[campo];
      const novo = { ...prev };
      if (atual === valor) {
        delete novo[campo];
      } else {
        novo[campo] = valor;
      }
      return novo;
    });

    // Fecha o menu se o usuário ativar algum filtro específico
    setMostrarAvancado(false);
  };

  return (
    <div className="filters-container">
      <button
        className="filter-icon"
        ref={engrenagemRef}
        style={{ zIndex: 1000 }}
        onClick={() => setMostrarAvancado(!mostrarAvancado)}
      >
        <span>⚙️</span>
      </button>

      <div className="filters-scroll">
        {filtrosDisponiveis.map((filtro, index) => (
          <button
            key={index}
            className={`filter-button ${filtrosAtivos.includes(filtro) ? 'active' : ''}`}
            onClick={() => toggleFiltro(filtro)}
          >
            {filtro}
          </button>
        ))}
      </div>

      {mostrarAvancado && (
        <div className="filters-advanced" ref={menuRef}>
          <p className="advanced-title">Filtros Específicos</p>

          <div className="filter-row">
            <span>Idade:</span>
            {[18, 25, 30, 35, 40].map((idade) => (
              <button
                key={`idadeMin-${idade}`}
                className={`filter-button small ${filtrosAvancados.idadeMin === idade ? 'active' : ''}`}
                onClick={() => toggleAvancado('idadeMin', idade)}
              >
                +{idade}
              </button>
            ))}
            {[25, 30, 35, 40, 50].map((idade) => (
              <button
                key={`idadeMax-${idade}`}
                className={`filter-button small ${filtrosAvancados.idadeMax === idade ? 'active' : ''}`}
                onClick={() => toggleAvancado('idadeMax', idade)}
              >
                -{idade}
              </button>
            ))}
          </div>

          <div className="filter-row">
            <span>Altura:</span>
            {[160, 170, 180].map((altura) => (
              <button
                key={`alturaMin-${altura}`}
                className={`filter-button small ${filtrosAvancados.alturaMin === altura ? 'active' : ''}`}
                onClick={() => toggleAvancado('alturaMin', altura)}
              >
                +{altura}cm
              </button>
            ))}
          </div>

          <div className="filter-row">
            <span>Peso:</span>
            {[60, 80, 100].map((peso) => (
              <button
                key={`pesoMax-${peso}`}
                className={`filter-button small ${filtrosAvancados.pesoMax === peso ? 'active' : ''}`}
                onClick={() => toggleAvancado('pesoMax', peso)}
              >
                -{peso}kg
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Filters;
