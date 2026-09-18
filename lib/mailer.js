const nodemailer = require('nodemailer');

const WHATSAPP_NUMBER = '573028400263';
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMBER}`;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error('Faltan credenciales de correo (GMAIL_USER, GMAIL_APP_PASSWORD)');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
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
    <p>Hola ${primerNombre},</p>
    <p>¡Gracias por registrarte para "Conexión Natural"! Ya recibimos tu información y uno de nuestros asesores se pondrá en contacto contigo en las próximas 24 horas para resolver tus dudas y ayudarte a separar tu cupo.</p>
    ${mensaje ? `<p>Vimos lo que nos compartiste: "${mensaje}" — nos encantará conversar más sobre eso.</p>` : ''}
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
  const transporter = getTransporter();
  const { subject, text, html } = buildWelcomeEmail(data);

  await transporter.sendMail({
    from: `"Conexión Natural - Carolina Posada" <${process.env.GMAIL_USER}>`,
    to: data.correo,
    subject,
    text,
    html,
  });
}

module.exports = { sendWelcomeEmail };
