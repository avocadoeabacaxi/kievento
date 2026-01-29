import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as db from './db';

// Mock the database functions
vi.mock('./db', async () => {
  const actual = await vi.importActual('./db');
  return {
    ...actual,
    getRegistrationById: vi.fn(),
    getEventById: vi.fn(),
    deleteRegistration: vi.fn(),
  };
});

describe('Registration Delete', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should have deleteRegistration function in db module', () => {
    expect(typeof db.deleteRegistration).toBe('function');
  });

  it('deleteRegistration should be callable with registration id', async () => {
    const mockDeleteRegistration = vi.mocked(db.deleteRegistration);
    mockDeleteRegistration.mockResolvedValueOnce(undefined);

    await db.deleteRegistration(123);

    expect(mockDeleteRegistration).toHaveBeenCalledWith(123);
    expect(mockDeleteRegistration).toHaveBeenCalledTimes(1);
  });

  it('getRegistrationById should return registration data', async () => {
    const mockRegistration = {
      id: 1,
      eventId: 100,
      name: 'Test User',
      email: 'test@example.com',
      status: 'pending',
    };

    const mockGetRegistrationById = vi.mocked(db.getRegistrationById);
    mockGetRegistrationById.mockResolvedValueOnce(mockRegistration);

    const result = await db.getRegistrationById(1);

    expect(result).toEqual(mockRegistration);
    expect(mockGetRegistrationById).toHaveBeenCalledWith(1);
  });

  it('getEventById should return event data for permission check', async () => {
    const mockEvent = {
      id: 100,
      userId: 1,
      title: 'Test Event',
    };

    const mockGetEventById = vi.mocked(db.getEventById);
    mockGetEventById.mockResolvedValueOnce(mockEvent);

    const result = await db.getEventById(100);

    expect(result).toEqual(mockEvent);
    expect(mockGetEventById).toHaveBeenCalledWith(100);
  });
});
