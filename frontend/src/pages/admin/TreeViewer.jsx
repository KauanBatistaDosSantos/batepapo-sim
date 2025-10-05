import React from 'react';
import ReactFlow, { Background, Controls } from 'reactflow';
import 'reactflow/dist/style.css';

const TreeViewer = ({ respostas, npc }) => {
  const nodes = [];
  const edges = [];

  const visitados = new Set();
  let idCounter = 1;

  const createNodes = (fala, parentId = null) => {
    if (visitados.has(fala)) return;
    visitados.add(fala);

    const currentId = `node-${idCounter++}`;
    const npcData = npc[fala] || {};

    nodes.push({
      id: currentId,
      data: { label: `${fala}\n→ ${npcData.resposta || ''}` },
      position: { x: Math.random() * 400, y: idCounter * 100 },
    });

    if (parentId) {
      edges.push({ id: `edge-${parentId}-${currentId}`, source: parentId, target: currentId });
    }

    (npcData.proximas || []).forEach(prox => {
      createNodes(prox, currentId);
    });
  };

  respostas.forEach(r => createNodes(r));

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
      style={{ width: '100%', height: '100%' }}
    >
      <Background />
      <Controls />
    </ReactFlow>
  );
};

export default TreeViewer;
