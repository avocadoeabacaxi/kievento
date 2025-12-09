import { ENV } from './_core/env';

interface EmailParams {
  to: string;
  subject: string;
  html: string;
}

/**
 * Serviço de envio de e-mails
 * Nota: Este é um placeholder. Para produção, integre com um serviço real como:
 * - SendGrid
 * - AWS SES
 * - Resend
 * - Mailgun
 */
export async function sendEmail({ to, subject, html }: EmailParams): Promise<boolean> {
  try {
    // Log do e-mail (para desenvolvimento)
    console.log('[Email Service] Enviando e-mail:');
    console.log('Para:', to);
    console.log('Assunto:', subject);
    console.log('HTML:', html.substring(0, 200) + '...');

    // TODO: Integrar com serviço real de e-mail
    // Exemplo com SendGrid:
    // const sgMail = require('@sendgrid/mail');
    // sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    // await sgMail.send({ to, from: 'noreply@kievento.com', subject, html });

    // Por enquanto, apenas simula o envio
    return true;
  } catch (error) {
    console.error('[Email Service] Erro ao enviar e-mail:', error);
    return false;
  }
}

/**
 * Template de e-mail de aprovação de inscrição
 */
export function getApprovalEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Aprovada - ${params.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                🎉 Inscrição Aprovada!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Olá <strong>${params.participantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Temos uma ótima notícia! Sua inscrição para o evento <strong>${params.eventTitle}</strong> foi aprovada! 🎊
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #2d7a4f; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #2d7a4f;">📅 Detalhes do Evento</h3>
                <p style="margin: 0 0 10px; font-size: 15px; color: #555555;">
                  <strong>Data:</strong> ${params.eventDate}
                </p>
                ${params.eventAddress ? `
                <p style="margin: 0; font-size: 15px; color: #555555;">
                  <strong>Local:</strong> ${params.eventAddress}
                </p>
                ` : ''}
              </div>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                Seu convite digital com QR Code está pronto! Clique no botão abaixo para acessá-lo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(45, 122, 79, 0.3);">
                      Ver Meu Convite com QR Code
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>Importante:</strong> Salve este e-mail ou adicione o link aos seus favoritos. Você precisará apresentar o QR Code na entrada do evento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Nos vemos no evento! 🎉
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} KiEvento. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template de e-mail de rejeição de inscrição
 */
export function getRejectionEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
  reason?: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Atualização sobre sua inscrição - ${params.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background-color: #6c757d; padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                Atualização sobre sua inscrição
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Olá <strong>${params.participantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Agradecemos seu interesse no evento <strong>${params.eventTitle}</strong>.
              </p>

              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Infelizmente, não foi possível aprovar sua inscrição neste momento.
              </p>

              ${params.reason ? `
              <div style="background-color: #f8f9fa; border-left: 4px solid #6c757d; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #6c757d;">Motivo</h3>
                <p style="margin: 0; font-size: 15px; color: #555555;">
                  ${params.reason}
                </p>
              </div>
              ` : ''}

              <p style="margin: 30px 0 0; font-size: 16px; line-height: 1.6; color: #333333;">
                Fique atento aos nossos próximos eventos! Esperamos vê-lo em breve.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} KiEvento. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}

/**
 * Template de e-mail de confirmação de inscrição (eventos abertos)
 */
export function getConfirmationEmailTemplate(params: {
  participantName: string;
  eventTitle: string;
  eventDate: string;
  eventAddress?: string;
  ticketUrl: string;
}): string {
  return `
<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Inscrição Confirmada - ${params.eventTitle}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f5f5f5;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f5f5f5; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); padding: 40px 30px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                ✅ Inscrição Confirmada!
              </h1>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Olá <strong>${params.participantName}</strong>,
              </p>
              
              <p style="margin: 0 0 20px; font-size: 16px; line-height: 1.6; color: #333333;">
                Sua inscrição para o evento <strong>${params.eventTitle}</strong> foi confirmada com sucesso! 🎉
              </p>

              <div style="background-color: #f8f9fa; border-left: 4px solid #2d7a4f; padding: 20px; margin: 30px 0; border-radius: 4px;">
                <h3 style="margin: 0 0 15px; font-size: 18px; color: #2d7a4f;">📅 Detalhes do Evento</h3>
                <p style="margin: 0 0 10px; font-size: 15px; color: #555555;">
                  <strong>Data:</strong> ${params.eventDate}
                </p>
                ${params.eventAddress ? `
                <p style="margin: 0; font-size: 15px; color: #555555;">
                  <strong>Local:</strong> ${params.eventAddress}
                </p>
                ` : ''}
              </div>

              <p style="margin: 0 0 30px; font-size: 16px; line-height: 1.6; color: #333333;">
                Seu convite digital com QR Code está pronto! Clique no botão abaixo para acessá-lo:
              </p>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${params.ticketUrl}" style="display: inline-block; background: linear-gradient(135deg, #2d7a4f 0%, #1e5a3a 100%); color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 8px; font-size: 16px; font-weight: 600; box-shadow: 0 4px 12px rgba(45, 122, 79, 0.3);">
                      Ver Meu Convite com QR Code
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 30px 0 0; font-size: 14px; line-height: 1.6; color: #666666;">
                <strong>Importante:</strong> Salve este e-mail ou adicione o link aos seus favoritos. Você precisará apresentar o QR Code na entrada do evento.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #e9ecef;">
              <p style="margin: 0 0 10px; font-size: 14px; color: #666666;">
                Nos vemos no evento! 🎉
              </p>
              <p style="margin: 0; font-size: 12px; color: #999999;">
                © ${new Date().getFullYear()} KiEvento. Todos os direitos reservados.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
