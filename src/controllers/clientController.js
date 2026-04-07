/**
 * ClientController.js
 * Propósito: HTTP handlers para vistas públicas (magic link access)
 * Pattern: Validación → Llamadas a Services → Responses
 */

const { validationResult } = require('express-validator');
const ProposalService = require('../services/ProposalService');
const ChatService = require('../services/ChatService');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

/**
 * Build choices+stats object from proposal details
 * @param {object} details - result of ProposalService.getProposalById
 * @returns {{ choices: array, stats: object }}
 */
function buildProposalStats(details) {
  const isServiceCompleted = (service) => {
    const idx = service?.selected_option_index;
    if (idx === null || idx === undefined || idx === '') return false;

    const numericIdx = Number(idx);
    if (Number.isNaN(numericIdx) || numericIdx < 0) return false;

    return service?.is_multichoice ? numericIdx >= 0 : numericIdx === 0;
  };

  const choices = [];

  // Venue
  const venueSelected = (details.venues || []).some(v => v.is_selected);
  const venueCount = (details.venues || []).length;
  if (venueCount > 0) {
    choices.push({
      id: 'venue',
      label: venueSelected ? 'Espacio confirmado' : 'Falta selección de espacio',
      is_completed: venueSelected,
      type: 'venue'
    });
  }

  // Services with options
  const servicesWithOptions = (details.services || []).filter(s => s.options && s.options.length > 0);
  servicesWithOptions.forEach(s => {
    choices.push({
      id: `service_${s.id}`,
      label: s.title || `Servicio ${s.id}`,
      is_completed: isServiceCompleted(s),
      type: 'service'
    });
  });

  const completedCount = choices.filter(c => c.is_completed).length;
  const totalCount = choices.length;
  const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

  return {
    choices,
    stats: {
      total_choices: totalCount,
      completed_choices: completedCount,
      progress_percentage: progress,
      pending_choices: choices.filter(c => !c.is_completed),
      all_completed: progress === 100
    }
  };
}

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
    // Convertir is_editing a boolean explícitamente (MySQL retorna 0/1)
    const isEditing = Boolean(proposal.is_editing) && proposal.is_editing !== 0 && proposal.is_editing !== '0';
    
    if (isEditing) {
      return res.render('client/maintenance', {
        title: 'Propuesta en revisión',
        proposal: proposal
      });
    }

    // Actualizar tracking (last_viewed_at)
    await ProposalService.updateLastViewed(proposal.id);

    // Generar paleta de branding desde brand_color
    const ImageService = require('../services/ImageService');
    const brandColor = proposal.brand_color || '#0066cc';
    const brandPalette = ImageService.generateColorPalette(brandColor);

    res.render('client/proposal-view', {
      title: `Propuesta: ${proposal.client_name}`,
      proposal: {
        ...proposal,
        ...details,
        // totals ya viene dentro de details porque getProposalById lo incluye
      },
      brandPalette: brandPalette,
      hash: hash,
      messages: [] // Se cargarán vía AJAX
    });
  } catch (err) {
    next(err);
  }
};

/**
 * OBTENER JSON DE PROPUESTA (Para UI dinámica en cliente)
 */
exports.getProposalJSON = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) return res.status(404).json({ success: false, message: 'No encontrado' });

    const details = await ProposalService.getProposalById(proposal.id);
    
    // Calcular progreso: incluir venue + todos los servicios que tengan opciones
    const isServiceCompleted = (service) => {
      const idx = service?.selected_option_index;
      if (idx === null || idx === undefined || idx === '') return false;

      const numericIdx = Number(idx);
      if (Number.isNaN(numericIdx) || numericIdx < 0) return false;

      return service?.is_multichoice ? numericIdx >= 0 : numericIdx === 0;
    };

    const choices = [];

    // 1. Venue
    const venueSelected = details.venues.some(v => v.is_selected);
    const venueCount = details.venues.length;
    if (venueCount > 0) {
      choices.push({
        id: 'venue',
        label: venueSelected ? 'Espacio confirmado' : 'Falta selección de espacio',
        is_completed: venueSelected,
        type: 'venue'
      });
    }

    // 2. Servicios (tanto multichoice como non-multichoice) que representen una decisión
    const servicesWithOptions = details.services.filter(s => s.options && s.options.length > 0);
    servicesWithOptions.forEach(s => {
      choices.push({
        id: `service_${s.id}`,
        label: s.title || `Servicio ${s.id}`,
        is_completed: isServiceCompleted(s),
        type: 'service'
      });
    });

    const completedCount = choices.filter(c => c.is_completed).length;
    const totalCount = choices.length;
    const progress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 100;

    res.json({
      success: true,
      proposal: {
        ...proposal,
        ...details
      },
      stats: {
        total_choices: totalCount,
        completed_choices: completedCount,
        progress_percentage: progress,
        pending_choices: choices.filter(c => !c.is_completed),
        all_completed: progress === 100
      },
      choices: choices
    });
  } catch (err) {
    console.error('Error in getProposalJSON:', err);
    res.status(500).json({ success: false, error: err.message });
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
// SELECCIONAR VENUE (Magic Link)
// ════════════════════════════════════════════════════════════════

exports.selectVenue = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { venue_id } = req.body;

    if (!Object.prototype.hasOwnProperty.call(req.body, 'venue_id')) {
      return res.status(400).json({ success: false, message: 'venue_id es requerido (entero o null)' });
    }

    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
    }

    const normalizedVenueId = venue_id === null ? null : parseInt(venue_id, 10);
    if (normalizedVenueId !== null && Number.isNaN(normalizedVenueId)) {
      return res.status(400).json({ success: false, message: 'venue_id inválido' });
    }

    await ProposalService.selectVenue(proposal.id, normalizedVenueId);

    // Return updated stats + proposal snapshot so client can update UI immediately
    const details = await ProposalService.getProposalById(proposal.id);
    const { choices, stats } = buildProposalStats(details);
    const isDeselect = normalizedVenueId === null;
    res.json({ success: true, message: isDeselect ? 'Venue deseleccionado correctamente' : 'Venue seleccionado correctamente', stats, choices, proposal: { ...proposal, ...details } });
  } catch (err) {
    console.error('Error selecting venue:', err);
    res.status(500).json({ success: false, message: 'Error al seleccionar venue' });
  }
};

/**
 * SELECCIONAR OPCIÓN (Choice)
 */
exports.selectOption = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { serviceId, optionId } = req.body;
    
    // LOG CRÍTICO para depuración en producción
    console.log(`[selectOption] DEBUG: hash=${hash}, serviceId=${JSON.stringify(serviceId)}, optionId=${JSON.stringify(optionId)}`);

    // Conversión ultra-segura
    const sId = parseInt(serviceId, 10);
    const oId = parseInt(optionId, 10);

    if (isNaN(sId) || isNaN(oId)) {
      console.error(`[selectOption] ERROR: Conversión fallida. sId=${sId}, oId=${oId}`);
      return res.status(400).json({ 
        success: false, 
        message: 'Los IDs proporcionados no son válidos' 
      });
    }

    // Obtener propuesta
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal || !proposal.id) {
      console.error(`[selectOption] ERROR: Propuesta no encontrada para hash=${hash}`);
      return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
    }

    console.log(`[selectOption] EXEC: calling ProposalService.selectServiceOption(${proposal.id}, ${sId}, ${oId})`);
    
    try {
      await ProposalService.selectServiceOption(proposal.id, sId, oId);
      const details = await ProposalService.getProposalById(proposal.id);
      const { choices, stats } = buildProposalStats(details);
      res.json({ success: true, message: 'Opción actualizada', stats, choices, proposal: { ...proposal, ...details } });
    } catch (sqlErr) {
      console.error('[selectOption] SQL ERROR inside service:', sqlErr);
      res.status(500).json({ success: false, message: 'Error interno de base de datos' });
    }
  } catch (err) {
    console.error('[selectOption] UNEXPECTED ERROR:', err);
    res.status(500).json({ success: false, message: 'Error inesperado al procesar selección' });
  }
};

// ════════════════════════════════════════════════════════════════
// ENVIAR MENSAJE (Chat)
// ════════════════════════════════════════════════════════════════

exports.sendMessage = async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { message_body } = req.body;
    logger.log(`SEND_MESSAGE START: Hash=${hash} Body=${message_body}`);

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.log(`SEND_MESSAGE VALIDATION FAILED: ${JSON.stringify(errors.array())}`);
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      logger.log(`SEND_MESSAGE PROPOSAL NOT FOUND: ${hash}`);
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Guardar mensaje
    logger.log(`SEND_MESSAGE SAVING DB: PropID=${proposal.id}`);
    const messageId = await ChatService.addMessage({
      proposal_id: proposal.id,
      sender_role: 'client',
      message_body: message_body.trim()
    });
    logger.log(`SEND_MESSAGE SAVED DB: ID=${messageId}`);

    // Responder inmediatamente para liberar al cliente
    res.json({
      success: true,
      message_id: Number(messageId),
      message: message_body
    });
    logger.log(`SEND_MESSAGE RESPONSE SENT`);

    // Enviar notificación por email al comercial en background (después de responder)
    EmailService.sendChatNotification({
      to: proposal.commercial_email,
      clientName: proposal.client_name,
      proposalId: Number(proposal.id),
      message: message_body,
      hash: hash
    }).then(() => {
        logger.log(`SEND_MESSAGE EMAIL SUCCESS`);
    }).catch(emailErr => {
      logger.log(`SEND_MESSAGE EMAIL ERROR: ${emailErr.message}`);
      console.error('Error enviando email de notificación (fondo):', emailErr);
    });
  } catch (err) {
    logger.log(`SEND_MESSAGE CRITICAL ERROR: ${err.message}`);
    console.error('[ClientController.sendMessage] CRITICAL:', err);
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
    logger.log(`GET_MESSAGES START: Hash=${hash} Since=${since}`);

    // Obtener propuesta por hash
    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      logger.log(`GET_MESSAGES PROPOSAL NOT FOUND: ${hash}`);
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    // Obtener mensajes
    const messages = await ChatService.getMessages(proposal.id, since);
    logger.log(`GET_MESSAGES SUCCESS: Count=${messages.length}`);

    res.json({
      success: true,
      messages: messages,
      count: messages.length
    });
  } catch (err) {
    logger.log(`GET_MESSAGES ERROR: ${err.message}`);
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
    await ChatService.markAsRead(proposal.id, 'client');

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

    const hasAddedMilestones = await ProposalService.checkProposalCompletion(proposal.id);
    if (!hasAddedMilestones) {
      return res.status(400).json({
        success: false,
        message: 'Debes anadir al menos un hito antes de aceptar la propuesta'
      });
    }

    const { PROPOSAL_STATUS } = require('../config/constants');
    const newStatus = PROPOSAL_STATUS.ACCEPTED || 'Aceptada';
    
    console.log(`[acceptProposal] Changing status to: ${newStatus} (from config: ${PROPOSAL_STATUS.ACCEPTED})`);

    // Cambiar status a 'Aceptada'
    await ProposalService.updateProposal(proposal.id, {
      status: newStatus
    });

    // Enviar notificación al comercial
    try {
      await EmailService.sendProposalAccepted({
        to: proposal.commercial_email,
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

    // Return updated stats so client sees progress recalculated after accept
    const details = await ProposalService.getProposalById(proposal.id);
    const { choices, stats } = buildProposalStats(details);
    res.json({ success: true, message: 'Propuesta aceptada correctamente', stats, choices, proposal: { ...proposal, ...details } });
  } catch (err) {
    next(err);
  }
};

// ════════════════════════════════════════════════════════════════
// ACTUALIZAR ESTADO DE HITO
// ════════════════════════════════════════════════════════════════

exports.updateMilestoneStatus = async (req, res, next) => {
  try {
    const { hash, serviceId } = req.params;
    const { status } = req.body;

    const proposal = await ProposalService.getProposalByHash(hash);
    if (!proposal) {
      return res.status(404).json({
        success: false,
        message: 'Propuesta no encontrada'
      });
    }

    await ProposalService.updateMilestoneStatus(proposal.id, serviceId, status);

    // Return updated stats so client updates progress bar immediately
    const details = await ProposalService.getProposalById(proposal.id);
    const { choices, stats } = buildProposalStats(details);
    res.json({ success: true, stats, choices, proposal: { ...proposal, ...details } });
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

    const { PROPOSAL_STATUS } = require('../config/constants');

    // Cambiar status a 'Pipe' (originalmente 'draft')
    await ProposalService.updateProposal(proposal.id, {
      status: PROPOSAL_STATUS.PIPE || 'Pipe'
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
        to: proposal.commercial_email,
        clientName: proposal.client_name,
        proposalId: proposal.id,
        reason: reason
      });
    } catch (emailErr) {
      console.error('Error enviando email:', emailErr);
    }

    const details = await ProposalService.getProposalById(proposal.id);
    const { choices, stats } = buildProposalStats(details);
    res.json({ success: true, message: 'Propuesta rechazada', stats, choices, proposal: { ...proposal, ...details } });
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

    const { PROPOSAL_STATUS } = require('../config/constants');

    // Cambiar status a 'Pipe' (originalmente 'draft') para que comercial pueda editar
    await ProposalService.updateProposal(proposal.id, {
      status: PROPOSAL_STATUS.PIPE || 'Pipe'
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
        to: proposal.commercial_email,
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
