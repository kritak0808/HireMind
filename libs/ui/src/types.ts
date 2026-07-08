import { ReactNode } from 'react';

/**
 * Component Property Interfaces for HireMind AI Design System
 */

export interface ButtonProps {
  variant: 'gold' | 'glass' | 'ghost';
  size: 'sm' | 'md' | 'lg';
  children: ReactNode;
  disabled?: boolean;
  onClick?: () => void;
  icon?: string;
}

export interface CardProps {
  glowEffect?: boolean;
  blurDensity?: 'light' | 'heavy';
  padding: 'sm' | 'md' | 'lg';
  children: ReactNode;
  title?: string;
  actionWidget?: ReactNode;
}

export interface InputProps {
  label?: string;
  placeholder?: string;
  status?: 'default' | 'error' | 'success';
  errorMessage?: string;
  value: string;
  onChange: (val: string) => void;
  type?: 'text' | 'password' | 'email' | 'number';
}

export interface TypographyProps {
  level: 'h1' | 'h2' | 'h3' | 'body' | 'caption';
  weight?: 'light' | 'regular' | 'medium' | 'bold';
  goldAccent?: boolean;
  children: ReactNode;
}

export interface ChartProps {
  type: 'radar' | 'bar' | 'sparkline';
  dataPoints: Array<{ label: string; value: number }>;
  height?: number;
  interactive?: boolean;
}

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  actionButtons?: ReactNode;
}

export interface LayoutProps {
  sidebarContent?: ReactNode;
  headerContent?: ReactNode;
  children: ReactNode;
}

export interface NavigationProps {
  activeTabId: string;
  tabsList: Array<{ id: string; label: string; icon?: string }>;
  onTabSelect: (id: string) => void;
}
