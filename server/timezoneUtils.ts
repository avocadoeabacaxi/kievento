import { toZonedTime, fromZonedTime } from 'date-fns-tz';

/**
 * Converte uma string datetime-local para Date UTC considerando o timezone do evento
 * @param datetimeLocal - String no formato "YYYY-MM-DDTHH:mm" do input datetime-local
 * @param timezone - Timezone do evento (ex: "America/Sao_Paulo")
 * @returns Date object em UTC que representa o mesmo momento no timezone especificado
 * 
 * Exemplo: Se usuário digita "2026-02-04T17:16" e timezone é "America/Sao_Paulo" (GMT-3),
 * a função retorna um Date que quando exibido em GMT-3 mostrará 17:16
 */
export function parseEventDateTime(datetimeLocal: string, timezone: string = "America/Sao_Paulo"): Date {
  if (!datetimeLocal) {
    throw new Error("datetime is required");
  }

  try {
    // Parse a string como se fosse no timezone especificado
    // "2026-02-04T17:16" no timezone "America/Sao_Paulo" 
    // será convertido para UTC mantendo o significado temporal correto
    const date = new Date(datetimeLocal);
    
    // Converter para UTC considerando que a data de entrada está no timezone especificado
    return fromZonedTime(date, timezone);
  } catch (error) {
    console.error('Erro ao parsear data:', error);
    throw new Error("Invalid datetime format");
  }
}

/**
 * Converte Date UTC para o timezone do evento (usado para exibição)
 * @param date - Date object em UTC
 * @param timezone - Timezone do evento
 * @returns Date object ajustado para o timezone
 */
export function convertToEventTimezone(date: Date, timezone: string = "America/Sao_Paulo"): Date {
  return toZonedTime(date, timezone);
}
