import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp, Shield, Zap, ArrowRight, ChevronRight,
  Users, BarChart3, Lock, Globe, Star, CheckCircle
} from 'lucide-react';
import { useAuth } from '@/lib/auth';

const STATS = [
  { value: '$2.4B+', label: 'Trading Volume' },
  { value: '48,000+', label: 'Active Traders' },
  { value: '99.8%', label: 'Uptime' },
  { value: '120+', label: 'Cryptocurrencies' },
];

const FEATURES = [
  {
    icon: TrendingUp,
    title: 'Copy Top Traders',
    desc: 'Mirror the strategies of verified expert traders automatically. Set your allocation and let them trade for you.',
    gradient: 'from-emerald-500/20 to-teal-500/10',
    border: 'border-emerald-500/15',
    iconBg: 'bg-emerald-500/15',
    iconColor: 'text-emerald-400',
  },
  {
    icon: BarChart3,
    title: 'Real-Time Portfolio',
    desc: 'Track all your holdings, profits, and losses in one beautiful dashboard with live market data.',
    gradient: 'from-blue-500/20 to-cyan-500/10',
    border: 'border-blue-500/15',
    iconBg: 'bg-blue-500/15',
    iconColor: 'text-blue-400',
  },
  {
    icon: Shield,
    title: 'Bank-Level Security',
    desc: 'Advanced encryption, 2FA, and cold storage ensure your assets are always protected.',
    gradient: 'from-purple-500/20 to-pink-500/10',
    border: 'border-purple-500/15',
    iconBg: 'bg-purple-500/15',
    iconColor: 'text-purple-400',
  },
  {
    icon: Zap,
    title: 'Instant Execution',
    desc: 'Lightning-fast trade execution with minimal slippage across all major crypto pairs.',
    gradient: 'from-yellow-500/20 to-orange-500/10',
    border: 'border-yellow-500/15',
    iconBg: 'bg-yellow-500/15',
    iconColor: 'text-yellow-400',
  },
  {
    icon: Globe,
    title: 'Global Markets',
    desc: 'Access 120+ cryptocurrencies across multiple networks, available 24/7 worldwide.',
    gradient: 'from-rose-500/20 to-red-500/10',
    border: 'border-rose-500/15',
    iconBg: 'bg-rose-500/15',
    iconColor: 'text-rose-400',
  },
  {
    icon: Lock,
    title: 'Regulated & Compliant',
    desc: 'Fully KYC/AML compliant with transparent fee structures and no hidden charges.',
    gradient: 'from-indigo-500/20 to-violet-500/10',
    border: 'border-indigo-500/15',
    iconBg: 'bg-indigo-500/15',
    iconColor: 'text-indigo-400',
  },
];

const TRADERS = [
  { name: 'Alex Chen', specialty: 'DeFi Expert', profit: '+248%', winRate: '78%', color: '#10b981' },
  { name: 'Sarah Kim', specialty: 'BTC Maxi', profit: '+184%', winRate: '82%', color: '#3b82f6' },
  { name: 'Marcus O.', specialty: 'Alt Season', profit: '+312%', winRate: '71%', color: '#a855f7' },
];

const TICKER_ITEMS = [
  { sym: 'BTC', price: '$67,420', change: '+3.14%', up: true },
  { sym: 'ETH', price: '$3,892', change: '+2.87%', up: true },
  { sym: 'SOL', price: '$178.50', change: '+5.23%', up: true },
  { sym: 'BNB', price: '$612', change: '-0.82%', up: false },
  { sym: 'DOGE', price: '$0.0412', change: '+8.91%', up: true },
  { sym: 'ADA', price: '$0.622', change: '-1.44%', up: false },
  { sym: 'AVAX', price: '$39.80', change: '+4.12%', up: true },
  { sym: 'DOT', price: '$8.90', change: '+1.77%', up: true },
];

export default function Landing() {
  const { user, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && user) {
      navigate(user.role === 'admin' ? '/admin' : '/dashboard', { replace: true });
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 glass-dark border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl gradient-green flex items-center justify-center glow-green-sm">
              <TrendingUp className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-lg">Vested</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            {['Features', 'Markets', 'Copy Trading', 'About'].map(l => (
              <a key={l} href="#" className="hover:text-foreground transition-colors">{l}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Link to="/auth" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:block">
              Sign In
            </Link>
            <Link to="/auth"
              className="px-4 py-2 rounded-xl text-sm font-bold gradient-green text-white glow-green-sm hover:opacity-90 transition-all">
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Ticker */}
      <div className="fixed top-16 inset-x-0 z-40 border-b border-white/5 bg-background/80 backdrop-blur-sm overflow-hidden h-8 flex items-center">
        <div className="flex animate-[ticker_30s_linear_infinite] whitespace-nowrap">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="flex items-center gap-2 mx-6 text-xs font-mono">
              <span className="font-bold text-foreground">{item.sym}</span>
              <span className="text-muted-foreground">{item.price}</span>
              <span className={item.up ? 'text-up font-semibold' : 'text-down font-semibold'}>{item.change}</span>
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="relative pt-36 pb-20 px-4 sm:px-6 lg:px-8 flex flex-col items-center text-center">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-emerald-500/8 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-blue-500/6 blur-3xl" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 rounded-full bg-purple-500/6 blur-3xl" />
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}
          className="relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-primary/25 bg-primary/8 text-sm font-semibold text-primary mb-8">
            <Star className="w-3.5 h-3.5 fill-current" />
            Trusted by 48,000+ traders worldwide
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-tight mb-6 tracking-tight">
            Trade Smarter,{' '}
            <span className="bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 bg-clip-text text-transparent">
              Copy the Best
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            The professional crypto trading platform with copy trading, real-time portfolio tracking, and institutional-grade security. Start growing your wealth today.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl gradient-green text-white font-bold text-base glow-green hover:opacity-90 transition-all">
              Start Trading Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link to="/auth"
              className="flex items-center gap-2 px-8 py-4 rounded-2xl border border-border text-foreground font-semibold text-base hover:bg-secondary transition-all">
              View Markets <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </Link>
          </div>
        </motion.div>

        {/* Stats bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="relative mt-20 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-12">
          {STATS.map(s => (
            <div key={s.label} className="text-center">
              <p className="text-3xl sm:text-4xl font-black font-mono text-foreground">{s.value}</p>
              <p className="text-sm text-muted-foreground mt-1 font-medium">{s.label}</p>
            </div>
          ))}
        </motion.div>
      </section>

      {/* Features */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-black mb-4">Everything you need to trade crypto</h2>
          <p className="text-muted-foreground max-w-xl mx-auto">Professional tools and features built for both beginner and expert crypto traders.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map(({ icon: Icon, title, desc, gradient, border, iconBg, iconColor }, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className={`group relative bg-gradient-to-br ${gradient} border ${border} rounded-2xl p-6 hover:scale-[1.02] transition-all duration-200`}>
              <div className={`w-11 h-11 rounded-2xl ${iconBg} flex items-center justify-center mb-4`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
              </div>
              <h3 className="font-bold text-base mb-2">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Copy traders preview */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-transparent to-card/40">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl font-black mb-4">Top Performing Traders</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Copy verified expert traders and share in their profits automatically.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 max-w-3xl mx-auto">
            {TRADERS.map((t, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-card border border-border rounded-2xl p-5 hover:border-primary/25 transition-colors text-center">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center text-white font-black text-lg"
                  style={{ background: t.color }}>
                  {t.name.slice(0, 2).toUpperCase()}
                </div>
                <p className="font-bold text-sm">{t.name}</p>
                <p className="text-xs text-muted-foreground mb-4">{t.specialty}</p>
                <div className="flex justify-between text-xs font-semibold border-t border-border pt-3 mt-3">
                  <div>
                    <p className="text-up text-base font-black font-mono">{t.profit}</p>
                    <p className="text-muted-foreground">Total Profit</p>
                  </div>
                  <div>
                    <p className="text-foreground text-base font-black font-mono">{t.winRate}</p>
                    <p className="text-muted-foreground">Win Rate</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 text-center relative">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">Ready to start trading?</h2>
          <p className="text-muted-foreground text-lg mb-10">Join thousands of traders building wealth with Vested. Free to sign up, no credit card required.</p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/auth"
              className="group flex items-center gap-2 px-8 py-4 rounded-2xl gradient-green text-white font-bold text-base glow-green hover:opacity-90 transition-all w-full sm:w-auto justify-center">
              Create Free Account
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
          <div className="flex items-center justify-center gap-6 mt-8 text-xs text-muted-foreground">
            {['No credit card required', 'Free to get started', 'Cancel anytime'].map((t, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <CheckCircle className="w-3.5 h-3.5 text-primary" />
                {t}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl gradient-green flex items-center justify-center">
              <TrendingUp className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-black text-base">Vested</span>
          </div>
          <p className="text-xs text-muted-foreground">© 2025 Vested. All rights reserved. Crypto trading involves risk.</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Support</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
