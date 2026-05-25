import React from 'react';
import DynamicSEO from '../components/seo/DynamicSEO';
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import StatsSection from '../components/home/StatsSection';
import GalleryCarousel from '../components/home/GalleryCarousel';
import PartnersSection from '../components/home/PartnersSection';
import MapSection from '../components/home/MapSection';
import CTASection from '../components/home/CTASection';

export default function Home() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "HomeAndConstructionBusiness",
    "name": "IwHome",
    "description": "Esperti in ristrutturazioni chiavi in mano e infissi su misura",
    "address": {
      "@type": "PostalAddress",
      "streetAddress": "Via Montefiorino 10/E",
      "addressLocality": "Reggio Emilia",
      "postalCode": "42124",
      "addressCountry": "IT"
    },
    "telephone": "+39 340 292 1052",
    "email": "info@iwhome.it",
    "priceRange": "€€-€€€"
  };

  return (
    <div>
      <DynamicSEO 
        title="IwHome - Ristrutturazioni Chiavi in Mano e Infissi di Qualità"
        description="Trasforma i tuoi spazi con IwHome. Ristrutturazioni complete, finestre su misura in PVC, alluminio e legno. Preventivi online immediati."
        keywords={['ristrutturazioni', 'infissi', 'chiavi in mano', 'finestre pvc', 'serramenti', 'reggio emilia']}
        structuredData={structuredData}
      />
      <HeroSection />
      <ServicesSection />
      <StatsSection />
      <GalleryCarousel />
      <PartnersSection />
      <MapSection />
      <CTASection />
    </div>
  );
}