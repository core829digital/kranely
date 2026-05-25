import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emailBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 10px;">
        <div style="background: white; padding: 30px; border-radius: 8px;">
          <h1 style="color: #333; margin-bottom: 20px;">Benvenuto in IwHome! 🎉</h1>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Ciao <strong>${user.full_name || user.email}</strong>,
          </p>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Siamo felici di averti con noi! Hai fatto il primo passo per accedere alla tua area privata.
          </p>
          
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 25px 0; border-left: 4px solid #667eea;">
            <h3 style="color: #333; margin-top: 0;">Il tuo codice di accesso:</h3>
            <p style="font-size: 24px; font-weight: bold; color: #667eea; letter-spacing: 2px; margin: 15px 0;">
              IWSHOWROOMLIVELLO1@AREAPRIVATA
            </p>
            <p style="color: #666; font-size: 14px; margin-bottom: 0;">
              Inserisci questo codice nelle impostazioni della tua area privata per attivare tutte le funzionalità.
            </p>
          </div>
          
          <p style="color: #555; font-size: 16px; line-height: 1.6;">
            Con l'area privata potrai:
          </p>
          
          <ul style="color: #555; font-size: 16px; line-height: 1.8;">
            <li>📅 Gestire i tuoi appuntamenti</li>
            <li>📄 Visualizzare i preventivi</li>
            <li>💬 Messaggiare con il nostro team</li>
            <li>⚙️ Personalizzare le tue impostazioni</li>
          </ul>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${Deno.env.get('BASE_URL') || 'https://iwhome.it'}/dashboard" 
               style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; text-decoration: none; border-radius: 50px; font-weight: bold; font-size: 16px;">
              Vai all'Area Privata
            </a>
          </div>
          
          <p style="color: #888; font-size: 14px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
            Se hai domande, non esitare a contattarci.<br>
            Team IwHome
          </p>
        </div>
      </div>
    `;

    await base44.integrations.Core.SendEmail({
      to: user.email,
      subject: '🎉 Benvenuto in IwHome - Il tuo codice di accesso',
      body: emailBody
    });

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});