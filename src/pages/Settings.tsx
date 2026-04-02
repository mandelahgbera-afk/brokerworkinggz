import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '@/lib/auth';
import { motion } from 'framer-motion';
import { Shield, Bell, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/lib/auth';
import PageHeader from '@/components/ui/PageHeader';
import { toast } from 'sonner';

export default function Settings() {
  const { user } = useOutletContext<OutletContext>();
  const { updateProfile } = useAuth();
  const [form, setForm] = useState({ full_name: user?.full_name || '', email: user?.email || '' });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await updateProfile({ full_name: form.full_name });
    if (error) toast.error(error.message || 'Failed to save');
    else toast.success('Profile updated');
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Settings" subtitle="Manage your account" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="space-y-3">
          {[
            { icon: Palette, label: 'Profile', active: true },
            { icon: Bell, label: 'Notifications', active: false },
            { icon: Shield, label: 'Security', active: false },
          ].map(({ icon: Icon, label, active }) => (
            <motion.button key={label} initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium transition-colors ${active ? 'bg-primary/12 text-primary border border-primary/20' : 'bg-card border border-border text-muted-foreground hover:text-foreground hover:bg-secondary'}`}>
              <Icon className="w-4 h-4" />
              {label}
            </motion.button>
          ))}
        </div>

        <div className="lg:col-span-2 bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-semibold mb-5">Profile Information</p>

          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
              {user?.full_name?.slice(0,2).toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
            </div>
            <div>
              <p className="font-semibold">{user?.full_name || 'No name set'}</p>
              <p className="text-sm text-muted-foreground">{user?.email}</p>
              <span className={`text-xs font-semibold mt-1 inline-block px-2 py-0.5 rounded-md ${user?.role === 'admin' ? 'bg-yellow-500/15 text-yellow-400' : 'bg-primary/15 text-primary'}`}>
                {user?.role || 'user'}
              </span>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Full Name</label>
              <Input value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                className="bg-secondary border-border" placeholder="Your full name" />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Email Address</label>
              <Input value={form.email} disabled className="bg-secondary border-border opacity-60 cursor-not-allowed" />
              <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={saving} className="gradient-green text-white font-semibold glow-green-sm">
                {saving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
