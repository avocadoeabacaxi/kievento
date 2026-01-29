import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, events, formFields, registrations, eventValidators, siteSettings, ticketTypes, emailTemplates, emailSettings, emailLogs, eventCollaborators, InsertEvent, InsertFormField, InsertRegistration, InsertEventValidator, InsertSiteSetting, InsertTicketType, InsertEmailTemplate, InsertEmailSetting, InsertEmailLog, InsertEventCollaborator } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============ EVENTS ============

export async function createEvent(event: InsertEvent) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(events).values(event);
  return result[0].insertId;
}

export async function getEventById(eventId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.id, eventId)).limit(1);
  return result[0];
}

export async function getEventBySlug(slug: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return result[0];
}

export async function getEventsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).where(eq(events.userId, userId)).orderBy(desc(events.createdAt));
}

export async function getAllEvents() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(events).orderBy(desc(events.createdAt));
}

export async function updateEvent(eventId: number, data: Partial<InsertEvent>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(events).set(data).where(eq(events.id, eventId));
}

export async function deleteEvent(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(events).where(eq(events.id, eventId));
}

// ============ FORM FIELDS ============

export async function createFormField(field: InsertFormField) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(formFields).values(field);
  return result[0].insertId;
}

export async function getFormFieldsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(formFields).where(eq(formFields.eventId, eventId)).orderBy(formFields.order);
}

export async function deleteFormFieldsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(formFields).where(eq(formFields.eventId, eventId));
}

// ============ REGISTRATIONS ============

export async function createRegistration(registration: InsertRegistration) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(registrations).values(registration);
  return result[0].insertId;
}

export async function getRegistrationById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
  return result[0];
}

export async function getRegistrationByQrCode(qrCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(registrations).where(eq(registrations.qrCode, qrCode)).limit(1);
  return result[0];
}

export async function getRegistrationWithEventByQrCode(qrCode: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select({
      registration: registrations,
      event: events,
    })
    .from(registrations)
    .leftJoin(events, eq(registrations.eventId, events.id))
    .where(eq(registrations.qrCode, qrCode))
    .limit(1);
  
  if (!result[0] || !result[0].event) return undefined;
  return {
    ...result[0].registration,
    event: result[0].event,
  };
}

export async function getRegistrationsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(registrations).where(eq(registrations.eventId, eventId)).orderBy(desc(registrations.createdAt));
}

export async function getAllRegistrations() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(registrations).orderBy(desc(registrations.createdAt));
}

export async function getRegistrationsByUserId(userId: number) {
  const db = await getDb();
  if (!db) return [];
  
  // Buscar inscrições pelo userId (chave correta para vincular ao usuário logado)
  // Retornar TODOS os ingressos (approved, pending, rejected) para o usuário ver o status
  return db.select().from(registrations)
    .where(eq(registrations.userId, userId))
    .orderBy(desc(registrations.createdAt));
}

export async function searchRegistrationsByName(eventId: number, searchTerm: string) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(registrations)
    .where(
      and(
        eq(registrations.eventId, eventId),
        or(
          like(registrations.name, `%${searchTerm}%`),
          like(registrations.email, `%${searchTerm}%`)
        )
      )
    )
    .orderBy(registrations.name);
}

export async function updateRegistration(id: number, data: Partial<InsertRegistration>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(registrations).set(data).where(eq(registrations.id, id));
}

export async function checkInRegistration(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(registrations).set({
    checkedIn: 1,
    checkedInAt: new Date(),
    checkedInBy: userId,
  }).where(eq(registrations.id, id));
}

export async function deleteRegistration(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(registrations).where(eq(registrations.id, id));
}

export async function getEventStats(eventId: number) {
  const db = await getDb();
  if (!db) return { total: 0, pending: 0, approved: 0, rejected: 0, checkedIn: 0 };
  
  const result = await db.select({
    total: sql<number>`COUNT(*)`,
    pending: sql<number>`SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END)`,
    approved: sql<number>`SUM(CASE WHEN status = 'approved' THEN 1 ELSE 0 END)`,
    rejected: sql<number>`SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)`,
    checkedIn: sql<number>`SUM(CASE WHEN checkedIn = 1 THEN 1 ELSE 0 END)`,
  }).from(registrations).where(eq(registrations.eventId, eventId));
  
  return result[0] || { total: 0, pending: 0, approved: 0, rejected: 0, checkedIn: 0 };
}

// ============ EVENT VALIDATORS ============

export async function addEventValidator(validator: InsertEventValidator) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(eventValidators).values(validator);
  return result[0].insertId;
}

export async function getEventValidators(eventId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(eventValidators).where(eq(eventValidators.eventId, eventId));
}

export async function removeEventValidator(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(eventValidators).where(eq(eventValidators.id, id));
}

// ============ USER PROFILE ============

export async function updateUserProfile(userId: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update user profile: database not available");
    return undefined;
  }

  await db.update(users).set(data).where(eq(users.id, userId));
  return await getUserById(userId);
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ PUBLIC EVENTS ============

export async function getPublicEvents(filters?: { category?: string; city?: string }) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get public events: database not available");
    return [];
  }

  let query = db.select().from(events).where(
    and(
      eq(events.visibility, "public"),
      eq(events.status, "published")
    )
  );
  
  const allEvents = await query;
  
  let filtered = allEvents;
  if (filters?.category) {
    filtered = filtered.filter(e => e.category === filters.category);
  }
  if (filters?.city) {
    filtered = filtered.filter(e => e.city === filters.city);
  }
  
  return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function getAllCities() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get cities: database not available");
    return [];
  }

  const allEvents = await db.select({ city: events.city }).from(events).where(eq(events.visibility, "public"));
  const cities = allEvents.map(e => e.city).filter(Boolean) as string[];
  const uniqueCities = Array.from(new Set(cities));
  return uniqueCities;
}

export async function getAllCategories() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get categories: database not available");
    return [];
  }

  const allEvents = await db.select({ category: events.category }).from(events).where(eq(events.visibility, "public"));
  const categories = allEvents.map(e => e.category).filter(Boolean) as string[];
  const uniqueCategories = Array.from(new Set(categories));
  return uniqueCategories;
}

// ============ SITE SETTINGS ============

export async function getSiteSetting(key: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get site setting: database not available");
    return null;
  }

  const results = await db.select().from(siteSettings).where(eq(siteSettings.key, key));
  return results[0] || null;
}

export async function getAllSiteSettings() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get site settings: database not available");
    return [];
  }

  return await db.select().from(siteSettings);
}

export async function updateSiteSetting(key: string, value: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update site setting: database not available");
    return null;
  }

  // Verificar se a configuração já existe
  const existing = await getSiteSetting(key);
  
  if (existing) {
    // Atualizar
    await db.update(siteSettings)
      .set({ value, updatedAt: new Date() })
      .where(eq(siteSettings.key, key));
  } else {
    // Inserir
    await db.insert(siteSettings).values({ key, value });
  }

  return await getSiteSetting(key);
}

// ============================================
// Ticket Types (Tipos de Ingressos/Lotes)
// ============================================

export async function createTicketType(data: InsertTicketType): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create ticket type: database not available");
    return 0;
  }

  const result = await db.insert(ticketTypes).values(data);
  return result[0].insertId;
}

export async function getTicketTypesByEventId(eventId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ticket types: database not available");
    return [];
  }

  return await db.select().from(ticketTypes)
    .where(eq(ticketTypes.eventId, eventId))
    .orderBy(ticketTypes.order);
}

export async function getTicketTypeById(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get ticket type: database not available");
    return null;
  }

  const results = await db.select().from(ticketTypes).where(eq(ticketTypes.id, id));
  return results[0] || null;
}

export async function updateTicketType(id: number, data: Partial<InsertTicketType>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update ticket type: database not available");
    return;
  }

  await db.update(ticketTypes)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(ticketTypes.id, id));
}

export async function deleteTicketType(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete ticket type: database not available");
    return;
  }

  await db.delete(ticketTypes).where(eq(ticketTypes.id, id));
}

export async function incrementTicketTypeSold(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot increment ticket type sold: database not available");
    return;
  }

  await db.update(ticketTypes)
    .set({ quantitySold: sql`${ticketTypes.quantitySold} + 1` })
    .where(eq(ticketTypes.id, id));
}

export async function getActiveTicketType(eventId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active ticket type: database not available");
    return null;
  }

  const now = new Date();
  const allTicketTypes = await db.select().from(ticketTypes)
    .where(and(
      eq(ticketTypes.eventId, eventId),
      eq(ticketTypes.isActive, 1)
    ))
    .orderBy(ticketTypes.order);

  // Encontrar o primeiro lote que está válido e tem vagas
  for (const tt of allTicketTypes) {
    // Verificar data de início
    if (tt.validFrom && new Date(tt.validFrom) > now) {
      continue; // Ainda não começou
    }

    // Verificar data de fim
    if (tt.validUntil && new Date(tt.validUntil) < now) {
      continue; // Já expirou
    }

    // Verificar quantidade disponível
    if (tt.quantity && tt.quantitySold >= tt.quantity) {
      continue; // Esgotado
    }

    // Este lote está ativo e disponível
    return tt;
  }

  // Nenhum lote ativo encontrado
  return null;
}


// ============================================
// Email Templates (Templates de Email por Evento)
// ============================================

export async function createEmailTemplate(data: InsertEmailTemplate): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email template: database not available");
    return 0;
  }

  const result = await db.insert(emailTemplates).values(data);
  return result[0].insertId;
}

export async function getEmailTemplatesByEventId(eventId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email templates: database not available");
    return [];
  }

  return await db.select().from(emailTemplates)
    .where(eq(emailTemplates.eventId, eventId));
}

export async function getEmailTemplateByEventAndType(eventId: number, templateType: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email template: database not available");
    return null;
  }

  const results = await db.select().from(emailTemplates)
    .where(and(
      eq(emailTemplates.eventId, eventId),
      eq(emailTemplates.templateType, templateType as any)
    ));
  return results[0] || null;
}

export async function updateEmailTemplate(id: number, data: Partial<InsertEmailTemplate>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email template: database not available");
    return;
  }

  await db.update(emailTemplates)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailTemplates.id, id));
}

export async function deleteEmailTemplate(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete email template: database not available");
    return;
  }

  await db.delete(emailTemplates).where(eq(emailTemplates.id, id));
}

// ============================================
// Email Settings (Configurações Globais de Email)
// ============================================

export async function createEmailSetting(data: InsertEmailSetting): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email setting: database not available");
    return 0;
  }

  const result = await db.insert(emailSettings).values(data);
  return result[0].insertId;
}

export async function getEmailSettings() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email settings: database not available");
    return [];
  }

  return await db.select().from(emailSettings);
}

export async function getActiveEmailSetting() {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get active email setting: database not available");
    return null;
  }

  const results = await db.select().from(emailSettings)
    .where(eq(emailSettings.enabled, 1));
  return results[0] || null;
}

export async function updateEmailSetting(id: number, data: Partial<InsertEmailSetting>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email setting: database not available");
    return;
  }

  await db.update(emailSettings)
    .set({ ...data, updatedAt: new Date() })
    .where(eq(emailSettings.id, id));
}

export async function deleteEmailSetting(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete email setting: database not available");
    return;
  }

  await db.delete(emailSettings).where(eq(emailSettings.id, id));
}

// ============================================
// Email Logs (Logs de Emails Enviados)
// ============================================

export async function createEmailLog(data: InsertEmailLog): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create email log: database not available");
    return 0;
  }

  const result = await db.insert(emailLogs).values(data);
  return result[0].insertId;
}

export async function getEmailLogs(limit = 100) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email logs: database not available");
    return [];
  }

  return await db.select().from(emailLogs)
    .orderBy(desc(emailLogs.createdAt))
    .limit(limit);
}

export async function getEmailLogsByEventId(eventId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get email logs: database not available");
    return [];
  }

  return await db.select().from(emailLogs)
    .where(eq(emailLogs.eventId, eventId))
    .orderBy(desc(emailLogs.createdAt));
}

export async function updateEmailLog(id: number, data: Partial<InsertEmailLog>) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update email log: database not available");
    return;
  }

  await db.update(emailLogs)
    .set(data)
    .where(eq(emailLogs.id, id));
}


// ============================================
// Event Collaborators
// ============================================

export async function createEventCollaborator(data: InsertEventCollaborator): Promise<number> {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot create event collaborator: database not available");
    return 0;
  }

  const result = await db.insert(eventCollaborators).values(data);
  return result[0].insertId;
}

export async function getEventCollaborators(eventId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get event collaborators: database not available");
    return [];
  }

  return await db.select().from(eventCollaborators)
    .where(eq(eventCollaborators.eventId, eventId))
    .orderBy(desc(eventCollaborators.createdAt));
}

export async function getCollaboratorByToken(token: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get collaborator by token: database not available");
    return null;
  }

  const result = await db.select().from(eventCollaborators)
    .where(eq(eventCollaborators.inviteToken, token))
    .limit(1);
  
  return result[0] || null;
}

export async function getCollaboratorByEventAndUser(eventId: number, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get collaborator: database not available");
    return null;
  }

  const result = await db.select().from(eventCollaborators)
    .where(and(
      eq(eventCollaborators.eventId, eventId),
      eq(eventCollaborators.userId, userId)
    ))
    .limit(1);
  
  return result[0] || null;
}

export async function acceptCollaboratorInvite(token: string, userId: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot accept invite: database not available");
    return;
  }

  await db.update(eventCollaborators)
    .set({
      userId,
      status: 'active',
      acceptedAt: new Date(),
    })
    .where(eq(eventCollaborators.inviteToken, token));
}

export async function updateCollaboratorRole(id: number, role: 'coordinator' | 'supervisor' | 'checkin') {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot update collaborator role: database not available");
    return;
  }

  await db.update(eventCollaborators)
    .set({ role })
    .where(eq(eventCollaborators.id, id));
}

export async function deleteCollaborator(id: number) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot delete collaborator: database not available");
    return;
  }

  await db.delete(eventCollaborators)
    .where(eq(eventCollaborators.id, id));
}
