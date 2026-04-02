import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { OutletContext } from '@/lib/auth';
import { motion } from 'framer-motion';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ArrowUpDown } from 'lucide-react';
import { api } from '@/lib/api';
import PageHeader from '@/components/ui/PageHeader';
import { CoinIcon, getCoinColor } from '@/components/ui/CryptoRow';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const MOCK_CHART = [
  { t: '00:00', v: 42100 }, { t: '04:00', v: 43200 }, { t: '08:00', v: 41800 },
  { t: '12:00', v: 44500 }, { t: '16:00', v: 43900 }, { t: '20:00', v: 45200 },
  { t: '24:00', v: 44800 },
];

export default function Trade() {
  const { user } = useOutletContext<OutletContext>();
  const [cryptos, setCryptos] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [amount, setAmount] = useState('');
  const [balance, setBalance] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!user?.email) return;
    Promise.all([
      api.cryptos.active(),
      api.balances.getByEmail(user.email),
    ]).then(([cry, bal]) => {
      setCryptos(cry);
      if (cry.length > 0) setSelected(cry[0]);
      setBalance(bal || { balance_usd: 0 });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [user]);

  const filtered = cryptos.filter(c =>
    c.symbol.toLowerCase().includes(search.toLowerCase()) ||
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const usdValue = selected && amount ? (parseFloat(amount) * selected.price).toFixed(2) : '0.00';
  const cryptoValue = selected && amount ? (parseFloat(amount) / selected.price).toFixed(6) : '0.000000';

  const handleTrade = async () => {
    if (!user) return;
    if (!selected || !amount || parseFloat(amount) <= 0) { toast.error('Enter a valid amount'); return; }
    const usdAmt = side === 'buy' ? parseFloat(amount) : parseFloat(amount) * selected.price;
    if (side === 'buy' && usdAmt > (balance?.balance_usd || 0)) { toast.error('Insufficient balance'); return; }
    setSubmitting(true);
    try {
      await api.transactions.create({
        user_email: user.email,
        type: side,
        amount: usdAmt,
        crypto_symbol: selected.symbol,
        crypto_amount: side === 'buy' ? parseFloat(cryptoValue) : parseFloat(amount),
        status: 'pending',
      });
      toast.success(`${side === 'buy' ? 'Buy' : 'Sell'} order placed! Awaiting admin approval.`);
      setAmount('');
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to place order');
    }
    setSubmitting(false);
  };

  const pcts = [25, 50, 75, 100];
  const coinColor = selected ? getCoinColor(selected.symbol) : '#10b981';

  return (
    <div className="space-y-6">
      <PageHeader user={user} title="Trade" subtitle="Buy & sell cryptocurrencies" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Market list */}
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <p className="text-sm font-semibold">Markets</p>
          <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)}
            className="bg-secondary border-border text-sm h-9" />
          <div className="space-y-0.5 max-h-[480px] overflow-y-auto">
            {loading ? [1,2,3,4,5].map(i => <div key={i} className="h-12 bg-secondary rounded-xl animate-pulse" />) : filtered.map(c => (
              <button key={c.id} onClick={() => setSelected(c)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left ${selected?.id === c.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-secondary'}`}>
                <CoinIcon symbol={c.symbol} size={7} />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold">{c.symbol}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{c.name}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-mono font-semibold">${c.price?.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
                  <p className={`text-[10px] font-semibold ${c.change_24h >= 0 ? 'text-up' : 'text-down'}`}>
                    {c.change_24h >= 0 ? '+' : ''}{c.change_24h?.toFixed(2)}%
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Chart + trading panel */}
        <div className="lg:col-span-2 space-y-4">
          {selected && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-card border border-border rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-4">
                <CoinIcon symbol={selected.symbol} size={10} />
                <div>
                  <p className="font-bold text-lg">{selected.name}</p>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-mono font-black">${selected.price?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                    <span className={`text-sm font-semibold ${selected.change_24h >= 0 ? 'text-up' : 'text-down'}`}>
                      {selected.change_24h >= 0 ? '+' : ''}{selected.change_24h?.toFixed(2)}%
                    </span>
                  </div>
                </div>
              </div>
              <div className="h-36">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={MOCK_CHART} margin={{ top: 5, right: 5, left: -30, bottom: 0 }}>
                    <defs>
                      <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={coinColor} stopOpacity={0.25} />
                        <stop offset="95%" stopColor={coinColor} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="t" tick={{ fontSize: 9, fill: 'hsl(215,14%,46%)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v: any) => [`$${Number(v).toLocaleString()}`, '']} />
                    <Area type="monotone" dataKey="v" stroke={coinColor} strokeWidth={2} fill="url(#tradeGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          <div className="bg-card border border-border rounded-2xl p-5">
            <div className="flex bg-secondary rounded-xl p-1 mb-5">
              {(['buy', 'sell'] as const).map(s => (
                <button key={s} onClick={() => setSide(s)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${side === s ? (s === 'buy' ? 'gradient-green text-white glow-green-xs' : 'bg-destructive text-destructive-foreground') : 'text-muted-foreground hover:text-foreground'}`}>
                  {s === 'buy' ? 'Buy' : 'Sell'}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs text-muted-foreground mb-1.5 block">
                  {side === 'buy' ? 'Amount (USD)' : `Amount (${selected?.symbol || 'COIN'})`}
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm font-mono">
                    {side === 'buy' ? '$' : selected?.symbol?.slice(0, 3) || ''}
                  </span>
                  <Input type="number" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)}
                    className="bg-secondary border-border pl-10 font-mono text-base h-12" />
                </div>
                {side === 'buy' && balance && (
                  <div className="flex gap-2 mt-2">
                    {pcts.map(p => (
                      <button key={p} onClick={() => setAmount(((balance.balance_usd * p) / 100).toFixed(2))}
                        className="flex-1 py-1.5 rounded-lg bg-secondary text-xs font-semibold text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                        {p}%
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-secondary">
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground mb-0.5">You {side === 'buy' ? 'receive' : 'get'}</p>
                  <p className="font-mono font-bold">{side === 'buy' ? `${cryptoValue} ${selected?.symbol || ''}` : `$${usdValue}`}</p>
                </div>
                <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
                <div className="text-right">
                  <p className="text-xs text-muted-foreground mb-0.5">Balance</p>
                  <p className="font-mono text-sm font-semibold">${(balance?.balance_usd || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
              </div>

              <Button onClick={handleTrade} disabled={submitting || !selected || !amount}
                className={`w-full h-12 text-sm font-bold rounded-xl ${side === 'buy' ? 'gradient-green text-white glow-green-sm' : 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'}`}>
                {submitting ? 'Placing order...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${selected?.symbol || ''}`}
              </Button>
              <p className="text-xs text-center text-muted-foreground">Orders require admin approval before execution</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
