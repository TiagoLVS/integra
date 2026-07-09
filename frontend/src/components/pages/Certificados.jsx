export default function Certificados({
  currentUser,
  navigate,
  minicursos,
  minhasMcInscricoes,
  openCertificado,
}) {
  if (!currentUser) {
    return (
      <div className="page active">
        <div className="certificados-page">
          <div className="empty-state">
            <div className="emoji">🔒</div>
            <p>Faça login para acessar seus certificados.</p>
            <button className="btn-primary" onClick={() => navigate('page-auth')}>
              Entrar ou criar conta
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Só entram aqui os minicursos já CONCLUÍDOS (presente = true)
  const concluidos = minhasMcInscricoes
    .filter((i) => i.presente)
    .map((i) => minicursos.find((m) => m.id === i.minicurso_id))
    .filter(Boolean);

  return (
    <div className="page active">
      <div className="certificados-page">
        <div className="inscricoes-header">
          <div className="section-label">Sua Conta</div>
          <h1 className="section-title">Certificados</h1>
          <p className="section-body" style={{ margin: '.6rem 0 0' }}>
            O certificado de participação é liberado para quem concluiu um
            minicurso (assistiu ao vídeo) e fica disponível para download em
            PDF.
          </p>
        </div>

        {concluidos.length === 0 && (
          <div className="empty-state" style={{ marginTop: '2rem' }}>
            <div className="emoji">🎓</div>
            <p>
              Você ainda não tem um certificado disponível — conclua um
              minicurso para gerar o seu.
            </p>
            <button className="btn-primary" onClick={() => navigate('page-minicursos')}>
              Ver minicursos
            </button>
          </div>
        )}

        {concluidos.map((mc) => (
          <div className="cert-card" key={mc.id}>
            <div className="cert-info">
              <div>
                <div className="titulo">{mc.titulo}</div>
                <span className="cert-status pronto">Pronto para emissão</span>
              </div>
            </div>
            <button className="btn-primary" onClick={() => openCertificado(mc.id)}>
              Ver certificado
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}