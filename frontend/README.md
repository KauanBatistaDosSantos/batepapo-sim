# Guia Completo do Simulador de Bate-Papo

Este repositório reúne um backend em **FastAPI** e um frontend em **React + Vite** que simulam um aplicativo de bate-papo com perfis fictícios (NPCs), lista de conversas, favoritos e painel administrativo. Este guia explica como instalar, executar e utilizar cada área da aplicação, incluindo o acesso às páginas administrativas.

## 1. Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas:

- [Node.js 18+](https://nodejs.org/) (inclui o npm)
- [Python 3.10+](https://www.python.org/)

> Dica: use `node -v` e `python --version` para confirmar se as versões estão disponíveis.

## 2. Preparação do projeto

Clone o repositório e abra o diretório raiz em seu terminal:

```bash
git clone <URL-do-repositorio>
cd batepapo-sim
```

### 2.1. Instale as dependências do frontend

```bash
cd frontend
npm install
```

### 2.2. (Opcional) Crie um ambiente virtual para o backend

```bash
cd ../backend
python -m venv .venv
source .venv/bin/activate  # Linux/Mac
.venv\Scripts\activate     # Windows PowerShell
```

### 2.3. Instale as dependências do backend

O backend utiliza apenas FastAPI e Uvicorn. Instale-as (dentro do ambiente virtual, se estiver usando um):

```bash
pip install fastapi uvicorn
```

## 3. Executando a aplicação

### 3.1. Inicie o backend (FastAPI)

Estando na pasta `backend`, execute:

```bash
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

- As rotas de API ficarão disponíveis em `http://localhost:8000`.
- Os dados persistem em arquivos JSON dentro de `backend/data`.
- As fotos cadastradas são servidas em `http://localhost:8000/fotos`.

### 3.2. Inicie o frontend (React + Vite)

Em outro terminal, volte para a pasta `frontend` e execute:

```bash
npm run dev
```

- A interface ficará disponível em `http://localhost:5173`.
- Pressione `o` no terminal para abrir no navegador ou acesse o endereço manualmente.

## 4. Navegação pelo aplicativo

A interface principal é composta por quatro abas acessíveis na barra inferior:

1. **Início (🏠)** – Página padrão ao abrir o app.
2. **Favoritos (⭐)** – Lista de NPCs marcados como favoritos.
3. **Conversas (💬)** – Caixa de entrada com seus chats ativos.
4. **Perfil (⚙️)** – Configurações e preferências do usuário.

### 4.1. Início (lista de NPCs)

- A lista é carregada do endpoint `GET /npcs` e ordenada por status online e distância.
- Use os filtros rápidos (Online agora, Com foto, Perto de mim, Novo, Favorito) e os filtros avançados (idade, altura, peso) para refinar a busca.
- Clique em um card para abrir o **perfil completo** do NPC. A partir do perfil é possível:
  - Favoritar ou bloquear o NPC.
  - Iniciar um chat (abre a tela de conversa).
  - Navegar para o próximo/anterior perfil filtrado.

NPCs bloqueados somem automaticamente da lista inicial e da caixa de entrada.

### 4.2. Perfil do NPC

- Mostra biografia, dados pessoais e fotos do personagem.
- O botão **Conversar** abre a tela de chat com o histórico carregado de `GET /mensagens/{npc_id}`.
- Ao bloquear, o NPC deixa de aparecer em todas as listagens até ser desbloqueado.

### 4.3. Conversas

- A aba **Conversas** consulta `GET /mensagens/` para montar a caixa de entrada com o último trecho de cada diálogo.
- Clique em um item para abrir o chat. As mensagens são enviadas via `POST /mensagens/{npc_id}`.
- NPCs bloqueados não são exibidos nesta aba.

### 4.4. Favoritos

- Exibe apenas os NPCs marcados como favoritos.
- Usa o mesmo cartão de perfil, permitindo abrir o perfil completo ou o chat rapidamente.

### 4.5. Perfil do usuário

- Atualize nome, e-mail, biografia, idioma, tema e URL do avatar.
- Ative ou desative notificações (email, SMS, push).
- Troque a senha informando a senha atual e confirmando a nova senha.

## 5. Acesso ao painel administrativo

O painel não aparece na navegação principal. Para acessá-lo, adicione o parâmetro `?admin` à URL do frontend:

```
http://localhost:5173/?admin
```

A página administrativa possui uma barra lateral com quatro seções. As duas primeiras estão implementadas:

### 5.1. 👥 NPCs

- Carrega todos os NPCs existentes (`GET /npcs`).
- Use o formulário "Adicionar novo NPC" para criar personagens. Campos importantes:
  - `nome`, `idade`, `foto` (URL), `altura`, `peso`, `corpo`, `genero`, `papel`, `estilo`, `interesse`, `signo`, `instagram`, `sobre`, etc.
  - O campo `id` é gerado automaticamente.
- Cada NPC exibido pode ser editado inline. As alterações são mantidas em memória e a interface envia a mudança para `PUT /npcs/{id}`.
- O botão **Excluir** remove o NPC da lista e dispara uma requisição `DELETE /npcs` com a coleção atualizada.
- **Importante:** o backend FastAPI incluído fornece apenas a rota `GET /npcs` e o toggle de favoritos. Se desejar persistir as edições feitas no painel, implemente os endpoints `POST`, `PUT` e `DELETE` correspondentes em `backend/main.py`.

### 5.2. 💬 Diálogos

- Selecione um NPC para carregar o fluxo de diálogo (`GET /dialogos/{npcId}`).
- Modos de visualização:
  - **✏️ Edição:** cria e altera falas do jogador e respostas do NPC.
  - **👤 Falas Iniciais / ⏭️ Falas em sequência:** focos diferentes sobre os mesmos dados.
  - **🌳 Visualização Árvore:** usa o componente `TreeViewer` para enxergar o fluxo completo.
- Adicione novas entradas pelo botão **➕ Adicionar grupo de fala**.
- Reordene falas com as setas ↑/↓.
- Remova trechos e gerencie as próximas respostas.
- Clique em **Salvar diálogo** para enviar o conteúdo para `POST /dialogos/{npcId}`.
- **Importante:** assim como no gerenciamento de NPCs, implemente no backend a rota `POST /dialogos/{npcId}` para que o botão de salvar persista o JSON editado.

### 5.3. 🖼 Fotos e 🧪 Filtros

- Estes itens atualmente exibem apenas textos informativos. Adapte conforme as necessidades do projeto.

## 6. Estrutura dos dados

Todos os arquivos de dados ficam em `backend/data`:

- `npcs.json` – catálogo de personagens.
- `dialogo-fluxo.json` – árvore de diálogos por NPC.
- `conversas.json` – histórico de mensagens.
- `fotos.json` – metadados de imagens usadas nos perfis.

Faça backups antes de editar manualmente os arquivos. O painel administrativo atualiza automaticamente o JSON correspondente em cada ação.

## 7. Dicas e solução de problemas

- Se o frontend mostrar erros de CORS ou dados vazios, confirme se o backend está rodando em `http://localhost:8000`.
- Ao alterar dados via painel admin, atualize a página principal para ver as mudanças refletidas.
- Use as ferramentas de desenvolvedor do navegador para acompanhar as requisições HTTP.
- Para redefinir os dados, substitua os arquivos JSON por versões limpas ou restaure um backup.

## 8. Próximos passos sugeridos

- Implementar autenticação de usuário/admin.
- Completar as seções de Fotos e Filtros no painel.
- Integrar envio de mídia e notificações reais.
- Criar testes automatizados para o backend e frontend.

Com esses passos, você terá o ambiente em execução e saberá navegar por todas as funcionalidades, incluindo as rotas administrativas. Bom desenvolvimento!