const API_URL = 'http://127.0.0.1:8000';

function getToken() {
  return localStorage.getItem('integra_token');
}

async function request(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const resp = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (!resp.ok) {
    let detail = 'Erro na requisição';
    try {
      const data = await resp.json();
      detail = data.detail || detail;
    } catch {}
    throw new Error(detail);
  }

  const contentType = resp.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return resp.json();
  }
  return resp;
}

// ---------- Autenticação ----------
export async function cadastrar({ nome, email, senha, telefone }) {
  return request('/auth/cadastro', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ nome, email, senha, telefone }),
  });
}

export async function login({ email, senha }) {
  const form = new URLSearchParams();
  form.append('username', email);
  form.append('password', senha);

  const resp = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });

  if (!resp.ok) {
    const data = await resp.json().catch(() => ({}));
    throw new Error(data.detail || 'E-mail ou senha incorretos.');
  }

  const data = await resp.json();
  localStorage.setItem('integra_token', data.access_token);
  return data;
}

export function logout() {
  localStorage.removeItem('integra_token');
}

export async function meuPerfil() {
  return request('/auth/me');
}

export async function buscarUsuarioPorEmail(email) {
  return request(`/usuarios/buscar?email=${encodeURIComponent(email)}`);
}

// ---------- Eventos / Palestras / Minicursos ----------
export async function listarEventos() {
  return request('/eventos');
}

export async function listarPalestras() {
  return request('/palestras');
}

export async function listarMinicursos() {
  return request('/minicursos');
}

// ---------- Inscrições ----------
export async function inscreverEvento(evento_id) {
  return request('/inscricoes/evento', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ evento_id }),
  });
}

export async function inscreverMinicurso(minicurso_id, usuario_id = null) {
  return request('/inscricoes/minicurso', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario_id ? { minicurso_id, usuario_id } : { minicurso_id }),
  });
}

export async function inscreverPalestra(palestra_id, usuario_id = null) {
  return request('/inscricoes/palestra', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(usuario_id ? { palestra_id, usuario_id } : { palestra_id }),
  });
}

export async function minhasInscricoes() {
  return request('/minhas-inscricoes');
}

export async function concluirMinicurso(minicurso_id) {
  return request(`/inscricoes/minicurso/concluir/${minicurso_id}`, {
    method: 'PATCH',
  });
}
export async function cancelarInscricaoMinicurso(minicurso_id) {
  return request(`/inscricoes/minicurso/${minicurso_id}`, {
    method: 'DELETE',
  });
}

// ---------- Certificados ----------
export async function emitirCertificadoMinicurso(minicurso_id) {
  return request(`/certificados/emitir/minicurso/${minicurso_id}`, { method: 'POST' });
}

export async function emitirCertificadoPalestra(palestra_id) {
  return request(`/certificados/emitir/palestra/${palestra_id}`, { method: 'POST' });
}

export async function emitirCertificadoEvento(evento_id) {
  return request(`/certificados/emitir/evento/${evento_id}`, { method: 'POST' });
}

export async function meusCertificados() {
  return request('/certificados/meus');
}

export async function baixarCertificadoPdf(certificado_id) {
  const token = getToken();
   const resp = await fetch(`${API_URL}/certificados/${certificado_id}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: 'no-store',
  });
  if (!resp.ok) throw new Error('Não foi possível baixar o certificado.');
  const blob = await resp.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `certificado_${certificado_id}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(url);
}
export async function esqueciSenha(email) {
  return request('/auth/esqueci-senha', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, senha: '' }),
  });
}
export async function contarInscritos(evento_id) {
  return request(`/eventos/${evento_id}/contagem`);
}