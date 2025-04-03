import React from 'react';
import './Filters.css';

const Filters = () => {
  const filtros = ['Online agora', 'Com foto', 'Perto de mim', 'Novo', 'Favorito'];

  return (
    <div className="filters-container">
      <button className="filter-icon">
        <span>⚙️</span>
      </button>
      <div className="filters-scroll">
        {filtros.map((filtro, index) => (
          <button key={index} className="filter-button">
            {filtro}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Filters;
