from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Pode restringir em produção
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 📁 Caminho base dos arquivos JSON
BASE_DIR = os.path.join(os.path.dirname(__file__), "data")
ARQUIVO_CONVERSAS = os.path.join(BASE_DIR, "conversas.json")
ARQUIVO_NPCS = os.path.join(BASE_DIR, "npcs.json")
ARQUIVO_DIALOGOS = os.path.join(BASE_DIR, "dialogo-fluxo.json")
ARQUIVO_FOTOS = os.path.join(BASE_DIR, "fotos.json")

app.mount("/fotos", StaticFiles(directory="data/fotos"), name="fotos")

# 📨 Estrutura do payload de mensagens
class MensagemPayload(BaseModel):
    npc_id: int
    mensagens: list  # lista de dicionários


# 🔄 Utilitários para ler/salvar
def ler_json(caminho):
    if not os.path.exists(caminho):
        return {}
    with open(caminho, "r", encoding="utf-8") as f:
        return json.load(f)

def salvar_json(caminho, data):
    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# 📥 Endpoints

@app.get("/npcs")
def get_npcs():
    return ler_json(ARQUIVO_NPCS)

@app.get("/dialogos/{npc_id}")
def get_dialogo(npc_id: str):
    todos = ler_json(ARQUIVO_DIALOGOS)
    return todos.get(npc_id, {})

@app.get("/fotos")
def get_fotos(npc_id: int = None):
    todas = ler_json(ARQUIVO_FOTOS)
    if npc_id is not None:
        return [f for f in todas if f.get("npcId") == npc_id]
    return todas

@app.get("/mensagens/")
def listar_todas_conversas():
    return ler_json(ARQUIVO_CONVERSAS)

@app.get("/mensagens/{npc_id}")
def get_mensagens(npc_id: int):
    todas = ler_json(ARQUIVO_CONVERSAS)
    return todas.get(str(npc_id), [])

@app.post("/mensagens/{npc_id}")
def post_mensagens(npc_id: int, payload: MensagemPayload):
    todas = ler_json(ARQUIVO_CONVERSAS)
    todas[str(npc_id)] = payload.mensagens
    salvar_json(ARQUIVO_CONVERSAS, todas)
    return {"status": "ok"}

@app.post("/npcs/{npc_id}/favorito")
def toggle_favorito(npc_id: int):
    npcs = ler_json(ARQUIVO_NPCS)
    npc_encontrado = next((n for n in npcs if n["id"] == npc_id), None)
    
    if not npc_encontrado:
        raise HTTPException(status_code=404, detail="NPC não encontrado")

    npc_encontrado["favorito"] = not npc_encontrado.get("favorito", False)
    salvar_json(ARQUIVO_NPCS, npcs)

    return {"status": "ok", "favorito": npc_encontrado["favorito"]}

@app.get("/npcs/favoritos")
def get_favoritos():
    npcs = ler_json(ARQUIVO_NPCS)
    favoritos = [n for n in npcs if n.get("favorito") is True]
    return favoritos
