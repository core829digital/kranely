/**
 * WhiteLabelContext
 * ─────────────────
 * Loads per-organization branding from Convex and injects CSS variables
 * so every component automatically reflects the org's theme.
 *
 * Defaults to Kranely brand if no white-label config is set.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../../Backend/convex/_generated/api';
import { useAuth } from './AuthContext';

// ── Kranely default branding ──────────────────────────────────────────────────
export const KRANELY_DEFAULT_BRAND = {
  appName:       'Kranely',
  tagline:       'Window & Door Management Platform',
  logoUrl:       '/logo.png',
  primaryColor:  '#FFC703',   // accent
  darkColor:     '#535252',   // dark
  lightColor:    '#F0EBE8',   // light / bg
  appBgColor:    '#1C1A18',   // dashboard bg
  supportEmail:  'support@kranely.com',
  emailFromName: 'Kranely',
  customDomain:  null,
  enabled:       false,
};

const WhiteLabelContext = createContext(KRANELY_DEFAULT_BRAND);

// Convert #RRGGBB → "H S% L%" for CSS custom properties
function hexToHsl(hex) {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function applyBrandToCss(brand) {
  const root = document.documentElement;
  const accent = brand.primaryColor || KRANELY_DEFAULT_BRAND.primaryColor;
  const dark   = brand.darkColor    || KRANELY_DEFAULT_BRAND.darkColor;
  const light  = brand.lightColor   || KRANELY_DEFAULT_BRAND.lightColor;

  // Inject CSS variables used by Tailwind and index.css
  root.style.setProperty('--kranely-accent', accent);
  root.style.setProperty('--kranely-dark',   dark);
  root.style.setProperty('--kranely-light',  light);

  // Also update the primary / accent Tailwind tokens (HSL)
  if (accent.startsWith('#')) {
    root.style.setProperty('--primary', hexToHsl(accent));
    root.style.setProperty('--accent',  hexToHsl(accent));
    root.style.setProperty('--ring',    hexToHsl(accent));
  }

  // Update page title
  if (brand.appName) {
    document.title = `${brand.appName} | ${brand.tagline || 'Management Platform'}`;
  }

  // Update theme-color meta
  const themeColor = document.querySelector('meta[name="theme-color"]');
  if (themeColor && brand.appBgColor) themeColor.content = brand.appBgColor;
}

export const WhiteLabelProvider = ({ children }) => {
  const { convexUser, isAuthenticated } = useAuth();
  const [brand, setBrand] = useState(KRANELY_DEFAULT_BRAND);

  // Load white-label settings for the user's organization
  const orgId = convexUser?.organization_id;
  const wlSettings = useQuery(
    api.organizations.getWhiteLabel,
    orgId ? { organizationId: orgId } : 'skip'
  );

  useEffect(() => {
    if (wlSettings?.enabled) {
      const merged = { ...KRANELY_DEFAULT_BRAND, ...wlSettings };
      setBrand(merged);
      applyBrandToCss(merged);
    } else {
      setBrand(KRANELY_DEFAULT_BRAND);
      applyBrandToCss(KRANELY_DEFAULT_BRAND);
    }
  }, [wlSettings]);

  return (
    <WhiteLabelContext.Provider value={brand}>
      {children}
    </WhiteLabelContext.Provider>
  );
};

export const useWhiteLabel = () => useContext(WhiteLabelContext);
