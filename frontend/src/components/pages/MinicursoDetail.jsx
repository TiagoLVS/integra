import { useEffect, useState } from 'react';

function extrairYoutubeId(url) {
  if (!url) return null;
  const match = url.match(/(?:v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function MinicursoDetail({
  mc,
  currentUser,
  navigate,
  isInscritoMC,
  isConcluidoMC,
  inscreverMinicurso,
  concluirMinicurso,
}) {
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const inscrito = !!currentUser && isInscritoMC(mc.id);
  const concluido = !!currentUser && isConcluidoMC(mc.id);
  const videoId = extrairYoutubeId(mc.video_url);

  useEffect(() => {
    setError('');
    setSuccess(inscrito ? `✓ Você já está inscrito(a) em "${mc.titulo}".` : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mc.id]);

  const handleInscricao = async () => {
    setError('');
    setSuccess('');
    try {
      await inscreverMinicurso(mc.id);
      setSuccess(`✓ Inscrição confirmada, ${currentUser.nome.split(' ')[0]}! Assista ao vídeo abaixo.`);
    } catch (err) {
      setError(err.message || 'Não foi possível confirmar a inscrição.');
    }
  };

  const handleConcluir = async () => {
    setError('');
    setSuccess('');
    try {
      await concluirMinicurso(mc.id);
      setSuccess('✓ Minicurso concluído! Seu certificado já está disponível.');
    } catch (err) {
      setError(err.message || 'Não foi possível concluir o minicurso.');
    }
  };

  let btnLabel = 'Confirmar inscrição';
  if (concluido) btnLabel = '✓ Concluído';
  else if (inscrito) btnLabel = '✓ Inscrito(a)';

  return (
    <div className="page active">
      <div className="mcd-page">
        <a className="mcd-back" onClick={() => navigate('page-minicursos')}>
          ← Voltar aos minicursos
        </a>

        <div className="mcd-grid">
          {/* Conteúdo do minicurso */}
          <div className="mcd-main">
            <div className="mcd-head">
              <div className="mcd-head-meta">
                <h1 className="mcd-title">{mc.titulo}</h1>
              </div>
            </div>

            <h2 className="mcd-section-label">Sobre o minicurso</h2>
            <p className="mcd-desc">{mc.descricao}</p>

            <div className="minicurso-info">
              <div className="info-chip">
                <span>🕐</span> {mc.horario_inicio?.slice(0, 5)} - {mc.horario_fim?.slice(0, 5)}
              </div>
              <div className="info-chip">
                <span>⏱️</span> {mc.carga_horaria}h
              </div>
            </div>

            {videoId && (
              <>
                <h2 className="mcd-section-label" style={{ marginTop: '1.5rem' }}>
                  Vídeo do minicurso
                </h2>
                <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0, overflow: 'hidden', borderRadius: '10px' }}>
                  <iframe
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={mc.titulo}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', border: 'none' }}
                  />
                </div>
              </>
            )}
          </div>

          {/* Inscrição / conclusão */}
          <aside className="mcd-form-card">
            <h3 className="mcd-form-title">
              {concluido ? 'Certificado disponível' : 'Garanta sua vaga'}
            </h3>

            {!currentUser && (
              <>
                <p className="mcd-form-sub">
                  Faça login com sua conta do evento para se inscrever.
                </p>
                <button className="btn-submit" onClick={() => navigate('page-auth')}>
                  Entrar ou criar conta
                </button>
              </>
            )}

            {currentUser && (
              <>
                <p className="mcd-form-sub">
                  {concluido
                    ? 'Você já concluiu este minicurso. Vá até Certificados para emitir o seu.'
                    : `Sua inscrição usa os dados da sua conta (${currentUser.nome.split(' ')[0]}).`}
                </p>

                {error && (
                  <div className="form-error" style={{ display: 'block', marginBottom: '.6rem' }}>
                    {error}
                  </div>
                )}
                <div className="form-success">{success}</div>

                {!inscrito && (
                  <button className="btn-submit" onClick={handleInscricao}>
                    {btnLabel}
                  </button>
                )}

                {inscrito && !concluido && (
                  <button className="btn-submit" onClick={handleConcluir}>
                    Concluir minicurso (já assisti)
                  </button>
                )}

                {concluido && (
                  <button className="btn-submit inscrito" onClick={() => navigate('page-certificados')}>
                    Ver certificados
                  </button>
                )}
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}