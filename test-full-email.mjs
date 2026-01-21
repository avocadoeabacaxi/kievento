import mysql from 'mysql2/promise';
import { Resend } from 'resend';

const DATABASE_URL = 'mysql://root:manus_password@localhost:3306/manus_db';

async function testFullEmailFlow() {
  console.log('=== TESTE COMPLETO DE ENVIO DE EMAIL ===\n');
  
  // 1. Conectar ao banco
  console.log('1. Conectando ao banco de dados...');
  const connection = await mysql.createConnection(DATABASE_URL);
  
  // 2. Buscar configuração de email
  console.log('2. Buscando configuração de email...');
  const [emailSettings] = await connection.execute('SELECT * FROM emailSettings WHERE enabled = 1 LIMIT 1');
  console.log('   Configuração encontrada:', emailSettings.length > 0 ? 'SIM' : 'NÃO');
  
  if (emailSettings.length === 0) {
    console.log('   ERRO: Nenhuma configuração de email ativa!');
    await connection.end();
    return;
  }
  
  const config = emailSettings[0];
  console.log('   Provider:', config.provider);
  console.log('   Sender:', config.senderName, '<' + config.senderEmail + '>');
  console.log('   API Key:', config.apiKey?.substring(0, 15) + '...');
  
  // 3. Buscar inscrição
  console.log('\n3. Buscando inscrição...');
  const [registrations] = await connection.execute('SELECT * FROM registrations WHERE eventId = 90009 AND status = "approved" LIMIT 1');
  console.log('   Inscrição encontrada:', registrations.length > 0 ? 'SIM' : 'NÃO');
  
  if (registrations.length === 0) {
    console.log('   ERRO: Nenhuma inscrição aprovada encontrada!');
    await connection.end();
    return;
  }
  
  const reg = registrations[0];
  console.log('   ID:', reg.id);
  console.log('   Nome:', reg.name);
  console.log('   Email:', reg.email);
  console.log('   QR Code:', reg.qrCode);
  
  // 4. Enviar email via Resend
  console.log('\n4. Enviando email via Resend...');
  const resend = new Resend(config.apiKey);
  
  const emailData = {
    from: config.senderName + ' <' + config.senderEmail + '>',
    to: reg.email,
    subject: '✅ Inscrição Aprovada - Conversa de Padaria',
    html: '<h2>Olá, ' + reg.name + '!</h2><p>Sua inscrição foi aprovada!</p><p>Acesse seu ingresso: <a href="https://kievento.com.br/ticket/' + reg.qrCode + '">Clique aqui</a></p>',
  };
  
  console.log('   De:', emailData.from);
  console.log('   Para:', emailData.to);
  console.log('   Assunto:', emailData.subject);
  
  try {
    const result = await resend.emails.send(emailData);
    console.log('\n5. RESULTADO:');
    console.log('   ID do email:', result.data?.id);
    console.log('   Erro:', result.error);
    
    if (result.data?.id) {
      console.log('\n✅ EMAIL ENVIADO COM SUCESSO!');
    } else {
      console.log('\n❌ FALHA NO ENVIO');
    }
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
  }
  
  await connection.end();
}

testFullEmailFlow().catch(console.error);
