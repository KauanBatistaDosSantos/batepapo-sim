import React from 'react';

const TreeViewer = ({ respostas, npc }) => {
  const renderNode = (fala, caminho = []) => {
    if (!fala || caminho.includes(fala)) {
      return null;
    }

    const dadosNpc = npc[fala] || {};
    const proximas = Array.isArray(dadosNpc.proximas) ? dadosNpc.proximas : [];

    return (
      <li key={`${caminho.join('>')}-${fala}`} className="tree-node">
        <div className="tree-node__content">
          <strong>{fala}</strong>
          {dadosNpc.resposta && <p className="tree-node__resposta">→ {dadosNpc.resposta}</p>}
        </div>
        {proximas.length > 0 && (
          <ul className="tree-node__children">
            {proximas.map((prox) => renderNode(prox, [...caminho, fala]))}
          </ul>
        )}
      </li>
    );
  };

  if (!Array.isArray(respostas) || respostas.length === 0) {
    return <p className="tree-viewer__empty">Nenhuma fala inicial cadastrada.</p>;
  }

  return (
    <div className="tree-viewer">
      <ul className="tree-root">
        {respostas.map((fala) => renderNode(fala, []))}
      </ul>
    </div>
  );
};

export default TreeViewer;