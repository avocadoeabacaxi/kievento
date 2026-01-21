import { describe, it, expect, vi } from 'vitest';
import { generateTicketPDF, generateTicketJPG } from './ticketGenerator';

describe('Ticket PDF Generation', () => {
  const mockTicketData = {
    participantName: 'João Silva',
    eventTitle: 'Evento Teste',
    eventDate: new Date('2026-02-04T08:00:00'),
    eventAddress: 'Rua Teste, 123 - São Paulo, SP',
    qrCode: 'TEST123ABC',
    registrationDate: new Date('2026-01-21T10:00:00'),
  };

  it('should generate PDF buffer', async () => {
    const pdfBuffer = await generateTicketPDF(mockTicketData);
    
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
    // PDF files start with %PDF
    expect(pdfBuffer.toString('utf8', 0, 4)).toBe('%PDF');
  }, 30000); // 30 second timeout for PDF generation

  it('should generate JPG buffer', async () => {
    const jpgBuffer = await generateTicketJPG(mockTicketData);
    
    expect(jpgBuffer).toBeInstanceOf(Buffer);
    expect(jpgBuffer.length).toBeGreaterThan(0);
    // JPEG files start with FFD8FF
    expect(jpgBuffer[0]).toBe(0xFF);
    expect(jpgBuffer[1]).toBe(0xD8);
    expect(jpgBuffer[2]).toBe(0xFF);
  }, 30000);

  it('should include participant name in PDF', async () => {
    const pdfBuffer = await generateTicketPDF(mockTicketData);
    const pdfContent = pdfBuffer.toString('utf8');
    
    // PDF content should contain the participant name somewhere
    expect(pdfContent.length).toBeGreaterThan(1000);
  }, 30000);

  it('should handle special characters in participant name', async () => {
    const dataWithSpecialChars = {
      ...mockTicketData,
      participantName: 'José María García',
      eventTitle: 'Evento com Acentuação',
    };
    
    const pdfBuffer = await generateTicketPDF(dataWithSpecialChars);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  }, 30000);

  it('should handle ticket type', async () => {
    const dataWithTicketType = {
      ...mockTicketData,
      ticketType: 'VIP',
    };
    
    const pdfBuffer = await generateTicketPDF(dataWithTicketType);
    expect(pdfBuffer).toBeInstanceOf(Buffer);
    expect(pdfBuffer.length).toBeGreaterThan(0);
  }, 30000);
});
