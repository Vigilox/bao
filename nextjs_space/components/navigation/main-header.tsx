'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { ChevronDown, Bell, HelpCircle, Menu } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { StudioMegaMenu } from './studio-megamenu';
import { TemplatesMegaMenu } from './templates-megamenu';
import { ResourcesMegaMenu } from './resources-megamenu';
import { AccountMegaMenu } from './account-megamenu';

type MegaMenuType = 'studio' | 'templates' | 'resources' | 'account' | null;

// Helper function to format user name (e.g., "John Doe" -> "John D.")
function formatUserName(name?: string | null): string {
  if (!name) return 'User';
  const parts = name.trim().split(' ');
  if (parts.length === 1) return parts[0];
  const firstName = parts[0];
  const lastInitial = parts[parts.length - 1][0];
  return `${firstName} ${lastInitial}.`;
}

export function MainHeader() {
  const { data: session } = useSession() || {};
  const [activeMegaMenu, setActiveMegaMenu] = useState<MegaMenuType>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleMouseEnter = (menu: MegaMenuType) => {
    setActiveMegaMenu(menu);
  };

  const handleMouseLeave = () => {
    setActiveMegaMenu(null);
  };

  return (
    <header
      className="bg-white border-b border-border sticky top-0 z-50"
      onMouseLeave={handleMouseLeave}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="BAO Logo"
                fill
                className="object-contain"
              />
            </div>
            <span className="text-2xl font-bold text-foreground">BAO</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            <Link
              href="/"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
            >
              Home
            </Link>

            {/* Studio Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('studio')}
            >
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 flex items-center gap-1"
              >
                Studio
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Templates Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('templates')}
            >
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 flex items-center gap-1"
              >
                Templates
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* Resources Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => handleMouseEnter('resources')}
            >
              <button
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 flex items-center gap-1"
              >
                Resources
                <ChevronDown className="h-4 w-4" />
              </button>
            </div>

            {/* My Account Dropdown - Only show when logged in */}
            {session && (
              <div
                className="relative"
                onMouseEnter={() => handleMouseEnter('account')}
              >
                <button
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5 flex items-center gap-1"
                >
                  My Account
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}

            <Link
              href="#pricing"
              className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
            >
              Pricing
            </Link>
          </nav>

          {/* Right Side: Icons + Auth */}
          <div className="flex items-center gap-3">
            {/* Icon Buttons (Desktop Only) */}
            {session && (
              <div className="hidden lg:flex items-center gap-2">
                <Link
                  href="/dashboard"
                  className="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                  title="Notifications"
                >
                  <div className="relative">
                    <Bell className="h-5 w-5" />
                    <span className="absolute -top-1 -right-1 h-4 w-4 bg-accent text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                      2
                    </span>
                  </div>
                </Link>
                <Link
                  href="#"
                  className="p-2 text-gray-600 hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                  title="Help"
                >
                  <HelpCircle className="h-5 w-5" />
                </Link>
              </div>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-gray-600 hover:text-primary transition-colors"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Auth Buttons / User Profile Badge */}
            {session ? (
              <div 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-default"
                title="For account settings, use My Account menu"
              >
                <div className="w-8 h-8 bg-primary text-white rounded-full flex items-center justify-center font-medium text-sm">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="hidden md:block text-sm font-medium text-gray-900">
                  {formatUserName(session?.user?.name)}
                </div>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-3">
                <Link
                  href="/auth/signin"
                  className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-primary transition-colors"
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="px-6 py-2.5 bg-primary text-white font-medium rounded-lg hover:bg-primary/90 transition shadow-lg shadow-primary/25"
                >
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mega Menus */}
      <AnimatePresence>
        {activeMegaMenu === 'studio' && <StudioMegaMenu />}
        {activeMegaMenu === 'templates' && <TemplatesMegaMenu />}
        {activeMegaMenu === 'resources' && <ResourcesMegaMenu />}
        {activeMegaMenu === 'account' && <AccountMegaMenu />}
      </AnimatePresence>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-white">
          <div className="px-4 py-4 space-y-2">
            <Link
              href="/"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Home
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Studio
            </Link>
            <Link
              href="/dashboard"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Templates
            </Link>
            <Link
              href="#"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Resources
            </Link>
            {session && (
              <Link
                href="/dashboard"
                className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
                onClick={() => setMobileMenuOpen(false)}
              >
                My Account
              </Link>
            )}
            <Link
              href="#pricing"
              className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
              onClick={() => setMobileMenuOpen(false)}
            >
              Pricing
            </Link>
            {!session && (
              <>
                <Link
                  href="/auth/signin"
                  className="block px-4 py-2 text-sm font-medium text-gray-700 hover:bg-primary/5 rounded-lg"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign In
                </Link>
                <Link
                  href="/auth/signup"
                  className="block px-4 py-2 text-sm font-medium bg-primary text-white rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
