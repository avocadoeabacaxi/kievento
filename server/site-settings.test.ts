import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Site Settings API", () => {
  let adminContext: Context;
  let userContext: Context;

  beforeAll(() => {
    // Mock admin context
    adminContext = {
      user: {
        id: 1,
        openId: "admin-openid",
        name: "Admin User",
        email: "admin@test.com",
        role: "admin",
        loginMethod: "oauth",
        profilePhoto: null,
        profilePhotoKey: null,
        userType: null,
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
      },
      req: {} as any,
      res: {} as any,
    };

    // Mock regular user context
    userContext = {
      user: {
        id: 2,
        openId: "user-openid",
        name: "Regular User",
        email: "user@test.com",
        role: "user",
        loginMethod: "oauth",
        profilePhoto: null,
        profilePhotoKey: null,
        userType: null,
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
      },
      req: {} as any,
      res: {} as any,
    };
  });

  it("should allow anyone to get site settings", async () => {
    const caller = appRouter.createCaller(userContext);
    
    // Primeiro, criar uma configuração como admin
    const adminCaller = appRouter.createCaller(adminContext);
    await adminCaller.siteSettings.update({
      key: "test_setting",
      value: "test_value",
    });

    // Agora buscar como usuário comum
    const setting = await caller.siteSettings.get({ key: "test_setting" });
    expect(setting).toBeDefined();
    expect(setting?.key).toBe("test_setting");
    expect(setting?.value).toBe("test_value");
  });

  it("should allow anyone to get all site settings", async () => {
    const caller = appRouter.createCaller(userContext);
    const settings = await caller.siteSettings.getAll();
    expect(Array.isArray(settings)).toBe(true);
  });

  it("should allow admin to update site settings", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    const result = await caller.siteSettings.update({
      key: "cookie_banner_text",
      value: "Utilizamos cookies para melhorar a sua experiência.",
    });

    expect(result).toBeDefined();
    expect(result?.key).toBe("cookie_banner_text");
    expect(result?.value).toBe("Utilizamos cookies para melhorar a sua experiência.");
  });

  it("should not allow regular user to update site settings", async () => {
    const caller = appRouter.createCaller(userContext);
    
    await expect(
      caller.siteSettings.update({
        key: "cookie_banner_text",
        value: "New text",
      })
    ).rejects.toThrow("Admin access required");
  });

  it("should allow admin to update multiple settings at once", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    const result = await caller.siteSettings.updateMultiple([
      { key: "cookie_banner_text", value: "Cookie text updated" },
      { key: "cookie_terms_link", value: "/termos-atualizados" },
      { key: "privacy_policy_link", value: "/privacidade-atualizada" },
    ]);

    expect(result.success).toBe(true);

    // Verificar se as configurações foram atualizadas
    const text = await caller.siteSettings.get({ key: "cookie_banner_text" });
    const terms = await caller.siteSettings.get({ key: "cookie_terms_link" });
    const privacy = await caller.siteSettings.get({ key: "privacy_policy_link" });

    expect(text?.value).toBe("Cookie text updated");
    expect(terms?.value).toBe("/termos-atualizados");
    expect(privacy?.value).toBe("/privacidade-atualizada");
  });

  it("should create new setting if it doesn't exist", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    const newKey = `new_setting_${Date.now()}`;
    const result = await caller.siteSettings.update({
      key: newKey,
      value: "New setting value",
    });

    expect(result).toBeDefined();
    expect(result?.key).toBe(newKey);
    expect(result?.value).toBe("New setting value");
  });

  it("should update existing setting", async () => {
    const caller = appRouter.createCaller(adminContext);
    
    // Criar
    await caller.siteSettings.update({
      key: "update_test",
      value: "Initial value",
    });

    // Atualizar
    const result = await caller.siteSettings.update({
      key: "update_test",
      value: "Updated value",
    });

    expect(result?.value).toBe("Updated value");
  });
});
