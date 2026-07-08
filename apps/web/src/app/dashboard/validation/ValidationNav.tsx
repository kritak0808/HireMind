'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Activity, Shield, Award, CheckSquare, FileText, Lock, Users } from 'lucide-react';
import Link from 'next/link';

export function ValidationNav({ active }: { active: string }) {
  const tabs = [
    { name: "Command Center", href: "/dashboard/validation/command", icon: Activity },
    { name: "Quality Gates", href: "/dashboard/validation/gates", icon: CheckSquare },
    { name: "Security", href: "/dashboard/validation/security", icon: Shield },
    { name: "Accessibility", href: "/dashboard/validation/accessibility", icon: Users },
    { name: "Compliance", href: "/dashboard/validation/compliance", icon: Lock },
    { name: "Release Candidates", href: "/dashboard/validation/candidates", icon: FileText },
    { name: "Evidence Explorer", href: "/dashboard/validation/evidence", icon: Lock },
    { name: "Certifications", href: "/dashboard/validation/certifications", icon: Award }
  ];

  return (
    <div className="flex flex-wrap gap-2 mb-8 border-b pb-4" style={{ borderColor: 'rgba(212,175,55,0.15)' }}>
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = active === tab.href;
        return (
          <Link key={tab.href} href={tab.href}>
            <span 
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium uppercase tracking-wider transition-all hover:scale-105 cursor-pointer"
              style={{
                backgroundColor: isActive ? THEME_TOKENS.colors.brand.goldPremium : 'transparent',
                color: isActive ? THEME_TOKENS.colors.neutral.grayDark : THEME_TOKENS.colors.brand.goldPremium,
                border: `1px solid ${THEME_TOKENS.colors.brand.goldPremium}`
              }}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.name}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
