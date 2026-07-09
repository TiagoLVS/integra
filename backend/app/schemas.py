from pydantic import BaseModel, EmailStr
from datetime import datetime, date, time
from typing import Optional


# ---------- Usuario ----------
class UsuarioCreate(BaseModel):
    nome: str
    email: EmailStr
    senha: str
    telefone: Optional[str] = None


class UsuarioLogin(BaseModel):
    email: EmailStr
    senha: str


class UsuarioOut(BaseModel):
    id: int
    nome: str
    email: str
    telefone: Optional[str] = None

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    token_type: str


# ---------- Evento ----------
class EventoOut(BaseModel):
    id: int
    nome: str
    descricao: Optional[str] = None
    data: date
    local: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Palestra ----------
class PalestraOut(BaseModel):
    id: int
    evento_id: int
    titulo: str
    descricao: Optional[str] = None
    palestrante: str
    horario_inicio: time
    horario_fim: time

    class Config:
        from_attributes = True


# ---------- Minicurso ----------
class MinicursoOut(BaseModel):
    id: int
    evento_id: int
    titulo: str
    descricao: Optional[str] = None
    carga_horaria: int
    horario_inicio: time
    horario_fim: time
    video_url: Optional[str] = None

    class Config:
        from_attributes = True


# ---------- Inscrições ----------
class InscricaoEventoCreate(BaseModel):
    evento_id: int


class InscricaoPalestraCreate(BaseModel):
    palestra_id: int
    usuario_id: Optional[int] = None  # se None, inscreve o próprio usuário logado


class InscricaoMinicursoCreate(BaseModel):
    minicurso_id: int
    usuario_id: Optional[int] = None


# ---------- Certificado ----------
class CertificadoOut(BaseModel):
    id: int
    tipo: str
    referencia_id: int
    carga_horaria: int
    data_emissao: datetime
    codigo_verificacao: str

    class Config:
        from_attributes = True