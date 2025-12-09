import { getEventById, getCollaboratorByEventAndUser } from "./db";
import type { User } from "../drizzle/schema";

export type CollaboratorRole = "coordinator" | "supervisor" | "checkin";

export interface EventPermissions {
  canEditEvent: boolean;
  canDeleteEvent: boolean;
  canManageCollaborators: boolean;
  canConfigureEmails: boolean;
  canApproveRegistrations: boolean;
  canCreateParticipants: boolean;
  canEditParticipants: boolean;
  canDeleteParticipants: boolean;
  canCheckin: boolean;
  canExportData: boolean;
  canSendEmails: boolean;
  canViewStatistics: boolean;
}

/**
 * Verifica as permissões de um usuário em um evento específico
 */
export async function getEventPermissions(
  eventId: number,
  user: User
): Promise<EventPermissions> {
  // Super Admin tem todas as permissões
  if (user.role === "admin") {
    return {
      canEditEvent: true,
      canDeleteEvent: true,
      canManageCollaborators: true,
      canConfigureEmails: true,
      canApproveRegistrations: true,
      canCreateParticipants: true,
      canEditParticipants: true,
      canDeleteParticipants: true,
      canCheckin: true,
      canExportData: true,
      canSendEmails: true,
      canViewStatistics: true,
    };
  }

  // Verificar se é dono do evento
  const event = await getEventById(eventId);
  if (event && event.userId === user.id) {
    // Admin do evento (criador) tem todas as permissões
    return {
      canEditEvent: true,
      canDeleteEvent: true,
      canManageCollaborators: true,
      canConfigureEmails: true,
      canApproveRegistrations: true,
      canCreateParticipants: true,
      canEditParticipants: true,
      canDeleteParticipants: true,
      canCheckin: true,
      canExportData: true,
      canSendEmails: true,
      canViewStatistics: true,
    };
  }

  // Verificar se é colaborador
  const collaborator = await getCollaboratorByEventAndUser(eventId, user.id);
  if (!collaborator || collaborator.status !== "active") {
    // Sem permissões
    return {
      canEditEvent: false,
      canDeleteEvent: false,
      canManageCollaborators: false,
      canConfigureEmails: false,
      canApproveRegistrations: false,
      canCreateParticipants: false,
      canEditParticipants: false,
      canDeleteParticipants: false,
      canCheckin: false,
      canExportData: false,
      canSendEmails: false,
      canViewStatistics: false,
    };
  }

  // Permissões baseadas no nível do colaborador
  switch (collaborator.role) {
    case "coordinator":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageCollaborators: false,
        canConfigureEmails: false,
        canApproveRegistrations: true,
        canCreateParticipants: true,
        canEditParticipants: true,
        canDeleteParticipants: true,
        canCheckin: true,
        canExportData: true,
        canSendEmails: true,
        canViewStatistics: true,
      };

    case "supervisor":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageCollaborators: false,
        canConfigureEmails: false,
        canApproveRegistrations: false,
        canCreateParticipants: true,
        canEditParticipants: false,
        canDeleteParticipants: false,
        canCheckin: true,
        canExportData: false,
        canSendEmails: false,
        canViewStatistics: false,
      };

    case "checkin":
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageCollaborators: false,
        canConfigureEmails: false,
        canApproveRegistrations: false,
        canCreateParticipants: false,
        canEditParticipants: false,
        canDeleteParticipants: false,
        canCheckin: true,
        canExportData: false,
        canSendEmails: false,
        canViewStatistics: false,
      };

    default:
      return {
        canEditEvent: false,
        canDeleteEvent: false,
        canManageCollaborators: false,
        canConfigureEmails: false,
        canApproveRegistrations: false,
        canCreateParticipants: false,
        canEditParticipants: false,
        canDeleteParticipants: false,
        canCheckin: false,
        canExportData: false,
        canSendEmails: false,
        canViewStatistics: false,
      };
  }
}

/**
 * Verifica se o usuário pode acessar um evento (dono, admin ou colaborador ativo)
 */
export async function canAccessEvent(eventId: number, user: User): Promise<boolean> {
  if (user.role === "admin") return true;

  const event = await getEventById(eventId);
  if (event && event.userId === user.id) return true;

  const collaborator = await getCollaboratorByEventAndUser(eventId, user.id);
  return collaborator !== null && collaborator.status === "active";
}

/**
 * Tradução de nível de colaborador para português
 */
export function getRoleLabel(role: CollaboratorRole): string {
  switch (role) {
    case "coordinator":
      return "Coordenador";
    case "supervisor":
      return "Supervisor";
    case "checkin":
      return "Check-in";
    default:
      return role;
  }
}
