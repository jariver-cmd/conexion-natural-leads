const axios = require('axios');

const RESPONSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    score: { type: 'INTEGER' },
    reasoning: { type: 'STRING' },
    flags: {
      type: 'OBJECT',
      properties: {
        tienePareja: { type: 'BOOLEAN' },
        senalPresupuestoAlto: { type: 'BOOLEAN' },
        perteneceEmpresaGrande: { type: 'BOOLEAN' },
      },
      required: ['tienePareja', 'senalPresupuestoAlto', 'perteneceEmpresaGrande'],
    },
  },
  required: ['score', 'reasoning', 'flags'],
};

function buildPrompt({ nombre, pareja, correo, whatsapp, redSocial, mensaje, scrapeSummary }) {
  return `Eres un asistente de calificación de leads para un negocio de talleres vivenciales para parejas ("Conexión Natural"). Evalúa el siguiente formulario de un prospecto y asígnale una puntuación de 1 a 100 según su potencial de compra.

Datos del formulario:
- Nombre principal: ${nombre}
- Nombre de la pareja: ${pareja || 'No proporcionado'}
- Correo: ${correo}
- WhatsApp: ${whatsapp || 'No proporcionado'}
- Red social (Facebook/Instagram): ${redSocial || 'No proporcionado'}
- Mensaje del prospecto: ${mensaje || 'No escribió mensaje'}

Información del sitio web del prospecto (si se pudo analizar):
${scrapeSummary || 'No se proporcionó sitio web o no se pudo analizar.'}

Criterios de calificación:
- Que haya un nombre de pareja indica que es una pareja establecida, el comprador objetivo ideal: sube la puntuación.
- Señales de presupuesto alto (precios premium, cargos ejecutivos/de fundador, referencias a lujo) en el mensaje o en el sitio: sube la puntuación.
- Señales de pertenecer a una empresa grande (páginas de equipo/nosotros que impliquen muchos empleados, múltiples sedes, diseño corporativo): sube la puntuación.
- Envíos profesionales, completos y deliberados puntúan más alto que envíos cortos o que parecen spam.

Responde ÚNICAMENTE con el JSON solicitado por el esquema: "score" (entero 1-100), "reasoning" (explicación breve citando qué señales encontraste o no) y "flags" con los tres booleanos indicados.`;
}

async function scoreLead(leadData) {
  const apiKey = process.env.GEMINI_API_KEY;
  const model = process.env.GEMINI_MODEL || 'gemini-3.6-flash';

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY no está configurada');
  }

  const prompt = buildPrompt(leadData);

  const response = await axios.post(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
    {
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
      },
    },
    { timeout: 45000 }
  );

  const text = response.data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini no devolvió contenido');
  }

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('la respuesta de Gemini no es JSON válido');
  }

  const rawScore = Number(parsed.score);
  if (!Number.isFinite(rawScore)) {
    throw new Error('Gemini no devolvió una puntuación numérica válida');
  }
  const score = Math.max(1, Math.min(100, Math.round(rawScore)));

  return {
    score,
    reasoning: typeof parsed.reasoning === 'string' ? parsed.reasoning : '',
    flags: parsed.flags && typeof parsed.flags === 'object' ? parsed.flags : {},
  };
}

module.exports = { scoreLead };
