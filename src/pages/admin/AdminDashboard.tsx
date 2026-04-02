import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, ArrowLeftRight, CheckCircle, Clock } from 'lucide-react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, BarChart, Bar, CartesianGrid, YAxis } from 'recharts';
import { api } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';

const CHART_DATA = [
  { m: 'Jan', deposits: 12000, withdrawals: 4200 }, { m: 'Feb', deposits: 18500, withdrawals: 6100 },
  { m: 'Mar', deposits: 15000, withdrawals: 5300 }, { m: 'Apr', deposits: 22000, withdrawals: 8000 },
  { m: 'May', deposits: 28000, withdrawals: 9500 }, { m: 'Jun', deposits: 35000, withdrawals: 11200 },
];

export default function AdminDashboard() {
  const { user } = useOutletContext<any>();
  const [stats, setStats] = useState({ users: 0, pendingTxns: 0, totalDeposits: 0, activeTraders: 0 });
  const [recentTxns, setRecentTxns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.users.list(),
      api.transactions.getAll(100),
      api.traders.all(),
    ]).then(([users, txns, traders]) => {
      const pending = txns.filter((t: any) => t.status === 'pending').length;
      const totalDep = txns.filter((t: any) => t.type === 'deposit' && t.status === 'approved').reduce((s: number, t: any) => s + t.amount, 0);
      setStats({ users: users.length, pendingTxns: pending, totalDeposits: totalDep, activeTraders: traders.filter((t: any) => t.is_approved).length });
      setRecentTxns(txns.slice(0, 8));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const statCards = [
    { label: 'Total Users', value: stats.users.toString(), icon: Users, gradient: 'bg-primary/15', color: 'text-primary' },
    { label: 'Pending Approvals', value: stats.pendingTxns.toString(), icon: Clock, gradient: 'bg-yellow-400/10', color: 'text-yellow-400' },
    { label: 'Total Deposits', value: `$${stats.totalDeposits.toLocaleString()}`, icon: DollarSign, gradient: 'bg-up', color: 'text-up' },
    { label: 'Active Traders', value: stats.activeTraders.toString(), icon: TrendingUp, gradient: 'bg-blue-400/10', color: 'text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Admin Overview" subtitle="Platform performance at a glance" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(({ label, value, icon: Icon, gradient, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
            className="bg-card border border-border rounded-2xl p-5">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{label}</p>
              <div className={`w-9 h-9 rounded-xl ${gradient} flex items-center justify-center`}>
                <Icon className={`w-4.5 h-4.5 ${color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold font-mono">{value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-bold mb-4">Transaction Volume (6 months)</p>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(222,18%,14%)" />
                <XAxis dataKey="m" tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} tickFormatter={v => `$${v/1000}k`} />
                <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                <Bar dataKey="deposits" fill="hsl(160,84%,39%)" radius={[4,4,0,0]} />
                <Bar dataKey="withdrawals" fill="hsl(0,72%,51%)" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card border border-border rounded-2xl p-5">
          <p className="text-sm font-bold mb-4">Recent Transactions</p>
          {loading ? (
            <div className="space-y-2">{[1,2,3,4].map(i => <div key={i} className="h-12 shimmer rounded-xl" />)}</div>
          ) : (
            <div className="space-y-1">
              {recentTxns.map(tx => (
                <div key={tx.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold capitalize">{tx.type.replace('_', ' ')}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{tx.user_email}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono font-bold">${tx.amount?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p className={`text-[10px] font-semibold capitalize ${tx.status === 'approved' || tx.status === 'completed' ? 'text-up' : tx.status === 'rejected' ? 'text-down' : 'text-yellow-400'}`}>
                      {tx.status}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
