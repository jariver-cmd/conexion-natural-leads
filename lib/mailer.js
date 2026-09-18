const axios = require('axios');

const WHATSAPP_NUMBER = '573028400263';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function buildWelcomeEmail({ nombre, mensaje }) {
  const primerNombre = nombre.split(' ')[0];
  const referenciaMensaje = mensaje
    ? `\n\nVimos lo que nos compartiste: "${mensaje}" — nos encantará conversar más sobre eso.`
    : '';

  const subject = '¡Gracias por tu interés en Conexión Natural!';

  const text = `Hola ${primerNombre},

¡Gracias por registrarte para "Conexión Natural"! Ya recibimos tu información y uno de nuestros asesores se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas y ayudarte a separar tu cupo.${referenciaMensaje}

Mientras tanto, si tienes alguna pregunta urgente, escríbenos por WhatsApp al +${WHATSAPP_NUMBER}: ${WHATSAPP_LINK}

¡Nos encanta que quieran regalarse este espacio en pareja!

Con cariño,
Diana Carolina Posada
Conexión Natural`;

  const html = `
    <p>Hola ${escapeHtml(primerNombre)},</p>
    <p>¡Gracias por registrarte para "Conexión Natural"! Ya recibimos tu información y uno de nuestros asesores se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas y ayudarte a separar tu cupo.</p>
    ${mensaje ? `<p>Vimos lo que nos compartiste: "${escapeHtml(mensaje)}" — nos encantará conversar más sobre eso.</p>` : ''}
    <p>Mientras tanto, si tienes alguna pregunta urgente, escríbenos por WhatsApp:</p>
    <p>
      <a href="${WHATSAPP_LINK}" style="background-color:#d9598c;color:#ffffff;padding:10px 20px;border-radius:24px;text-decoration:none;display:inline-block;">
        Escribir por WhatsApp (+${WHATSAPP_NUMBER})
      </a>
    </p>
    <p>¡Nos encanta que quieran regalarse este espacio en pareja!</p>
    <p>Con cariño,<br>Diana Carolina Posada<br>Conexión Natural</p>
  `;

  return { subject, text, html };
}

async function sendWelcomeEmail(data) {
  const url = process.env.EMAIL_RELAY_URL;
  const secret = process.env.EMAIL_RELAY_SECRET;

  if (!url || !secret) {
    throw new Error('Faltan credenciales del relay de correo (EMAIL_RELAY_URL, EMAIL_RELAY_SECRET)');
  }

  const { subject, text, html } = buildWelcomeEmail(data);

  const response = await axios.post(
    url,
    { secret, to: data.correo, subject, text, html, fromName: 'Conexión Natural - Carolina Posada' },
    { headers: { 'Content-Type': 'application/json' }, timeout: 20000, maxRedirects: 5 }
  );

  if (!response.data || response.data.ok !== true) {
    throw new Error(`el relay de correo rechazó el envío: ${response.data?.error || 'respuesta inesperada'}`);
  }
}

module.exports = { sendWelcomeEmail };
