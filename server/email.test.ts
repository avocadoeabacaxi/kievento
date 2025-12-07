import { describe, expect, it } from "vitest";
import {
  getApprovalEmailTemplate,
  getRejectionEmailTemplate,
  getConfirmationEmailTemplate,
} from "./emailService";

describe("Email Templates", () => {
  it("deve gerar template de aprovação com todos os campos", () => {
    const html = getApprovalEmailTemplate({
      participantName: "João Silva",
      eventTitle: "Workshop de React",
      eventDate: "15 de dezembro de 2024 às 19:00",
      eventAddress: "Rua Exemplo, 123, São Paulo - SP",
      ticketUrl: "https://kievento.com/ticket/abc123",
    });

    expect(html).toContain("João Silva");
    expect(html).toContain("Workshop de React");
    expect(html).toContain("15 de dezembro de 2024 às 19:00");
    expect(html).toContain("Rua Exemplo, 123, São Paulo - SP");
    expect(html).toContain("https://kievento.com/ticket/abc123");
    expect(html).toContain("Inscrição Aprovada");
    expect(html).toContain("Ver Meu Convite com QR Code");
  });

  it("deve gerar template de rejeição com nome e título do evento", () => {
    const html = getRejectionEmailTemplate({
      participantName: "Maria Santos",
      eventTitle: "Conferência de Tecnologia",
      reason: "Vagas esgotadas",
    });

    expect(html).toContain("Maria Santos");
    expect(html).toContain("Conferência de Tecnologia");
    expect(html).toContain("Vagas esgotadas");
    expect(html).toContain("Atualização sobre sua inscrição");
  });

  it("deve gerar template de rejeição sem motivo", () => {
    const html = getRejectionEmailTemplate({
      participantName: "Pedro Oliveira",
      eventTitle: "Meetup de Desenvolvedores",
    });

    expect(html).toContain("Pedro Oliveira");
    expect(html).toContain("Meetup de Desenvolvedores");
    expect(html).not.toContain("Motivo");
  });

  it("deve gerar template de confirmação para eventos abertos", () => {
    const html = getConfirmationEmailTemplate({
      participantName: "Ana Costa",
      eventTitle: "Palestra sobre IA",
      eventDate: "20 de dezembro de 2024 às 14:00",
      eventAddress: "Av. Paulista, 1000, São Paulo - SP",
      ticketUrl: "https://kievento.com/ticket/xyz789",
    });

    expect(html).toContain("Ana Costa");
    expect(html).toContain("Palestra sobre IA");
    expect(html).toContain("20 de dezembro de 2024 às 14:00");
    expect(html).toContain("Av. Paulista, 1000, São Paulo - SP");
    expect(html).toContain("https://kievento.com/ticket/xyz789");
    expect(html).toContain("Inscrição Confirmada");
  });

  it("deve gerar templates válidos sem endereço", () => {
    const approvalHtml = getApprovalEmailTemplate({
      participantName: "Carlos Lima",
      eventTitle: "Evento Online",
      eventDate: "25 de dezembro de 2024 às 10:00",
      ticketUrl: "https://kievento.com/ticket/online123",
    });

    expect(approvalHtml).toContain("Carlos Lima");
    expect(approvalHtml).toContain("Evento Online");
    expect(approvalHtml).not.toContain("Local:");
  });

  it("deve incluir estrutura HTML válida em todos os templates", () => {
    const templates = [
      getApprovalEmailTemplate({
        participantName: "Teste",
        eventTitle: "Teste",
        eventDate: "Teste",
        ticketUrl: "https://test.com",
      }),
      getRejectionEmailTemplate({
        participantName: "Teste",
        eventTitle: "Teste",
      }),
      getConfirmationEmailTemplate({
        participantName: "Teste",
        eventTitle: "Teste",
        eventDate: "Teste",
        ticketUrl: "https://test.com",
      }),
    ];

    templates.forEach((html) => {
      expect(html).toContain("<!DOCTYPE html>");
      expect(html).toContain("<html");
      expect(html).toContain("</html>");
      expect(html).toContain("<head>");
      expect(html).toContain("</head>");
      expect(html).toContain("<body");
      expect(html).toContain("</body>");
      expect(html).toContain("KiEvento");
    });
  });
});
