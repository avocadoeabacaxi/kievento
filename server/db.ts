import { eq, desc, and, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, events, formFields, registrations, eventValidators, InsertEvent, InsertFormField, InsertRegistration, InsertEventValidator } from "../drizzle/schema";
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
