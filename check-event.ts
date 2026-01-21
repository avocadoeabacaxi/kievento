import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { events } from "./drizzle/schema";
import { like, desc } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

const result = await db.select().from(events).where(like(events.title, '%Teste%')).orderBy(desc(events.createdAt)).limit(3);

console.log("Eventos encontrados:");
result.forEach(event => {
  console.log(`\nID: ${event.id}`);
  console.log(`Título: ${event.title}`);
  console.log(`eventDate (raw): ${event.eventDate}`);
  console.log(`eventDate (ISO): ${new Date(event.eventDate).toISOString()}`);
  console.log(`eventDate (Local): ${new Date(event.eventDate).toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`createdAt: ${event.createdAt}`);
});

await connection.end();
