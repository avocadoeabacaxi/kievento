import puppeteer from 'puppeteer';
import QRCode from 'qrcode';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface TicketData {
  participantName: string;
  eventTitle: string;
  eventDate: Date;
  eventAddress: string;
  qrCode: string;
  ticketType?: string;
  registrationDate: Date;
}

/**
 * Gera HTML do convite com QR Code
 */
async function generateTicketHTML(data: TicketData): Promise<string> {
  const qrCodeDataURL = await QRCode.toDataURL(data.qrCode, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#FFFFFF',
    },
  });

  const eventDateFormatted = format(data.eventDate, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
  const registrationDateFormatted = format(data.registrationDate, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
  const [address, mapLink] = data.eventAddress?.split('|') || ['', ''];

  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Convite - ${data.eventTitle}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: white;
      width: 800px;
      margin: 0 auto;
    }
    
    .ticket {
      background: white;
      border: 2px solid #e5e7eb;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    
    .header {
      background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%);
      padding: 40px 30px;
      text-align: center;
      color: white;
    }
    
    .logo {
      width: 120px;
      height: auto;
      margin-bottom: 20px;
    }
    
    .event-title {
      font-size: 32px;
      font-weight: 700;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    
    .event-date {
      font-size: 18px;
      font-weight: 500;
      margin-bottom: 20px;
      color: #e5e7eb;
    }
    
    .event-location {
      font-size: 16px;
      color: #d1d5db;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    
    .content {
      padding: 40px 30px;
    }
    
    .qr-section {
      text-align: center;
      margin-bottom: 30px;
    }
    
    .qr-code {
      width: 300px;
      height: 300px;
      margin: 0 auto 16px;
      border: 4px solid #f3f4f6;
      border-radius: 12px;
    }
    
    .qr-text {
      font-family: 'Courier New', monospace;
      font-size: 14px;
      color: #6b7280;
      word-break: break-all;
      max-width: 300px;
      margin: 0 auto;
    }
    
    .participant-section {
      background: #f9fafb;
      border-radius: 12px;
      padding: 24px;
      margin-top: 30px;
    }
    
    .participant-label {
      font-size: 12px;
      font-weight: 600;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 8px;
    }
    
    .participant-name {
      font-size: 24px;
      font-weight: 700;
      text-transform: uppercase;
      color: #111827;
      margin-bottom: 16px;
    }
    
    .registration-info {
      font-size: 14px;
      color: #6b7280;
    }
    
    .footer {
      text-align: center;
      padding: 20px;
      font-size: 12px;
      color: #9ca3af;
      border-top: 1px solid #e5e7eb;
    }
  </style>
</head>
<body>
  <div class="ticket">
    <!-- Header -->
    <div class="header">
      <h1 class="event-title">${data.eventTitle}</h1>
      <div class="event-date">${eventDateFormatted}</div>
      <div class="event-location">
        📍 ${address}
      </div>
    </div>
    
    <!-- Content -->
    <div class="content">
      <!-- QR Code -->
      <div class="qr-section">
        <img src="${qrCodeDataURL}" alt="QR Code" class="qr-code" />
        <div class="qr-text">${data.qrCode}</div>
      </div>
      
      <!-- Participant Info -->
      <div class="participant-section">
        <div class="participant-label">Participante</div>
        <div class="participant-name">${data.participantName}</div>
        <div class="registration-info">
          Inscrição realizada em ${registrationDateFormatted}
        </div>
        ${data.ticketType ? `<div class="registration-info" style="margin-top: 8px;">Tipo: ${data.ticketType}</div>` : ''}
      </div>
    </div>
    
    <!-- Footer -->
    <div class="footer">
      © ${new Date().getFullYear()} KiEvento - Todos os direitos reservados
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Gera convite em formato JPG
 */
export async function generateTicketJPG(data: TicketData): Promise<Buffer> {
  const html = await generateTicketHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 800, height: 1200 });
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 95,
      fullPage: true,
    });
    
    return Buffer.from(screenshot);
  } finally {
    await browser.close();
  }
}

/**
 * Gera convite em formato PDF
 */
export async function generateTicketPDF(data: TicketData): Promise<Buffer> {
  const html = await generateTicketHTML(data);
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });
  
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px',
      },
    });
    
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
