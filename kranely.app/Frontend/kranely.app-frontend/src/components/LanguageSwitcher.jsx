import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { SUPPORTED_LANGUAGES } from '@/lib/i18n';
import { Globe } from 'lucide-react';

export default function LanguageSwitcher({ className = "" }) {
  const { i18n } = useTranslation();
  const [currentLang, setCurrentLang] = useState(() => {
    const saved = localStorage.getItem('i18nextLng');
    return SUPPORTED_LANGUAGES.find(l => l.code === (saved || i18n.language)) || SUPPORTED_LANGUAGES[1]; // Default to Italian
  });

  const handleChange = (e) => {
    const newLang = e.target.value;
    
    // Save to localStorage directly
    localStorage.setItem('i18nextLng', newLang);
    
    // Change i18n language
    i18n.changeLanguage(newLang);
    
    // Update state
    setCurrentLang(SUPPORTED_LANGUAGES.find(l => l.code === newLang) || SUPPORTED_LANGUAGES[1]);
    
    // Refresh the page to apply changes
    window.location.reload();
  };

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center gap-2">
        <Globe size={14} className="text-[#F0EBE8]/60" />
        <select
          value={localStorage.getItem('i18nextLng') || 'it'}
          onChange={handleChange}
          className="bg-transparent border border-white/10 rounded-lg px-2 py-1.5 text-sm text-[#F0EBE8] hover:border-[#FFC703]/30 focus:border-[#FFC703]/50 focus:outline-none cursor-pointer appearance-none"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23F0EBE8' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'right 8px center',
            paddingRight: '28px'
          }}
        >
          {SUPPORTED_LANGUAGES.map((lang) => (
            <option 
              key={lang.code} 
              value={lang.code}
              className="bg-[#1C1A18] text-[#F0EBE8]"
            >
              {lang.flag} {lang.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
