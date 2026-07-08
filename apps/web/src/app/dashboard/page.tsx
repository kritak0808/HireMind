'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardRootPage() {
  const router = useRouter();

  useEffect(() => {
    const lastPage = localStorage.getItem('last_visited_dashboard_page');
    router.replace(lastPage || '/dashboard/recruitment');
  }, [router]);

  return null;
}
