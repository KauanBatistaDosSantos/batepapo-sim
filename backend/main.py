from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import json
import os
from fastapi import HTTPException
from fastapi.staticfiles import StaticFiles
from fastapi import Body
from typing import Optional, Literal

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


class FotoModel(BaseModel):
    id: Optional[int] = None
    npcId: int
    autor: Literal["player", "npc"]
    url: str
    data: Optional[str] = None
    legenda: Optional[str] = ""

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


@app.post("/fotos")
def adicionar_foto(foto: FotoModel):
    fotos = ler_json(ARQUIVO_FOTOS, [])

    novo_id = foto.id
    if novo_id is None:
        existente = [f.get("id", 0) for f in fotos if isinstance(f.get("id"), int)]
        novo_id = (max(existente) if existente else 0) + 1

    if any(f.get("id") == novo_id for f in fotos):
        raise HTTPException(status_code=400, detail="ID da foto já utilizado")

    dados = foto.dict()
    dados["id"] = novo_id
    fotos.append(dados)
    salvar_json(ARQUIVO_FOTOS, fotos)
    return {"status": "ok", "id": novo_id}


@app.put("/fotos/{foto_id}")
def editar_foto(foto_id: int, foto: FotoModel):
    fotos = ler_json(ARQUIVO_FOTOS, [])
    index = next((i for i, f in enumerate(fotos) if f.get("id") == foto_id), None)
    if index is None:
        raise HTTPException(status_code=404, detail="Foto não encontrada")

    dados = foto.dict()
    dados["id"] = foto_id
    fotos[index] = dados
    salvar_json(ARQUIVO_FOTOS, fotos)
    return {"status": "ok"}


@app.delete("/fotos/{foto_id}")
def remover_foto(foto_id: int):
    fotos = ler_json(ARQUIVO_FOTOS, [])
    novas = [f for f in fotos if f.get("id") != foto_id]
    if len(novas) == len(fotos):
        raise HTTPException(status_code=404, detail="Foto não encontrada")
    salvar_json(ARQUIVO_FOTOS, novas)
    return {"status": "removida"}

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


@app.post("/mensagens/reset")
def resetar_mensagens(payload: dict = Body(default={})):  # type: ignore[assignment]
    npc_id = payload.get("npc_id") if isinstance(payload, dict) else None
    todas = ler_json(ARQUIVO_CONVERSAS, {})

    if npc_id is None:
        salvar_json(ARQUIVO_CONVERSAS, {})
        return {"status": "ok", "escopo": "todas"}

    chave = str(npc_id)
    if chave in todas:
        del todas[chave]
        salvar_json(ARQUIVO_CONVERSAS, todas)
        return {"status": "ok", "escopo": "npc", "npc_id": npc_id}

    return {"status": "ok", "escopo": "npc", "npc_id": npc_id, "mensagens": 0}

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