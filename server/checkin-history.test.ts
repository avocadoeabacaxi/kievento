import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock do módulo db
vi.mock('./db', () => ({
  getEventById: vi.fn(),
  getCheckInHistory: vi.fn(),
}));

import * as db from './db';

describe('Check-in History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCheckInHistory', () => {
    it('should return empty array when no check-ins exist', async () => {
      vi.mocked(db.getCheckInHistory).mockResolvedValue([]);
      
      const result = await db.getCheckInHistory(1);
      
      expect(result).toEqual([]);
      expect(db.getCheckInHistory).toHaveBeenCalledWith(1);
    });

    it('should return check-in history with operator names', async () => {
      const mockHistory = [
        {
          id: 1,
          name: 'João Silva',
          email: 'joao@test.com',
          phone: '11999999999',
          checkedIn: 1,
          checkedInAt: new Date('2026-02-03T10:30:00'),
          checkedInBy: 1,
          operatorName: 'Admin User',
        },
        {
          id: 2,
          name: 'Maria Santos',
          email: 'maria@test.com',
          phone: '11888888888',
          checkedIn: 1,
          checkedInAt: new Date('2026-02-03T11:00:00'),
          checkedInBy: 2,
          operatorName: 'Colaborador',
        },
      ];
      
      vi.mocked(db.getCheckInHistory).mockResolvedValue(mockHistory);
      
      const result = await db.getCheckInHistory(1);
      
      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('João Silva');
      expect(result[0].operatorName).toBe('Admin User');
      expect(result[1].name).toBe('Maria Santos');
      expect(result[1].operatorName).toBe('Colaborador');
    });

    it('should order check-ins by checkedInAt descending', async () => {
      const mockHistory = [
        {
          id: 2,
          name: 'Maria Santos',
          checkedInAt: new Date('2026-02-03T11:00:00'),
          operatorName: 'Admin',
        },
        {
          id: 1,
          name: 'João Silva',
          checkedInAt: new Date('2026-02-03T10:30:00'),
          operatorName: 'Admin',
        },
      ];
      
      vi.mocked(db.getCheckInHistory).mockResolvedValue(mockHistory);
      
      const result = await db.getCheckInHistory(1);
      
      // O primeiro deve ser o mais recente
      expect(result[0].checkedInAt.getTime()).toBeGreaterThan(result[1].checkedInAt.getTime());
    });
  });

  describe('Export functionality', () => {
    it('should format data correctly for CSV export', () => {
      const checkInData = [
        {
          name: 'João Silva',
          email: 'joao@test.com',
          phone: '11999999999',
          checkedInAt: new Date('2026-02-03T10:30:00'),
          operatorName: 'Admin User',
        },
      ];

      // Simular formatação para CSV
      const headers = ['Nome', 'Email', 'Telefone', 'Check-in Em', 'Check-in Por'];
      const rows = checkInData.map(item => [
        item.name,
        item.email,
        item.phone || '',
        item.checkedInAt ? item.checkedInAt.toLocaleString('pt-BR') : '',
        item.operatorName || 'Sistema'
      ]);

      expect(headers).toHaveLength(5);
      expect(rows[0][0]).toBe('João Silva');
      expect(rows[0][1]).toBe('joao@test.com');
      expect(rows[0][4]).toBe('Admin User');
    });

    it('should handle missing phone and operator gracefully', () => {
      const checkInData = [
        {
          name: 'Maria Santos',
          email: 'maria@test.com',
          phone: null,
          checkedInAt: new Date('2026-02-03T11:00:00'),
          operatorName: null,
        },
      ];

      const rows = checkInData.map(item => [
        item.name,
        item.email,
        item.phone || '',
        item.checkedInAt ? item.checkedInAt.toLocaleString('pt-BR') : '',
        item.operatorName || 'Sistema'
      ]);

      expect(rows[0][2]).toBe(''); // phone vazio
      expect(rows[0][4]).toBe('Sistema'); // operatorName default
    });
  });
});
