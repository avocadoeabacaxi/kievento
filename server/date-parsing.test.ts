import { describe, it, expect } from 'vitest';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Testes para o parsing robusto de datas do evento
 * Estes testes verificam que diferentes formatos de data são corretamente parseados
 */
describe('Date Parsing for Event Dates', () => {
  // Função auxiliar que simula o parsing robusto implementado no routers.ts
  function parseEventDate(eventDate: unknown): string {
    try {
      const eventDateValue = eventDate as unknown;
      if (eventDateValue instanceof Date) {
        return format(eventDateValue, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
      } else {
        const dateStr = String(eventDate);
        let eventDateObj: Date;
        
        // Formato ISO: 2026-02-04T08:00:00
        if (dateStr.includes('T')) {
          eventDateObj = new Date(dateStr);
        }
        // Formato: 2026-02-04 08:00
        else if (dateStr.includes(' ')) {
          eventDateObj = new Date(dateStr.replace(' ', 'T') + ':00');
        }
        // Formato: 2026-02-04T08:00 (sem segundos)
        else if (dateStr.length === 16) {
          eventDateObj = new Date(dateStr + ':00');
        }
        // Outros formatos
        else {
          eventDateObj = new Date(dateStr);
        }
        
        if (isNaN(eventDateObj.getTime())) {
          return dateStr; // Fallback
        }
        return format(eventDateObj, "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR });
      }
    } catch {
      return String(eventDate);
    }
  }

  it('deve parsear formato ISO completo (2026-02-04T08:00:00)', () => {
    const result = parseEventDate('2026-02-04T08:00:00');
    expect(result).toContain('04 de fevereiro de 2026');
    expect(result).toContain('08:00');
  });

  it('deve parsear formato ISO sem segundos (2026-02-04T08:00)', () => {
    const result = parseEventDate('2026-02-04T08:00');
    expect(result).toContain('04 de fevereiro de 2026');
    expect(result).toContain('08:00');
  });

  it('deve parsear formato com espaço (2026-02-04 08:00)', () => {
    const result = parseEventDate('2026-02-04 08:00');
    expect(result).toContain('04 de fevereiro de 2026');
    expect(result).toContain('08:00');
  });

  it('deve parsear objeto Date', () => {
    const date = new Date('2026-02-04T08:00:00');
    const result = parseEventDate(date);
    expect(result).toContain('04 de fevereiro de 2026');
    expect(result).toContain('08:00');
  });

  it('deve retornar string original para formato inválido', () => {
    const result = parseEventDate('invalid-date');
    expect(result).toBe('invalid-date');
  });
});
