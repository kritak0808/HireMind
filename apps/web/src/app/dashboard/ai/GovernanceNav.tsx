'use client';

import React from 'react';
import { THEME_TOKENS } from '@hiremind/ui';
import { Shield, Sliders, CheckSquare, BarChart2, ShieldAlert, FileText, Database, Activity, DollarSign, GitBranch } from 'lucide-react';
import Link from 'next/link';

export function GovernanceNav({ active }: { active: string }) {
  const tabs = [
    { name: "Command Center", href: "/dashboard/ai/command", icon: Activity },
    { name: "Prompt Studio", href: "/dashboard/ai/prompts", icon: FileText },
    { name: "Model Registry", href: "/dashboard/ai/registry", icon: Database },
    { name: "Routing Settings", href: "/dashboard/ai/router", icon: Sliders },
    { name: "Experiment Lab", href: "/dashboard/ai/experiments", icon: GitBranch },
    { name: "Evaluation Center", href: "/dashboard/ai/evaluations", icon: BarChart2 },
    { name: "Safety Console", href: "/dashboard/ai/safety", icon: ShieldAlert },
    { name: "Compliance Hub", href: "/dashboard/ai/compliance", icon: Shield },
    { name: "Dataset Manager", href: "/dashboard/ai/datasets", icon: Database },
    { name: "Model Health", href: "/dashboard/ai/health", icon: Activity },
    { name: "Cost Dashboard", href: "/dashboard/ai/cost", icon: DollarSign },
    { name: "Approvals", href: "/dashboard/ai/approvals", icon: CheckSquare },
    { name: "Audit logs", href: "/dashboard/ai/audit", icon: FileText }
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
