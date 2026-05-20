import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Get all quotes with expiration dates
    const quotes = await base44.asServiceRole.entities.QuoteAutomation.list();
    
    const now = new Date();
    const notificationsSent = [];
    
    for (const quote of quotes) {
      const expirationDate = new Date(quote.data_scadenza);
      const daysUntilExpiration = Math.ceil((expirationDate - now) / (1000 * 60 * 60 * 24));
      
      // Check if notification should be sent
      if (!quote.notifica_inviata && 
          daysUntilExpiration <= quote.notifica_giorni_prima && 
          daysUntilExpiration > 0) {
        
        // Send notification email
        await base44.asServiceRole.integrations.Core.SendEmail({
          to: quote.cliente_email,
          subject: `Promemoria: Il preventivo ${quote.numero_preventivo} sta per scadere`,
          body: `Gentile Cliente,\n\nLe ricordiamo che il preventivo ${quote.numero_preventivo} scadrà tra ${daysUntilExpiration} giorni (${expirationDate.toLocaleDateString('it-IT')}).\n\nLa invitiamo a confermare la sua scelta prima della scadenza.\n\nCordiali saluti,\nIwHome Team`
        });
        
        // Create notification
        await base44.asServiceRole.entities.Notification.create({
          user_email: quote.created_by,
          type: 'quote',
          title: 'Preventivo in scadenza',
          message: `Il preventivo ${quote.numero_preventivo} scadrà tra ${daysUntilExpiration} giorni`,
          link: '/pdfeditor'
        });
        
        // Mark notification as sent
        await base44.asServiceRole.entities.QuoteAutomation.update(quote.id, {
          notifica_inviata: true
        });
        
        notificationsSent.push(quote.numero_preventivo);
      }
    }
    
    return Response.json({ 
      success: true, 
      notificationsSent,
      totalChecked: quotes.length 
    });
    
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});