import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT id, name, formData FROM registrations WHERE eventId = 90009 AND formData IS NOT NULL AND formData != '{}' LIMIT 5");
for (const row of rows) {
  console.log(`\n--- ID: ${row.id} | Name: ${row.name} ---`);
  try {
    const fd = typeof row.formData === 'string' ? JSON.parse(row.formData) : row.formData;
    console.log(JSON.stringify(fd, null, 2));
  } catch(e) {
    console.log('Raw:', row.formData);
  }
}
await conn.end();
