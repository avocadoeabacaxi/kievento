import { describe, expect, it, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import * as db from "./db";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(role: "admin" | "user" = "user"): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };

  return ctx;
}

describe("Events API", () => {
  it("should create an event successfully", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.create({
      title: "Test Event",
      description: "<p>Test description</p>",
      eventDate: new Date().toISOString(),
      address: "Test Address",
      registrationType: "open",
      formFields: [
        {
          label: "Nome",
          fieldType: "text",
          required: true,
          order: 0,
        },
      ],
    });

    expect(result).toHaveProperty("eventId");
    expect(typeof result.eventId).toBe("number");
  });

  it("should list user events", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an event first
    await caller.events.create({
      title: "My Event",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    const events = await caller.events.myEvents();
    expect(Array.isArray(events)).toBe(true);
    expect(events.length).toBeGreaterThan(0);
    expect(events[0]).toHaveProperty("title");
    expect(events[0]).toHaveProperty("stats");
  });

  it("should get event by id", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an event
    const { eventId } = await caller.events.create({
      title: "Event Details Test",
      eventDate: new Date().toISOString(),
      registrationType: "approval",
    });

    const event = await caller.events.getById({ eventId: Number(eventId) });
    expect(event).toBeDefined();
    expect(event.title).toBe("Event Details Test");
    expect(event.registrationType).toBe("approval");
    expect(Array.isArray(event.formFields)).toBe(true);
  });

  it("admin should list all events", async () => {
    const adminCtx = createAuthContext("admin");
    const adminCaller = appRouter.createCaller(adminCtx);

    const events = await adminCaller.events.allEvents();
    expect(Array.isArray(events)).toBe(true);
  });

  it("non-admin should not access allEvents", async () => {
    const userCtx = createAuthContext("user");
    const userCaller = appRouter.createCaller(userCtx);

    await expect(userCaller.events.allEvents()).rejects.toThrow();
  });

  it("should get event stats", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { eventId } = await caller.events.create({
      title: "Stats Test Event",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    const stats = await caller.events.getStats({ eventId: Number(eventId) });
    expect(stats).toHaveProperty("total");
    expect(stats).toHaveProperty("pending");
    expect(stats).toHaveProperty("approved");
    expect(stats).toHaveProperty("rejected");
    expect(stats).toHaveProperty("checkedIn");
    expect(stats.total).toBe(0);
  });
});

describe("Registrations API", () => {
  it("should create a registration for open event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create an open event
    const { eventId } = await caller.events.create({
      title: "Open Event",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    // Create registration without auth (public)
    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "John Doe",
      email: "john@example.com",
      phone: "123456789",
      formData: JSON.stringify({ Nome: "John Doe" }),
    });

    expect(registration).toHaveProperty("registrationId");
    expect(registration).toHaveProperty("qrCode");
    expect(registration.status).toBe("approved");
  });

  it("should create pending registration for approval event", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create approval event
    const { eventId } = await caller.events.create({
      title: "Approval Event",
      eventDate: new Date().toISOString(),
      registrationType: "approval",
    });

    // Create registration
    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "Jane Doe",
      email: "jane@example.com",
      formData: JSON.stringify({ Nome: "Jane Doe" }),
    });

    expect(registration.status).toBe("pending");
  });

  it("should approve registration", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create event and registration
    const { eventId } = await caller.events.create({
      title: "Test Event",
      eventDate: new Date().toISOString(),
      registrationType: "approval",
    });

    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "Test User",
      email: "test@example.com",
      formData: JSON.stringify({}),
    });

    // Approve registration
    const result = await caller.registrations.updateStatus({
      registrationId: Number(registration.registrationId),
      status: "approved",
    });

    expect(result.success).toBe(true);
  });

  it("should check in by QR code", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Create event and approved registration
    const { eventId } = await caller.events.create({
      title: "Check-in Test",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "Check-in User",
      email: "checkin@example.com",
      formData: JSON.stringify({}),
    });

    // Check in
    const result = await caller.registrations.checkInByQrCode({
      qrCode: registration.qrCode,
    });

    expect(result.success).toBe(true);
    expect(result.registration).toBeDefined();
  });

  it("should not check in twice", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { eventId } = await caller.events.create({
      title: "Double Check-in Test",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "Double User",
      email: "double@example.com",
      formData: JSON.stringify({}),
    });

    // First check-in
    await caller.registrations.checkInByQrCode({ qrCode: registration.qrCode });

    // Second check-in should fail
    await expect(
      caller.registrations.checkInByQrCode({ qrCode: registration.qrCode })
    ).rejects.toThrow("Already checked in");
  });

  it("should get registration by QR code", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const { eventId } = await caller.events.create({
      title: "QR Test Event",
      eventDate: new Date().toISOString(),
      registrationType: "open",
    });

    const publicCtx: TrpcContext = {
      user: undefined,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };
    const publicCaller = appRouter.createCaller(publicCtx);

    const registration = await publicCaller.registrations.create({
      eventId: Number(eventId),
      name: "QR User",
      email: "qr@example.com",
      formData: JSON.stringify({}),
    });

    const result = await publicCaller.registrations.getByQrCode({
      qrCode: registration.qrCode,
    });

    expect(result).toHaveProperty("registration");
    expect(result).toHaveProperty("event");
    expect(result.registration.name).toBe("QR User");
    expect(result.event.title).toBe("QR Test Event");
  });
});
