'use client';

import Link from 'next/link';
import { Instagram, Facebook, Linkedin, FileText, Briefcase, Award, Sparkles, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';

const templateCategories = [
  {
    name: 'Social Media',
    icon: Instagram,
    count: 10,
    items: [
      { name: 'Instagram Posts', size: '1:1' },
      { name: 'Instagram Stories', size: '9:16' },
      { name: 'Facebook Covers', size: '16:9' },
      { name: 'LinkedIn Posts', size: '1:1' },
    ],
  },
  {
    name: 'Marketing',
    icon: Sparkles,
    count: 8,
    items: [
      { name: 'Flyers & Posters', size: 'A4' },
      { name: 'Business Cards', size: '3.5x2"' },
      { name: 'Brochures', size: 'Tri-fold' },
      { name: 'Presentations', size: '16:9' },
    ],
  },
  {
    name: 'Business',
    icon: Briefcase,
    count: 12,
    items: [
      { name: 'Resumes & CVs', size: 'Letter' },
      { name: 'Letterheads', size: 'A4' },
      { name: 'Email Signatures', size: 'Web' },
      { name: 'Certificates', size: '11x8.5"' },
    ],
  },
  {
    name: 'Creative',
    icon: Award,
    count: 10,
    items: [
      { name: 'Infographics', size: 'Vertical' },
      { name: 'Event Invitations', size: '5x7"' },
      { name: 'Coupons & Vouchers', size: '4x6"' },
      { name: 'Brand Kits', size: 'Various' },
    ],
  },
];

export function TemplatesMegaMenu() {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className="absolute left-0 right-0 top-full mt-0 bg-white border-t border-border shadow-2xl"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
          {/* Template Categories */}
          {templateCategories.map((category, idx) => {
            const Icon = category.icon;
            return (
              <div key={idx}>
                <div className="flex items-center gap-2 mb-4">
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                    {category.name}
                  </h3>
                  <span className="text-xs text-gray-500">({category.count})</span>
                </div>
                <ul className="space-y-2">
                  {category.items.map((item, itemIdx) => (
                    <li key={itemIdx}>
                      <Link
                        href="/dashboard"
                        className="block p-2 rounded-lg hover:bg-primary/5 transition-colors group"
                      >
                        <div className="font-medium text-sm text-gray-900 group-hover:text-primary transition-colors">
                          {item.name}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{item.size}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}

          {/* Promo Space */}
          <div>
            <div className="bg-gradient-to-br from-accent/10 via-primary/5 to-primary/10 rounded-xl p-5 border border-accent/20 h-full flex flex-col">
              <div className="flex items-center gap-2 mb-3">
                <div className="p-1.5 bg-accent/10 rounded-lg">
                  <Award className="h-4 w-4 text-accent" />
                </div>
                <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                  40+ Templates
                </span>
              </div>
              <h4 className="font-bold text-gray-900 mb-2">
                Professional Designs
              </h4>
              <p className="text-sm text-gray-600 mb-4 flex-1">
                Pre-made templates for every need. Customize and export in minutes.
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-1 text-sm font-medium text-accent hover:text-accent/80 transition-colors"
              >
                Browse all templates
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>

        {/* Bottom Link */}
        <div className="mt-6 pt-6 border-t border-border">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            <Sparkles className="h-4 w-4" />
            View all 40+ templates
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
