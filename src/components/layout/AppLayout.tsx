import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import { useAuth } from '@/lib/auth';

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      <Sidebar user={user} isAdmin={isAdmin} />
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-[1400px] mx-auto">
          <Outlet context={{ user }} />
        </div>
      </main>
    </div>
  );
}
