/**
 * ClientController.js
 * Propósito: HTTP handlers para vistas públicas (magic link access)
 * Pattern: Validación → Llamadas a Services → Responses
 */

const { validationResult } = require('express-validator');
const ProposalService = require('../services/ProposalService');
const ChatService = require('../services/ChatService');
const EmailService = require('../services/EmailService');

// ════════════════════════════════════════════════════════════════
// VER PROPUESTA (Magic Link)
// ════════════════════════════════════════════════════════════════

exports.viewProposal = async (req, res, next) => {
  try {
    const { hash } = req.params;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).render('errors/404', {
        title: 'Propuesta no encontrada'
      });
    }

    // Cargar venues, servicios, items
    const details = await ProposalService.getProposalById(proposal.id);

    // Si propuesta está en modo edición, mostrar pantalla de espera
    if (proposal.is_editing) {
      return res.render('client/maintenance', {
        title: 'Propuesta en revisión',
        proposal: proposal
      });
    }

    // Calcular totales
    const totals = await ProposalService.calculateTotals(proposal.id);

    // Generar paleta de branding desde brand_color
    const ImageService = require('../services/ImageService');
    const brandColor = proposal.brand_color || '#0066cc';
    const brandPalette = ImageService.generateColorPalette(brandColor);

    res.render('client/proposal-view', {
      title: `Propuesta: ${proposal.client_name}`,
      proposal: {
        ...proposal,
        ...details,
        total_estimated: totals
      },
      brandPalette: brandPalette,
      hash: hash,
      messages: [] // Se cargarán vía AJAX
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// DESCARGAR PDF (Magic Link)
// ════════════════════════════════════════════════════════════════

exports.downloadPDF = async (req, res, next) => {
  try {
    const { hash } = req.params;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Aquí se generaría PDF con Puppeteer
    // Por ahora, retornar mensaje
    res.json({
      success: true,
      message: 'PDF generado correctamente',
      url: `/downloads/${hash}.pdf`
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// ENVIAR MENSAJE (Chat)
// ════════════════════════════════════════════════════════════════

exports.sendMessage = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { hash } = req.params;
    const { message_body } = req.body;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Guardar mensaje
    const messageId = await ChatService.addMessage({
      proposal_id: proposal.id,
      sender_role: 'client',
      message_body: message_body.trim()
    });

    // Enviar notificación por email al comercial
    try {
      await EmailService.sendChatNotification({
        to: proposal.user_email,
        clientName: proposal.client_name,
        proposalId: proposal.id,
        message: message_body,
        hash: hash
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
      // No fallar si email falla
    }

    res.json({
      success: true,
      message_id: messageId,
      message: message_body
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// OBTENER MENSAJES (AJAX Polling)
// ════════════════════════════════════════════════════════════════

exports.getMessages = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { since } = req.query; // timestamp opcional para polling

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Obtener mensajes
    const messages = await ChatService.getMessages(proposal.id, since);

    res.json({
      success: true,
      messages: messages,
      count: messages.length
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// MARCAR MENSAJES COMO LEÍDOS
// ════════════════════════════════════════════════════════════════

exports.markMessagesAsRead = async (req, res, next) => {
  try {
    const { hash } = req.params;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Marcar como leídos
    await ChatService.markAsRead(proposal.id, 'commercial');

    res.json({
      success: true
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// ACEPTAR PROPUESTA
// ════════════════════════════════════════════════════════════════

exports.acceptProposal = async (req, res, next) => {
  try {
    const { hash } = req.params;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Cambiar status a 'accepted'
    await ProposalService.updateProposal(proposal.id, {
      status: 'accepted'
    });

    // Enviar notificación al comercial
    try {
      await EmailService.sendProposalAccepted({
        to: proposal.user_email,
        clientName: proposal.client_name,
        proposalId: proposal.id
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
    }

    // Mensaje de chat automático
    await ChatService.addMessage({
      proposal_id: proposal.id,
      sender_role: 'client',
      message_body: '✅ He aceptado la propuesta. ¡Gracias!'
    });

    res.json({
      success: true,
      message: 'Propuesta aceptada correctamente'
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// RECHAZAR PROPUESTA
// ════════════════════════════════════════════════════════════════

exports.rejectProposal = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { reason } = req.body;

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Cambiar status a 'draft'
    await ProposalService.updateProposal(proposal.id, {
      status: 'draft'
    });

    // Mensaje de rechazo
    const messageText = reason ? `❌ He rechazado la propuesta. Motivo: ${reason}` : '❌ He rechazado la propuesta.';
    
    await ChatService.addMessage({
      proposal_id: proposal.id,
      sender_role: 'client',
      message_body: messageText
    });

    // Notificar al comercial
    try {
      await EmailService.sendProposalRejected({
        to: proposal.user_email,
        clientName: proposal.client_name,
        proposalId: proposal.id,
        reason: reason
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
    }

    res.json({
      success: true,
      message: 'Propuesta rechazada'
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// SOLICITAR MODIFICACIONES
// ════════════════════════════════════════════════════════════════

exports.requestModifications = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { modifications } = req.body;

    if (!modifications || !modifications.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Por favor describe las modificaciones'
      });
    }

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Cambiar status a 'draft' para que comercial pueda editar
    await ProposalService.updateProposal(proposal.id, {
      status: 'draft'
    });

    // Mensaje con solicitud
    const messageText = `🔄 Solicito las siguientes modificaciones:\n\n${modifications}`;
    
    await ChatService.addMessage({
      proposal_id: proposal.id,
      sender_role: 'client',
      message_body: messageText
    });

    // Notificar al comercial
    try {
      await EmailService.sendModificationRequest({
        to: proposal.user_email,
        clientName: proposal.client_name,
        proposalId: proposal.id,
        modifications: modifications
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
    }

    res.json({
      success: true,
      message: 'Solicitud de modificaciones enviada'
    });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// DASHBOARD DE CLIENTE (Client View)
// ════════════════════════════════════════════════════════════════

exports.getClientDashboard = async (req, res) => {
  try {
    // Si no hay usuario autenticado, redirigir a login
    if (!req.session.user || !req.session.user.email) {
      return res.redirect('/login');
    }

    const clientEmail = req.session.user.email;

    // Obtener propuestas del cliente por email
    const proposals = await ProposalService.getProposalsByClientEmail(clientEmail);

    // Calcular estadísticas
    let totalProposals = proposals.length;
    let activeProposals = 0;
    let acceptedProposals = 0;
    let totalAmount = 0;

    for (const proposal of proposals) {
      if (proposal.status === 'accepted') {
        acceptedProposals++;
      } else if (proposal.status === 'sent' || proposal.status === 'draft') {
        // Verificar si está dentro de valid_until
        const validUntil = new Date(proposal.valid_until);
        if (validUntil > new Date()) {
          activeProposals++;
        }
      }
      
      const totals = await ProposalService.calculateTotals(proposal.id);
      totalAmount += totals.total || 0;
    }

    res.render('client/dashboard', {
      title: 'Mis Propuestas - MICE Catering',
      proposals,
      totalProposals,
      activeProposals,
      acceptedProposals,
      totalAmount,
      formatCurrency: (amount) => {
        if (!amount) return '0,00 €';
        return amount.toLocaleString('es-ES', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }) + ' €';
      }
    });
  } catch (err) {
    console.error('Error en getClientDashboard:', err);
    req.flash('error', 'Error al cargar tus propuestas');
    res.redirect('/login');
  }
};
