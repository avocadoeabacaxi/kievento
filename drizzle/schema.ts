import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, tinyint } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  
  // Novos campos de perfil
  userType: mysqlEnum("userType", ["individual", "company"]).default("individual"),
  profilePhoto: text("profilePhoto"),
  profilePhotoKey: text("profilePhotoKey"),
  phone: varchar("phone", { length: 20 }),
  
  // Campos para Pessoa Física
  cpf: varchar("cpf", { length: 14 }),
  birthDate: timestamp("birthDate"),
  
  // Campos para Empresa
  cnpj: varchar("cnpj", { length: 18 }),
  companyName: text("companyName"),
  tradeName: text("tradeName"),
  
  // Endereço
  address: text("address"),
  city: varchar("city", { length: 100 }),
  state: varchar("state", { length: 2 }),
  zipCode: varchar("zipCode", { length: 9 }),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Eventos criados pelos organizadores
 */
export const events = mysqlTable("events", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  description: text("description"),
  eventDate: timestamp("eventDate").notNull(),
  address: text("address"),
  bannerUrl: text("bannerUrl"),
  bannerKey: text("bannerKey"),
  cardImageUrl: text("cardImageUrl"), // Imagem otimizada 3:4 para página principal
  cardImageKey: text("cardImageKey"),
  registrationType: mysqlEnum("registrationType", ["open", "approval"]).notNull(),
  
  // Novos campos
  category: varchar("category", { length: 50 }),
  city: varchar("city", { length: 100 }),
  visibility: mysqlEnum("visibility", ["public", "private"]).default("private").notNull(),
  status: mysqlEnum("status", ["draft", "published"]).default("draft").notNull(), // Status do evento (rascunho ou publicado)
  slug: varchar("slug", { length: 255 }).notNull().unique(), // URL amigável gerada a partir do título
  faq: text("faq"), // JSON string: [{question: string, answer: string}]
  registrationDeadline: timestamp("registrationDeadline"), // Data limite para inscrições
  hasTicketTypes: tinyint("hasTicketTypes").default(0).notNull(), // Sistema de ingressos ativado? (0=false, 1=true)
  timezone: varchar("timezone", { length: 100 }).default("America/Sao_Paulo").notNull(), // Fuso horário do evento
  
  // Campos de personalização visual da página de cadastro
  customSidebarBg: varchar("customSidebarBg", { length: 7 }), // Cor de fundo da barra lateral (hex)
  customSidebarText: varchar("customSidebarText", { length: 7 }), // Cor do texto da barra lateral (hex)
  customButtonBg: varchar("customButtonBg", { length: 7 }), // Cor de fundo dos botões (hex)
  customButtonHover: varchar("customButtonHover", { length: 7 }), // Cor de hover dos botões (hex)
  customTitleColor: varchar("customTitleColor", { length: 7 }), // Cor dos títulos principais (hex)
  customSubtitleColor: varchar("customSubtitleColor", { length: 7 }), // Cor dos subtítulos (hex)
  customBgGradientStart: varchar("customBgGradientStart", { length: 7 }), // Cor inicial do gradiente de fundo (hex)
  customBgGradientEnd: varchar("customBgGradientEnd", { length: 7 }), // Cor final do gradiente de fundo (hex)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Event = typeof events.$inferSelect;
export type InsertEvent = typeof events.$inferInsert;

/**
 * Perguntas personalizadas do formulário de inscrição
 */
export const formFields = mysqlTable("formFields", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  label: varchar("label", { length: 255 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "email", "phone", "textarea", "select", "checkbox", "cpf", "cnpj", "cep"]).notNull(),
  options: text("options"), // JSON array para select/checkbox
  required: int("required").default(1).notNull(), // 1 = true, 0 = false
  order: int("order").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type FormField = typeof formFields.$inferSelect;
export type InsertFormField = typeof formFields.$inferInsert;

/**
 * Inscrições dos participantes
 */
export const registrations = mysqlTable("registrations", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }), // Usuário que fez a inscrição
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  phone: varchar("phone", { length: 50 }),
  formData: text("formData"), // JSON com respostas do formulário
  ticketTypeId: int("ticketTypeId"), // Tipo de ingresso escolhido (null se evento não usa lotes)
  status: mysqlEnum("status", ["pending", "approved", "rejected"]).default("pending").notNull(),
  qrCode: varchar("qrCode", { length: 255 }).unique(),
  checkedIn: int("checkedIn").default(0).notNull(), // 1 = presente, 0 = ausente
  checkedInAt: timestamp("checkedInAt"),
  checkedInBy: int("checkedInBy").references(() => users.id),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type InsertRegistration = typeof registrations.$inferInsert;

/**
 * Permissões de validadores para eventos
 */
export const eventValidators = mysqlTable("eventValidators", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  canScanQr: int("canScanQr").default(1).notNull(), // 1 = true, 0 = false
  canSearchName: int("canSearchName").default(1).notNull(), // 1 = true, 0 = false
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EventValidator = typeof eventValidators.$inferSelect;
export type InsertEventValidator = typeof eventValidators.$inferInsert;
/**
 * Configurações globais do site (banner de cookies, políticas, etc.)
 */
export const siteSettings = mysqlTable("siteSettings", {
  id: int("id").autoincrement().primaryKey(),
  key: varchar("key", { length: 100 }).notNull().unique(),
  value: text("value"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SiteSetting = typeof siteSettings.$inferSelect;
export type InsertSiteSetting = typeof siteSettings.$inferInsert;

/**
 * Tipos de ingressos/lotes para eventos (sistema opcional)
 */
export const ticketTypes = mysqlTable("ticketTypes", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 100 }).notNull(), // Ex: "1º Lote - Early Bird", "VIP", "Estudante"
  description: text("description"), // Descrição dos benefícios
  price: varchar("price", { length: 50 }), // Preço como string (ex: "R$ 100,00" ou "Gratuito")
  quantity: int("quantity"), // Quantidade disponível (null = ilimitado)
  quantitySold: int("quantitySold").default(0).notNull(), // Quantidade já vendida/aprovada
  validFrom: timestamp("validFrom"), // Data de início da venda deste lote
  validUntil: timestamp("validUntil"), // Data limite deste lote
  color: varchar("color", { length: 20 }).default("#ef4444"), // Cor do badge (hex)
  order: int("order").default(0).notNull(), // Ordem de exibição/prioridade
  isActive: tinyint("isActive").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type TicketType = typeof ticketTypes.$inferSelect;
export type InsertTicketType = typeof ticketTypes.$inferInsert;

/**
 * Templates de email personalizáveis por evento
 */
export const emailTemplates = mysqlTable("emailTemplates", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull().references(() => events.id, { onDelete: "cascade" }),
  templateType: mysqlEnum("templateType", ["approval", "rejection", "pending", "purchase", "confirmation"]).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(), // Assunto do email
  htmlBody: text("htmlBody").notNull(), // Corpo HTML com variáveis {{nome}}, {{evento}}, etc.
  attachmentFormat: mysqlEnum("attachmentFormat", ["jpg", "pdf", "none"]).default("none").notNull(), // Formato do convite anexado
  enabled: tinyint("enabled").default(1).notNull(), // 1 = ativo, 0 = inativo
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailTemplate = typeof emailTemplates.$inferSelect;
export type InsertEmailTemplate = typeof emailTemplates.$inferInsert;

/**
 * Configurações globais de email (credenciais e provedor)
 */
export const emailSettings = mysqlTable("emailSettings", {
  id: int("id").autoincrement().primaryKey(),
  provider: mysqlEnum("provider", ["smtp", "sendgrid", "ses", "resend"]).notNull(),
  
  // SMTP
  smtpHost: varchar("smtpHost", { length: 255 }),
  smtpPort: int("smtpPort"),
  smtpUser: varchar("smtpUser", { length: 255 }),
  smtpPassword: text("smtpPassword"), // Criptografado
  smtpSecure: tinyint("smtpSecure").default(1), // 1 = TLS, 0 = sem criptografia
  
  // SendGrid / Resend
  apiKey: text("apiKey"), // Criptografado
  
  // AWS SES
  awsRegion: varchar("awsRegion", { length: 50 }),
  awsAccessKey: varchar("awsAccessKey", { length: 255 }),
  awsSecretKey: text("awsSecretKey"), // Criptografado
  
  // Configurações gerais
  senderEmail: varchar("senderEmail", { length: 320 }).notNull(),
  senderName: varchar("senderName", { length: 100 }).notNull(),
  replyToEmail: varchar("replyToEmail", { length: 320 }),
  enabled: tinyint("enabled").default(1).notNull(), // 1 = ativo, 0 = inativo
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type EmailSetting = typeof emailSettings.$inferSelect;
export type InsertEmailSetting = typeof emailSettings.$inferInsert;

/**
 * Log de emails enviados (monitoramento)
 */
export const emailLogs = mysqlTable("emailLogs", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").references(() => events.id, { onDelete: "set null" }),
  registrationId: int("registrationId").references(() => registrations.id, { onDelete: "set null" }),
  templateType: mysqlEnum("templateType", ["approval", "rejection", "pending", "purchase", "confirmation"]),
  recipient: varchar("recipient", { length: 320 }).notNull(),
  subject: varchar("subject", { length: 200 }).notNull(),
  status: mysqlEnum("status", ["sent", "failed", "pending"]).default("pending").notNull(),
  error: text("error"), // Mensagem de erro caso falhe
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EmailLog = typeof emailLogs.$inferSelect;
export type InsertEmailLog = typeof emailLogs.$inferInsert;

/**
 * Event Collaborators - Sistema de hierarquia de permissões por evento
 */
export const eventCollaborators = mysqlTable("eventCollaborators", {
  id: int("id").autoincrement().primaryKey(),
  eventId: int("eventId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["coordinator", "supervisor", "checkin"]).notNull(),
  status: mysqlEnum("status", ["pending", "active"]).default("pending").notNull(),
  inviteToken: varchar("inviteToken", { length: 64 }).notNull().unique(),
  userId: int("userId"), // NULL até aceitar convite
  invitedBy: int("invitedBy").notNull(), // userId de quem convidou
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  acceptedAt: timestamp("acceptedAt"),
});

export type EventCollaborator = typeof eventCollaborators.$inferSelect;
export type InsertEventCollaborator = typeof eventCollaborators.$inferInsert;
