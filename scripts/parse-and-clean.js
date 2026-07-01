import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const projectRoot = path.join(__dirname, '..');
const htmlSourceDir = path.join(projectRoot, '..', 'html');
const scriptsDir = __dirname;

const emailsConfigPath = path.join(scriptsDir, 'emails-config.json');

// Default metadata structure
const metadata = {
  1: {
    subject: 'Seu cupom chegou!',
    preheader: 'Garanta suas recompensas! 💸',
    title: 'E-mail 1: Seu cupom chegou!'
  },
  2: {
    subject: 'Não deixe para depois!',
    preheader: 'Seus 100 Vibes estão te esperando! ⏰',
    title: 'E-mail 2: Não deixe para depois!'
  },
  3: {
    subject: 'Seu cupom chegou!',
    preheader: 'Garanta suas recompensas! 💸',
    title: 'E-mail 3: Seu cupom chegou!'
  },
  4: {
    subject: 'Aguardando Assunto',
    preheader: 'Aguardando Pré-cabeçalho',
    title: 'E-mail 4'
  },
  5: {
    subject: 'Aguardando Assunto',
    preheader: 'Aguardando Pré-cabeçalho',
    title: 'E-mail 5'
  }
};

function run() {
  console.log('Parsing user uploaded email templates in html/ folder...');

  for (let i = 2; i <= 5; i++) {
    const txtFileName = `email ${i}.html.txt`;
    const sourceFilePath = path.join(htmlSourceDir, txtFileName);

    if (fs.existsSync(sourceFilePath)) {
      console.log(`Processing ${txtFileName}...`);
      const fileContent = fs.readFileSync(sourceFilePath, 'utf8');
      const lines = fileContent.split('\n');

      let subject = '';
      let preheader = '';
      let htmlStartIndex = -1;

      // Scan first few lines to extract metadata and find where HTML starts
      for (let j = 0; j < Math.min(lines.length, 10); j++) {
        const line = lines[j].trim();
        if (line.toLowerCase().startsWith('assunto:')) {
          subject = line.substring(line.indexOf(':') + 1).trim();
        } else if (line.toLowerCase().startsWith('pré-cabeçalho:') || line.toLowerCase().startsWith('pre-cabeçalho:') || line.toLowerCase().startsWith('preheader:')) {
          preheader = line.substring(line.indexOf(':') + 1).trim();
        } else if (line.toLowerCase().startsWith('html:')) {
          // The next line or the rest of this line is the HTML
          htmlStartIndex = j + 1;
        } else if (line.startsWith('<!DOCTYPE') || line.startsWith('<html')) {
          // If we encounter HTML tags directly
          if (htmlStartIndex === -1) {
            htmlStartIndex = j;
          }
        }
      }

      // If we found HTML start index
      if (htmlStartIndex !== -1) {
        const cleanHtml = lines.slice(htmlStartIndex).join('\n').trim();
        const destFilePath = path.join(scriptsDir, `email${i}.html`);
        fs.writeFileSync(destFilePath, cleanHtml, 'utf8');
        console.log(`Saved clean HTML for E-mail ${i} to ${destFilePath}`);
      } else {
        console.error(`Could not locate start of HTML in ${txtFileName}`);
      }

      // Update metadata if extracted successfully
      if (subject) {
        metadata[i].subject = subject;
        console.log(`- Extracted Subject: "${subject}"`);
      }
      if (preheader) {
        metadata[i].preheader = preheader;
        console.log(`- Extracted Preheader: "${preheader}"`);
      }
      metadata[i].title = `E-mail ${i}: ${metadata[i].subject}`;
    } else {
      console.log(`${txtFileName} not found, using defaults.`);
    }
  }

  // Save the configuration JSON file
  fs.writeFileSync(emailsConfigPath, JSON.stringify(metadata, null, 2), 'utf8');
  console.log(`Successfully saved metadata config to ${emailsConfigPath}`);
}

run();
