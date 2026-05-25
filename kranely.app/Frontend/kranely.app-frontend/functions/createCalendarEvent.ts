import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const { 
      full_name, 
      email, 
      phone, 
      appointment_date, 
      appointment_time, 
      project_type,
      notes 
    } = await req.json();
    
    // Get Google Calendar access token
    const accessToken = await base44.asServiceRole.connectors.getAccessToken('googlecalendar');
    
    // Parse date and time
    const [hours, minutes] = appointment_time.split(':');
    const startDateTime = new Date(appointment_date);
    startDateTime.setHours(parseInt(hours), parseInt(minutes), 0);
    
    const endDateTime = new Date(startDateTime);
    endDateTime.setHours(endDateTime.getHours() + 1); // 1 hour duration
    
    // Create event in Google Calendar
    const eventResponse = await fetch(
      'https://www.googleapis.com/calendar/v3/calendars/primary/events',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          summary: `Appuntamento IwHome - ${full_name}`,
          description: `
Cliente: ${full_name}
Email: ${email}
Telefono: ${phone || 'Non fornito'}
Tipo progetto: ${project_type}
Note: ${notes || 'Nessuna nota'}

Appuntamento presso IwHome Showroom
Via Montefiorino 10/E, Reggio Emilia
          `.trim(),
          location: 'Via Montefiorino 10/E, 42124 Reggio Emilia, Italia',
          start: {
            dateTime: startDateTime.toISOString(),
            timeZone: 'Europe/Rome'
          },
          end: {
            dateTime: endDateTime.toISOString(),
            timeZone: 'Europe/Rome'
          },
          attendees: [
            { email: email }
          ],
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'email', minutes: 24 * 60 }, // 1 day before
              { method: 'popup', minutes: 60 } // 1 hour before
            ]
          },
          colorId: '9' // Blue color for business appointments
        })
      }
    );
    
    if (!eventResponse.ok) {
      const error = await eventResponse.text();
      throw new Error(`Failed to create calendar event: ${error}`);
    }
    
    const event = await eventResponse.json();
    
    // Email template for customer
    const customerEmailBody = `
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
      <h2 style="color: #212529; margin-top: 0;">✅ Appuntamento Confermato!</h2>
      
      <p>Gentile <strong>${full_name}</strong>,</p>
      
      <p>Il tuo appuntamento presso IwHome Showroom è stato confermato con successo.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; border-left: 4px solid #212529; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📅 Dettagli Appuntamento</strong></p>
        <p style="margin: 8px 0;"><strong>Data:</strong> ${new Date(appointment_date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 8px 0;"><strong>Orario:</strong> ${appointment_time}</p>
        <p style="margin: 8px 0;"><strong>Tipo progetto:</strong> ${project_type}</p>
      </div>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0 0 10px 0; font-size: 16px;"><strong>📍 Dove Siamo</strong></p>
        <p style="margin: 5px 0;"><strong>IwHome Showroom</strong><br/>
        Via Montefiorino 10/E<br/>
        42124 Reggio Emilia (RE)<br/>
        Italia</p>
        
        <p style="margin: 15px 0 5px 0;"><strong>Come arrivare:</strong></p>
        <p style="margin: 5px 0;">Facilmente raggiungibile dall'uscita autostradale Reggio Emilia.<br/>
        Parcheggio gratuito disponibile.</p>
      </div>
      
      <div style="background-color: #fff8e1; padding: 15px; border-radius: 8px; margin: 25px 0;">
        <p style="margin: 0;"><strong>💡 Cosa portare:</strong></p>
        <ul style="margin: 10px 0 0 20px; padding: 0;">
          <li>Planimetrie o foto della tua abitazione (se disponibili)</li>
          <li>Misure approssimative degli spazi da rinnovare</li>
          <li>Idee o riferimenti di stile che ti piacciono</li>
        </ul>
      </div>
      
      <p><strong>Hai bisogno di modificare l'appuntamento?</strong><br/>
      Contattaci al +39 340 292 1052 o rispondi a questa email.</p>
      
      <div style="text-align: center; margin: 30px 0 20px 0;">
        <p style="margin: 0 0 10px 0; font-size: 14px; color: #6c757d;">Ti aspettiamo!</p>
        <p style="margin: 0; font-size: 18px; font-weight: bold; color: #212529;">Il Team IwHome</p>
      </div>
    </div>
    
    <div style="background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d;">
      <p style="margin: 5px 0;"><strong>IwHome Showroom</strong></p>
      <p style="margin: 5px 0;">Via Montefiorino 10/E, 42124 Reggio Emilia (RE)</p>
      <p style="margin: 5px 0;">Tel: +39 340 292 1052 | Email: info@iwhome.it</p>
    </div>
  </div>
</body>
</html>
    `;

    // Email template for company
    const companyEmailBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background-color: #212529; padding: 30px; text-align: center;">
      <h1 style="color: #f8f9fa; margin: 0; font-size: 32px;">IW<span style="font-weight: 300;">Home</span></h1>
      <p style="color: #dee2e6; margin: 5px 0 0 0;">Nuovo Appuntamento</p>
    </div>
    
    <div style="background-color: #ffffff; padding: 30px; border: 1px solid #dee2e6;">
      <h2 style="color: #212529; margin-top: 0;">📅 Nuovo Appuntamento Prenotato</h2>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>👤 Dati Cliente</strong></p>
        <p style="margin: 8px 0;"><strong>Nome:</strong> ${full_name}</p>
        <p style="margin: 8px 0;"><strong>Email:</strong> <a href="mailto:${email}">${email}</a></p>
        <p style="margin: 8px 0;"><strong>Telefono:</strong> ${phone || 'Non fornito'}</p>
      </div>
      
      <div style="background-color: #fff8e1; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0 0 15px 0; font-size: 16px;"><strong>📋 Dettagli Appuntamento</strong></p>
        <p style="margin: 8px 0;"><strong>Data:</strong> ${new Date(appointment_date).toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
        <p style="margin: 8px 0;"><strong>Orario:</strong> ${appointment_time}</p>
        <p style="margin: 8px 0;"><strong>Tipo progetto:</strong> ${project_type}</p>
        ${notes ? `<p style="margin: 8px 0;"><strong>Note:</strong> ${notes}</p>` : ''}
      </div>
      
      <div style="background-color: #e8f5e9; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #2e7d32;">✓ L'appuntamento è stato aggiunto al calendario Google Calendar</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
    
    // Send email to customer
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'IwHome Showroom',
        to: email,
        subject: `Conferma Appuntamento IwHome - ${new Date(appointment_date).toLocaleDateString('it-IT')}`,
        body: customerEmailBody
      });
    } catch (emailError) {
      console.log('Could not send customer email:', emailError.message);
    }
    
    // Send notification email to company
    try {
      await base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'Sistema Appuntamenti IwHome',
        to: 'info@iwhome.it',
        subject: `Nuovo Appuntamento - ${full_name} - ${new Date(appointment_date).toLocaleDateString('it-IT')}`,
        body: companyEmailBody
      });
    } catch (emailError) {
      console.log('Could not send company notification email:', emailError.message);
    }
    
    return Response.json({ 
      success: true, 
      eventId: event.id,
      eventLink: event.htmlLink,
      message: 'Appuntamento creato su Google Calendar'
    });
    
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return Response.json({ 
      error: 'Errore nella creazione dell\'appuntamento',
      details: error.message 
    }, { status: 500 });
  }
});