// Teste direto da função sendApprovalEmail
import { Resend } from 'resend';

const resend = new Resend('re_5rGt5Qe4_JpKap8qTQEQ6hu612nwB8GLU');

async function testSendApproval() {
  console.log('=== Testando envio de e-mail de aprovação ===');
  
  const emailData = {
    from: 'KiEvento <contato@kievento.com.br>',
    to: 'fernando@avocado.buzz',
    subject: '✅ Inscrição Aprovada - Conversa de Padaria',
    html: `<h2>Olá, FERNANDO GONCALVES DE MATOS MACHADO!</h2>
<p>Sua inscrição para o evento <strong>Conversa de Padaria</strong> foi aprovada!</p>
<p><strong>Data:</strong> 4 de fevereiro de 2026 às 08:00</p>
<p><strong>Local:</strong> SP-330, Km 304 - s/n - Jardim Manoel Penna, Ribeirão Preto - SP</p>
<p>Acesse seu ingresso: <a href="https://kievento.com.br/ticket/test123">Clique aqui</a></p>`,
  };

  console.log('Enviando para:', emailData.to);
  console.log('De:', emailData.from);
  console.log('Assunto:', emailData.subject);
  
  try {
    const result = await resend.emails.send(emailData);
    console.log('\n=== RESULTADO ===');
    console.log(JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('\n=== ERRO ===');
    console.error(error);
    throw error;
  }
}

testSendApproval();
