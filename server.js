require('dotenv').config();

const path = require('path');
const express = require('express');

const { validateLeadInput } = require('./lib/validators');
const { scrapeWebsite } = require('./lib/scraper');
const { scoreLead } = require('./lib/gemini');
const { createLead, updateLead } = require('./lib/airtable');

const REQUIRED_ENV_VARS = ['GEMINI_API_KEY', 'AIRTABLE_API_KEY', 'AIRTABLE_BASE_ID', 'AIRTABLE_TABLE_NAME'];
const missingEnvVars = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
if (missingEnvVars.length > 0) {
  console.warn(`[config] Faltan variables de entorno: ${missingEnvVars.join(', ')}. Revisa tu archivo .env.`);
}

const app = express();
app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, 'public')));

function computePriority(score) {
  if (score == null) return 'Sin calificar';
  if (score >= 70) return 'Alta';
  if (score >= 40) return 'Media';
  return 'Baja';
}

async function processLeadAsync(recordId, data) {
  let scrapeNote = 'No se proporcionó sitio web.';

  if (data.sitioWeb) {
    try {
      scrapeNote = await scrapeWebsite(data.sitioWeb);
      console.log(`[leads] ${recordId}: scraping OK (${scrapeNote.length} caracteres)`);
    } catch (err) {
      scrapeNote = `No se pudo analizar el sitio web: ${err.message}`;
      console.warn(`[leads] ${recordId}: scraping falló — ${err.message}`);
    }
  }

  let scoring;
  try {
    scoring = await scoreLead({ ...data, scrapeSummary: scrapeNote });
    console.log(`[leads] ${recordId}: puntuación Gemini = ${scoring.score}`);
  } catch (err) {
    console.warn(`[leads] ${recordId}: calificación con Gemini falló — ${err.message}`);
    scoring = { score: null, reasoning: `No se pudo calificar automáticamente (${err.message}).` };
  }

  const priority = computePriority(scoring.score);

  try {
    await updateLead(recordId, { scrapeNote, scoring, priority });
    console.log(`[leads] ${recordId}: Airtable actualizado (prioridad=${priority})`);
  } catch (err) {
    console.error(`[leads] ${recordId}: no se pudo actualizar Airtable — ${err.message}`);
  }
}

app.post('/api/leads', async (req, res) => {
  const { valid, errors, data } = validateLeadInput(req.body);
  if (!valid) {
    return res.status(400).json({ error: 'Datos inválidos', details: errors });
  }

  let record;
  try {
    record = await createLead(data);
  } catch (err) {
    console.error(`[leads] createLead falló — ${err.message}`);
    return res.status(502).json({
      error: 'No pudimos guardar tu información. Intenta de nuevo o contáctanos por WhatsApp.',
    });
  }

  res.status(201).json({
    success: true,
    message: 'Gracias, hemos recibido tu información. Nos pondremos en contacto pronto.',
  });

  processLeadAsync(record.id, data).catch((err) => {
    console.error(`[leads] ${record.id}: error inesperado en el procesamiento asíncrono — ${err.message}`);
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
