import React, { useEffect, useState } from 'react';
import './Settings.css';

const Settings = ({ profile, onSaveProfile, onChangePassword }) => {
  const [formData, setFormData] = useState(profile);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [feedback, setFeedback] = useState(null);
  const [passwordFeedback, setPasswordFeedback] = useState(null);

  useEffect(() => {
    setFormData(profile);
  }, [profile]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;

    if (name.startsWith('notifications.')) {
      const key = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        notifications: {
          ...prev.notifications,
          [key]: event.target.checked,
        },
      }));
      return;
    }

    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleProfileSubmit = (event) => {
    event.preventDefault();
    onSaveProfile(formData);
    setFeedback('Informações atualizadas com sucesso!');
    setTimeout(() => setFeedback(null), 4000);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handlePasswordSubmit = (event) => {
    event.preventDefault();
    if (!passwordData.currentPassword) {
      setPasswordFeedback('Informe a senha atual para continuar.');
      return;
    }

    if (passwordData.currentPassword !== profile.password) {
      setPasswordFeedback('Senha atual incorreta.');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setPasswordFeedback('A nova senha deve ter pelo menos 6 caracteres.');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordFeedback('As senhas não coincidem.');
      return;
    }

    onChangePassword(passwordData.newPassword);
    setPasswordFeedback('Senha atualizada com sucesso!');
    setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setPasswordFeedback(null), 4000);
  };

  return (
    <section className="settings">
      <header className="settings__header">
        <div className="settings__avatar">
          <img src={formData.avatarUrl} alt={`Avatar de ${formData.name}`} />
        </div>
        <div>
          <h1>Configurações do usuário</h1>
          <p>Atualize seus dados pessoais e preferências da conta.</p>
        </div>
      </header>

      <div className="settings__content">
        <form className="settings__card" onSubmit={handleProfileSubmit}>
          <h2>Informações pessoais</h2>
          <div className="form-group">
            <label htmlFor="name">Nome completo</label>
            <input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Digite seu nome"
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">E-mail</label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="nome@email.com"
            />
          </div>
          <div className="form-group">
            <label htmlFor="bio">Biografia</label>
            <textarea
              id="bio"
              name="bio"
              rows="3"
              value={formData.bio}
              onChange={handleInputChange}
              placeholder="Conte um pouco sobre você"
            />
          </div>
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="language">Idioma</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en-US">Inglês</option>
                <option value="es-ES">Espanhol</option>
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="theme">Tema</label>
              <select
                id="theme"
                name="theme"
                value={formData.theme}
                onChange={handleInputChange}
              >
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
                <option value="system">Automático</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="avatarUrl">URL do avatar</label>
            <input
              id="avatarUrl"
              name="avatarUrl"
              value={formData.avatarUrl}
              onChange={handleInputChange}
              placeholder="https://..."
            />
          </div>

          <fieldset className="settings__card">
            <legend>Notificações</legend>
            <label className="toggle">
              <input
                type="checkbox"
                name="notifications.email"
                checked={formData.notifications?.email ?? false}
                onChange={handleInputChange}
              />
              E-mail
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                name="notifications.sms"
                checked={formData.notifications?.sms ?? false}
                onChange={handleInputChange}
              />
              SMS
            </label>
            <label className="toggle">
              <input
                type="checkbox"
                name="notifications.push"
                checked={formData.notifications?.push ?? false}
                onChange={handleInputChange}
              />
              Push
            </label>
          </fieldset>

          <button type="submit" className="btn-primary">
            Salvar alterações
          </button>
          {feedback && <p className="feedback success">{feedback}</p>}
        </form>

        <form className="settings__card" onSubmit={handlePasswordSubmit}>
          <h2>Alterar senha</h2>
          <div className="form-group">
            <label htmlFor="currentPassword">Senha atual</label>
            <input
              id="currentPassword"
              name="currentPassword"
              type="password"
              value={passwordData.currentPassword}
              onChange={handlePasswordChange}
              placeholder="Digite sua senha atual"
            />
          </div>
          <div className="form-group">
            <label htmlFor="newPassword">Nova senha</label>
            <input
              id="newPassword"
              name="newPassword"
              type="password"
              value={passwordData.newPassword}
              onChange={handlePasswordChange}
              placeholder="Mínimo de 6 caracteres"
            />
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirmar nova senha</label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              placeholder="Repita a nova senha"
            />
          </div>

          <button type="submit" className="btn-secondary">
            Atualizar senha
          </button>
          {passwordFeedback && (
            <p
              className={`feedback ${passwordFeedback.includes('sucesso') ? 'success' : 'error'}`}
            >
              {passwordFeedback}
            </p>
          )}
        </form>
      </div>
    </section>
  );
};

export default Settings;