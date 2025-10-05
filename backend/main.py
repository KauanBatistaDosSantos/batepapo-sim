from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi import Body
from typing import Optional

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

app.mount("/fotos", StaticFiles(directory=os.path.join(BASE_DIR, "fotos")), name="fotos")

# 📨 Estrutura do payload de mensagens
class MensagemPayload(BaseModel):
    npc_id: int
    mensagens: list  # lista de dicionários


# 🔄 Utilitários para ler/salvar
def ler_json(caminho, padrao=None):
    """Lê um arquivo JSON retornando um valor padrão quando não existe ou é inválido."""

    if padrao is None:
        padrao = {}

    if not os.path.exists(caminho):
        return padrao

    try:
        with open(caminho, "r", encoding="utf-8") as f:
            return json.load(f)
    except json.JSONDecodeError:
        return padrao


def salvar_json(caminho, data):
    """Salva dados no formato JSON garantindo codificação em UTF-8."""

    with open(caminho, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

# === Schemas ===
class MensagemPayload(BaseModel):
    npc_id: int
    mensagens: list

class NpcModel(BaseModel):
    id: int
    nome: str = ""
    idade: Optional[int] = None
    foto: str = ""
    favorito: bool = False
    bloqueado: bool = False
    distancia: Optional[int] = None
    online: Optional[bool] = None
    novo: Optional[bool] = None
    altura: str = ""
    peso: str = ""
    corpo: str = ""
    genero: str = ""
    sexualidade: str = ""
    status: str = ""
    papel: str = ""
    estilo: str = ""
    interesse: str = ""
    fumante: str = ""
    signo: str = ""
    instagram: str = ""
    sobre: str = ""
    ultimaOnline: str = ""

# 📥 Endpoints

@app.get("/npcs")
def get_npcs():
    return ler_json(ARQUIVO_NPCS, [])

@app.get("/dialogos/{npc_id}")
def get_dialogo(npc_id: str):
    todos = ler_json(ARQUIVO_DIALOGOS, {})
    return todos.get(npc_id, {})

@app.get("/fotos")
def get_fotos(npc_id: int = None):
    todas = ler_json(ARQUIVO_FOTOS, [])
    if npc_id is not None:
        return [f for f in todas if f.get("npcId") == npc_id]
    return todas

@app.get("/mensagens/")
def listar_todas_conversas():
    return ler_json(ARQUIVO_CONVERSAS, {})

@app.get("/mensagens/{npc_id}")
def get_mensagens(npc_id: int):
    todas = ler_json(ARQUIVO_CONVERSAS, {})
    return todas.get(str(npc_id), [])

@app.post("/mensagens/{npc_id}")
def post_mensagens(npc_id: int, payload: MensagemPayload):
    todas = ler_json(ARQUIVO_CONVERSAS, {})
    todas[str(npc_id)] = payload.mensagens
    salvar_json(ARQUIVO_CONVERSAS, todas)
    return {"status": "ok"}

@app.post("/npcs/{npc_id}/favorito")
def toggle_favorito(npc_id: int):
    npcs = ler_json(ARQUIVO_NPCS, [])
    npc_encontrado = next((n for n in npcs if n["id"] == npc_id), None)
    
    if not npc_encontrado:
        raise HTTPException(status_code=404, detail="NPC não encontrado")

    npc_encontrado["favorito"] = not npc_encontrado.get("favorito", False)
    salvar_json(ARQUIVO_NPCS, npcs)

    return {"status": "ok", "favorito": npc_encontrado["favorito"]}

@app.get("/npcs/favoritos")
def get_favoritos():
    npcs = ler_json(ARQUIVO_NPCS, [])
    favoritos = [n for n in npcs if n.get("favorito") is True]
    return favoritos

@app.post("/npcs/{npc_id}/bloquear")
def toggle_bloqueado(npc_id: int):
    npcs = ler_json(ARQUIVO_NPCS, [])
    npc_encontrado = next((n for n in npcs if n["id"] == npc_id), None)

    if not npc_encontrado:
        raise HTTPException(status_code=404, detail="NPC não encontrado")

    npc_encontrado["bloqueado"] = not npc_encontrado.get("bloqueado", False)
    salvar_json(ARQUIVO_NPCS, npcs)

    return {"status": "ok", "bloqueado": npc_encontrado["bloqueado"]}

@app.get("/npcs/bloqueados")
def get_bloqueados():
    npcs = ler_json(ARQUIVO_NPCS, [])
    return [n for n in npcs if n.get("bloqueado")]

@app.post("/npcs")
def adicionar_npc(npc: NpcModel):
    npcs = ler_json(ARQUIVO_NPCS, [])
    if any(n["id"] == npc.id for n in npcs):
        raise HTTPException(status_code=400, detail="ID já existente")
    npcs.append(npc.dict())
    salvar_json(ARQUIVO_NPCS, npcs)
    return {"status": "ok"}

@app.put("/npcs/{npc_id}")
def editar_npc(npc_id: int, npc_data: NpcModel):
    npcs = ler_json(ARQUIVO_NPCS, [])
    index = next((i for i, n in enumerate(npcs) if n["id"] == npc_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="NPC não encontrado")
    npcs[index] = npc_data.dict()
    salvar_json(ARQUIVO_NPCS, npcs)
    return {"status": "ok"}

@app.delete("/npcs/{npc_id}")
def deletar_npc(npc_id: int):
    npcs = ler_json(ARQUIVO_NPCS, [])
    novos = [n for n in npcs if n["id"] != npc_id]
    if len(novos) == len(npcs):
        raise HTTPException(status_code=404, detail="NPC não encontrado")
    salvar_json(ARQUIVO_NPCS, novos)
    return {"status": "removido"}

# === Endpoints Dialogo, Fotos, Mensagens ===


@app.post("/dialogos/{npc_id}")
def salvar_dialogo(npc_id: str, dialogo: dict = Body(...)):
    todos = ler_json(ARQUIVO_DIALOGOS, {})
    todos[npc_id] = dialogo
    salvar_json(ARQUIVO_DIALOGOS, todos)
    return {"status": "ok"}