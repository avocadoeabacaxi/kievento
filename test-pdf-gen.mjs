import puppeteer from 'puppeteer';

async function testPDF() {
  console.log('Testando geração de PDF com Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: '/usr/bin/chromium-browser',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });
  
  console.log('Browser iniciado');
  
  const page = await browser.newPage();
  await page.setContent('<h1>Teste PDF</h1><p>Conteúdo de teste</p>');
  
  const pdf = await page.pdf({ format: 'A4' });
  console.log('PDF gerado com sucesso! Tamanho:', pdf.length, 'bytes');
  
  await browser.close();
  console.log('Browser fechado');
}

testPDF().catch(console.error);
