'use client';

import Link from 'next/link';
import { Film, Image as ImageIcon, Palette, FolderOpen, Grid3x3, Archive, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function StudioMegaMenu() {
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
          {/* Column 1: Create */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Create
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Video Generation
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Create videos with Veo 3.1
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
                    <ImageIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Image Generation
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      AI-powered with NanoBanana
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
                    <Palette className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Design Tool
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Canvas editor & templates
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Manage */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Manage
            </h3>
            <ul className="space-y-3">
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
                      Projects
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      All projects & create new
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
                    <Grid3x3 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Scenes & Shots
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Storyboard management
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
                      Images, videos & references
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Quick Actions */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Quick Start
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/dashboard"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <Sparkles className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      New Project
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Start from scratch
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
                    <Film className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Recent Projects
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Continue where you left off
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4: Promo Space */}
          <div>
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-accent/10 rounded-xl p-5 border border-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  New Feature
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Veo 3.1 Video Generation
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Create stunning videos in seconds with our latest AI model.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Try it now
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
