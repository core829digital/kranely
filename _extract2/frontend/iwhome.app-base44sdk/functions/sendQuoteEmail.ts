import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    // Verify user is authenticated
    const user = await base44.auth.me();
    if (!user) {
      return Response.json({ error: 'Non autorizzato' }, { status: 401 });
    }
    
    const { quoteData, totalPrice, quoteNumber } = await req.json();
    
    // Generate quote summary for email
    const quoteType = quoteData.quote_type === 'finestre' ? 'Infissi' : 
                      quoteData.quote_type === 'chiavi_in_mano' ? 'Ristrutturazione Chiavi in Mano' : 
                      'Ristrutturazione Completa con Infissi';
    
    let configDetails = '';
    
    if (quoteData.window_config) {
      const wc = quoteData.window_config;
      configDetails += `
<h3 style="color: #343a40; margin-top: 20px;">Configurazione Infissi</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Materiale:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.material?.toUpperCase() || '-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Quantità:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.quantity || '-'}</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Dimensioni:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.width && wc.height ? `${wc.width}cm × ${wc.height}cm` : '-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Tipo di Vetro:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.glassType || '-'}</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Apertura:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.openingType || '-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Colore:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${wc.color || '-'}</td>
  </tr>
</table>
`;
    }
    
    if (quoteData.project_config) {
      const pc = quoteData.project_config;
      configDetails += `
<h3 style="color: #343a40; margin-top: 20px;">Configurazione Progetto</h3>
<table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Tipo Immobile:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${pc.propertyType || '-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Superficie:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${pc.squareMeters ? `${pc.squareMeters} m²` : '-'}</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Stanze:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${pc.rooms || '-'}</td>
  </tr>
  <tr>
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Bagni:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${pc.bathrooms || '-'}</td>
  </tr>
  <tr style="background-color: #f8f9fa;">
    <td style="padding: 10px; border: 1px solid #dee2e6;"><strong>Qualità:</strong></td>
    <td style="padding: 10px; border: 1px solid #dee2e6;">${pc.qualityLevel || '-'}</td>
  </tr>
</table>
`;
      
      if (pc.services && pc.services.length > 0) {
        configDetails += `
<p style="margin-top: 15px;"><strong>Servizi Inclusi:</strong></p>
<ul style="margin-left: 20px;">
  ${pc.services.map(s => `<li>${s}</li>`).join('')}
</ul>
`;
      }
    }
    
    const notesSection = quoteData.notes ? `
<div style="margin-top: 20px; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #6c757d;">
  <strong>Note:</strong><br/>
  ${quoteData.notes}
</div>
` : '';
    
    // Email to IwHome
    const emailToCompany = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #212529; padding: 30px; text-align: center;">
      <h1 style="color: #f8f9fa; margin: 0; font-size: 32px;">IW<span style="font-weight: 300;">Home</span></h1>
      <p style="color: #dee2e6; margin: 5px 0 0 0;">Showroom</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6;">
      <h2 style="color: #212529; margin-top: 0;">Nuova Richiesta Preventivo</h2>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p style="margin: 5px 0;"><strong>Preventivo n.:</strong> ${quoteNumber}</p>
        <p style="margin: 5px 0;"><strong>Data:</strong> ${new Date().toLocaleDateString('it-IT', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 5px 0;"><strong>Tipo:</strong> ${quoteType}</p>
      </div>
      
      <h3 style="color: #343a40;">Dati Cliente</h3>
      <p><strong>Nome:</strong> ${user.full_name || user.email}</p>
      <p><strong>Email:</strong> ${user.email}</p>
      
      ${configDetails}
      ${notesSection}
      
      <div style="background-color: #212529; color: #f8f9fa; padding: 20px; text-align: center; margin-top: 30px; border-radius: 5px;">
        <p style="margin: 0; font-size: 14px;">PREVENTIVO TOTALE</p>
        <p style="margin: 10px 0 0 0; font-size: 32px; font-weight: bold;">€ ${totalPrice.toLocaleString('it-IT')}</p>
        <p style="margin: 5px 0 0 0; font-size: 12px;">IVA esclusa</p>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p>IwHome Showroom | Via Montefiorino 10/E, Reggio Emilia</p>
      <p>Tel: +39 340 292 1052 | Email: info@iwhome.it</p>
    </div>
  </div>
</body>
</html>
`;
    
    // Email to customer
    const emailToCustomer = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #212529; padding: 30px; text-align: center;">
      <h1 style="color: #f8f9fa; margin: 0; font-size: 32px;">IW<span style="font-weight: 300;">Home</span></h1>
      <p style="color: #dee2e6; margin: 5px 0 0 0;">Showroom</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6;">
      <h2 style="color: #212529; margin-top: 0;">Preventivo Ricevuto!</h2>
      
      <p>Gentile <strong>${user.full_name || 'Cliente'}</strong>,</p>
      
      <p>Grazie per aver richiesto un preventivo a IwHome. Abbiamo ricevuto la tua richiesta e il nostro team la sta valutando con attenzione.</p>
      
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 5px 0;"><strong>Numero preventivo:</strong> ${quoteNumber}</p>
        <p style="margin: 5px 0;"><strong>Preventivo stimato:</strong> € ${totalPrice.toLocaleString('it-IT')} (IVA esclusa)</p>
      </div>
      
      <p><strong>Cosa succede ora?</strong></p>
      <ul style="margin-left: 20px;">
        <li>Un nostro consulente ti contatterà entro 24-48 ore</li>
        <li>Fisseremo un appuntamento per un sopralluogo gratuito</li>
        <li>Ti forniremo un preventivo dettagliato e personalizzato</li>
      </ul>
      
      <p>Nel frattempo, puoi visitare il nostro showroom per vedere i nostri materiali e progetti realizzati.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 5px; margin-top: 30px;">
        <p style="margin: 0 0 10px 0; font-weight: bold;">📍 Dove Siamo</p>
        <p style="margin: 0;">Via Montefiorino 10/E<br/>42124 Reggio Emilia (RE)</p>
        <p style="margin: 15px 0 0 0; font-weight: bold;">📞 Contatti</p>
        <p style="margin: 5px 0 0 0;">Tel: +39 340 292 1052<br/>Email: info@iwhome.it</p>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p>Questo è un messaggio automatico, non rispondere a questa email.</p>
      <p>Per qualsiasi domanda, contattaci a info@iwhome.it</p>
    </div>
  </div>
</body>
</html>
`;
    
    // Send both emails
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: 'info@iwhome.it',
      subject: `Nuova Richiesta Preventivo - ${quoteNumber}`,
      body: emailToCompany
    });
    
    await base44.asServiceRole.integrations.Core.SendEmail({
      to: user.email,
      subject: `IwHome - Preventivo Ricevuto n. ${quoteNumber}`,
      body: emailToCustomer
    });
    
    return Response.json({ 
      success: true, 
      message: 'Preventivo inviato con successo',
      quoteNumber 
    });
    
  } catch (error) {
    console.error('Error sending quote:', error);
    return Response.json({ 
      error: 'Errore nell\'invio del preventivo',
      details: error.message 
    }, { status: 500 });
  }
});