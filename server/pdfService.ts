import QRCode from 'qrcode';
import puppeteer from 'puppeteer-core';
import { ENV } from './_core/env';

interface TicketPDFParams {
  eventTitle: string;
  eventDate: string;
  eventAddress: string;
  participantName: string;
  qrCode: string;
  ticketUrl: string;
}

/**
 * Gera QR Code como base64 data URL
 */
async function generateQRCodeBase64(text: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(text, {
      width: 200,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff',
      },
    });
    return dataUrl;
  } catch (error) {
    console.error('[PDF Service] Erro ao gerar QR Code:', error);
    throw error;
  }
}

/**
 * Gera HTML do convite para conversão em PDF
 */
function generateTicketHTML(params: TicketPDFParams, qrCodeBase64: string): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background: #f5f5f5;
      padding: 20px;
    }
    .ticket {
      max-width: 600px;
      margin: 0 auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.1);
    }
    .header {
      background: linear-gradient(135deg, #1a1a1a 0%, #333333 100%);
      color: white;
      padding: 30px;
      text-align: center;
    }
    .logo {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 20px;
    }
    .logo-box {
      background: #C72227;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-weight: bold;
      font-size: 18px;
    }
    .logo-text {
      font-size: 24px;
      font-weight: 300;
      color: white;
    }
    .event-title {
      font-size: 28px;
      font-weight: bold;
      margin-bottom: 15px;
    }
    .event-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      font-size: 14px;
      opacity: 0.9;
    }
    .event-info-item {
      display: flex;
      align-items: center;
      gap: 8px;
      justify-content: center;
    }
    .content {
      padding: 30px;
      display: flex;
      gap: 30px;
    }
    .participant-info {
      flex: 1;
    }
    .participant-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .participant-name {
      font-size: 20px;
      font-weight: bold;
      color: #1a1a1a;
      margin-bottom: 20px;
    }
    .qr-section {
      text-align: center;
    }
    .qr-code {
      width: 180px;
      height: 180px;
      border: 3px solid #f0f0f0;
      border-radius: 12px;
      padding: 10px;
      background: white;
    }
    .qr-code img {
      width: 100%;
      height: 100%;
    }
    .qr-label {
      font-size: 11px;
      color: #666;
      margin-top: 10px;
      font-family: monospace;
      word-break: break-all;
    }
    .footer {
      background: #f9f9f9;
      padding: 20px 30px;
      text-align: center;
      border-top: 1px solid #eee;
    }
    .footer-text {
      font-size: 12px;
      color: #999;
    }
    .ticket-url {
      font-size: 11px;
      color: #C72227;
      margin-top: 8px;
      word-break: break-all;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <div class="header">
      <div class="logo">
        <span class="logo-box">Ki</span>
        <span class="logo-text">Evento</span>
      </div>
      <div class="event-title">${params.eventTitle}</div>
      <div class="event-info">
        <div class="event-info-item">
          📅 ${params.eventDate}
        </div>
        <div class="event-info-item">
          📍 ${params.eventAddress}
        </div>
      </div>
    </div>
    <div class="content">
      <div class="participant-info">
        <div class="participant-label">Participante</div>
        <div class="participant-name">${params.participantName}</div>
        <div class="participant-label" style="margin-top: 20px;">Instruções</div>
        <p style="font-size: 14px; color: #666; line-height: 1.6;">
          Apresente este QR Code na entrada do evento para realizar o check-in.
          Você também pode acessar seu ingresso digital através do link abaixo.
        </p>
      </div>
      <div class="qr-section">
        <div class="qr-code">
          <img src="${qrCodeBase64}" alt="QR Code" />
        </div>
        <div class="qr-label">${params.qrCode}</div>
      </div>
    </div>
    <div class="footer">
      <div class="footer-text">© ${new Date().getFullYear()} KiEvento By Lab485/Avocado. Todos os direitos reservados.</div>
      <div class="ticket-url">${params.ticketUrl}</div>
    </div>
  </div>
</body>
</html>
`;
}

/**
 * Gera PDF do convite usando Puppeteer
 */
export async function generateTicketPDF(params: TicketPDFParams): Promise<Buffer> {
  console.log('[PDF Service] Iniciando geração de PDF para:', params.participantName);
  
  // Gerar QR Code como base64
  const qrCodeBase64 = await generateQRCodeBase64(params.qrCode);
  
  // Gerar HTML do convite
  const html = generateTicketHTML(params, qrCodeBase64);
  
  let browser = null;
  
  try {
    // Encontrar executável do Chromium
    const chromiumPath = process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium-browser';
    
    console.log('[PDF Service] Usando Chromium em:', chromiumPath);
    
    browser = await puppeteer.launch({
      executablePath: chromiumPath,
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
      ],
    });
    
    const page = await browser.newPage();
    
    // Definir conteúdo HTML
    await page.setContent(html, {
      waitUntil: 'networkidle0',
    });
    
    // Gerar PDF
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    console.log('[PDF Service] PDF gerado com sucesso, tamanho:', pdfBuffer.length, 'bytes');
    
    return Buffer.from(pdfBuffer);
  } catch (error) {
    console.error('[PDF Service] Erro ao gerar PDF:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Gera PDF do convite como base64 para anexar em e-mail
 */
export async function generateTicketPDFBase64(params: TicketPDFParams): Promise<string> {
  const pdfBuffer = await generateTicketPDF(params);
  return pdfBuffer.toString('base64');
}
