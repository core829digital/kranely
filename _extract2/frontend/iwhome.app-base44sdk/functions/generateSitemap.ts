import { createClientFromRequest } from 'npm:@base44/sdk@0.8.4';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    
    const baseUrl = 'https://yourdomain.com'; // Aggiorna con il tuo dominio
    
    // Pagine statiche
    const staticPages = [
      { url: '/', priority: '1.0', changefreq: 'weekly' },
      { url: '/ChiSiamo', priority: '0.8', changefreq: 'monthly' },
      { url: '/Servizi', priority: '0.9', changefreq: 'monthly' },
      { url: '/Recensioni', priority: '0.8', changefreq: 'weekly' },
      { url: '/Preventivo', priority: '1.0', changefreq: 'weekly' },
      { url: '/Appuntamenti', priority: '0.9', changefreq: 'weekly' },
      { url: '/Contatti', priority: '0.7', changefreq: 'monthly' },
      { url: '/AreaPrivata', priority: '0.6', changefreq: 'monthly' },
    ];

    // Recupera recensioni pubblicate per URL dinamici
    const reviews = await base44.asServiceRole.entities.Review.filter({ status: 'approved' });
    
    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Aggiungi pagine statiche
    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.url}</loc>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
  </url>`;
    });

    // Aggiungi recensioni
    reviews.forEach(review => {
      sitemap += `
  <url>
    <loc>${baseUrl}/Recensioni#${review.id}</loc>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <lastmod>${review.created_date.split('T')[0]}</lastmod>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return new Response(sitemap, {
      status: 200,
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400'
      }
    });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});