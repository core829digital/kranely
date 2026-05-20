import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return Response.json({ error: 'Codice richiesto' }, { status: 400 });
    }

    // Check if code exists
    const accessCodes = await base44.asServiceRole.entities.AccessCode.filter({ code });

    if (accessCodes.length === 0) {
      return Response.json({ error: 'Codice non valido' }, { status: 404 });
    }

    const accessCode = accessCodes[0];

    if (!accessCode.active) {
      return Response.json({ error: 'Codice non più attivo' }, { status: 403 });
    }

    // Update user based on code type
    let updateData = {
      access_code: code,
      access_level: accessCode.type
    };

    if (accessCode.type === 'azienda') {
      updateData.is_company = true;
      updateData.company_role = 'admin';
      updateData.company_code = code;
    } else if (accessCode.type === 'standard') {
      updateData.is_company = false;
      updateData.company_role = null;
    }

    // Update user
    await base44.asServiceRole.entities.User.update(user.id, updateData);

    // Add user to used_by list
    const usedBy = accessCode.used_by || [];
    if (!usedBy.includes(user.email)) {
      await base44.asServiceRole.entities.AccessCode.update(accessCode.id, {
        used_by: [...usedBy, user.email]
      });
    }

    return Response.json({ 
      success: true, 
      type: accessCode.type,
      message: accessCode.type === 'azienda' 
        ? 'Accesso aziendale attivato con successo' 
        : 'Accesso area privata attivato'
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});