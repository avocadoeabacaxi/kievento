import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { events } from "./drizzle/schema";
import { sql } from "drizzle-orm";

const connection = await mysql.createConnection(process.env.DATABASE_URL!);
const db = drizzle(connection);

console.log("🔍 Buscando eventos para corrigir...\n");

const allEvents = await db.select().from(events);

console.log(`📊 Encontrados ${allEvents.length} eventos\n`);

for (const event of allEvents) {
  const oldDate = new Date(event.eventDate);
  
  // Pega a data/hora em UTC
  const year = oldDate.getUTCFullYear();
  const month = oldDate.getUTCMonth();
  const day = oldDate.getUTCDate();
  const hours = oldDate.getUTCHours();
  const minutes = oldDate.getUTCMinutes();
  const seconds = oldDate.getUTCSeconds();
  
  // Cria nova data interpretando como UTC (sem conversão de timezone)
  const newDate = new Date(Date.UTC(year, month, day, hours, minutes, seconds));
  
  console.log(`📅 Evento: ${event.title}`);
  console.log(`   Antes: ${oldDate.toISOString()} → Exibe: ${oldDate.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' })}`);
  console.log(`   Depois: ${newDate.toISOString()} → Exibe: ${newDate.toLocaleString('pt-BR', { timeZone: 'UTC' })}`);
  
  // Atualiza no banco
  await db.update(events)
    .set({ eventDate: newDate })
    .where(sql`${events.id} = ${event.id}`);
  
  console.log(`   ✅ Atualizado!\n`);
}

console.log("🎉 Migração concluída!");

await connection.end();
