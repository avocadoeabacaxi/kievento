// Endpoint de teste para verificar envio de email
import * as db from "./db";
import { sendApprovalEmail } from "./emailService";

export async function testEmailSend() {
  console.log('[TEST] ========== INICIANDO TESTE DE EMAIL ==========');
  
  // 1. Buscar configuração de email
  const emailConfig = await db.getActiveEmailSetting();
  console.log('[TEST] Email config:', JSON.stringify(emailConfig, null, 2));
  
  if (!emailConfig) {
    console.log('[TEST] ERRO: Configuração de email não encontrada');
    return { success: false, error: 'No email config' };
  }
  
  // 2. Testar envio
  const result = await sendApprovalEmail({
    eventId: 90009,
    registrationId: 1,
    recipientEmail: 'fernando@avocado.buzz',
    participantName: 'TESTE',
    eventTitle: 'Conversa de Padaria',
    eventDate: '4 de fevereiro de 2026 às 08:00',
    eventAddress: 'Ribeirão Preto',
    ticketUrl: 'https://kievento.com.br/ticket/test123',
    qrCode: 'test123',
  });
  
  console.log('[TEST] Resultado:', result);
  return { success: result };
}
