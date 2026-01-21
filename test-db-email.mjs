import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function testEmailSettings() {
  console.log('Conectando ao banco de dados...');
  console.log('DATABASE_URL:', DATABASE_URL ? 'Configurado' : 'NÃO CONFIGURADO');
  
  if (!DATABASE_URL) {
    console.error('DATABASE_URL não configurado!');
    return;
  }
  
  const connection = await mysql.createConnection(DATABASE_URL);
  
  const [rows] = await connection.execute('SELECT * FROM emailSettings WHERE enabled = 1');
  console.log('Configurações de email ativas:', JSON.stringify(rows, null, 2));
  
  await connection.end();
}

testEmailSettings().catch(console.error);
