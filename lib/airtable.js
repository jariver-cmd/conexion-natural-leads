const axios = require('axios');

function getConfig() {
  const apiKey = process.env.AIRTABLE_API_KEY;
  const baseId = process.env.AIRTABLE_BASE_ID;
  const tableName = process.env.AIRTABLE_TABLE_NAME;

  if (!apiKey || !baseId || !tableName) {
    throw new Error(
      'Faltan credenciales de Airtable (AIRTABLE_API_KEY, AIRTABLE_BASE_ID, AIRTABLE_TABLE_NAME)'
    );
  }

  return { apiKey, baseId, tableName };
}

function tableUrl(recordId) {
  const { baseId, tableName } = getConfig();
  const base = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`;
  return recordId ? `${base}/${recordId}` : base;
}

function authHeaders() {
  const { apiKey } = getConfig();
  return { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' };
}

async function createLead(data) {
  const fields = {
    'Nombre Principal': data.nombre,
    'Nombre Pareja': data.pareja,
    Correo: data.correo,
    WhatsApp: data.whatsapp,
    'Facebook/Instagram': data.redSocial,
    'Sitio Web': data.sitioWeb,
    Mensaje: data.mensaje,
    Estado: 'Nuevo',
  };

  try {
    const response = await axios.post(
      tableUrl(),
      { fields, typecast: true },
      { headers: authHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    throw new Error(
      `No se pudo crear el registro en Airtable: ${err.response?.data?.error?.message || err.message}`
    );
  }
}

async function updateLead(recordId, { scrapeNote, scoring, priority }) {
  const fields = {
    'Resumen Scraping': scrapeNote,
    'Puntuación IA': scoring?.score ?? undefined,
    Prioridad: priority,
    'Análisis IA': scoring?.reasoning,
    Estado: scoring?.score != null ? 'Calificado' : 'Error de calificación',
  };

  try {
    const response = await axios.patch(
      tableUrl(recordId),
      { fields, typecast: true },
      { headers: authHeaders(), timeout: 10000 }
    );
    return response.data;
  } catch (err) {
    throw new Error(
      `No se pudo actualizar el registro en Airtable: ${err.response?.data?.error?.message || err.message}`
    );
  }
}

module.exports = { createLead, updateLead };
