import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    
    if (!user || user.role !== 'admin') {
      return Response.json({ error: 'Unauthorized - Admin only' }, { status: 401 });
    }

    const { pageContent, pageName, currentTitle, currentDescription } = await req.json();

    if (!pageContent || !pageName) {
      return Response.json({ error: 'pageContent and pageName are required' }, { status: 400 });
    }

    const response = await base44.integrations.Core.InvokeLLM({
      prompt: `Sei un esperto SEO per un'azienda italiana che si occupa di ristrutturazioni, infissi e progetti chiavi in mano.

Analizza il seguente contenuto della pagina "${pageName}" e genera ottimizzazioni SEO:

CONTENUTO ATTUALE:
${pageContent}

META ATTUALI:
Titolo: ${currentTitle || 'N/A'}
Descrizione: ${currentDescription || 'N/A'}

Genera:
1. Meta Title ottimizzato (max 60 caratteri) - deve essere accattivante e includere parole chiave
2. Meta Description ottimizzata (max 160 caratteri) - deve invogliare al click
3. Lista di 5-8 parole chiave rilevanti per questa pagina
4. Valuta la leggibilità del testo (punteggio da 1 a 10)
5. Suggerimenti per migliorare la leggibilità del contenuto
6. Suggerimenti per migliorare il posizionamento SEO
7. 3-5 argomenti correlati da usare per articoli suggeriti

Rispondi in italiano e in formato JSON.`,
      response_json_schema: {
        type: "object",
        properties: {
          meta_title: { type: "string" },
          meta_description: { type: "string" },
          keywords: { 
            type: "array",
            items: { type: "string" }
          },
          readability_score: { type: "number" },
          readability_suggestions: {
            type: "array",
            items: { type: "string" }
          },
          seo_improvements: {
            type: "array",
            items: { type: "string" }
          },
          related_topics: {
            type: "array",
            items: { type: "string" }
          }
        }
      }
    });

    return Response.json({ 
      success: true,
      seo_data: response
    });

  } catch (error) {
    return Response.json({ 
      error: error.message,
      success: false 
    }, { status: 500 });
  }
});