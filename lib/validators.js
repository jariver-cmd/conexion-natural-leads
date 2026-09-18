const MAX_LENGTHS = { nombre: 200, pareja: 200, mensaje: 2000 };

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function normalizePhone(value) {
  if (!isNonEmptyString(value)) return undefined;
  const digitsOnly = value.trim().replace(/[^\d+]/g, '');
  return digitsOnly.length >= 7 ? digitsOnly : undefined;
}

function truncate(value, max) {
  if (!isNonEmptyString(value)) return undefined;
  const trimmed = value.trim();
  return trimmed.length > max ? trimmed.slice(0, max) : trimmed;
}

function normalizeUrl(value) {
  if (!isNonEmptyString(value)) return undefined;
  let candidate = value.trim();
  if (!/^https?:\/\//i.test(candidate)) {
    candidate = `https://${candidate}`;
  }
  try {
    return new URL(candidate).toString();
  } catch {
    return undefined;
  }
}

function validateLeadInput(body = {}) {
  const errors = [];
  const nombre = truncate(body.nombre, MAX_LENGTHS.nombre);
  const correo = isNonEmptyString(body.correo) ? body.correo.trim() : undefined;
  const whatsapp = normalizePhone(body.whatsapp);

  if (!nombre) errors.push('El nombre es requerido.');
  if (!correo) {
    errors.push('El correo es requerido.');
  } else if (!isValidEmail(correo)) {
    errors.push('El correo no tiene un formato válido.');
  }
  if (!whatsapp) errors.push('El número de WhatsApp es requerido.');

  if (errors.length > 0) {
    return { valid: false, errors, data: null };
  }

  const data = {
    nombre,
    correo,
    whatsapp,
    pareja: truncate(body.pareja, MAX_LENGTHS.pareja),
    mensaje: truncate(body.mensaje, MAX_LENGTHS.mensaje),
    redSocial: normalizeUrl(body.redSocial),
    sitioWeb: normalizeUrl(body.sitioWeb),
  };

  return { valid: true, errors: [], data };
}

module.exports = { validateLeadInput, normalizeUrl, isValidEmail };
