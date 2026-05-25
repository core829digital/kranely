import { useEffect } from 'react';

export default function SEO({ 
  title = 'IwHome - Materiali, Design, Casa | Ristrutturazioni e Infissi Reggio Emilia',
  description = 'Trasformiamo i tuoi spazi con soluzioni complete di ristrutturazione, infissi in PVC, alluminio e legno, e progetti chiavi in mano. Showroom a Reggio Emilia.',
  keywords = 'ristrutturazioni reggio emilia, infissi pvc, finestre alluminio, finestre legno, chiavi in mano, interior design, showroom infissi, preventivi online',
  image = 'https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/693fee2042e99e5e698561c0/95bae648d_logo.png',
  url = window.location.href,
  type = 'website',
  author = 'IwHome Team',
  structuredData
}) {
  useEffect(() => {
    // Title
    document.title = title;

    // Meta tags
    const metaTags = [
      { name: 'description', content: description },
      { name: 'keywords', content: keywords },
      { name: 'author', content: author },
      { name: 'robots', content: 'index, follow' },
      { name: 'language', content: 'Italian' },
      { name: 'revisit-after', content: '7 days' },
      
      // Open Graph
      { property: 'og:title', content: title },
      { property: 'og:description', content: description },
      { property: 'og:image', content: image },
      { property: 'og:url', content: url },
      { property: 'og:type', content: type },
      { property: 'og:site_name', content: 'IwHome' },
      { property: 'og:locale', content: 'it_IT' },
      
      // Twitter Card
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:title', content: title },
      { name: 'twitter:description', content: description },
      { name: 'twitter:image', content: image }];

    metaTags.forEach(({ name, property, content }) => {
      const attr = name ? 'name' : 'property';
      const value = name || property;
      
      let tag = document.querySelector(`meta[${attr}="${value}"]`);
      
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute(attr, value);
        document.head.appendChild(tag);
      }
      
      tag.setAttribute('content', content);
    });

    // Canonical URL
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', url);

    // Structured Data (Schema.org)
    if (structuredData) {
      let script = document.querySelector('script[type="application/ld+json"]');
      if (!script) {
        script = document.createElement('script');
        script.setAttribute('type', 'application/ld+json');
        document.head.appendChild(script);
      }
      script.textContent = JSON.stringify(structuredData);
    }

  }, [title, description, keywords, image, url, type, author, structuredData]);

  return null;
}