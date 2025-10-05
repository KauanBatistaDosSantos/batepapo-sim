import React, { useState } from 'react';
import './AdminPanel.css';
import NpcManager from './admin/NpcManager';
import DialogManager from './admin/DialogManager';

const sections = {
  npcs: {
    icon: '👥',
    label: 'NPCs',
    title: 'Gerenciar NPCs',
    description:
      'Cadastre novos personagens, mantenha o histórico atualizado e organize o elenco do bate-papo.',
    component: <NpcManager />,
  },
  dialogos: {
    icon: '💬',
    label: 'Diálogos',
    title: 'Gerenciar Diálogos',
    description:
      'Monte fluxos de conversas, defina gatilhos e visualize rapidamente como os NPCs respondem.',
    component: <DialogManager />,
  },
  fotos: {
    icon: '🖼',
    label: 'Fotos',
    title: 'Biblioteca de Fotos',
    description:
      'Faça upload de novas imagens, organize em coleções e mantenha tudo pronto para o storytelling.',
  },
  filtros: {
    icon: '🧪',
    label: 'Filtros',
    title: 'Laboratório de Filtros',
    description:
      'Experimente combinações de corpo, papel e estilo para criar personagens inesquecíveis.',
  },
};

const AdminPanel = () => {
  const [section, setSection] = useState('npcs');
  const activeSection = sections[section];

  return (
    <div className="admin-panel">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__header">
          <span className="admin-sidebar__badge">Painel</span>
          <h2>Administração</h2>
          <p>Faça ajustes com segurança e acompanhe tudo em tempo real.</p>
        </div>
        <nav>
          {Object.entries(sections).map(([key, value]) => (
            <button
              key={key}
              type="button"
              className={`admin-nav-button ${section === key ? 'is-active' : ''}`}
              onClick={() => setSection(key)}
            >
              <span className="admin-nav-button__icon" aria-hidden>{value.icon}</span>
              <span>{value.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      <main className="admin-content">
        <header className="admin-content__header">
          <span className="admin-content__badge">{activeSection.label}</span>
          <h3>{activeSection.title}</h3>
          <p>{activeSection.description}</p>
        </header>

        <section className="admin-section-card">
          {activeSection.component ? (
            activeSection.component
          ) : (
            <div className="admin-placeholder">
              <div className="admin-placeholder__icon" aria-hidden>
                {activeSection.icon}
              </div>
              <h4>Em breve</h4>
              <p>
                Estamos preparando ferramentas incríveis para esta área. Enquanto isso, use o menu ao
                lado para navegar pelas seções disponíveis.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default AdminPanel;