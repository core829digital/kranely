import React from 'react';
import { useTranslation } from 'react-i18next';
import DynamicSEO from '../components/seo/DynamicSEO';
import HeroSection from '../components/home/HeroSection';
import ServicesSection from '../components/home/ServicesSection';
import StatsSection from '../components/home/StatsSection';
import CTASection from '../components/home/CTASection';

export default function Home() {
  const { t } = useTranslation();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kranely",
    "applicationCategory": "BusinessApplication",
    "description": "The Ultimate Window & Door Management Platform for Professionals",
    "operatingSystem": "Web",
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "EUR"
    }
  };

  return (
    <div className="bg-[#1C1A18] min-h-screen text-[#F0EBE8]">
      <DynamicSEO 
        title="Kranely - The Window & Door Management Platform"
        description="Streamline your window installation business with Kranely. The all-in-one CRM, Quoting, and Supplier network platform."
        keywords={['window management software', 'crm for installers', 'b2b SaaS', 'Kranely platform']}
        structuredData={structuredData}
      />
      <HeroSection />
      <StatsSection />
      <ServicesSection />
      <CTASection />
    </div>
  );
}
