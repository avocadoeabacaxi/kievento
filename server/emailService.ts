import * as db from "./db";

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

interface SendEventEmailParams {
  eventId: number;
  registrationId: number;
  templateType: "approval" | "rejection" | "pending" | "purchase" | "confirmation";
  recipientEmail: string;
  variables: {
    nome: string;
    email: string;
    evento: string;
    data: string;
    local: string;
    qrcode?: string;
    convite_url?: string;
  };
}

/**
 * Substitui variáveis no template
 */
function replaceVariables(template: string, variables: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(variables)) {
    const regex = new RegExp(`{{${key}}}`, 'g');
    result = result.replace(regex, value || '');
  }
  return result;
}

/**
 * Envia email usando templates personalizados do evento
 */
export async function sendEventEmail(params: SendEventEmailParams): Promise<boolean> {
  try {
    // 1. Buscar template personalizado do evento
    const customTemplate = await db.getEmailTemplateByEventAndType(params.eventId, params.templateType);
    
    // 2. Se não houver template personalizado ou estiver desativado, usar template padrão
    if (!customTemplate || customTemplate.enabled !== 1) {
      console.log(`[Email Service] Template ${params.templateType} não encontrado ou desativado para evento ${params.eventId}`);
      return false;
    }

    // 3. Substituir variáveis no assunto e corpo
    const subject = replaceVariables(customTemplate.subject, params.variables);
    const html = replaceVariables(customTemplate.htmlBody, params.variables);

    // 4. Buscar configurações globais de email
    const emailConfig = await db.getActiveEmailSetting();
    if (!emailConfig || emailConfig.enabled !== 1) {
      console.log('[Email Service] Configurações de email não encontradas ou desativadas');
      return false;
    }

    // 5. Criar log de email
    const logId = await db.createEmailLog({
      eventId: params.eventId,
      registrationId: params.registrationId,
      templateType: params.templateType,
      recipient: params.recipientEmail,
      subject,
      status: "pending",
    });

    // 6. Enviar email usando o provedor configurado
    let success = false;
    try {
      success = await sendEmailWithProvider({
        to: params.recipientEmail,
        subject,
        html,
        config: emailConfig,
      });

      // 7. Atualizar log com resultado
      await db.updateEmailLog(logId, {
        status: success ? "sent" : "failed",
        sentAt: success ? new Date() : undefined,
        error: success ? undefined : "Falha ao enviar email",
      });

      return success;
    } catch (error) {
      await db.updateEmailLog(logId, {
        status: "failed",
        error: error instanceof Error ? error.message : "Erro desconhecido",
      });
      return false;
    }
  } catch (error) {
    console.error('[Email Service] Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia email usando o provedor configurado
 */
async function sendEmailWithProvider(params: {
  to: string;
  subject: string;
  html: string;
  config: any;
}): Promise<boolean> {
  const { to, subject, html, config } = params;

  console.log('[Email Service] Enviando email:');
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Provedor:', config.provider);

  // TODO: Implementar integração real com provedores
  // Por enquanto, apenas simula o envio
  
  switch (config.provider) {
    case "smtp":
      // TODO: Implementar SMTP com nodemailer
      console.log('[Email Service] SMTP:', config.smtpHost, config.smtpPort);
      break;
    
    case "sendgrid":
      // TODO: Implementar SendGrid
      console.log('[Email Service] SendGrid API Key:', config.apiKey?.substring(0, 10) + '...');
      break;
    
    case "resend":
      // TODO: Implementar Resend
      console.log('[Email Service] Resend API Key:', config.apiKey?.substring(0, 10) + '...');
      break;
    
    case "ses":
      // TODO: Implementar AWS SES
      console.log('[Email Service] AWS SES Region:', config.awsRegion);
      break;
  }

  // Simula envio bem-sucedido
  return true;
}

/**
 * Serviço de envio de e-mails (método legado)
 * @deprecated Use sendEventEmail para emails de eventos
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    console.log('[Email Service] Enviando e-mail (método legado):');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    return true;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail:', error);
    return false;
  }
}

// Templates padrão (mantidos para compatibilidade)
export function getApprovalEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
}): string {
  return `<h2>Olá, ${params.participantName}!</h2>
<p>Sua inscrição para o evento <strong>${params.eventTitle}</strong> foi aprovada!</p>
<p><strong>Data:</strong> ${params.eventDate}</p>
${params.eventAddress ? `<p><strong>Local:</strong> ${params.eventAddress}</p>` : ''}
<p>Acesse seu ingresso: <a href="${params.ticketUrl}">Clique aqui</a></p>`;
}

export function getRejectionEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
}): string {
  return `<h2>Olá, ${params.participantName}!</h2>
<p>Infelizmente não foi possível aprovar sua inscrição para o evento <strong>${params.eventTitle}</strong>.</p>
<p>Agradecemos seu interesse!</p>`;
}

export function getConfirmationEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
}): string {
  return `<h2>Olá, ${params.participantName}!</h2>
<p>Sua inscrição para o evento <strong>${params.eventTitle}</strong> foi confirmada!</p>
<p><strong>Data:</strong> ${params.eventDate}</p>
${params.eventAddress ? `<p><strong>Local:</strong> ${params.eventAddress}</p>` : ''}
<p>Acesse seu ingresso: <a href="${params.ticketUrl}">Clique aqui</a></p>`;
}
