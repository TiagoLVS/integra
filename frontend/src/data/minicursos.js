// ============================================================
// ÍNTEGRA — Helpers de validação
// (usados no formulário de cadastro/login)
// ============================================================

export const isValidEmail = (e) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);

export const isValidPhone = (p) => {
  const digits = p.replace(/\D/g, '');
  return digits.length >= 10 && digits.length <= 11;
};