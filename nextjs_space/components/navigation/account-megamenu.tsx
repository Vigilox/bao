'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { 
  LayoutDashboard, 
  FolderOpen, 
  Archive, 
  CreditCard, 
  Settings, 
  User, 
  Bell, 
  Palette,
  LogOut,
  Crown,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

export function AccountMegaMenu() {
  const { data: session } = useSession() || {};

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: '/auth/signin' });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full mt-0 bg-white border-t border-border shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Column 1: Profile & Navigation */}
          <div>
            <div className="mb-6 pb-4 border-b border-border">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 bg-primary text-white rounded-full flex items-center justify-center font-bold text-lg">
                  {session?.user?.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold text-gray-900">
                    {session?.user?.name || 'User'}
                  </div>
                  <div className="text-xs text-gray-500">
                    {session?.user?.email || 'user@example.com'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-700 text-xs font-medium rounded-full">
                  <Crown className="h-3 w-3" />
                  Free Plan
                </span>
                <Link
                  href="#"
                  className="text-xs font-medium text-primary hover:text-primary/80 transition-colors"
                >
                  Upgrade →
                </Link>
              </div>
            </div>

            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Navigation
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <LayoutDashboard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Dashboard
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Overview & analytics
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <FolderOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      My Projects
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      All your creations
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Archive className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Asset Library
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Images, videos & files
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Account & Billing */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Account & Billing
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <CreditCard className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Subscription & Credits
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Manage your plan
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Upgrade Plan
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Unlock premium features
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Usage & Credits
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Track your consumption
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Settings & Preferences */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Settings
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Profile
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Personal information
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Settings className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Preferences
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Customize your experience
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Bell className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Notifications
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Email & push settings
                    </p>
                  </div>
                </Link>
              </li>
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Appearance
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Theme & display options
                    </p>
                  </div>
                </Link>
              </li>
            </ul>

            {/* Sign Out */}
            <div className="mt-6 pt-4 border-t border-border">
              <button
                onClick={handleSignOut}
                className="flex items-start gap-3 p-2 rounded-lg hover:bg-accent/5 transition-colors group w-full text-left"
              >
                <div className="mt-0.5">
                  <LogOut className="h-5 w-5 text-accent" />
                </div>
                <div>
                  <div className="font-medium text-accent group-hover:text-accent/80 transition-colors">
                    Sign Out
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    End your session
                  </p>
                </div>
              </button>
            </div>
          </div>

          {/* Column 4: Promo Space */}
          <div>
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-accent/10 rounded-xl p-5 border border-accent/20 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Crown className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  Upgrade Now
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Unlock Premium Features
              </h4>
              <p className="text-sm text-gray-600 mb-4 flex-1">
                Get unlimited generations, priority support, and access to advanced AI models.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  <span className="text-gray-700">Unlimited videos & images</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  <span className="text-gray-700">Priority processing</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  <span className="text-gray-700">Advanced AI models</span>
                </li>
                <li className="flex items-start gap-2 text-sm">
                  <span className="text-accent mt-0.5">✓</span>
                  <span className="text-gray-700">24/7 priority support</span>
                </li>
              </ul>
              <Link
                href="#"
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-accent text-white font-medium rounded-lg hover:bg-accent/90 transition-colors shadow-lg shadow-accent/25"
              >
                Upgrade to Pro
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
