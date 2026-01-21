import { Resend } from 'resend';

const resend = new Resend('re_5rGt5Qe4_JpKap8qTQEQ6hu612nwB8GLU');

async function testEmail() {
  console.log('Testando envio de e-mail com Resend...');
  
  try {
    const result = await resend.emails.send({
      from: 'KiEvento <contato@kievento.com.br>',
      to: 'test@example.com',
      subject: 'Teste de E-mail KiEvento',
      html: '<h1>Teste</h1><p>Este é um e-mail de teste.</p>',
    });
    
    console.log('Resultado:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Erro:', error);
    throw error;
  }
}

testEmail();
