import io
import uuid
import math
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from reportlab.pdfgen import canvas
from reportlab.lib import colors
from app.database import get_db
from app import models, schemas, auth

router = APIRouter(prefix="/certificados", tags=["Certificados"])


def desenhar_raios(c, cx, cy, n_raios, raio_min, raio_max, cor, largura_linha=0.8, angulo_abertura=360, angulo_central=90):
    c.setStrokeColor(cor)
    inicio_angulo = angulo_central - angulo_abertura / 2
    for i in range(n_raios + 1):
        angulo = math.radians(inicio_angulo + (angulo_abertura * i / n_raios))
        comprido = (i % 2 == 0)
        r_max = raio_max if comprido else raio_max * 0.62
        c.setLineWidth(largura_linha * (1.3 if comprido else 0.8))
        x1 = cx + raio_min * math.cos(angulo)
        y1 = cy + raio_min * math.sin(angulo)
        x2 = cx + r_max * math.cos(angulo)
        y2 = cy + r_max * math.sin(angulo)
        c.line(x1, y1, x2, y2)
    c.setFillColor(colors.white)
    c.setStrokeColor(cor)
    c.setLineWidth(1)
    c.circle(cx, cy, raio_min * 0.9, fill=1, stroke=1)


def desenhar_linhas_laterais(c, x, y_centro, cor, n_linhas=5, espacamento=7, comprimento=30, lado="direita"):
    c.setStrokeColor(cor)
    c.setLineWidth(0.7)
    sinal = 1 if lado == "direita" else -1
    meio = n_linhas // 2
    for i in range(n_linhas):
        y = y_centro + (i - meio) * espacamento
        comp = comprimento * (1 - 0.15 * abs(i - meio))
        c.line(x, y, x + sinal * comp, y)


def desenhar_canto(c, x, y, tamanho, cor, flip_x=1, flip_y=1):
    c.setStrokeColor(cor)
    for i, offset in enumerate([0, 8, 16]):
        c.setLineWidth(1.1 if i == 0 else 0.6)
        s = tamanho - offset
        c.line(x, y + offset * flip_y, x + flip_x * s, y + offset * flip_y)
        c.line(x + offset * flip_x, y, x + offset * flip_x, y + flip_y * s)
        p = c.beginPath()
        p.moveTo(x + flip_x * s, y + offset * flip_y)
        p.curveTo(
            x + flip_x * s * 0.6, y + offset * flip_y,
            x + offset * flip_x, y + flip_y * s * 0.6,
            x + offset * flip_x, y + flip_y * s,
        )
        c.drawPath(p, stroke=1, fill=0)


def desenhar_estrela(c, cx, cy, raio, cor):
    pontos = []
    for i in range(10):
        angulo = math.pi / 2 + i * math.pi / 5
        r = raio if i % 2 == 0 else raio * 0.4
        x = cx + r * math.cos(angulo)
        y = cy + r * math.sin(angulo)
        pontos.append((x, y))
    path = c.beginPath()
    path.moveTo(*pontos[0])
    for p in pontos[1:]:
        path.lineTo(*p)
    path.close()
    c.setFillColor(cor)
    c.drawPath(path, fill=1, stroke=0)


def desenhar_moldura_dupla(c, largura, altura, azul, dourado, margem_ext=14):
    c.setStrokeColor(azul)
    c.setLineWidth(1.6)
    c.rect(margem_ext, margem_ext, largura - 2 * margem_ext, altura - 2 * margem_ext, stroke=1, fill=0)
    c.setStrokeColor(dourado)
    c.setLineWidth(0.7)
    c.rect(margem_ext + 6, margem_ext + 6, largura - 2 * (margem_ext + 6), altura - 2 * (margem_ext + 6), stroke=1, fill=0)


def desenhar_divisor(c, cx, cy, largura, cor):
    c.setStrokeColor(cor)
    c.setLineWidth(0.8)
    c.line(cx - largura / 2, cy, cx - 14, cy)
    c.line(cx + 14, cy, cx + largura / 2, cy)
    for dx in [-14, 14]:
        p = c.beginPath()
        p.moveTo(cx + dx - 5, cy)
        p.lineTo(cx + dx, cy + 5)
        p.lineTo(cx + dx + 5, cy)
        p.lineTo(cx + dx, cy - 5)
        p.close()
        c.drawPath(p, stroke=1, fill=0)
    c.setFillColor(cor)
    c.circle(cx, cy, 4, fill=1, stroke=0)
    c.setStrokeColor(cor)
    c.circle(cx, cy, 7, fill=0, stroke=1)


def gerar_pdf_certificado(nome_usuario: str, titulo_atividade: str, carga_horaria: int, codigo: str) -> io.BytesIO:
    buffer = io.BytesIO()
    largura, altura = 620, 760
    c = canvas.Canvas(buffer, pagesize=(largura, altura))

    azul = colors.HexColor("#1B3A6B")
    dourado = colors.HexColor("#B8912E")
    cinza_texto = colors.HexColor("#2B2B2B")

    c.setFillColor(colors.white)
    c.rect(0, 0, largura, altura, fill=1, stroke=0)

    margem = 45

    desenhar_moldura_dupla(c, largura, altura, azul, dourado)

    desenhar_raios(c, margem + 5, altura - margem - 5, 18, 10, 52, azul, largura_linha=1.0, angulo_abertura=100, angulo_central=225)
    desenhar_raios(c, largura - margem - 5, altura - margem - 5, 18, 10, 52, azul, largura_linha=1.0, angulo_abertura=100, angulo_central=315)
    desenhar_raios(c, margem + 5, margem + 5, 18, 10, 52, azul, largura_linha=1.0, angulo_abertura=100, angulo_central=135)
    desenhar_raios(c, largura - margem - 5, margem + 5, 18, 10, 52, azul, largura_linha=1.0, angulo_abertura=100, angulo_central=45)

    desenhar_raios(c, largura / 2, altura - 12, 16, 5, 30, azul, largura_linha=0.9, angulo_abertura=150, angulo_central=270)
    desenhar_raios(c, largura / 2, 12, 16, 5, 30, azul, largura_linha=0.9, angulo_abertura=150, angulo_central=90)

    desenhar_raios(c, margem - 5, altura / 2, 12, 4, 20, dourado, largura_linha=0.7, angulo_abertura=140, angulo_central=0)
    desenhar_raios(c, largura - margem + 5, altura / 2, 12, 4, 20, dourado, largura_linha=0.7, angulo_abertura=140, angulo_central=180)
    desenhar_raios(c, margem + 70, altura - margem - 70, 10, 3, 16, dourado, largura_linha=0.6, angulo_abertura=360)
    desenhar_raios(c, largura - margem - 70, altura - margem - 70, 10, 3, 16, dourado, largura_linha=0.6, angulo_abertura=360)
    desenhar_raios(c, margem + 70, margem + 70, 10, 3, 16, dourado, largura_linha=0.6, angulo_abertura=360)
    desenhar_raios(c, largura - margem - 70, margem + 70, 10, 3, 16, dourado, largura_linha=0.6, angulo_abertura=360)

    for (ex, ey, er) in [
        (largura / 2 - 220, altura - 160, 5), (largura / 2 + 220, altura - 160, 5),
        (largura / 2 - 250, altura / 2 + 40, 4), (largura / 2 + 250, altura / 2 + 40, 4),
        (largura / 2 - 220, 190, 5), (largura / 2 + 220, 190, 5),
        (margem + 95, altura - margem - 20, 3.5), (largura - margem - 95, altura - margem - 20, 3.5),
        (margem + 95, margem + 20, 3.5), (largura - margem - 95, margem + 20, 3.5),
    ]:
        desenhar_estrela(c, ex, ey, er, dourado)

    desenhar_linhas_laterais(c, margem - 8, altura / 2 + 90, dourado, n_linhas=5, lado="direita")
    desenhar_linhas_laterais(c, largura - margem + 8, altura / 2 + 90, dourado, n_linhas=5, lado="esquerda")
    desenhar_linhas_laterais(c, margem - 8, altura / 2 - 90, dourado, n_linhas=5, lado="direita")
    desenhar_linhas_laterais(c, largura - margem + 8, altura / 2 - 90, dourado, n_linhas=5, lado="esquerda")

    desenhar_canto(c, margem + 8, altura - margem - 8, 44, azul, flip_x=1, flip_y=-1)
    desenhar_canto(c, largura - margem - 8, altura - margem - 8, 44, azul, flip_x=-1, flip_y=-1)
    desenhar_canto(c, margem + 8, margem + 8, 44, azul, flip_x=1, flip_y=1)
    desenhar_canto(c, largura - margem - 8, margem + 8, 44, azul, flip_x=-1, flip_y=1)

    y = altura - 100

    c.setFillColor(cinza_texto)
    c.setFont("Helvetica-Bold", 15)
    c.drawString(margem + 45, y, "20")
    c.drawRightString(largura - margem - 45, y, "26")

    c.setFont("Helvetica-Bold", 11)
    c.drawCentredString(largura / 2, y + 5, "CERTIFICADO DE")
    c.drawCentredString(largura / 2, y - 10, "PARTICIPAÇÃO")

    y -= 60
    desenhar_divisor(c, largura / 2, y, 160, dourado)

    y -= 55
    c.setFillColor(azul)
    c.setFont("Helvetica-Bold", 26)
    c.drawCentredString(largura / 2, y, "ÍNTEGRA: HUMANO")
    y -= 32
    c.drawCentredString(largura / 2, y, "POR INTEIRO")

    y -= 35
    desenhar_divisor(c, largura / 2, y, 160, dourado)

    y -= 45
    c.setFillColor(cinza_texto)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(largura / 2, y, "CONCEDIDO A")

    y -= 38
    c.setFillColor(azul)
    c.setFont("Helvetica-Bold", 24)
    c.drawCentredString(largura / 2, y, nome_usuario)

    y -= 40
    c.setFillColor(cinza_texto)
    c.setFont("Helvetica", 9)
    linha1 = f'PELA PARTICIPAÇÃO EM "{titulo_atividade.upper()}",'
    linha2 = f"COM CARGA HORÁRIA DE {carga_horaria} HORAS."
    c.drawCentredString(largura / 2, y, linha1)
    c.drawCentredString(largura / 2, y - 14, linha2)

    y_assinatura = margem + 90
    c.setStrokeColor(colors.HexColor("#999999"))
    c.setLineWidth(0.7)
    c.line(largura / 2 - 190, y_assinatura, largura / 2 - 50, y_assinatura)
    c.line(largura / 2 + 50, y_assinatura, largura / 2 + 190, y_assinatura)

    c.setFillColor(dourado)
    c.circle(largura / 2, y_assinatura, 22, fill=1, stroke=0)
    c.setFillColor(azul)
    c.circle(largura / 2, y_assinatura, 17, fill=1, stroke=0)
    desenhar_estrela(c, largura / 2, y_assinatura, 10, dourado)
    c.setStrokeColor(dourado)
    c.setLineWidth(0.8)
    c.circle(largura / 2, y_assinatura, 26, fill=0, stroke=1)

    c.setFillColor(azul)
    c.setFont("Helvetica-Bold", 10)
    c.drawCentredString(largura / 2 - 120, y_assinatura - 14, "COORDENAÇÃO GERAL")
    c.drawCentredString(largura / 2 + 120, y_assinatura - 14, "ORGANIZAÇÃO")
    c.setFillColor(cinza_texto)
    c.setFont("Helvetica", 8)
    c.drawCentredString(largura / 2 - 120, y_assinatura - 26, "Congresso Íntegra")
    c.drawCentredString(largura / 2 + 120, y_assinatura - 26, "Congresso Íntegra")

    c.setFont("Helvetica", 7)
    c.setFillColor(colors.HexColor("#777777"))
    c.drawCentredString(largura / 2, margem + 25, f"Código de verificação: {codigo}  |  Emitido em {datetime.now().strftime('%d/%m/%Y')}")

    c.showPage()
    c.save()
    buffer.seek(0)
    return buffer


@router.post("/emitir/minicurso/{minicurso_id}")
def emitir_certificado_minicurso(
    minicurso_id: int,
    usuario_atual: models.Usuario = Depends(auth.usuario_logado),
    db: Session = Depends(get_db),
):
    inscricao = db.query(models.InscricaoMinicurso).filter(
        models.InscricaoMinicurso.minicurso_id == minicurso_id,
        models.InscricaoMinicurso.usuario_id == usuario_atual.id,
    ).first()
    if not inscricao:
        raise HTTPException(status_code=404, detail="Você não está inscrito neste minicurso")
    if not inscricao.presente:
        raise HTTPException(status_code=400, detail="Presença ainda não confirmada para este minicurso")

    ja_existe = db.query(models.Certificado).filter(
        models.Certificado.usuario_id == usuario_atual.id,
        models.Certificado.tipo == "minicurso",
        models.Certificado.referencia_id == minicurso_id,
    ).first()
    if ja_existe:
        return ja_existe

    minicurso = db.query(models.Minicurso).filter(models.Minicurso.id == minicurso_id).first()

    novo = models.Certificado(
        usuario_id=usuario_atual.id,
        tipo="minicurso",
        referencia_id=minicurso_id,
        carga_horaria=minicurso.carga_horaria,
        codigo_verificacao=str(uuid.uuid4())[:8].upper(),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.post("/emitir/palestra/{palestra_id}")
def emitir_certificado_palestra(
    palestra_id: int,
    usuario_atual: models.Usuario = Depends(auth.usuario_logado),
    db: Session = Depends(get_db),
):
    inscricao = db.query(models.InscricaoPalestra).filter(
        models.InscricaoPalestra.palestra_id == palestra_id,
        models.InscricaoPalestra.usuario_id == usuario_atual.id,
    ).first()
    if not inscricao:
        raise HTTPException(status_code=404, detail="Você não está inscrito nesta palestra")

    ja_existe = db.query(models.Certificado).filter(
        models.Certificado.usuario_id == usuario_atual.id,
        models.Certificado.tipo == "palestra",
        models.Certificado.referencia_id == palestra_id,
    ).first()
    if ja_existe:
        return ja_existe

    palestra = db.query(models.Palestra).filter(models.Palestra.id == palestra_id).first()
    duracao_minutos = (
        palestra.horario_fim.hour * 60 + palestra.horario_fim.minute
        - (palestra.horario_inicio.hour * 60 + palestra.horario_inicio.minute)
    )
    carga_horaria = max(1, round(duracao_minutos / 60))

    novo = models.Certificado(
        usuario_id=usuario_atual.id,
        tipo="palestra",
        referencia_id=palestra_id,
        carga_horaria=carga_horaria,
        codigo_verificacao=str(uuid.uuid4())[:8].upper(),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.post("/emitir/evento/{evento_id}")
def emitir_certificado_evento(
    evento_id: int,
    usuario_atual: models.Usuario = Depends(auth.usuario_logado),
    db: Session = Depends(get_db),
):
    inscricao = db.query(models.InscricaoEvento).filter(
        models.InscricaoEvento.evento_id == evento_id,
        models.InscricaoEvento.usuario_id == usuario_atual.id,
    ).first()
    if not inscricao:
        raise HTTPException(status_code=404, detail="Você não está inscrito neste evento")

    ja_existe = db.query(models.Certificado).filter(
        models.Certificado.usuario_id == usuario_atual.id,
        models.Certificado.tipo == "evento",
        models.Certificado.referencia_id == evento_id,
    ).first()
    if ja_existe:
        return ja_existe

    novo = models.Certificado(
        usuario_id=usuario_atual.id,
        tipo="evento",
        referencia_id=evento_id,
        carga_horaria=8,
        codigo_verificacao=str(uuid.uuid4())[:8].upper(),
    )
    db.add(novo)
    db.commit()
    db.refresh(novo)
    return novo


@router.get("/meus", response_model=list[schemas.CertificadoOut])
def meus_certificados(
    usuario_atual: models.Usuario = Depends(auth.usuario_logado),
    db: Session = Depends(get_db),
):
    return db.query(models.Certificado).filter(models.Certificado.usuario_id == usuario_atual.id).all()


@router.get("/{certificado_id}/pdf")
def baixar_certificado_pdf(
    certificado_id: int,
    usuario_atual: models.Usuario = Depends(auth.usuario_logado),
    db: Session = Depends(get_db),
):
    certificado = db.query(models.Certificado).filter(
        models.Certificado.id == certificado_id,
        models.Certificado.usuario_id == usuario_atual.id,
    ).first()
    if not certificado:
        raise HTTPException(status_code=404, detail="Certificado não encontrado")

    if certificado.tipo == "minicurso":
        item = db.query(models.Minicurso).filter(models.Minicurso.id == certificado.referencia_id).first()
        titulo = item.titulo
    elif certificado.tipo == "palestra":
        item = db.query(models.Palestra).filter(models.Palestra.id == certificado.referencia_id).first()
        titulo = item.titulo
    else:
        item = db.query(models.Evento).filter(models.Evento.id == certificado.referencia_id).first()
        titulo = item.nome

    pdf_buffer = gerar_pdf_certificado(
        usuario_atual.nome, titulo, certificado.carga_horaria, certificado.codigo_verificacao
    )

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=certificado_{certificado_id}.pdf"},
    )