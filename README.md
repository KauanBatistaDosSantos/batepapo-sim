# Bate-papo Sim

Este repositório contém o frontend (Vite + React) e um backend simples em FastAPI
utilizado para simular conversas com NPCs. Os dados ficam salvos em arquivos JSON
armazenados em `backend/data`.

## Backend na Vercel

A Vercel é otimizada para hospedar frontends estáticos e funções serverless sem
estado. O backend deste projeto depende de gravar arquivos JSON no disco para
persistir NPCs, conversas e demais dados. Em ambientes serverless — como as
funções da Vercel — o sistema de arquivos é temporário e as gravações são
apagadas após cada execução. Por isso, ao implantar apenas o frontend na Vercel
o backend não conseguirá armazenar as alterações realizadas pela aplicação.

Para manter os dados persistentes você precisa executar o backend em um serviço
que ofereça armazenamento permanente (por exemplo, um servidor próprio, Render,
Railway, Fly.io, etc.) ou adaptar o código para utilizar um banco de dados
externo (PostgreSQL, MongoDB, Supabase, Firebase, etc.).

## Executando o backend localmente

1. **Pré-requisitos:** Python 3.10+ e `pip`.
2. Instale as dependências:
   ```bash
   pip install fastapi uvicorn
   ```
3. A partir da raiz do repositório execute o servidor:
   ```bash
   uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000
   ```
4. O backend ficará acessível em `http://localhost:8000` e os dados serão
   gravados em `backend/data`. Os arquivos já versionados servem como semente,
   mas serão atualizados conforme você utilizar os endpoints.

## Executando o frontend

O frontend continua podendo ser construído/hospedado na Vercel. Para rodar
localmente:

```bash
npm install
npm run dev --prefix frontend
```

O Vite abrirá a aplicação em `http://localhost:5173` por padrão. Configure as
variáveis de ambiente do frontend para apontar para o backend local (por
exemplo, `VITE_API_URL=http://localhost:8000`).

## Criar um executável do backend

É possível empacotar o backend FastAPI em um executável utilizando ferramentas
como [PyInstaller](https://pyinstaller.org/). O executável basicamente roda o
Uvicorn embutido, portanto ele ainda precisa de acesso aos arquivos de dados.

1. Instale o PyInstaller:
   ```bash
   pip install pyinstaller
   ```
2. Gere o executável (a partir da pasta `backend`):
   ```bash
   pyinstaller --onefile --name batepapo-backend run_server.py
   ```

O comando acima cria um binário que inicia o servidor FastAPI quando executado
(utilizando o script `run_server.py`). Lembre-se de distribuir também a pasta
`data`, pois ela não é embutida automaticamente. Para distribuição em produção
recomenda-se ainda configurar um sistema de logs, variáveis de ambiente e,
idealmente, migrar para um banco de dados dedicado.

## Próximos passos sugeridos

- Adicionar um serviço de banco de dados para garantir persistência em produção.
- Criar um arquivo `requirements.txt` ou Poetry para facilitar a instalação do
  backend em outros ambientes.
- Automatizar a publicação do backend em um serviço adequado (Docker/Render,
  etc.).

## Como estender o fluxo de mensagens

As opções de mensagens disponíveis para cada NPC ficam registradas no arquivo
`backend/data/dialogo-fluxo.json`. A estrutura básica é a seguinte:

```json
{
  "<id_do_npc>": {
    "inicio": {
      "respostas": ["opcao_a", "opcao_b"],
      "npc": {
        "opcao_a": {
          "player": { "tipo": "texto", "texto": "Opção A" },
          "resposta": { "texto": "Resposta do NPC" },
          "proximas": ["outra_opcao"]
        }
      }
    }
  }
}
```

- `respostas`: lista com as opções iniciais que aparecerão para o jogador.
- `npc`: objeto onde cada chave representa um passo do fluxo. A chave pode ser o
  próprio texto da opção ou qualquer identificador único. Cada passo contém:
  - `player`: define como a opção do jogador é exibida. Use `tipo: "texto"` ou
    `tipo: "imagem"` (neste caso informe também `url` e, opcionalmente,
    `legenda`).
  - `resposta`: conteúdo enviado pelo NPC quando a opção é escolhida. É possível
    incluir texto (`texto`) e/ou imagem (`imagem` + `legenda`).
  - `proximas`: array com os identificadores das próximas opções liberadas após
    a resposta do NPC.

Para adicionar uma nova interação:

1. Acrescente o identificador desejado em `proximas` do passo anterior.
2. Crie uma entrada com esse identificador dentro de `npc`, definindo o conteúdo
   que o jogador enviará (`player`) e a resposta do NPC (`resposta`).
3. Se a nova opção também liberar outras mensagens, liste-as em `proximas`.

Ao salvar o arquivo, recarregue o frontend: o componente `Chat` lerá a estrutura
normalizada e exibirá as novas ramificações automaticamente.

## Como resetar conversas salvas

Os históricos ficam em `backend/data/conversas.json`. Para limpar:

- **Via API:** faça uma requisição `POST` para `http://localhost:8000/mensagens/reset`.
  - Corpo vazio (`{}`) remove todas as conversas.
  - Envie `{ "npc_id": <id_do_npc> }` para limpar somente um NPC.
- **Via painel administrativo:** a página `frontend/src/pages/admin/ConversationTools.jsx`
  oferece um formulário que dispara a mesma requisição. Utilize-a na aplicação
  para não precisar chamar a API manualmente.

Após o reset, o arquivo `conversas.json` é reescrito e o chat volta ao estado
inicial (as opções passam a ser carregadas diretamente de `dialogo-fluxo.json`).