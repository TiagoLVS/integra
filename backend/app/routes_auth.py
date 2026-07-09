import secrets
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/auth", tags=["Autenticação"])


@router.post("/cadastro", response_model=schemas.UsuarioOut)
def cadastrar(usuario: schemas.UsuarioCreate, db: Session = Depends(get_db)):
    existente = db.query(models.Usuario).filter(models.Usuario.email == usuario.email).first()
    if existente:
        raise HTTPException(status_code=400, detail="Email já cadastrado")

    novo_usuario = models.Usuario(
        nome=usuario.nome,
        email=usuario.email,
        senha_hash=auth.hash_senha(usuario.senha),
        telefone=usuario.telefone,
    )
    db.add(novo_usuario)
    db.commit()
    db.refresh(novo_usuario)
    return novo_usuario


@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == form_data.username).first()
    if not usuario or not auth.verificar_senha(form_data.password, usuario.senha_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email ou senha incorretos",
        )
    token = auth.criar_token({"sub": str(usuario.id)})
    return {"access_token": token, "token_type": "bearer"}


@router.get("/me", response_model=schemas.UsuarioOut)
def meu_perfil(usuario_atual: models.Usuario = Depends(auth.usuario_logado)):
    return usuario_atual


@router.post("/esqueci-senha")
def esqueci_senha(dados: schemas.UsuarioLogin, db: Session = Depends(get_db)):
    usuario = db.query(models.Usuario).filter(models.Usuario.email == dados.email).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Não existe conta com este email")

    nova_senha = secrets.token_urlsafe(6)
    usuario.senha_hash = auth.hash_senha(nova_senha)
    db.commit()

    return {"mensagem": "Senha redefinida com sucesso", "nova_senha": nova_senha}