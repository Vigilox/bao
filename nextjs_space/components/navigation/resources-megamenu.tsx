'use client';

import Link from 'next/link';
import { BookOpen, GraduationCap, HelpCircle, Newspaper, MessageSquare, Star, Lightbulb, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function ResourcesMegaMenu() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full mt-0 bg-white border-t border-border shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Column 1: Learn */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Learn
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Getting Started
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Quick start guide & tutorials
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
                    <BookOpen className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Documentation
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Feature guides & references
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
                    <GraduationCap className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Academy
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Design principles & tips
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 2: Support */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
              Support
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="#"
                  className="flex items-start gap-3 p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                >
                  <div className="mt-0.5">
                    <HelpCircle className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Help Center
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      FAQs & troubleshooting
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
                    <Newspaper className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      What's New
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Latest features & updates
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
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-medium text-gray-900 group-hover:text-primary transition-colors">
                      Community
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      User stories & feedback
                    </p>
                  </div>
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3: Promo Space */}
          <div>
            <div className="bg-gradient-to-br from-primary/10 via-accent/5 to-primary/10 rounded-xl p-5 border border-primary/20 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-primary/10 rounded-lg">
                  <Lightbulb className="h-4 w-4 text-primary" />
                </div>
                <span className="text-xs font-semibold text-primary uppercase tracking-wide">
                  Pro Tip
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Master AI Prompting
              </h4>
              <p className="text-sm text-gray-600 mb-4 flex-1">
                Learn how to write effective prompts for better AI-generated content.
              </p>
              <Link
                href="#"
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Read the guide
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
