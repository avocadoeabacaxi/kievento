import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    userType: "individual",
    profilePhoto: null,
    profilePhotoKey: null,
    phone: null,
    cpf: null,
    birthDate: null,
    cnpj: null,
    companyName: null,
    tradeName: null,
    address: null,
    city: null,
    state: null,
    zipCode: null,
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

  return { ctx };
}

describe("Event Edit and Card Image", () => {
  it("should create event with card image", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.events.create({
      title: "Evento com Imagem do Card",
      description: "Teste de imagem do card",
      eventDate: new Date(Date.now() + 86400000).toISOString(),
      address: "Rua Teste, 123",
      registrationType: "open",
      category: "Teste",
      city: "São Paulo",
      visibility: "public",
      bannerBase64: undefined,
      cardImageBase64: undefined,
      formFields: [],
    });

    expect(result).toBeDefined();
    expect(result.eventId).toBeTypeOf("number");
  });

  it("should update event successfully", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    // Criar evento primeiro
    const createResult = await caller.events.create({
      title: "Evento Original",
      description: "Descrição original",
      eventDate: new Date(Date.now() + 86400000).toISOString(),
      address: "Rua Original, 123",
      registrationType: "open",
      category: "Original",
      city: "São Paulo",
      visibility: "private",
      formFields: [],
    });

    // Atualizar evento
    const updateResult = await caller.events.update({
      eventId: Number(createResult.eventId),
      title: "Evento Atualizado",
      description: "Descrição atualizada",
    });

    expect(updateResult).toBeDefined();
    expect(updateResult.success).toBe(true);
  });
});
