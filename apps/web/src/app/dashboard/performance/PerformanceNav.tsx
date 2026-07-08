'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Activity, Zap, Cpu, Server, TrendingUp, ShieldAlert, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export function PerformanceNav({ active }: { active: string }) {
  const tabs = [
    { name: "Command Center", href: "/dashboard/performance/command", icon: Activity },
    { name: "Infra Health", href: "/dashboard/performance/health", icon: Server },
    { name: "Scalability", href: "/dashboard/performance/scalability", icon: TrendingUp },
    { name: "Cache Analytics", href: "/dashboard/performance/caching", icon: Zap },
    { name: "Load Testing", href: "/dashboard/performance/loadtests", icon: CloudLightning },
    { name: "Capacity & Cost", href: "/dashboard/performance/capacity", icon: Cpu },
    { name: "Recovery Center", href: "/dashboard/performance/recovery", icon: RefreshCw },
    { name: "Incidents", href: "/dashboard/performance/incidents", icon: ShieldAlert }
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

import { CloudLightning } from 'lucide-react';
