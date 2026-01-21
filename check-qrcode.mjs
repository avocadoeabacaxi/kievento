import mysql from 'mysql2/promise';

async function checkQRCode() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'gateway01.us-west-2.prod.aws.tidbcloud.com',
    port: parseInt(process.env.DB_PORT || '4000'),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    ssl: { rejectUnauthorized: true }
  });
  
  const [rows] = await connection.execute('SELECT id, name, email, qrCode, status FROM registrations WHERE eventId = 90009 ORDER BY id DESC LIMIT 5');
  console.log('Inscrições:', JSON.stringify(rows, null, 2));
  
  await connection.end();
}

checkQRCode().catch(console.error);
