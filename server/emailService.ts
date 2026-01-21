import * as db from "./db";
import { generateTicketJPG, generateTicketPDF } from "./ticketGenerator";

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

    // 6. Gerar anexo se configurado
    let attachments: Array<{ filename: string; content: Buffer; contentType: string }> | undefined;
    if (customTemplate.attachmentFormat && customTemplate.attachmentFormat !== 'none' && params.variables.qrcode) {
      try {
        // Buscar dados da inscrição e evento para gerar convite
        const registration = await db.getRegistrationById(params.registrationId);
        const event = await db.getEventById(params.eventId);
        
        if (registration && event && registration.qrCode) {
          // Buscar nome do tipo de ingresso se houver
          let ticketTypeName: string | undefined;
          if (registration.ticketTypeId) {
            const ticketType = await db.getTicketTypeById(registration.ticketTypeId);
            ticketTypeName = ticketType?.name;
          }

          const ticketData = {
            participantName: registration.name,
            eventTitle: event.title,
            eventDate: new Date(event.eventDate),
            eventAddress: event.address || '',
            qrCode: registration.qrCode,
            ticketType: ticketTypeName,
            registrationDate: new Date(registration.createdAt),
          };

          let attachmentBuffer: Buffer;
          let filename: string;
          let contentType: string;

          if (customTemplate.attachmentFormat === 'jpg') {
            attachmentBuffer = await generateTicketJPG(ticketData);
            filename = `convite-${registration.qrCode}.jpg`;
            contentType = 'image/jpeg';
          } else if (customTemplate.attachmentFormat === 'pdf') {
            attachmentBuffer = await generateTicketPDF(ticketData);
            filename = `convite-${registration.qrCode}.pdf`;
            contentType = 'application/pdf';
          } else {
            throw new Error('Formato de anexo inválido');
          }

          attachments = [{
            filename,
            content: attachmentBuffer,
            contentType,
          }];

          console.log(`[Email Service] Anexo gerado: ${filename}`);
        }
      } catch (error) {
        console.error('[Email Service] Erro ao gerar anexo:', error);
        // Continua sem anexo se houver erro
      }
    }

    // 7. Enviar email usando o provedor configurado
    let success = false;
    try {
      success = await sendEmailWithProvider({
        to: params.recipientEmail,
        subject,
        html,
        config: emailConfig,
        attachments,
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
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}): Promise<boolean> {
  const { to, subject, html, config, attachments } = params;

  console.log('[Email Service] Enviando email:');
  console.log('Para:', to);
  console.log('Assunto:', subject);
  console.log('Provedor:', config.provider);

  try {
    switch (config.provider) {
      case "smtp":
        return await sendWithSMTP({ to, subject, html, config, attachments });
      
      case "sendgrid":
        return await sendWithSendGrid({ to, subject, html, config, attachments });
      
      case "resend":
        return await sendWithResend({ to, subject, html, config, attachments });
      
      case "ses":
        console.log('[Email Service] AWS SES não implementado ainda');
        return false;
      
      default:
        console.error('[Email Service] Provedor desconhecido:', config.provider);
        return false;
    }
  } catch (error) {
    console.error('[Email Service] Erro ao enviar email:', error);
    return false;
  }
}

/**
 * Envia email via SMTP usando nodemailer
 */
async function sendWithSMTP(params: {
  to: string;
  subject: string;
  html: string;
  config: any;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}): Promise<boolean> {
  const nodemailer = await import('nodemailer');
  const { to, subject, html, config, attachments } = params;

  const transporter = nodemailer.default.createTransport({
    host: config.smtpHost,
    port: config.smtpPort,
    secure: config.smtpPort === 465,
    auth: {
      user: config.smtpUser,
      pass: config.smtpPassword,
    },
  });

  const mailOptions: any = {
    from: `"${config.senderName}" <${config.senderEmail}>`,
    to,
    subject,
    html,
    replyTo: config.replyToEmail,
  };

  if (attachments && attachments.length > 0) {
    mailOptions.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
      contentType: att.contentType,
    }));
  }

  await transporter.sendMail(mailOptions);
  console.log('[Email Service] Email enviado via SMTP com sucesso');
  return true;
}

/**
 * Envia email via SendGrid
 */
async function sendWithSendGrid(params: {
  to: string;
  subject: string;
  html: string;
  config: any;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}): Promise<boolean> {
  const sgMail = await import('@sendgrid/mail');
  const { to, subject, html, config, attachments } = params;

  sgMail.default.setApiKey(config.apiKey);

  const msg: any = {
    to,
    from: {
      email: config.senderEmail,
      name: config.senderName,
    },
    replyTo: config.replyToEmail,
    subject,
    html,
  };

  if (attachments && attachments.length > 0) {
    msg.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content.toString('base64'),
      type: att.contentType,
      disposition: 'attachment',
    }));
  }

  await sgMail.default.send(msg);
  console.log('[Email Service] Email enviado via SendGrid com sucesso');
  return true;
}

/**
 * Envia email via Resend
 */
async function sendWithResend(params: {
  to: string;
  subject: string;
  html: string;
  config: any;
  attachments?: Array<{ filename: string; content: Buffer; contentType: string }>;
}): Promise<boolean> {
  const { Resend } = await import('resend');
  const { to, subject, html, config, attachments } = params;

  const resend = new Resend(config.apiKey);

  const emailData: any = {
    from: `${config.senderName} <${config.senderEmail}>`,
    to,
    subject,
    html,
    reply_to: config.replyToEmail,
  };

  if (attachments && attachments.length > 0) {
    emailData.attachments = attachments.map(att => ({
      filename: att.filename,
      content: att.content,
    }));
  }

  try {
    const result = await resend.emails.send(emailData);
    console.log('[Email Service] Email enviado via Resend com sucesso:', result);
    return true;
  } catch (error: any) {
    console.error('[Email Service] Erro ao enviar via Resend:', error);
    throw new Error(`Erro Resend: ${error.message || 'Erro desconhecido'}`);
  }
}

/**
 * Envia email de teste usando configuração ativa
 */
export async function sendTestEmail(params: {
  to: string;
  subject: string;
  html: string;
  config: any;
}): Promise<boolean> {
  return await sendEmailWithProvider({
    to: params.to,
    subject: params.subject,
    html: params.html,
    config: params.config,
  });
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

/**
 * Envia e-mail de confirmação de inscrição usando template padrão ou personalizado
 * Esta função SEMPRE envia o e-mail, mesmo sem template personalizado
 */
export async function sendConfirmationEmail(params: {
  eventId: number;
  registrationId: number;
  recipientEmail: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
  qrCode: string;
}): Promise<boolean> {
  console.log('[Email Service] sendConfirmationEmail chamado com:', {
    eventId: params.eventId,
    registrationId: params.registrationId,
    recipientEmail: params.recipientEmail,
    participantName: params.participantName,
    eventTitle: params.eventTitle,
  });
  
  try {
    // 1. Buscar configurações globais de email
    console.log('[Email Service] Buscando configurações de email...');
    const emailConfig = await db.getActiveEmailSetting();
    console.log('[Email Service] Configuração encontrada:', emailConfig ? { provider: emailConfig.provider, enabled: emailConfig.enabled, senderEmail: emailConfig.senderEmail } : 'null');
    
    if (!emailConfig || emailConfig.enabled !== 1) {
      console.log('[Email Service] Configurações de email não encontradas ou desativadas');
      return false;
    }

    // 2. Tentar buscar template personalizado
    const customTemplate = await db.getEmailTemplateByEventAndType(params.eventId, 'confirmation');
    
    let subject: string;
    let html: string;

    if (customTemplate && customTemplate.enabled === 1) {
      // Usar template personalizado
      const variables = {
        nome: params.participantName,
        email: params.recipientEmail,
        evento: params.eventTitle,
        data: params.eventDate,
        local: params.eventAddress || '',
        qrcode: params.qrCode,
        convite_url: params.ticketUrl,
      };
      subject = replaceVariables(customTemplate.subject, variables);
      html = replaceVariables(customTemplate.htmlBody, variables);
    } else {
      // Usar template padrão
      subject = `✅ Inscrição Confirmada - ${params.eventTitle}`;
      html = getConfirmationEmailTemplate({
        participantName: params.participantName,
        eventTitle: params.eventTitle,
        eventDate: params.eventDate,
        eventAddress: params.eventAddress,
        ticketUrl: params.ticketUrl,
      });
    }

    // 3. Criar log de email
    const logId = await db.createEmailLog({
      eventId: params.eventId,
      registrationId: params.registrationId,
      templateType: 'confirmation',
      recipient: params.recipientEmail,
      subject,
      status: 'pending',
    });

    // 4. Enviar email usando o provedor configurado
    const success = await sendEmailWithProvider({
      to: params.recipientEmail,
      subject,
      html,
      config: emailConfig,
    });

    // 5. Atualizar log
    await db.updateEmailLog(logId, {
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : undefined,
      error: success ? undefined : 'Falha ao enviar email',
    });

    console.log(`[Email Service] E-mail de confirmação ${success ? 'enviado' : 'falhou'} para ${params.recipientEmail}`);
    return success;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail de confirmação:', error);
    return false;
  }
}

/**
 * Envia e-mail de "Aguardando Aprovação" para eventos que requerem aprovação
 */
export async function sendPendingEmail(params: {
  eventId: number;
  registrationId: number;
  recipientEmail: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
}): Promise<boolean> {
  try {
    const emailConfig = await db.getActiveEmailSetting();
    if (!emailConfig || emailConfig.enabled !== 1) {
      console.log('[Email Service] Configurações de email não encontradas ou desativadas');
      return false;
    }

    // Tentar buscar template personalizado
    const customTemplate = await db.getEmailTemplateByEventAndType(params.eventId, 'pending');
    
    let subject: string;
    let html: string;

    if (customTemplate && customTemplate.enabled === 1) {
      const variables = {
        nome: params.participantName,
        email: params.recipientEmail,
        evento: params.eventTitle,
        data: params.eventDate,
        local: '',
      };
      subject = replaceVariables(customTemplate.subject, variables);
      html = replaceVariables(customTemplate.htmlBody, variables);
    } else {
      // Template padrão
      subject = `⏳ Inscrição Recebida - ${params.eventTitle}`;
      html = `<h2>Olá, ${params.participantName}!</h2>
<p>Sua inscrição para o evento <strong>${params.eventTitle}</strong> foi recebida com sucesso!</p>
<p><strong>Data do evento:</strong> ${params.eventDate}</p>
<p>Sua inscrição está <strong>aguardando aprovação</strong> do organizador.</p>
<p>Você receberá um e-mail assim que sua inscrição for analisada.</p>
<p>Obrigado pelo interesse!</p>`;
    }

    const logId = await db.createEmailLog({
      eventId: params.eventId,
      registrationId: params.registrationId,
      templateType: 'pending',
      recipient: params.recipientEmail,
      subject,
      status: 'pending',
    });

    const success = await sendEmailWithProvider({
      to: params.recipientEmail,
      subject,
      html,
      config: emailConfig,
    });

    await db.updateEmailLog(logId, {
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : undefined,
      error: success ? undefined : 'Falha ao enviar email',
    });

    console.log(`[Email Service] E-mail de aguardando aprovação ${success ? 'enviado' : 'falhou'} para ${params.recipientEmail}`);
    return success;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail de aguardando aprovação:', error);
    return false;
  }
}

/**
 * Envia e-mail de aprovação com link do ingresso
 */
export async function sendApprovalEmail(params: {
  eventId: number;
  registrationId: number;
  recipientEmail: string;
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
  qrCode: string;
}): Promise<boolean> {
  try {
    const emailConfig = await db.getActiveEmailSetting();
    if (!emailConfig || emailConfig.enabled !== 1) {
      console.log('[Email Service] Configurações de email não encontradas ou desativadas');
      return false;
    }

    // Tentar buscar template personalizado
    const customTemplate = await db.getEmailTemplateByEventAndType(params.eventId, 'approval');
    
    let subject: string;
    let html: string;

    if (customTemplate && customTemplate.enabled === 1) {
      const variables = {
        nome: params.participantName,
        email: params.recipientEmail,
        evento: params.eventTitle,
        data: params.eventDate,
        local: params.eventAddress || '',
        qrcode: params.qrCode,
        convite_url: params.ticketUrl,
      };
      subject = replaceVariables(customTemplate.subject, variables);
      html = replaceVariables(customTemplate.htmlBody, variables);
    } else {
      // Template padrão
      subject = `✅ Inscrição Aprovada - ${params.eventTitle}`;
      html = getApprovalEmailTemplate({
        participantName: params.participantName,
        eventTitle: params.eventTitle,
        eventDate: params.eventDate,
        eventAddress: params.eventAddress,
        ticketUrl: params.ticketUrl,
      });
    }

    const logId = await db.createEmailLog({
      eventId: params.eventId,
      registrationId: params.registrationId,
      templateType: 'approval',
      recipient: params.recipientEmail,
      subject,
      status: 'pending',
    });

    const success = await sendEmailWithProvider({
      to: params.recipientEmail,
      subject,
      html,
      config: emailConfig,
    });

    await db.updateEmailLog(logId, {
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : undefined,
      error: success ? undefined : 'Falha ao enviar email',
    });

    console.log(`[Email Service] E-mail de aprovação ${success ? 'enviado' : 'falhou'} para ${params.recipientEmail}`);
    return success;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail de aprovação:', error);
    return false;
  }
}

/**
 * Envia e-mail de rejeição
 */
export async function sendRejectionEmail(params: {
  eventId: number;
  registrationId: number;
  recipientEmail: string;
  participantName: string;
  eventTitle: string;
}): Promise<boolean> {
  try {
    const emailConfig = await db.getActiveEmailSetting();
    if (!emailConfig || emailConfig.enabled !== 1) {
      console.log('[Email Service] Configurações de email não encontradas ou desativadas');
      return false;
    }

    // Tentar buscar template personalizado
    const customTemplate = await db.getEmailTemplateByEventAndType(params.eventId, 'rejection');
    
    let subject: string;
    let html: string;

    if (customTemplate && customTemplate.enabled === 1) {
      const variables = {
        nome: params.participantName,
        email: params.recipientEmail,
        evento: params.eventTitle,
        data: '',
        local: '',
      };
      subject = replaceVariables(customTemplate.subject, variables);
      html = replaceVariables(customTemplate.htmlBody, variables);
    } else {
      // Template padrão
      subject = `Inscrição Não Aprovada - ${params.eventTitle}`;
      html = getRejectionEmailTemplate({
        participantName: params.participantName,
        eventTitle: params.eventTitle,
      });
    }

    const logId = await db.createEmailLog({
      eventId: params.eventId,
      registrationId: params.registrationId,
      templateType: 'rejection',
      recipient: params.recipientEmail,
      subject,
      status: 'pending',
    });

    const success = await sendEmailWithProvider({
      to: params.recipientEmail,
      subject,
      html,
      config: emailConfig,
    });

    await db.updateEmailLog(logId, {
      status: success ? 'sent' : 'failed',
      sentAt: success ? new Date() : undefined,
      error: success ? undefined : 'Falha ao enviar email',
    });

    console.log(`[Email Service] E-mail de rejeição ${success ? 'enviado' : 'falhou'} para ${params.recipientEmail}`);
    return success;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail de rejeição:', error);
    return false;
  }
}
