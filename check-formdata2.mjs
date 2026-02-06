import mysql from 'mysql2/promise';
const conn = await mysql.createConnection(process.env.DATABASE_URL);
const [rows] = await conn.execute("SELECT id, name, formData FROM registrations WHERE eventId = 90009 LIMIT 10");
for (const row of rows) {
  console.log(`ID: ${row.id} | Name: ${row.name} | formData: ${row.formData}`);
}
await conn.end();
