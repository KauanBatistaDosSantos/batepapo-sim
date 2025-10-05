import React, { useEffect, useState, useCallback } from 'react';
import ReactFlow, {
  ReactFlowProvider,
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
} from 'reactflow';
import 'reactflow/dist/style.css';

const generateNodesAndEdges = (dialogo) => {
  const nodes = [];
  const edges = [];

  if (!dialogo?.inicio?.respostas) return { nodes, edges };

  dialogo.inicio.respostas.forEach((fala, index) => {
    const npcData = dialogo.inicio.npc[fala];

    nodes.push({
      id: fala,
      type: 'default',
      position: { x: 100 + index * 250, y: 100 },
      data: {
        label: (
          <div>
            <strong>{fala}</strong>
            <div style={{ fontSize: 12, color: '#555' }}>{npcData?.resposta}</div>
          </div>
        )
      },
    });

    npcData?.proximas?.forEach((proxima) => {
      edges.push({ id: `${fala}->${proxima}`, source: fala, target: proxima });
    });
  });

  return { nodes, edges };
};

const DialogTree = ({ dialogo }) => {
  const { nodes: initialNodes, edges: initialEdges } = generateNodesAndEdges(dialogo);
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  useEffect(() => {
    const { nodes, edges } = generateNodesAndEdges(dialogo);
    setNodes(nodes);
    setEdges(edges);
  }, [dialogo, setNodes, setEdges]);

  const onConnect = useCallback(
    (params) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  return (
    <div style={{ height: '80vh', border: '1px solid #ccc', borderRadius: 10 }}>
      <ReactFlowProvider>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <MiniMap />
          <Controls />
          <Background color="#aaa" gap={16} />
        </ReactFlow>
      </ReactFlowProvider>
    </div>
  );
};

export default DialogTree;
