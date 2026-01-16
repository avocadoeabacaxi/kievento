import { format, toZonedTime } from 'date-fns-tz';
import { ptBR } from 'date-fns/locale';

/**
 * Formata uma data considerando o timezone do evento
 * @param date - Data a ser formatada (string ISO ou Date)
 * @param timezone - Timezone do evento (ex: "America/Sao_Paulo")
 * @param formatString - Formato desejado (padrão: "dd/MM/yyyy 'às' HH:mm")
 * @returns String formatada no timezone correto
 */
export function formatEventDate(
  date: string | Date,
  timezone: string = "America/Sao_Paulo",
  formatString: string = "dd/MM/yyyy 'às' HH:mm"
): string {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    
    // Converter para o timezone do evento
    const zonedDate = toZonedTime(dateObj, timezone);
    
    // Formatar a data
    return format(zonedDate, formatString, { 
      locale: ptBR,
      timeZone: timezone 
    });
  } catch (error) {
    console.error('Erro ao formatar data:', error);
    return 'Data inválida';
  }
}

/**
 * Formata apenas a data (sem hora)
 */
export function formatEventDateOnly(
  date: string | Date,
  timezone: string = "America/Sao_Paulo"
): string {
  return formatEventDate(date, timezone, "dd/MM/yyyy");
}

/**
 * Formata apenas a hora
 */
export function formatEventTimeOnly(
  date: string | Date,
  timezone: string = "America/Sao_Paulo"
): string {
  return formatEventDate(date, timezone, "HH:mm");
}

/**
 * Formata data completa com dia da semana
 */
export function formatEventDateFull(
  date: string | Date,
  timezone: string = "America/Sao_Paulo"
): string {
  return formatEventDate(date, timezone, "EEEE, dd 'de' MMMM 'de' yyyy 'às' HH:mm");
}

/**
 * Converte uma data do input datetime-local para ISO string no timezone especificado
 * @param datetimeLocal - Valor do input datetime-local (ex: "2024-01-20T14:30")
 * @param timezone - Timezone do evento (ex: "America/Sao_Paulo")
 * @returns ISO string que representa a mesma data/hora no timezone especificado
 */
export function convertLocalDateTimeToTimezone(
  datetimeLocal: string,
  timezone: string = "America/Sao_Paulo"
): string {
  if (!datetimeLocal) return "";
  
  try {
    // datetime-local retorna formato "YYYY-MM-DDTHH:mm"
    // Precisamos interpretar isso como sendo no timezone do evento, não UTC
    const [datePart, timePart] = datetimeLocal.split('T');
    const [year, month, day] = datePart.split('-').map(Number);
    const [hour, minute] = timePart.split(':').map(Number);
    
    // Criar data no timezone especificado
    const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
    
    // Retornar como ISO string (o backend vai salvar isso)
    return new Date(dateStr).toISOString();
  } catch (error) {
    console.error('Erro ao converter data:', error);
    return new Date(datetimeLocal).toISOString();
  }
}
