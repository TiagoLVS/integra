import { useEffect, useState } from 'react';
import { emitirCertificadoMinicurso, baixarCertificadoPdf } from '../../services/api.js';

// ── Canto ornamental art-déco ──
function CertCorner() {
  return (
    <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g stroke="var(--medical-deep)" strokeWidth="1.6" strokeLinecap="round">
        <line x1="14" y1="32" x2="95" y2="32" />
        <line x1="32" y1="14" x2="32" y2="95" />
        <line x1="14" y1="26" x2="14" y2="38" />
        <line x1="26" y1="14" x2="38" y2="14" />
        <line x1="89" y1="26" x2="89" y2="38" />
        <line x1="26" y1="89" x2="38" y2="89" />
        <path d="M32 55 C32 42 42 32 55 32" />
        <path d="M32 70 C32 50 50 32 70 32" opacity="0.45" />
      </g>
      <circle cx="32" cy="32" r="3" fill="var(--medical-deep)" />
    </svg>
  );
}

function CertSunburst({ count = 20 }) {
  const rays = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const len = i % 2 === 0 ? 46 : 30;
    const x1 = 50 + Math.cos(angle) * 9;
    const y1 = 50 + Math.sin(angle) * 9;
    const x2 = 50 + Math.cos(angle) * len;
    const y2 = 50 + Math.sin(angle) * len;
    rays.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />);
  }
  return (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
      <g stroke="var(--medical)" strokeWidth="0.9">{rays}</g>
    </svg>
  );
}

export default function CertificadoDetail({ mc, currentUser, navigate }) {
  const [certificado, setCertificado] = useState(null);
  const [erro, setErro] = useState('');
  const [baixando, setBaixando] = useState(false);

  useEffect(() => {
    setCertificado(null);
    setErro('');
    emitirCertificadoMinicurso(mc.id)
      .then(setCertificado)
      .catch((err) => setErro(err.message || 'Não foi possível emitir o certificado.'));
  }, [mc.id]);

  const handleBaixarPdf = async () => {
    if (!certificado) return;
    setBaixando(true);
    try {
      await baixarCertificadoPdf(certificado.id);
    } catch (err) {
      setErro(err.message || 'Não foi possível baixar o certificado.');
    } finally {
      setBaixando(false);
    }
  };

  const dataFormatada = certificado
    ? new Date(certificado.data_emissao).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : '';

  return (
    <div className="page active">
      <div className="cert-page">
        <a className="cert-back" onClick={() => navigate('page-certificados')}>
          ← Voltar aos certificados
        </a>

        {erro && <div className="form-error" style={{ display: 'block', marginBottom: '1rem' }}>{erro}</div>}

        {!certificado && !erro && <p>Emitindo certificado...</p>}

        {certificado && (
          <>
            <div className="cert-sheet">
              <div className="cert-sunburst cert-sunburst-top"><CertSunburst /></div>
              <div className="cert-sunburst cert-sunburst-left"><CertSunburst count={16} /></div>
              <div className="cert-sunburst cert-sunburst-right"><CertSunburst count={16} /></div>

              <span className="cert-corner cert-corner-tl"><CertCorner /></span>
              <span className="cert-corner cert-corner-tr"><CertCorner /></span>
              <span className="cert-corner cert-corner-bl"><CertCorner /></span>
              <span className="cert-corner cert-corner-br"><CertCorner /></span>

              <div className="cert-body">
                <div className="cert-eyebrow">Íntegra: Humano por Inteiro · Congresso de Extensão</div>

                <div className="cert-divider">
                  <span></span><i></i><div className="cert-divider-dot"></div><i></i><span></span>
                </div>

                <h1 className="cert-heading">
                  Certificado
                  <br />
                  de Participação
                </h1>

                <div className="cert-divider">
                  <span></span><i></i><div className="cert-divider-dot"></div><i></i><span></span>
                </div>

                <div className="cert-presented-to">Concedido a</div>
                <div className="cert-name">{currentUser.nome}</div>

                <p className="cert-body-text">
                  Pela participação no minicurso{' '}
                  <span className="cert-course-title">{mc.titulo}</span>, com carga
                  horária de {certificado.carga_horaria}h, no âmbito do congresso de
                  extensão Íntegra: Humano por Inteiro.
                </p>

                <div className="cert-signature-row">
                  <div className="cert-signature">
                    <div className="cert-signature-line"></div>
                    <div className="cert-signature-name">Prof. Silvio Gobbi</div>
                    <div className="cert-signature-role">Coordenação Geral · Congresso Íntegra</div>
                  </div>
                  <div className="cert-signature">
                    <div className="cert-signature-line"></div>
                    <div className="cert-signature-name">NeuroVita</div>
                    <div className="cert-signature-role">Soluções em Saúde e Tecnologia</div>
                  </div>
                </div>

                <div className="cert-meta-row">
                  <div>
                    <div className="label">Emitido em</div>
                    <div className="value">{dataFormatada}</div>
                  </div>
                  <div>
                    <div className="label">Código de verificação</div>
                    <div className="value">{certificado.codigo_verificacao}</div>
                  </div>
                  <div>
                    <div className="label">Carga horária</div>
                    <div className="value">{certificado.carga_horaria}h</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="cert-actions">
              <button className="btn-primary" onClick={() => window.print()}>
                Imprimir / salvar esta tela
              </button>
              <button className="btn-primary" onClick={handleBaixarPdf} disabled={baixando}>
                {baixando ? 'Baixando...' : 'Baixar PDF oficial'}
              </button>
              <button className="btn-ghost" onClick={() => navigate('page-certificados')}>
                Voltar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}