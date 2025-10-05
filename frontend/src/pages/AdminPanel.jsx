import React, { useState } from 'react';
import './AdminPanel.css';
import NpcManager from './admin/NpcManager';
import DialogManager from './admin/DialogManager';

const AdminPanel = () => {
  const [section, setSection] = useState('npcs');

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <h2>Administração</h2>
        <nav>
          <button onClick={() => setSection('npcs')}>👥 NPCs</button>
          <button onClick={() => setSection('dialogos')}>💬 Diálogos</button>
          <button onClick={() => setSection('fotos')}>🖼 Fotos</button>
          <button onClick={() => setSection('filtros')}>🧪 Filtros</button>
        </nav>
      </aside>

      <main className="admin-content">
        {section === 'npcs' && <h3>Gerenciar NPCs (lista, adicionar, editar)</h3>}
        {section === 'dialogos' && <h3>Gerenciar Diálogos (fluxo de conversa)</h3>}
        {section === 'fotos' && <h3>Gerenciar Fotos (upload, deletar)</h3>}
        {section === 'filtros' && <h3>Gerenciar Filtros (corpo, papel, estilo...)</h3>}
        {section === 'npcs' && <NpcManager />}
        {section === 'dialogos' && <DialogManager />}
      </main>
    </div>
  );
};

export default AdminPanel;
