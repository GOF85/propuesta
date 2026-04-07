/**
 * EditorController.js
 * Propósito: Gestionar la edición interactiva de propuestas y el motor financiero
 */

const ProposalService = require('../services/ProposalService');
const VenueService = require('../services/VenueService');
const ChatService = require('../services/ChatService');
const EmailService = require('../services/EmailService');

class EditorController {
  constructor() {
    this.renderEditor = this.renderEditor.bind(this);
    this.updateProposal = this.updateProposal.bind(this);
    this.addService = this.addService.bind(this);
    this.updateService = this.updateService.bind(this);
    this.removeService = this.removeService.bind(this);
    this.addVenue = this.addVenue.bind(this);
    this.removeVenue = this.removeVenue.bind(this);
    this.selectVenue = this.selectVenue.bind(this);
    this.calculateTotals = this.calculateTotals.bind(this);
    this.toggleEditing = this.toggleEditing.bind(this);
    this.publishProposal = this.publishProposal.bind(this);
    this.cancelProposal = this.cancelProposal.bind(this);
    this.getMessages = this.getMessages.bind(this);
    this.sendMessage = this.sendMessage.bind(this);
    this.markMessagesAsRead = this.markMessagesAsRead.bind(this);
    this.addOption = this.addOption.bind(this);
    this.getProposalData = this.getProposalData.bind(this);
    this.validateProposal = this.validateProposal.bind(this);
  }

  getSafeUser(req) {
    const user = req.user || (req.session && req.session.user);
    if (!user) return null;
    return {
      id: user.id || user.ID,
      role: user.role || user.ROLE,
      name: user.name || user.NAME || user.username
    };
  }

  async renderEditor(req, res, next) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      if (!user) {
        req.flash('error', 'Sesión expirada');
        return res.redirect('/login');
      }
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal) return res.status(404).render('errors/404', { message: 'Propuesta no encontrada', user });

      const isOwner = Number(proposal.user_id) === Number(user.id);
      const isAdmin = user.role === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).render('errors/403', { message: 'No permitido', user });
      }

      // Marcar mensajes como leídos al entrar al editor (Proactivo)
      try {
        const numericId = parseInt(id);
        await ChatService.markAsRead(numericId, 'commercial');
        
        // Recalcular contador global para que el header se actualice inmediatamente
        res.locals.totalUnreadChats = await ChatService.getTotalUnreadForUser(user.id, user.role);
        
        console.log(`[EditorController] Marked read for proposal ${numericId}. New global unread: ${res.locals.totalUnreadChats}`);
      } catch (err) {
        console.error('[EditorController] Error marking messages as read:', err);
      }

      let allVenues = [];
      try {
        allVenues = await VenueService.getAll({ limit: 500, scrapedOnly: true }) || [];
      } catch (err) {
        console.error('Error cargando venues:', err);
      }

      res.render('commercial/editor', {
        proposal,
        availableVenues: allVenues,
        title: 'Editar Propuesta',
        user,
        activePage: 'proposals'
      });
    } catch (err) { next(err); }
  }

  async getProposalData(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      
      if (!proposal) return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
      
      const isOwner = Number(proposal.user_id) === Number(user?.id);
      const isAdmin = user?.role === 'admin';
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'No autorizado' });
      }

      res.json({
        success: true,
        proposal: {
          id: proposal.id,
          title: proposal.title,
          status: proposal.status,
          is_editing: proposal.is_editing,
          totals: proposal.totals
        },
        services: proposal.services
      });
    } catch (err) {
      res.status(500).json({ success: false, message: err.message });
    }
  }

  async updateProposal(req, res) {
    try {
      const { id } = req.params;
      console.log(`[EditorController] updateProposal entry: ID=${id}, Body=`, JSON.stringify(req.body));
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      
      if (!proposal) {
        return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });
      }

      if (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin') {
        return res.status(403).json({ success: false, message: 'No tienes permiso para editar esta propuesta' });
      }

      const result = await ProposalService.updateProposal(id, req.body);
      
      if (result && result.success === false) {
        console.warn('[EditorController] updateProposal logic failure:', result.message);
        return res.status(400).json(result);
      }

      res.json({ success: true });
    } catch (err) {
      console.error('[EditorController] updateProposal CRITICAL error:', err);
      // Devolvemos el error detallado para que el usuario sepa qué pasa
      res.status(500).json({ 
        success: false, 
        message: 'Error de base de datos o servidor', 
        details: err.message,
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
      });
    }
  }

  async addService(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      let { title, type, service_date, start_time, end_time, duration, comments, location, vat_rate, pax, is_multichoice, price_model } = req.body;
      
      // Sanitización
      service_date = service_date || null;
      start_time = start_time || null;
      end_time = end_time || null;
      duration = parseInt(duration) || 0;
      comments = comments || null;
      location = location || null;
      vat_rate = vat_rate || (type === 'gastronomy' ? 21.00 : 10.00);
      pax = pax ? parseInt(pax) : null; // null significa heredar de propuesta
      price_model = price_model || 'pax';
      
      // Interpretación robusta de multichoice (soporta bool o int 0/1)
      const isMC = (is_multichoice === true || is_multichoice === 1 || is_multichoice === '1' || is_multichoice === 'true') ? 1 : 0;

      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        const [maxOrderRes] = await conn.query('SELECT MAX(order_index) as max_order FROM proposal_services WHERE proposal_id = ?', [id]);
        const nextOrder = (maxOrderRes && maxOrderRes.max_order !== null) ? (maxOrderRes.max_order + 1) : 0;
        
        const result = await conn.query(
          'INSERT INTO proposal_services (proposal_id, title, type, order_index, service_date, start_time, end_time, duration, comments, location, vat_rate, pax, is_multichoice, price_model, selected_option_index) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)', 
          [id, title, type, nextOrder, service_date, start_time, end_time, duration, comments, location, vat_rate, pax, isMC, price_model, null]
        );
        
        const newId = result.insertId || (result[0] && result[0].insertId);
        console.log(`[EditorController] Service added with ID ${newId}`);
        res.json({ success: true, serviceId: newId });
      } finally { conn.end(); }
    } catch (err) { 
      console.error('[EditorController] Error adding service:', err);
      res.status(500).json({ success: false, error: err.message }); 
    }
  }

  async updateService(req, res) {
    try {
      const { id, serviceId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, message: 'No tienes permiso' });
      }

      let { title, type, service_date, start_time, end_time, duration, comments, location, pax, vat_rate, is_multichoice, price_model } = req.body;
      
      // Sanitización
      service_date = service_date || null;
      start_time = start_time || null;
      end_time = end_time || null;
      duration = parseInt(duration) || 0;
      comments = comments || null;
      location = location || null;
      pax = pax ? parseInt(pax) : null;
      vat_rate = vat_rate ? parseFloat(vat_rate) : null;
      price_model = price_model || 'pax';
      
      // Interpretación robusta de multichoice (soporta bool o int 0/1)
      const isMC = (is_multichoice === true || is_multichoice === 1 || is_multichoice === '1' || is_multichoice === 'true') ? 1 : 0;

      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'UPDATE proposal_services SET title = ?, type = ?, service_date = ?, start_time = ?, end_time = ?, duration = ?, comments = ?, location = ?, pax = ?, vat_rate = ?, is_multichoice = ?, price_model = ? WHERE id = ? AND proposal_id = ?',
          [title, type, service_date, start_time, end_time, duration, comments, location, pax, vat_rate, isMC, price_model, serviceId, id]
        );
        
        console.log(`[EditorController] Service ${serviceId} updated`);
        res.json({ success: true });
      } finally { conn.end(); }
    } catch (err) { 
      console.error('[EditorController] Error updating service:', err);
      res.status(500).json({ success: false, error: err.message }); 
    }
  }

  async duplicateOption(req, res) {
    try {
      const { id, optionId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const result = await ProposalService.duplicateOption(optionId);
      res.json(result);
    } catch (err) {
      console.error('[EditorController] Error duplicating option:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async duplicateService(req, res) {
    try {
      const { id, serviceId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const result = await ProposalService.duplicateService(serviceId);
      res.json(result);
    } catch (err) {
      console.error('[EditorController] Error duplicating service:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async importMenu(req, res) {
    try {
      const { id, optionId } = req.params;
      const { menuId } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const result = await ProposalService.importMenuToOption(optionId, menuId);
      res.json(result);
    } catch (err) {
      console.error('[EditorController] Error importing menu:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async reorderItems(req, res) {
    try {
      const { id } = req.params;
      const { items } = req.body; // Array de { id, order_index }
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query('START TRANSACTION');
        for (const item of items) {
          await conn.query('UPDATE proposal_items SET order_index = ? WHERE id = ?', [item.order_index, item.id]);
        }
        await conn.query('COMMIT');
        res.json({ success: true });
      } catch (err) {
        await conn.query('ROLLBACK');
        throw err;
      } finally { conn.end(); }
    } catch (err) {
      console.error('[EditorController] Error reordering items:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const result = await ProposalService.updateItem(itemId, req.body);
      res.json({ success: true, item: result });
    } catch (err) {
      console.error('[EditorController] Error updating item:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async removeItem(req, res) {
    try {
      const { id, itemId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }

      const result = await ProposalService.removeItem(itemId);
      res.json({ success: true });
    } catch (err) {
      console.error('[EditorController] Error removing item:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async removeService(req, res) {
    try {
      const { id, serviceId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query('DELETE FROM proposal_services WHERE id = ? AND proposal_id = ?', [serviceId, id]);
        res.json({ success: true });
      } finally { conn.end(); }
    } catch (err) { 
      console.error('[EditorController] Error removing service:', err);
      res.status(500).json({ success: false, error: err.message }); 
    }
  }

  async addVenue(req, res) {
    try {
      const { id } = req.params;
      const { venue_id } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        const result = await conn.query('INSERT INTO proposal_venues (proposal_id, venue_id) VALUES (?, ?)', [id, venue_id]);
        const venueIdPv = result.insertId || (result[0] && result[0].insertId);
        res.json({ success: true, venue_id: venueIdPv });
      } finally { conn.end(); }
    } catch (err) { res.status(500).json({ success: false }); }
  }

  async removeVenue(req, res) {
    try {
      const { id, venueId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query('DELETE FROM proposal_venues WHERE id = ? AND proposal_id = ?', [venueId, id]);
        res.json({ success: true });
      } finally { conn.end(); }
    } catch (err) { res.status(500).json({ success: false }); }
  }

  async selectVenue(req, res) {
    try {
      const { id, venueId } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query('START TRANSACTION');
        
        // Verificar si ya está seleccionado
        const [current] = await conn.query(
          'SELECT is_selected FROM proposal_venues WHERE id = ? AND proposal_id = ?',
          [venueId, id]
        );

        const isCurrentlySelected = current && current.is_selected === 1;

        // Desmarcar todos primero (siempre, para asegurar exclusividad)
        await conn.query('UPDATE proposal_venues SET is_selected = 0 WHERE proposal_id = ?', [id]);
        
        // Si no estaba seleccionado, marcar el elegido. Si lo estaba, se queda desmarcado (toggle off).
        if (!isCurrentlySelected) {
          await conn.query('UPDATE proposal_venues SET is_selected = 1 WHERE id = ? AND proposal_id = ?', [venueId, id]);
        }
        
        await conn.query('COMMIT');
        res.json({ success: true, deselected: isCurrentlySelected });
      } catch (err) {
        await conn.query('ROLLBACK');
        throw err;
      } finally { conn.end(); }
    } catch (err) { res.status(500).json({ success: false, error: err.message }); }
  }

  async calculateTotals(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      const totals = await ProposalService.calculateTotals(id, { persist: true });
      
      // Formatear para el frontend
      const formatter = new Intl.NumberFormat('es-ES', { 
        style: 'currency', 
        currency: 'EUR',
        minimumFractionDigits: 2 
      });

      const formatted = {
        total_base: formatter.format(totals.total_base),
        total_discount: formatter.format(totals.total_discount),
        total_vat: formatter.format(totals.total_vat),
        total_final: formatter.format(totals.total_final),
        margin: formatter.format(totals.total_margin || 0),
        // Nuevos campos potenciales
        total_max_base: formatter.format(totals.total_max_base || 0),
        total_max_discount: formatter.format(totals.total_max_discount || 0),
        total_max_vat: formatter.format(totals.total_max_vat || 0),
        total_max_potential: formatter.format(totals.total_max_potential || 0)
      };

      res.json({ success: true, totals, formatted });
    } catch (err) { 
      console.error('[EditorController] Calculate totals error:', err);
      res.status(500).json({ success: false, error: err.message }); 
    }
  }

  async toggleEditing(req, res) {
    try {
      const { id } = req.params;
      const { is_editing } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      await ProposalService.updateProposal(id, { is_editing });
      res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
  }

  async publishProposal(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user.id) && user.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      await ProposalService.updateProposal(id, { status: 'sent' });

      // Enviar email al cliente con magic link (fire and forget)
      EmailService.sendProposalToClient({
        to: proposal.client_email,
        clientName: proposal.client_name,
        proposalId: id,
        hash: proposal.unique_hash
      }).catch(err => console.error('Error enviando propuesta por email:', err));

      // Auto-mensaje en el chat
      await ChatService.addMessage({
        proposal_id: id,
        sender_role: 'commercial',
        message_body: '🚀 Propuesta enviada al cliente.'
      });

      res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
  }

  async cancelProposal(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user.id) && user.role !== 'admin')) {
        return res.status(403).json({ success: false });
      }
      await ProposalService.updateProposal(id, { status: 'cancelled' });

      // Auto-mensaje en el chat
      await ChatService.addMessage({
        proposal_id: id,
        sender_role: 'commercial',
        message_body: '🚫 Propuesta anulada.'
      });

      res.json({ success: true });
    } catch (err) { res.status(500).json({ success: false }); }
  }

  async getMessages(req, res) {
    try {
      const { id } = req.params;
      const { since } = req.query;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      // Marcar como leídos al solicitar mensajes (lectura implícita)
      await ChatService.markAsRead(id, 'commercial');

      const messages = await ChatService.getMessages(id, since);
      res.json({ success: true, messages });
    } catch (err) {
      console.error('[EditorController] getMessages error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async sendMessage(req, res) {
    try {
      const { id } = req.params;
      const { message_body } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      const messageId = await ChatService.addMessage({
        proposal_id: id,
        sender_role: 'commercial',
        message_body
      });

      // Responder inmediatamente
      res.json({ success: true, messageId: Number(messageId) });

      // Notificación en background (después de responder)
      EmailService.sendCommercialMessageNotification({
        to: proposal.client_email,
        clientName: proposal.client_name,
        proposalId: id,
        message: message_body,
        hash: proposal.unique_hash
      }).catch(err => console.error('Error email comercial (fondo):', err));
    } catch (err) {
      console.error('[EditorController] sendMessage error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async markMessagesAsRead(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);
      
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      // El comercial marca como leídos los del cliente
      await ChatService.markAsRead(id, 'commercial');
      res.json({ success: true });
    } catch (err) {
      console.error('[EditorController] markMessagesAsRead error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async addOption(req, res) {
    try {
      const { id } = req.params;
      const { service_id, name, price_pax, discount_pax, price_model, description, images, badges, url_images, video_url } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);

      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        const result = await conn.query(
          'INSERT INTO service_options (service_id, name, price_pax, discount_pax, price_model, description, images, badges, url_images, video_url) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
          [
            service_id, 
            name, 
            price_pax, 
            discount_pax || 0, 
            price_model || 'pax',
            description || null,
            Array.isArray(images) ? JSON.stringify(images) : (images || null),
            Array.isArray(badges) ? JSON.stringify(badges) : (badges || null),
            url_images || null,
            video_url || null
          ]
        );
        const optionId = result.insertId || (result[0] && result[0].insertId);
        res.json({ success: true, optionId });
      } finally {
        conn.end();
      }
    } catch (err) {
      console.error('[EditorController] addOption error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async updateOption(req, res) {
    try {
      const { id, optionId } = req.params;
      const { name, price_pax, discount_pax, price_model, description, images, badges, url_images, video_url } = req.body;
      const user = this.getSafeUser(req);
      const proposal = await ProposalService.getProposalById(id);

      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        await conn.query(
          'UPDATE service_options SET name = ?, price_pax = ?, discount_pax = ?, price_model = ?, description = ?, images = ?, badges = ?, url_images = ?, video_url = ? WHERE id = ?',
          [
            name, 
            price_pax, 
            discount_pax || 0, 
            price_model || 'pax', 
            description || null, 
            Array.isArray(images) ? JSON.stringify(images) : (images || null),
            Array.isArray(badges) ? JSON.stringify(badges) : (badges || null),
            url_images || null,
            video_url || null,
            optionId
          ]
        );
        res.json({ success: true });
      } finally {
        conn.end();
      }
    } catch (err) {
      console.error('[EditorController] updateOption error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  async getService(req, res) {
    try {
      const { serviceId } = req.params;
      const { pool } = require('../config/db');
      const conn = await pool.getConnection();
      try {
        const [service] = await conn.query('SELECT * FROM proposal_services WHERE id = ?', [serviceId]);
        if (!service) return res.status(404).json({ success: false });

        const options = await conn.query('SELECT * FROM service_options WHERE service_id = ?', [serviceId]);
        
        for (const opt of options) {
            opt.items = await conn.query('SELECT * FROM proposal_items WHERE option_id = ? ORDER BY order_index ASC', [opt.id]);
        }
        
        service.options = options;
        res.json(service);
      } finally {
        conn.end();
      }
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Añadir línea de descuento
   */
  async addDiscountLine(req, res) {
    try {
      const { id } = req.params;
      const user = this.getSafeUser(req);
      const ProposalService = require('../services/ProposalService');
      
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      const discountId = await ProposalService.addDiscountLine(id, req.body);
      res.json({ success: true, id: discountId });
    } catch (err) {
      console.error('[EditorController] addDiscountLine error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Eliminar línea de descuento
   */
  async deleteDiscountLine(req, res) {
    try {
      const { id, discountId } = req.params;
      const user = this.getSafeUser(req);
      const ProposalService = require('../services/ProposalService');

      const proposal = await ProposalService.getProposalById(id);
      if (!proposal || (Number(proposal.user_id) !== Number(user?.id) && user?.role !== 'admin')) {
        return res.status(403).json({ success: false, error: 'No autorizado' });
      }

      await ProposalService.deleteDiscountLine(discountId, id);
      res.json({ success: true });
    } catch (err) {
      console.error('[EditorController] deleteDiscountLine error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Validación "Pre-vuelo" de la propuesta
   */
  async validateProposal(req, res) {
    try {
      const { id } = req.params;
      const proposal = await ProposalService.getProposalById(id);
      if (!proposal) return res.status(404).json({ success: false, message: 'Propuesta no encontrada' });

      const errors = [];
      const warnings = [];

      // 1. PAX Check
      if (!proposal.pax || proposal.pax <= 0) {
        errors.push('El número de asistentes (PAX) debe ser mayor a 0.');
      }

      // 2. Services Check
      if (!proposal.services || proposal.services.length === 0) {
        errors.push('La propuesta no tiene servicios configurados.');
      } else {
        proposal.services.forEach(s => {
          if (!s.options || s.options.length === 0) {
            errors.push(`El servicio "${s.title}" no tiene opciones o platos.`);
          }
        });
      }

      // 3. Venues Check
      const selectedVenue = proposal.venues?.find(v => v.is_selected);
      if (!selectedVenue) {
        warnings.push('No hay ningún Venue marcado como "Seleccionado". El cliente verá todos como opciones.');
      }

      // 4. Logo Check
      if (!proposal.logo_url) {
        warnings.push('La propuesta no tiene logo personalizado. Se usará el logo por defecto.');
      }

      const totalErrors = errors.length;
      res.json({
        success: true,
        valid: totalErrors === 0,
        errors: [...errors, ...warnings]
      });
    } catch (err) {
      console.error('[EditorController] Validation error:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new EditorController();
