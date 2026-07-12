export default function Inscricoes({
  currentUser,
  navigate,
  openMinicurso,
  minicursos,
  minhasMcInscricoes,
  cancelarInscricaoMinicurso,
  meuAssento,
}) {
  if (!currentUser) {
    return (
      <div className="page active">
        <div className="inscricoes-page">
          <div className="inscricoes-body">
            <div className="empty-state">
              <p>Faça login para ver suas inscrições no evento e nos minicursos.</p>
              <button className="btn-primary" onClick={() => navigate('page-auth')}>
                Entrar ou criar conta
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const meusMinicursos = minhasMcInscricoes
    .map((i) => ({
      ...i,
      mc: minicursos.find((m) => m.id === i.minicurso_id),
    }))
    .filter((i) => i.mc);

  const concluidos = meusMinicursos.filter((i) => i.presente).length;
  const iniciais = currentUser.nome
    .split(' ')
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase();

  return (
    <div className="page active">
      <div className="inscricoes-page">
        <div className="inscricoes-body">
          <div className="section-label">Sua Conta</div>
          <h1 className="section-title" style={{ marginBottom: '1.75rem' }}>Minhas Inscrições</h1>

          <div className="inscricoes-profile-grid">
            <div className="inscricoes-profile-card">
              <div className="inscricoes-avatar">{iniciais}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="inscricoes-profile-name">{currentUser.nome}</p>
                <p className="inscricoes-profile-email">{currentUser.email}</p>
                <div className="inscricoes-profile-badges">
                  <span className="inscricoes-badge">{meusMinicursos.length} minicurso(s)</span>
                  <span className="inscricoes-badge">{concluidos} concluído(s)</span>
                </div>
              </div>
            </div>

            <div className="inscricoes-seat-card">
              <p className="inscricoes-seat-label">Seu assento</p>
              <p className="inscricoes-seat-value">{meuAssento || '—'}</p>
              <p className="inscricoes-seat-sub">
                {meuAssento ? 'Salão principal' : 'Ainda não escolhido'}
              </p>
            </div>
          </div>

          <div className="inscricoes-divider">
            <span>Meus Minicursos</span>
            <div className="line" />
          </div>

          {meusMinicursos.length === 0 && (
            <div className="empty-state">
              <p>
                Você ainda não se inscreveu em nenhum minicurso. Escolha um e
                garanta sua vaga.
              </p>
              <button className="btn-primary" onClick={() => navigate('page-minicursos')}>
                Ver minicursos disponíveis
              </button>
            </div>
          )}

          {meusMinicursos.map(({ mc, presente }) => (
            <div className={`inscricoes-mc-item${presente ? ' concluido' : ''}`} key={mc.id}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="titulo">{mc.titulo}</p>
                <p className="meta">
                  {mc.horario_inicio?.slice(0, 5)} - {mc.horario_fim?.slice(0, 5)} · {mc.carga_horaria}h
                  {presente && <> · <span className="status-concluido">concluído</span></>}
                </p>
              </div>
              {presente ? (
                <button className="btn-mc-primary" onClick={() => openMinicurso(mc.id)}>
                  Certificado
                </button>
              ) : (
                <>
                  <button className="btn-mc-ghost" onClick={() => openMinicurso(mc.id)}>
                    Ver detalhes
                  </button>
                  <button className="btn-mc-danger" onClick={() => cancelarInscricaoMinicurso(mc.id)}>
                    Cancelar
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}