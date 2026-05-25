/**
 * Kranely — Sitemap Generator
 * Served as an edge function (Vercel Edge / Deno Deploy).
 * Returns a valid XML sitemap for all public pages.
 */

Deno.serve(async (_req: Request) => {
  const BASE_URL = 'https://app.kranely.com';
  const today = new Date().toISOString().split('T')[0];

  const staticPages = [
    { url: '/',         priority: '1.0', changefreq: 'weekly'   },
    { url: '/About',    priority: '0.8', changefreq: 'monthly'  },
    { url: '/Services', priority: '0.9', changefreq: 'monthly'  },
    { url: '/Pricing',  priority: '1.0', changefreq: 'weekly'   },
    { url: '/Blog',     priority: '0.8', changefreq: 'weekly'   },
    { url: '/Contact',  priority: '0.7', changefreq: 'monthly'  },
    { url: '/Reviews',  priority: '0.7', changefreq: 'weekly'   },
  ];

  const urlEntries = staticPages
    .map(p => `  <url>
    <loc>${BASE_URL}${p.url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`)
    .join('\n');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urlEntries}
</urlset>`;

  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, stale-while-revalidate=3600',
    },
  });
});