import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const apiKey = Deno.env.get("MAP_EMBED_API");
    
    if (!apiKey) {
      return Response.json({ error: 'API key not configured' }, { status: 500 });
    }

    return Response.json({ apiKey });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});