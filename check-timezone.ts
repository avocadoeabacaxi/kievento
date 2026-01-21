import { db } from "./server/db";
import { events } from "./drizzle/schema";
import { like, desc } from "drizzle-orm";

async function checkTimezone() {
  console.log('=== CONSULTANDO EVENTOS DE TESTE ===\n');
  
  const testEvents = await db
    .select()
    .from(events)
    .where(like(events.title, '%Teste%'))
    .orderBy(desc(events.createdAt))
    .limit(5);
  
  testEvents.forEach(event => {
    console.log(`ID: ${event.id}`);
    console.log(`Título: ${event.title}`);
    console.log(`Data do Evento (objeto): ${event.eventDate}`);
    console.log(`Data do Evento (ISO): ${event.eventDate.toISOString()}`);
    console.log(`Data do Evento (toString): ${event.eventDate.toString()}`);
    console.log(`Timezone configurado: ${event.timezone || 'não configurado'}`);
    console.log(`Criado em: ${event.createdAt}`);
    console.log('---\n');
  });
  
  process.exit(0);
}

checkTimezone().catch(console.error);
