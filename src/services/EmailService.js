/**
 * EmailService.js
 * Propósito: Envío de emails vía Nodemailer (Gmail SMTP)
 * Configuración: .env (EMAIL_USER, EMAIL_PASS)
 */

const nodemailer = require('nodemailer');
require('dotenv').config();

// Configurar transporte
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// ════════════════════════════════════════════════════════════════
// PLANTILLA: EMAIL BASE
// ════════════════════════════════════════════════════════════════

const htmlTemplate = (title, body, ctaUrl = null, ctaText = null) => `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; }
    .content { padding: 30px; }
    .footer { background: #f4f4f4; padding: 20px; text-align: center; font-size: 12px; color: #666; }
    .cta { display: inline-block; background: #667eea; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>${title}</h1>
    </div>
    <div class="content">
      ${body}
      ${ctaUrl ? `<div style="text-align: center;"><a href="${ctaUrl}" class="cta">${ctaText || 'Ver propuesta'}</a></div>` : ''}
    </div>
    <div class="footer">
      <p>MICE CATERING PROPOSALS</p>
      <p>propuestas.micecatering.eu</p>
    </div>
  </div>
</body>
</html>
`;

// ════════════════════════════════════════════════════════════════
// NOTIFICACIÓN: NUEVO MENSAJE DE CLIENTE
// ════════════════════════════════════════════════════════════════

exports.sendChatNotification = async (options) => {
  const { to, clientName, proposalId, message, hash } = options;

  const subject = `💬 Nuevo mensaje de ${clientName} - Propuesta #${proposalId}`;
  
  const body = `
    <p>Hola,</p>
    <p><strong>${clientName}</strong> ha dejado un nuevo mensaje en la propuesta:</p>
    <blockquote style="border-left: 4px solid #667eea; padding: 10px; background: #f9f9f9;">
      "${message}"
    </blockquote>
    <p>Haz clic en el botón de abajo para responder:</p>
  `;

  const ctaUrl = `${process.env.APP_DOMAIN}/p/${hash}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlTemplate(subject, body, ctaUrl, 'Ver propuesta y responder')
    });
    console.log(`✓ Email enviado a ${to}`);
  } catch (err) {
    console.error('Error enviando email:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// NOTIFICACIÓN: PROPUESTA ENVIADA AL CLIENTE
// ════════════════════════════════════════════════════════════════

exports.sendProposalToClient = async (options) => {
  const { to, clientName, proposalId, hash } = options;

  const subject = `📋 Tu propuesta de catering está lista`;
  
  const body = `
    <p>Hola ${clientName},</p>
    <p>Te hemos preparado una propuesta personalizada de catering para tu evento.</p>
    <p>Por favor revisa los detalles, precios y servicios. Puedes:</p>
    <ul>
      <li><strong>Aceptar</strong> la propuesta</li>
      <li><strong>Rechazarla</strong> si prefieres</li>
      <li><strong>Solicitar modificaciones</strong> mediante chat</li>
    </ul>
    <p>La propuesta es válida hasta <strong>30 días</strong> desde hoy.</p>
  `;

  const ctaUrl = `${process.env.APP_DOMAIN}/p/${hash}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlTemplate(subject, body, ctaUrl, 'Ver propuesta')
    });
    console.log(`✓ Propuesta enviada a ${to}`);
  } catch (err) {
    console.error('Error enviando email:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// NOTIFICACIÓN: PROPUESTA ACEPTADA
// ════════════════════════════════════════════════════════════════

exports.sendProposalAccepted = async (options) => {
  const { to, clientName, proposalId } = options;

  const subject = `✅ Propuesta #${proposalId} - Aceptada`;
  
  const body = `
    <p>Excelente noticia!</p>
    <p><strong>${clientName}</strong> ha aceptado tu propuesta.</p>
    <p>Los siguientes pasos serán coordinados mediante el chat de la propuesta.</p>
    <p>Próximos pasos:</p>
    <ul>
      <li>Confirmar detalles logísticos</li>
      <li>Procesamiento del pago</li>
      <li>Coordinación final del evento</li>
    </ul>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlTemplate(subject, body)
    });
    console.log(`✓ Notificación de aceptación enviada a ${to}`);
  } catch (err) {
    console.error('Error enviando email:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// NOTIFICACIÓN: PROPUESTA RECHAZADA
// ════════════════════════════════════════════════════════════════

exports.sendProposalRejected = async (options) => {
  const { to, clientName, proposalId, reason } = options;

  const subject = `❌ Propuesta #${proposalId} - Rechazada`;
  
  const body = `
    <p>Hola,</p>
    <p><strong>${clientName}</strong> ha rechazado tu propuesta.</p>
    ${reason ? `<p><strong>Motivo:</strong> ${reason}</p>` : ''}
    <p>Puedes revisar el motivo del rechazo y enviar una propuesta revisada si lo deseas.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlTemplate(subject, body)
    });
    console.log(`✓ Notificación de rechazo enviada a ${to}`);
  } catch (err) {
    console.error('Error enviando email:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// NOTIFICACIÓN: SOLICITUD DE MODIFICACIONES
// ════════════════════════════════════════════════════════════════

exports.sendModificationRequest = async (options) => {
  const { to, clientName, proposalId, modifications } = options;

  const subject = `🔄 Propuesta #${proposalId} - Solicitud de cambios`;
  
  const body = `
    <p>Hola,</p>
    <p><strong>${clientName}</strong> ha solicitado las siguientes modificaciones:</p>
    <blockquote style="border-left: 4px solid #f59e0b; padding: 10px; background: #f9f9f9;">
      ${modifications.replace(/\n/g, '<br>')}
    </blockquote>
    <p>La propuesta ha vuelto a estado de borrador. Puedes hacer los cambios solicitados y enviarla nuevamente.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: to,
      subject: subject,
      html: htmlTemplate(subject, body)
    });
    console.log(`✓ Solicitud de modificaciones enviada a ${to}`);
  } catch (err) {
    console.error('Error enviando email:', err);
    throw err;
  }
};

// ════════════════════════════════════════════════════════════════
// UTILIDAD: PROBAR CONEXIÓN
// ════════════════════════════════════════════════════════════════

exports.verifyConnection = async () => {
  try {
    await transporter.verify();
    console.log('✓ EmailService conectado correctamente');
    return true;
  } catch (err) {
    console.error('✗ Error en EmailService:', err.message);
    return false;
  }
};
