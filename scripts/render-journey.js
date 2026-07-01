import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define directories
const projectRoot = path.join(__dirname, '..');
const outputsDir = path.join(projectRoot, 'outputs', 'rendered_emails');

// Ensure output directory exists
if (!fs.existsSync(outputsDir)) {
  fs.mkdirSync(outputsDir, { recursive: true });
}

// Metadata for the 5 emails in the journey (with fallback defaults)
const emailsMetadata = {
  1: {
    filename: 'email1.html',
    title: 'E-mail 1: Seu cupom chegou!',
    subject: 'Seu cupom chegou!',
    preheader: 'Garanta suas recompensas! 💸',
    delay: 'Imediato'
  },
  2: {
    filename: 'email2.html',
    title: 'E-mail 2',
    subject: 'Aguardando template',
    preheader: 'Aguardando template',
    delay: '+7 Dias'
  },
  3: {
    filename: 'email3.html',
    title: 'E-mail 3',
    subject: 'Aguardando template',
    preheader: 'Aguardando template',
    delay: '+7 Dias'
  },
  4: {
    filename: 'email4.html',
    title: 'E-mail 4',
    subject: 'Aguardando template',
    preheader: 'Aguardando template',
    delay: '+7 Dias'
  },
  5: {
    filename: 'email5.html',
    title: 'E-mail 5',
    subject: 'Aguardando template',
    preheader: 'Aguardando template',
    delay: '+7 Dias'
  }
};

// Load dynamic metadata from emails-config.json if it exists
const configPath = path.join(__dirname, 'emails-config.json');
if (fs.existsSync(configPath)) {
  try {
    const loadedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    for (let i = 1; i <= 5; i++) {
      if (loadedConfig[i]) {
        emailsMetadata[i].subject = loadedConfig[i].subject || emailsMetadata[i].subject;
        emailsMetadata[i].preheader = loadedConfig[i].preheader || emailsMetadata[i].preheader;
        emailsMetadata[i].title = loadedConfig[i].title || emailsMetadata[i].title;
      }
    }
    console.log('Dynamic email metadata loaded successfully from config.');
  } catch (e) {
    console.error('Warning: Failed to load emails-config.json. Using defaults.', e);
  }
}


async function render() {
  console.log('Starting render engine...');
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    deviceScaleFactor: 2, // High resolution screenshots
  });
  const page = await context.newPage();

  const renderedEmailsData = {};

  // Loop through all 5 emails, render if the HTML file exists
  for (let i = 1; i <= 5; i++) {
    const meta = emailsMetadata[i];
    const emailFilePath = path.join(__dirname, meta.filename);

    if (fs.existsSync(emailFilePath)) {
      console.log(`Rendering Email ${i} (${meta.filename})...`);
      let emailHtml = fs.readFileSync(emailFilePath, 'utf8');

      // Strip SFMC tracking/custom tags safely
      emailHtml = emailHtml
        .replace(/<custom[^>]*\/?>/gi, '')
        .replace(/<\/custom>/gi, '');

      // Load HTML content
      await page.setContent(emailHtml);
      await page.setViewportSize({ width: 600, height: 1000 });

      // Wait for all remote assets to finish loading
      try {
        await page.waitForLoadState('networkidle', { timeout: 10000 });
      } catch (e) {
        console.log(`Warning: Network idle timeout reached for Email ${i}.`);
      }

      // Take screenshot of the email
      const emailPngPath = path.join(outputsDir, `email_${i}.png`);
      const emailBuffer = await page.screenshot({
        path: emailPngPath,
        fullPage: true,
      });
      console.log(`Email ${i} rendered successfully at: ${emailPngPath}`);

      // Convert to base64 for embedding in the flowchart page
      const emailBase64 = emailBuffer.toString('base64');
      renderedEmailsData[i] = `data:image/png;base64,${emailBase64}`;
    } else {
      console.log(`Email ${i} template (${meta.filename}) not found. Will render as placeholder.`);
    }
  }

  // 2. Generate the "Régua de Comunicação" (Journey Flowchart) HTML page
  console.log('Generating Régua de Comunicação diagram...');
  
  let stepsHtml = '';
  for (let i = 1; i <= 5; i++) {
    const meta = emailsMetadata[i];
    const isRendered = !!renderedEmailsData[i];

    stepsHtml += `
      <!-- Step ${i} -->
      <div class="step-wrapper">
        <div class="step-card ${isRendered ? 'active' : 'placeholder'}">
          <div class="step-header">
            <span class="step-number">Disparo ${i}</span>
            <span class="step-delay">${meta.delay}</span>
          </div>
          <div class="step-title">${meta.title}</div>
          
          ${isRendered ? `
            <div class="step-meta">
              <div><span class="meta-label">Assunto:</span> ${meta.subject}</div>
              <div style="margin-top: 4px;"><span class="meta-label">Preheader:</span> ${meta.preheader}</div>
            </div>
            
            <div class="browser-mockup">
              <div class="browser-bar">
                <div class="browser-dot dot-red"></div>
                <div class="browser-dot dot-yellow"></div>
                <div class="browser-dot dot-green"></div>
              </div>
              <div class="browser-viewport">
                <img class="email-thumbnail" src="${renderedEmailsData[i]}" alt="Preview Email ${i}" />
              </div>
            </div>
          ` : `
            <div class="placeholder-content">
              <div class="placeholder-icon">${i}</div>
              <div>Aguardando arquivo <code>scripts/${meta.filename}</code></div>
            </div>
          `}
        </div>
      </div>
    `;

    // Add connector if not the last step
    if (i < 5) {
      const nextIsRendered = !!renderedEmailsData[i + 1];
      stepsHtml += `
        <!-- Connector ${i} -> ${i+1} -->
        <div class="connector ${nextIsRendered ? '' : 'placeholder-conn'}">
          <div class="connector-line"></div>
          <span class="connector-label">+7 Dias</span>
        </div>
      `;
    }
  }

  const journeyHtml = `
  <!DOCTYPE html>
  <html lang="pt-BR">
  <head>
    <meta charset="UTF-8">
    <title>Régua de Comunicação - Ativação Vibes</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <style>
      :root {
        --bg-color: #0b0f19;
        --card-bg: rgba(22, 28, 45, 0.7);
        --card-border: rgba(255, 255, 255, 0.08);
        --text-primary: #f8fafc;
        --text-secondary: #94a3b8;
        --brand-teal: #00C6CC;
        --brand-lime: #D3FF00;
        --accent-glow: rgba(0, 198, 204, 0.15);
      }

      * {
        box-sizing: border-box;
        margin: 0;
        padding: 0;
      }

      body {
        background-color: var(--bg-color);
        color: var(--text-primary);
        font-family: 'Plus Jakarta Sans', sans-serif;
        padding: 60px 40px;
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        background-image: 
          radial-gradient(circle at 10% 20%, rgba(0, 198, 204, 0.05) 0%, transparent 40%),
          radial-gradient(circle at 90% 80%, rgba(211, 255, 0, 0.03) 0%, transparent 40%);
      }

      header {
        text-align: center;
        margin-bottom: 50px;
        width: 100%;
        max-width: 1800px;
      }

      h1 {
        font-family: 'Outfit', sans-serif;
        font-size: 38px;
        font-weight: 800;
        letter-spacing: -0.5px;
        background: linear-gradient(135deg, #ffffff 30%, var(--brand-teal) 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        margin-bottom: 10px;
      }

      .subtitle {
        color: var(--text-secondary);
        font-size: 16px;
        font-weight: 500;
        max-width: 800px;
        margin: 0 auto;
        line-height: 1.6;
      }

      /* Rule Settings (Entry/Exit) */
      .rule-configs {
        display: flex;
        justify-content: center;
        gap: 30px;
        margin-bottom: 60px;
        width: 100%;
        max-width: 1800px;
      }

      .config-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 16px;
        padding: 24px 30px;
        flex: 1;
        max-width: 550px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(12px);
      }

      .config-card.entry {
        border-left: 4px solid var(--brand-teal);
        box-shadow: 0 0 25px rgba(0, 198, 204, 0.05);
      }

      .config-card.exit {
        border-left: 4px solid var(--brand-lime);
        box-shadow: 0 0 25px rgba(211, 255, 0, 0.03);
      }

      .config-title {
        font-size: 13px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 1.5px;
      }
      
      .entry .config-title { color: var(--brand-teal); }
      .exit .config-title { color: var(--brand-lime); }

      .config-desc {
        font-size: 15px;
        color: var(--text-primary);
        line-height: 1.5;
        font-weight: 600;
      }

      /* Flow container */
      .flow-container {
        display: flex;
        align-items: flex-start;
        justify-content: flex-start;
        gap: 15px;
        width: 100%;
        max-width: 1900px;
        padding: 20px 10px;
      }

      /* Step Card */
      .step-wrapper {
        display: flex;
        align-items: center;
      }

      .step-card {
        background: var(--card-bg);
        border: 1px solid var(--card-border);
        border-radius: 20px;
        width: 310px;
        padding: 22px;
        display: flex;
        flex-direction: column;
        box-shadow: 0 15px 35px -15px rgba(0, 0, 0, 0.6);
        backdrop-filter: blur(12px);
        position: relative;
        transition: transform 0.3s ease;
      }

      .step-card.active {
        border-color: rgba(0, 198, 204, 0.4);
        box-shadow: 0 0 30px rgba(0, 198, 204, 0.1);
      }

      .step-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 14px;
      }

      .step-number {
        font-family: 'Outfit', sans-serif;
        font-size: 12px;
        font-weight: 700;
        background: rgba(255, 255, 255, 0.06);
        padding: 4px 10px;
        border-radius: 20px;
        color: var(--text-secondary);
        letter-spacing: 0.5px;
      }

      .active .step-number {
        background: rgba(0, 198, 204, 0.15);
        color: var(--brand-teal);
      }

      .step-delay {
        font-size: 12px;
        font-weight: 700;
        color: var(--brand-teal);
        display: flex;
        align-items: center;
        gap: 4px;
      }

      .step-title {
        font-family: 'Outfit', sans-serif;
        font-size: 16px;
        font-weight: 700;
        color: var(--text-primary);
        margin-bottom: 12px;
        line-height: 1.4;
      }

      .step-meta {
        font-size: 11px;
        color: var(--text-secondary);
        line-height: 1.6;
        background: rgba(0, 0, 0, 0.2);
        padding: 10px;
        border-radius: 10px;
        margin-bottom: 14px;
        border: 1px solid rgba(255, 255, 255, 0.03);
      }

      .meta-label {
        font-weight: 700;
        color: var(--text-primary);
      }

      /* Browser Mockup for active email */
      .browser-mockup {
        width: 100%;
        border-radius: 12px;
        overflow: hidden;
        border: 1px solid rgba(255, 255, 255, 0.1);
        box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
        background: #1e1e1e;
        display: flex;
        flex-direction: column;
      }

      .browser-bar {
        background: #1a1a1a;
        height: 24px;
        display: flex;
        align-items: center;
        padding: 0 10px;
        gap: 6px;
        border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      }

      .browser-dot {
        width: 6px;
        height: 6px;
        border-radius: 50%;
      }
      .dot-red { background-color: #ff5f56; }
      .dot-yellow { background-color: #ffbd2e; }
      .dot-green { background-color: #27c93f; }

      .browser-viewport {
        width: 100%;
        height: 380px;
        overflow-y: scroll;
        background: #ffffff;
        scrollbar-width: thin;
        scrollbar-color: rgba(0, 0, 0, 0.2) transparent;
      }

      .browser-viewport::-webkit-scrollbar {
        width: 4px;
      }
      .browser-viewport::-webkit-scrollbar-thumb {
        background: rgba(0, 0, 0, 0.2);
        border-radius: 2px;
      }

      .email-thumbnail {
        width: 100%;
        display: block;
        height: auto;
      }

      /* Placeholder Card style */
      .step-card.placeholder {
        border-style: dashed;
        border-width: 2px;
        border-color: rgba(148, 163, 184, 0.25);
        background: rgba(22, 28, 45, 0.3);
      }

      .placeholder .step-title {
        color: var(--text-secondary);
      }

      .placeholder-content {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 200px;
        color: var(--text-secondary);
        font-size: 13px;
        text-align: center;
        gap: 12px;
      }

      .placeholder-icon {
        width: 40px;
        height: 40px;
        border-radius: 50%;
        border: 1px dashed rgba(148, 163, 184, 0.4);
        display: flex;
        align-items: center;
        justify-content: center;
        color: rgba(148, 163, 184, 0.6);
        font-size: 18px;
        font-weight: 300;
      }

      /* Connectors */
      .connector {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 70px;
        position: relative;
      }

      .connector-line {
        height: 2px;
        background: linear-gradient(90deg, var(--brand-teal), rgba(148, 163, 184, 0.3));
        width: 100%;
      }

      .connector.placeholder-conn .connector-line {
        background: rgba(148, 163, 184, 0.2);
        border-bottom: 2px dashed rgba(148, 163, 184, 0.2);
      }

      .connector-label {
        font-size: 10px;
        font-weight: 700;
        color: var(--brand-teal);
        background: var(--bg-color);
        padding: 4px 8px;
        border-radius: 12px;
        border: 1px solid rgba(0, 198, 204, 0.25);
        position: absolute;
        top: -12px;
        white-space: nowrap;
      }

      .connector.placeholder-conn .connector-label {
        color: var(--text-secondary);
        border-color: rgba(148, 163, 184, 0.2);
      }
    </style>
  </head>
  <body>
    <header>
      <h1>Régua de Comunicação</h1>
      <div class="subtitle">Fluxo de Ativação do Vibes - Primeira Compra com Cartão Afinz Visa</div>
    </header>

    <section class="rule-configs">
      <div class="config-card entry">
        <div class="config-title">Gatilho de Entrada</div>
        <div class="config-desc">Pessoas que acabaram de fazer a primeira compra com o cartão Afinz Visa começam a receber créditos.</div>
      </div>
      <div class="config-card exit">
        <div class="config-title">Critério de Saída (Filtro)</div>
        <div class="config-desc">Ativou o Vibes App (Interrompe o recebimento dos próximos disparos).</div>
      </div>
    </section>

    <div class="flow-container">
      ${stepsHtml}
    </div>
  </body>
  </html>
  `;

  // Write journey flowchart HTML to temporary file to render it
  const journeyTempHtmlPath = path.join(__dirname, 'journey_temp.html');
  fs.writeFileSync(journeyTempHtmlPath, journeyHtml, 'utf8');

  // Render Journey Flowchart
  console.log('Rendering Régua de Comunicação flowchart...');
  await page.goto(`file://${journeyTempHtmlPath}`);
  
  // Set viewport to accommodate all 5 cards side-by-side
  // Each card is 310px wide + 70px connector = 380px per step. 5 steps = ~1900px
  await page.setViewportSize({ width: 1920, height: 950 });
  await page.waitForLoadState('networkidle');

  // Wait a small buffer to make sure animations or styles are computed
  await page.waitForTimeout(1000);

  // Take full page screenshot of the flowchart
  const journeyPngPath = path.join(outputsDir, 'regua_comunicacao.png');
  await page.screenshot({
    path: journeyPngPath,
    fullPage: true,
  });
  console.log(`Journey flowchart rendered successfully at: ${journeyPngPath}`);

  // Cleanup temporary HTML file
  fs.unlinkSync(journeyTempHtmlPath);

  // Close browser
  await browser.close();
  console.log('Browser closed. Rendering operation complete!');
}

render().catch(err => {
  console.error('Fatal error during rendering:', err);
  process.exit(1);
});
