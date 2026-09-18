const axios = require('axios');
const cheerio = require('cheerio');

const TIMEOUT_MS = 8000;
const MAX_CONTENT_LENGTH = 2_000_000;
const EXCERPT_LENGTH = 4000;

async function scrapeWebsite(url) {
  const response = await axios.get(url, {
    timeout: TIMEOUT_MS,
    maxContentLength: MAX_CONTENT_LENGTH,
    maxRedirects: 5,
    responseType: 'text',
    validateStatus: null,
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ConexionNaturalLeadBot/1.0)',
    },
  });

  if (response.status < 200 || response.status >= 300) {
    throw new Error(`el sitio respondió con estado ${response.status}`);
  }

  const contentType = response.headers['content-type'] || '';
  if (!contentType.includes('text/html')) {
    throw new Error(`contenido no analizable (content-type: ${contentType || 'desconocido'})`);
  }

  const $ = cheerio.load(response.data);
  $('script, style, nav, footer').remove();

  const title = $('title').first().text().trim();
  const description =
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content') ||
    '';
  const siteName = $('meta[property="og:site_name"]').attr('content') || '';
  const bodyText = $('body').text().replace(/\s+/g, ' ').trim().slice(0, EXCERPT_LENGTH);

  const parts = [];
  if (title) parts.push(`Título: ${title}`);
  if (siteName) parts.push(`Sitio: ${siteName}`);
  if (description) parts.push(`Descripción: ${description}`);
  if (bodyText) parts.push(`Contenido: ${bodyText}`);

  const textSummary = parts.join('\n');
  if (!textSummary) {
    throw new Error('no se pudo extraer contenido útil del sitio');
  }

  return textSummary;
}

module.exports = { scrapeWebsite };
