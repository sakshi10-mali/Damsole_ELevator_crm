// old-file/app/dashboard/leads/page.tsx
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

import LeadsPageClient from './LeadsPageClient';

// Add this to force server-side execution
export const revalidate = 0;

export default async function LeadsPage() {
  // Force server-side execution by doing something async
  // This ensures the route is treated as dynamic
  await Promise.resolve();
  
  return <LeadsPageClient />;
}