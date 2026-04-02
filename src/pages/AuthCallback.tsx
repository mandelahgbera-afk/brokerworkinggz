import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();
  const processed = useRef(false);

  useEffect(() => {
    if (processed.current) return;
    processed.current = true;

    const handleCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Vested] Auth callback error:', error.message);
          navigate('/auth', { replace: true });
          return;
        }

        if (data.session) {
          navigate('/dashboard', { replace: true });
        } else {
          const hash = window.location.hash;
          if (hash && hash.includes('access_token')) {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { data: retryData } = await supabase.auth.getSession();
            if (retryData.session) {
              navigate('/dashboard', { replace: true });
              return;
            }
          }
          navigate('/auth', { replace: true });
        }
      } catch (err) {
        console.error('[Vested] Auth callback exception:', err);
        navigate('/auth', { replace: true });
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-2xl gradient-green flex items-center justify-center glow-green-sm">
          <TrendingUp className="w-6 h-6 text-white" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Confirming your account...</p>
        </div>
      </div>
    </div>
  );
}
