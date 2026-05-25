import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import ScrollToAnchor from './components/utils/ScrollToAnchor';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Phone, Mail, MapPin, Share2, Globe, User, LogOut, LayoutDashboard } from 'lucide-react';
import ReferralWidget from './components/chat/ReferralWidget';
import PageTransition from './components/PageTransition';
import GDPRBanner from './components/GDPRBanner';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

import { useUser, useClerk } from "@clerk/clerk-react";
import NotificationBell from './components/dashboard/NotificationBell';
import LanguageSwitcher from './components/LanguageSwitcher';
import { useQuery } from "convex/react";
import { api } from "../../../Backend/convex/_generated/api";

export default function Layout({ children, currentPageName, isPrivate, sidebarWidth = 280 }) {
  const { t } = useTranslation();
  const [scrolled, setScrolled] = useState(false);
  const [atTop, setAtTop] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);

  const { user: clerkUser } = useUser();
  const { openSignIn, signOut } = useClerk();

  // Fetch Convex User for profile image and accurate role
  // Skip when user is not loaded yet — avoids querying with empty string
  const convexUser = useQuery(
    api.users.getByEmail,
    clerkUser?.primaryEmailAddress?.emailAddress
      ? { email: clerkUser.primaryEmailAddress.emailAddress }
      : "skip"
  );

  // Get profile image from Convex storage - we store storageId, need to get URL
  const rawProfileImage = convexUser?.profile_image;
  
  // If starts with http, it's a full URL; otherwise it's a storage ID
  const isFullUrl = rawProfileImage && rawProfileImage.startsWith('http');
  
  // Get the resolved URL from Convex storage - hook must be called unconditionally
  const resolvedProfileUrl = useQuery(
    api.files.getFileUrl,
    rawProfileImage && !isFullUrl ? { storageId: rawProfileImage } : "skip"
  );
  
  const profileImageUrl = rawProfileImage
    ? (isFullUrl ? rawProfileImage : resolvedProfileUrl)
    : null;

  const user = clerkUser ? {
    email: clerkUser.primaryEmailAddress?.emailAddress,
    full_name: clerkUser.fullName,
    role: convexUser?.role || clerkUser.publicMetadata?.role,
    profile_image: profileImageUrl
  } : null;

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
      setAtTop(scrollY === 0);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogout = async () => {
    await signOut();
  };

  // ── Private area: no public header/footer ──────────────────────────────────
  // sidebarWidth (px) comes from App.jsx GlobalLayout — 264 expanded, 72 collapsed.
  if (isPrivate) {
    return (
      <div className="min-h-screen" style={{ background: '#1C1A18' }}>
        <style>{`
          :root {
            --sidebar-w: ${sidebarWidth}px;
          }
          * {
            box-sizing: border-box;
          }
          html, body {
            overflow-x: hidden;
            max-width: 100vw;
            margin: 0;
            padding: 0;
          }
          .private-area {
            position: fixed;
            top: 0;
            left: var(--sidebar-w, 264px);
            right: 0;
            z-index: 20;
            height: 60px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            padding: 0 1.5rem;
            border-bottom: 1px solid rgba(255,255,255,0.08);
            background: rgba(28,26,24,0.85);
            backdrop-filter: blur(24px);
            -webkit-backdrop-filter: blur(24px);
            transition: left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .private-area-inner {
            display: flex;
            align-items: center;
            justify-content: space-between;
            width: 100%;
            height: 100%;
            max-width: 100%;
          }
          .page-wrapper {
            min-height: 100vh;
            box-sizing: border-box;
            overflow-x: hidden;
            padding-top: 60px;
            margin-left: var(--sidebar-w, 264px);
            transition: margin-left 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          }
          .page-wrapper > * {
            box-sizing: border-box;
            max-width: 100%;
            overflow-x: hidden;
          }
          
          /* Mobile - no sidebar */
          @media (max-width: 767px) {
            .private-area {
              left: 0;
            }
            .page-wrapper {
              margin-left: 0;
            }
          }
        `}</style>

        {/* Private top bar — fixed, relative to the right area */}
        <div className="private-area">
          <div className="private-area-inner">
            {/* Left: page context / breadcrumb hint */}
            <div className="flex items-center gap-2">
              {/* If Mobile, compensate for hamburger menu by adding padding-left */}
              <span className="text-[#F0EBE8]/50 text-xs font-semibold tracking-widest uppercase hidden md:block">
                {currentPageName}
              </span>
              <span className="text-[#F0EBE8]/50 text-xs font-semibold tracking-widest uppercase block md:hidden ml-10">
                {currentPageName}
              </span>
            </div>

            {/* Right: actions */}
            <div className="flex items-center gap-3">
              <LanguageSwitcher />
              {user && <NotificationBell user={user} />}
            </div>
          </div>
        </div>

        <main
          className="page-wrapper"
        >
          <PageTransition>
            {children}
          </PageTransition>
        </main>
        <GDPRBanner />
      </div>
    );
  }


  const navItems = [
    { name: t('landing.footer.product'),     page: 'Home' },
    { name: t('landing.footer.company'),    page: 'About' },
    { name: t('landing.footer.features'), page: 'Services' },
    { name: t('landing.footer.pricing'),  page: 'Pricing' },
    { name: t('landing.footer.contact'),  page: 'Contact' },
  ];

  const legalPages = [
    { name: t('landing.footer.privacy'),    page: 'Privacy' },
    { name: t('landing.footer.cookies'),     page: 'Cookie' },
    { name: t('landing.footer.terms'),  page: 'Terms' },
  ];

  return (
    <div className="min-h-screen bg-[#1C1A18] font-sans relative overflow-x-hidden">
      <ScrollToAnchor />
      {/* ... (backgrounds) ... */}

      <div className="relative z-10">
        <style>{`
            /* ... (css styles) ... */
          `}</style>

        {/* Header */}
        <motion.header
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ease-in-out will-change-transform ${atTop && currentPageName === 'Home'
            ? 'bg-transparent py-5 border-b border-transparent'
            : scrolled
              ? 'bg-[#141210]/90 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.7)] py-2.5 border-b border-white/10'
              : currentPageName === 'Home'
                ? 'bg-[#1C1A18]/60 backdrop-blur-md py-5 border-b border-white/5'
                : 'bg-[#1C1A18]/95 backdrop-blur-xl shadow-lg py-4 border-b border-white/8'
            }`}
          style={{
            backdropFilter: atTop && currentPageName === 'Home' ? 'none' : 'blur(24px)',
            WebkitBackdropFilter: atTop && currentPageName === 'Home' ? 'none' : 'blur(24px)',
            paddingTop: 'env(safe-area-inset-top)',
            paddingLeft: 'env(safe-area-inset-left)',
            paddingRight: 'env(safe-area-inset-right)',
          }}
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-5 md:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-2 sm:gap-4">
              {/* Logo - Kranely SVG Wordmark */}
              <Link to={createPageUrl('Home')} className="flex items-center gap-2 flex-shrink-0 group">
                <svg width="24" height="24" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="transform transition-transform group-hover:scale-105">
                  <rect x="0" y="0" width="40" height="40" rx="8" fill="#1C1A18" stroke="#FFC703" strokeWidth="2" strokeOpacity="0.3"></rect>
                  <path d="M14 10V30M14 20L22 10H28L20 18.5L28 30H22L16 21" stroke="#FFC703" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"></path>
                </svg>
                <span
                  className="font-bold tracking-tight text-white select-none hidden sm:block"
                  style={{ fontSize: scrolled ? '1.3rem' : '1.5rem', letterSpacing: '-0.02em' }}
                >
                  <span style={{ color: '#FFC703' }}>K</span>ranely
                </span>
              </Link>

              {/* Desktop Nav - Centered */}
              <nav className="hidden lg:flex items-center gap-3 xl:gap-5 absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2">
                {navItems.map((item) => (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    className={`nav-link text-sm tracking-wide transition-all duration-300 font-medium relative whitespace-nowrap ${item.page === 'Calcolatore'
                      ? 'text-[#FFC703] hover:text-[#FFC703]/80'
                      : currentPageName === item.page
                        ? 'text-white font-semibold'
                        : 'text-white/85 hover:text-white'
                      }`}
                  >
                    {item.name}
                  </Link>
                ))}
              </nav>

              {/* User Menu Desktop */}
              <div className="hidden lg:flex items-center gap-2 flex-shrink-0 ml-auto">
                <a
                  href="https://www.instagram.com/kranely/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`p-2 rounded-lg hover:bg-white/10 transition-all ${scrolled ? 'text-white/80' : 'text-white'}`}
                  title="Follow us on Instagram"
                >
                  <Share2 size={scrolled ? 18 : 20} />
                </a>

                {/* Language Switcher - Public Header */}
                <div className="mr-2">
                  <LanguageSwitcher />
                </div>

                {/* Notification Bell */}
                {user && (
                  <div className="mr-2">
                    <NotificationBell user={user} />
                  </div>
                )}

                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 text-white hover:bg-white/10 rounded-full px-3 py-1.5 transition-all">
                        <div className={`rounded-full bg-gradient-to-br from-white/20 to-white/10 flex items-center justify-center transition-all duration-300 overflow-hidden border border-white/20 ${scrolled ? 'w-7 h-7' : 'w-8 h-8'
                          }`}>
                          {user.profile_image ? (
                            <img src={user.profile_image} alt="Profile" className="w-full h-full object-cover" />
                          ) : (
                            <User size={scrolled ? 14 : 16} />
                          )}
                        </div>
                        <span className={`hidden xl:block transition-all duration-300 ${scrolled ? 'text-xs' : 'text-sm'}`}>
                          {user.full_name || user.email}
                        </span>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 bg-[#141210] border-white/10">
                      <DropdownMenuItem asChild>
                        <Link to={createPageUrl('Dashboard')} className="flex items-center gap-2 cursor-pointer text-white hover:bg-white/10">
                          <LayoutDashboard size={16} />
                          Dashboard
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-white/10" />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-white hover:bg-white/10">
                        <LogOut size={16} />
                        Log out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <Button
                    onClick={() => openSignIn()}
                    className={`bg-gradient-to-r from-white to-gray-200 text-black hover:shadow-xl rounded-full transition-all duration-300 font-medium ${scrolled ? 'px-4 py-1.5 text-sm' : 'px-5 py-2'
                      }`}
                  >
                    <User size={scrolled ? 14 : 16} className="mr-2" />
                    <span className="hidden sm:inline">Sign in</span>
                  </Button>
                )}
              </div>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="lg:hidden p-2 rounded-lg transition-all duration-200 text-white hover:bg-white/10"
              >
                {menuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          <AnimatePresence>
            {menuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="lg:hidden bg-[#141210]/97 backdrop-blur-xl border-t border-white/8"
              >
                <nav className="max-w-7xl mx-auto px-6 py-6 flex flex-col gap-4">
                  {navItems.map((item) => (
                    <Link
                      key={item.page}
                      to={createPageUrl(item.page)}
                      onClick={() => setMenuOpen(false)}
                      className={`text-lg transition-colors ${item.page === 'Pricing'
                        ? 'text-[#FFC703] hover:text-[#FFC703]/80'
                        : currentPageName === item.page
                          ? 'text-white'
                          : 'text-[#F0EBE8]/80 hover:text-white'
                        }`}
                    >
                      {item.name}
                    </Link>
                  ))}

                  {/* User Menu Mobile */}
                  <div className="pt-4 border-t border-white/8">
                    {user ? (
                      <>
                        <div className="px-4 py-2 text-sm text-[#F0EBE8]/75 mb-2">
                          {user.full_name || user.email}
                        </div>
                        <Link
                          to={createPageUrl('Dashboard')}
                          onClick={() => setMenuOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/8 rounded-lg"
                        >
                          <LayoutDashboard size={18} />
                          Dashboard
                        </Link>
                        <button
                          onClick={() => {
                            handleLogout();
                            setMenuOpen(false);
                          }}
                          className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/8 rounded-lg w-full text-left"
                        >
                          <LogOut size={18} />
                          Log out
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => {
                          openSignIn();
                          setMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-3 text-white hover:bg-white/8 rounded-lg w-full text-left"
                      >
                        <User size={18} />
                        Sign in
                      </button>
                    )}
                  </div>
                </nav>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.header>

        {/* Main Content */}
        <main>
          <PageTransition>
            {children}
          </PageTransition>
        </main>

        {/* Referral Widget */}
        <ReferralWidget />

        {/* GDPR Banner */}
        <GDPRBanner />


      </div>

      {/* Footer */}
      <footer className="relative bg-gradient-to-b from-[#1C1A18] to-[#111009] text-[#F0EBE8] pt-16 pb-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#FFC703] rounded-full blur-[120px]"></div>
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-[#FFC703]/40 rounded-full blur-[120px]"></div>
        </div>
        <div className="relative max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
            {/* Logo & Description */}
            <div className="lg:col-span-1">
              <div className="mb-6">
                <span
                  className="font-bold tracking-tight text-white select-none"
                  style={{ fontSize: '1.6rem', letterSpacing: '-0.02em' }}
                >
                  <span style={{ color: '#FFC703' }}>K</span>ranely
                </span>
              </div>
              <p className="text-[#F0EBE8]/55 text-sm leading-relaxed mb-6">
                {t('app.description')}
              </p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/kranely/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-[#FFC703]/10 flex items-center justify-center hover:bg-[#FFC703]/20 hover:scale-110 transition-all duration-300">
                  <Share2 size={18} className="text-[#FFC703]/70 hover:text-[#FFC703]" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-300">
                  <Globe size={18} className="text-[#e9ecef]/70 hover:text-white" />
                </a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 hover:scale-110 transition-all duration-300">
                  <Globe size={18} className="text-[#e9ecef]/70 hover:text-white" />
                </a>
              </div>
            </div>

            {/* Navigation */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
                {t('landing.footer.product')}
              </h4>
              <ul className="space-y-3">
                {navItems.map((item) => (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
                {t('landing.footer.legal')}
              </h4>
              <ul className="space-y-3">
                {legalPages.map((item) => (
                  <li key={item.page}>
                    <Link
                      to={createPageUrl(item.page)}
                      className="text-white/60 hover:text-white transition-colors text-sm"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h4 className="text-sm font-semibold uppercase tracking-wider text-white mb-6">
                {t('landing.footer.contact')}
              </h4>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-[#F0EBE8]/50 text-sm">
                  <Phone size={16} className="text-[#FFC703]" />
                  <a href="tel:+390000000000" className="hover:text-white transition-colors">+39 000 000 0000</a>
                </li>
                <li className="flex items-start gap-3 text-[#F0EBE8]/50 text-sm">
                  <Mail size={16} className="text-[#FFC703] mt-0.5" />
                  <div className="flex flex-col">
                    <a href="mailto:info@kranely.com" className="hover:text-white transition-colors">info@kranely.com</a>
                  </div>
                </li>
                <li className="flex items-start gap-3 text-[#F0EBE8]/50 text-sm">
                  <MapPin size={16} className="mt-0.5 text-[#FFC703]" />
                  <span>Italy</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="border-t border-white/8 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-[#F0EBE8]/40 text-sm flex flex-col md:items-start items-center">
              <p>© {new Date().getFullYear()} Kranely. {t('landing.footer.all_rights')}</p>
              <p className="text-xs opacity-70 mt-1">Powered by Core829 Digital</p>
            </div>
            <p className="text-[#FFC703]/60 text-xs font-semibold tracking-widest uppercase">
              Enterprise · Quality · Growth
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}