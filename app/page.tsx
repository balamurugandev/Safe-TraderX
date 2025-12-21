'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import TradeEntryForm from '@/components/TradeEntryForm';
import PanicButton from '@/components/PanicButton';
import { TrendingUp, TrendingDown, Wallet, AlertOctagon, ArrowRight, Activity, Sparkles } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Settings {
  starting_capital: number;
  max_daily_loss_percent: number;
  daily_profit_target_percent: number;
}

interface Trade {
  id: string;
  trade_name: string;
  pnl_amount: number;
  created_at: string;
}

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (settingsData) setSettings(settingsData);

      const today = new Date().toISOString().split('T')[0];
      const { data: tradesData } = await supabase
        .from('daily_trades')
        .select('*')
        .eq('trade_date', today)
        .order('created_at', { ascending: false });

      if (tradesData) setTrades(tradesData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 text-sm">Initializing trading system...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          {/* Hero Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex mb-8"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-[#0a0a0f]">
              <Activity className="w-4 h-4 text-white" />
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl sm:text-5xl font-bold mb-4 bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent"
          >
            Safe TradeX
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-zinc-400 text-lg mb-8 leading-relaxed"
          >
            Your intelligent trading discipline system. Set your limits, respect your rules, protect your capital.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link href="/settings">
              <button className="btn-primary group flex items-center gap-3 text-lg mx-auto">
                Initialize Protocol
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-16 grid grid-cols-3 gap-4 text-center"
          >
            {[
              { label: 'Loss Limits', icon: '🛡️' },
              { label: 'Profit Targets', icon: '🎯' },
              { label: 'Panic Mode', icon: '🚨' },
            ].map((feature, i) => (
              <div key={i} className="p-4">
                <div className="text-2xl mb-2">{feature.icon}</div>
                <div className="text-xs text-zinc-500 font-medium uppercase tracking-wider">{feature.label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  const totalPnL = trades.reduce((sum, t) => sum + t.pnl_amount, 0);
  const currentPnlPct = settings.starting_capital > 0 ? (totalPnL / settings.starting_capital) * 100 : 0;

  const isMaxLossReached = currentPnlPct <= -settings.max_daily_loss_percent;
  const isProfitTargetReached = currentPnlPct >= settings.daily_profit_target_percent;
  const isLocked = isMaxLossReached || isProfitTargetReached;

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-28 pt-20"
    >
      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Starting Capital"
          value={`₹${settings.starting_capital.toLocaleString('en-IN')}`}
          subtext="Available Margin"
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Max Daily Loss"
          value={`${settings.max_daily_loss_percent}%`}
          subtext={`₹${(settings.starting_capital * settings.max_daily_loss_percent / 100).toLocaleString('en-IN')}`}
          variant="danger"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Profit Target"
          value={`${settings.daily_profit_target_percent}%`}
          subtext={`₹${(settings.starting_capital * settings.daily_profit_target_percent / 100).toLocaleString('en-IN')}`}
          variant="success"
        />
      </motion.div>

      {/* Main P&L Display */}
      <motion.div variants={item}>
        <div className={`card-glow ${totalPnL < 0 ? 'card-danger' : ''} p-8 sm:p-12 text-center relative`}>
          <div className="relative z-10">
            <p className="label mb-4">Today's Net P&L</p>

            <div className={`text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter mb-4 ${totalPnL >= 0 ? 'stat-value-profit' : 'stat-value-loss'
              }`}>
              {totalPnL >= 0 ? '+' : ''}₹{Math.abs(totalPnL).toLocaleString('en-IN')}
            </div>

            <div className={`inline-flex badge ${currentPnlPct >= 0 ? 'badge-profit' : 'badge-loss'}`}>
              {currentPnlPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {currentPnlPct >= 0 ? '+' : ''}{currentPnlPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Kill Switch Warning */}
      {isLocked && (
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-red-500/10 p-6"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-red-500/5 to-transparent" />
          <div className="relative flex items-center justify-center gap-4 text-center">
            <AlertOctagon className="w-8 h-8 text-red-400 animate-pulse flex-shrink-0" />
            <div>
              <p className="text-red-400 font-bold text-xl">
                {isMaxLossReached ? 'MAXIMUM LOSS LIMIT REACHED' : 'PROFIT TARGET ACHIEVED'}
              </p>
              <p className="text-red-300/70 text-sm mt-1">
                {isMaxLossReached
                  ? 'Trading session locked. Protect your remaining capital.'
                  : 'Congratulations! Book your profits and step away.'}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Trade Entry Form */}
      <motion.div variants={item}>
        <TradeEntryForm
          startingCapital={settings.starting_capital}
          onTradeAdded={fetchData}
          disabled={isLocked}
        />
      </motion.div>

      {/* Trades List */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="label">Session Activity</h2>
          <span className="text-xs text-zinc-600">{trades.length} trades</span>
        </div>

        {trades.length === 0 ? (
          <div className="card p-12 text-center border-dashed">
            <p className="text-zinc-500">No trades logged in this session</p>
          </div>
        ) : (
          <div className="space-y-2">
            {trades.map((trade, i) => (
              <motion.div
                key={trade.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="card p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${trade.pnl_amount >= 0 ? 'bg-emerald-400' : 'bg-red-400'}`} />
                  <span className="font-medium text-zinc-200 group-hover:text-white transition-colors">
                    {trade.trade_name}
                  </span>
                </div>
                <span className={`font-mono font-bold ${trade.pnl_amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {trade.pnl_amount >= 0 ? '+' : ''}₹{trade.pnl_amount.toLocaleString('en-IN')}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      <PanicButton />
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
  subtext,
  variant = 'default'
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  variant?: 'default' | 'success' | 'danger';
}) {
  const iconColors = {
    default: 'text-zinc-400',
    success: 'text-emerald-400',
    danger: 'text-red-400'
  };

  const valueColors = {
    default: 'stat-value',
    success: 'stat-value-profit',
    danger: 'stat-value-loss'
  };

  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }}
      className="card p-6"
    >
      <div className={`inline-flex mb-4 ${iconColors[variant]}`}>
        {icon}
      </div>
      <p className="label mb-2">{label}</p>
      <p className={`text-2xl font-bold ${valueColors[variant]}`}>{value}</p>
      <p className="text-xs text-zinc-500 mt-1 font-mono">{subtext}</p>
    </motion.div>
  );
}
