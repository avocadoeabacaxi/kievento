import mysql from 'mysql2/promise';

async function checkDate() {
  const connection = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await connection.execute('SELECT id, title, eventDate FROM events WHERE id = 90009');
  console.log('Evento:', rows[0]);
  console.log('eventDate tipo:', typeof rows[0].eventDate);
  console.log('eventDate valor:', rows[0].eventDate);
  
  // Testar parsing
  const eventDateStr = rows[0].eventDate;
  console.log('\nTestando parsing:');
  console.log('new Date(eventDateStr):', new Date(eventDateStr));
  console.log('new Date(eventDateStr + ":00"):', new Date(eventDateStr + ':00'));
  
  await connection.end();
}

checkDate().catch(console.error);
