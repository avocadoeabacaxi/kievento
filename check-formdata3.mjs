import mysql from 'mysql2/promise';
console.log('DATABASE_URL exists:', !!process.env.DATABASE_URL);
try {
  const conn = await mysql.createConnection(process.env.DATABASE_URL);
  const [rows] = await conn.execute("SELECT id, name, email, phone, formData, status FROM registrations WHERE eventId = 90009 LIMIT 5");
  console.log('Total rows:', rows.length);
  rows.forEach(r => {
    console.log(`\nID: ${r.id}`);
    console.log(`Name: ${r.name}`);
    console.log(`Email: ${r.email}`);
    console.log(`Phone: ${r.phone}`);
    console.log(`Status: ${r.status}`);
    console.log(`formData type: ${typeof r.formData}`);
    console.log(`formData value:`, r.formData);
  });
  await conn.end();
} catch(e) {
  console.error('Error:', e.message);
}
