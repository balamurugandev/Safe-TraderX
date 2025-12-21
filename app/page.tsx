'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import TradeEntryForm from '@/components/TradeEntryForm';
import PanicButton from '@/components/PanicButton';
import QuotesMarquee from '@/components/QuotesMarquee';
import { TrendingUp, TrendingDown, Wallet, AlertOctagon, ArrowRight, Activity, Sparkles, Clock, Flame, Calculator } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Settings {
  starting_capital: number;
  max_daily_loss_percent: number;
  daily_profit_target_percent: number;
  max_trades_per_day: number;
  brokerage_per_order: number;
  current_streak: number;
}

interface Trade {
  id: string;
  trade_name: string;
  pnl_amount: number;
  comments?: string;
  setup_type?: string;
  market_state?: string;
  is_loss?: boolean;
  created_at: string;
}

// Format date for display
function formatDateIST(date: Date): string {
  return date.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata'
  });
}

// Format time for display
function formatTimeIST(date: Date): string {
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
    timeZone: 'Asia/Kolkata'
  });
}

export default function Dashboard() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [trades, setTrades] = useState<Trade[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [lastLossTime, setLastLossTime] = useState<Date | null>(null);
  const [lastTradeTime, setLastTradeTime] = useState<Date | null>(null);

  // Update clock every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check localStorage for last loss time
  useEffect(() => {
    const stored = localStorage.getItem('lastLossTime');
    if (stored) {
      const lossTime = new Date(stored);
      const now = new Date();
      // Only set if within 15 minutes
      if (now.getTime() - lossTime.getTime() < 15 * 60 * 1000) {
        setLastLossTime(lossTime);
      } else {
        localStorage.removeItem('lastLossTime');
      }
    }

    // Check for last trade time (5 min pause)
    const storedTrade = localStorage.getItem('lastTradeTime');
    if (storedTrade) {
      const tradeTime = new Date(storedTrade);
      const now = new Date();
      if (now.getTime() - tradeTime.getTime() < 5 * 60 * 1000) {
        setLastTradeTime(tradeTime);
      } else {
        localStorage.removeItem('lastTradeTime');
      }
    }
  }, []);

  const fetchData = useCallback(async () => {
    try {
      const { data: settingsData } = await supabase
        .from('settings')
        .select('*')
        .single();

      if (settingsData) {
        setSettings({
          starting_capital: settingsData.starting_capital || 0,
          max_daily_loss_percent: settingsData.max_daily_loss_percent || 2,
          daily_profit_target_percent: settingsData.daily_profit_target_percent || 5,
          max_trades_per_day: settingsData.max_trades_per_day || 10,
          brokerage_per_order: settingsData.brokerage_per_order || 20,
          current_streak: settingsData.current_streak || 0,
        });
      }

      const today = new Date().toISOString().split('T')[0];
      const { data: tradesData } = await supabase
        .from('daily_trades')
        .select('*')
        .eq('trade_date', today)
        .order('created_at', { ascending: false });

      if (tradesData) {
        setTrades(tradesData);

        // Check for last loss
        const lastLoss = tradesData.find(t => t.pnl_amount < 0);
        if (lastLoss) {
          const lossTime = new Date(lastLoss.created_at);
          const now = new Date();
          if (now.getTime() - lossTime.getTime() < 15 * 60 * 1000) {
            setLastLossTime(lossTime);
            localStorage.setItem('lastLossTime', lossTime.toISOString());
          }
        }
      }
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
      <div className="min-h-[60vh] flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 text-sm">Initializing trading system...</p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 pt-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="relative inline-flex mb-8"
          >
            <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-[0_0_60px_rgba(16,185,129,0.4)]">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center border-4 border-[#1a1a24]">
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

  // Calculations
  const grossPnL = trades.reduce((sum, t) => sum + t.pnl_amount, 0);
  const tradeCount = trades.length;
  const brokerageTotal = tradeCount * settings.brokerage_per_order * 2; // Buy + Sell
  const estimatedTaxes = Math.abs(grossPnL) * 0.001; // ~0.1% estimate
  const netPnL = grossPnL - brokerageTotal - estimatedTaxes;

  const currentPnlPct = settings.starting_capital > 0 ? (grossPnL / settings.starting_capital) * 100 : 0;
  const maxLossAmount = settings.starting_capital * settings.max_daily_loss_percent / 100;
  const profitTargetAmount = settings.starting_capital * settings.daily_profit_target_percent / 100;

  const isMaxLossReached = grossPnL <= -maxLossAmount;
  const isProfitTargetReached = grossPnL >= profitTargetAmount;
  const isLocked = isMaxLossReached || isProfitTargetReached;

  const disableReason = isMaxLossReached
    ? 'Maximum loss limit reached. Protect your capital.'
    : isProfitTargetReached
      ? 'Profit target achieved! Book your profits.'
      : undefined;

  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const todayFormatted = formatDateIST(currentTime);

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6 pb-28 pt-20"
    >
      {/* Date/Time Header */}
      <motion.div variants={item} className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">{todayFormatted}</h1>
          <p className="text-zinc-500 text-sm">Trading Session</p>
        </div>
        <div className="flex items-center gap-4">
          {/* Streak */}
          {settings.current_streak > 0 && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-500/10 border border-orange-500/20">
              <Flame className="w-4 h-4 text-orange-400" />
              <span className="text-orange-400 font-bold">{settings.current_streak}</span>
              <span className="text-orange-400/70 text-xs">day streak</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-zinc-400">
            <Clock className="w-4 h-4" />
            <span className="font-mono text-lg">{formatTimeIST(currentTime)}</span>
            <span className="text-xs text-zinc-600">IST</span>
          </div>
        </div>
      </motion.div>

      {/* Scrolling Quotes */}
      <motion.div variants={item}>
        <QuotesMarquee />
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={item} className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          icon={<Wallet className="w-5 h-5" />}
          label="Starting Capital"
          value={`₹${settings.starting_capital.toLocaleString('en-IN')}`}
          subtext={`${tradeCount}/${settings.max_trades_per_day} trades`}
        />
        <StatCard
          icon={<TrendingDown className="w-5 h-5" />}
          label="Max Daily Loss"
          value={`${settings.max_daily_loss_percent}%`}
          subtext={`₹${maxLossAmount.toLocaleString('en-IN')}`}
          variant="danger"
        />
        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Profit Target"
          value={`${settings.daily_profit_target_percent}%`}
          subtext={`₹${profitTargetAmount.toLocaleString('en-IN')}`}
          variant="success"
        />
      </motion.div>

      {/* Main P&L Display */}
      <motion.div variants={item}>
        <div className={`card-glow ${grossPnL < 0 ? 'card-danger' : ''} p-8 sm:p-12 text-center relative`}>
          <div className="relative z-10">
            <p className="label mb-4">Today&apos;s Gross P&L</p>

            <div className={`text-5xl sm:text-7xl md:text-8xl font-bold tracking-tighter mb-4 ${grossPnL >= 0 ? 'stat-value-profit' : 'stat-value-loss'}`}>
              {grossPnL >= 0 ? '+' : ''}₹{Math.abs(grossPnL).toLocaleString('en-IN')}
            </div>

            <div className={`inline-flex badge ${currentPnlPct >= 0 ? 'badge-profit' : 'badge-loss'}`}>
              {currentPnlPct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {currentPnlPct >= 0 ? '+' : ''}{currentPnlPct.toFixed(2)}%
            </div>
          </div>
        </div>
      </motion.div>

      {/* Net P&L Calculator */}
      {tradeCount > 0 && (
        <motion.div variants={item}>
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <Calculator className="w-5 h-5 text-blue-400" />
              <h3 className="font-semibold text-white">Brokerage & Tax Estimate</h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xs text-zinc-500 mb-1">Gross P&L</p>
                <p className={`font-mono font-bold ${grossPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {grossPnL >= 0 ? '+' : ''}₹{grossPnL.toLocaleString('en-IN')}
                </p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">Brokerage + GST</p>
                <p className="font-mono text-yellow-400">
                  -₹{(brokerageTotal * 1.18).toFixed(0)}
                </p>
                <p className="text-[10px] text-zinc-600">{tradeCount} × ₹{settings.brokerage_per_order} × 2 + 18% GST</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 mb-1">STT + Charges</p>
                <p className="font-mono text-yellow-400">
                  -₹{estimatedTaxes.toFixed(0)}
                </p>
                <p className="text-[10px] text-zinc-600">0.05% STT + Exchange</p>
              </div>
              <div className="bg-white/5 rounded-lg p-2">
                <p className="text-xs text-zinc-400 mb-1">Net P&L</p>
                <p className={`font-mono font-bold text-lg ${netPnL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {netPnL >= 0 ? '+' : ''}₹{netPnL.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}

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
          maxTradesPerDay={settings.max_trades_per_day}
          todayTradeCount={tradeCount}
          lastLossTime={lastLossTime}
          lastTradeTime={lastTradeTime}
          onTradeAdded={() => {
            setLastTradeTime(new Date());
            fetchData();
          }}
          disabled={isLocked}
          disableReason={disableReason}
        />
      </motion.div>

      {/* Trades List */}
      <motion.div variants={item} className="space-y-4">
        <div className="flex items-center justify-between px-2">
          <h2 className="label">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}&apos;s Activity</h2>
          <span className="text-xs text-zinc-600">{trades.length} trades</span>
        </div>

        {trades.length === 0 ? (
          <div className="card p-12 text-center border-dashed">
            <p className="text-zinc-500">No trades logged in this session</p>
          </div>
        ) : (
          <div className="table-container">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    <th className="table-header text-left">Time</th>
                    <th className="table-header text-left">Script</th>
                    <th className="table-header text-left">Setup</th>
                    <th className="table-header text-left">Market</th>
                    <th className="table-header text-left">Comments</th>
                    <th className="table-header text-right">P&L</th>
                  </tr>
                </thead>
                <tbody>
                  {trades.map((trade, i) => (
                    <motion.tr
                      key={trade.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      className="table-row"
                    >
                      <td className="table-cell">
                        <span className="text-zinc-400 text-sm">
                          {new Date(trade.created_at).toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                            hour12: true
                          })}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-white font-medium">{trade.trade_name}</span>
                      </td>
                      <td className="table-cell">
                        <span className="text-zinc-400 text-sm capitalize">
                          {trade.setup_type?.replace('_', ' ') || '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className={`text-sm capitalize ${trade.market_state === 'sideways' ? 'text-yellow-400' :
                          trade.market_state === 'volatile' ? 'text-orange-400' : 'text-zinc-400'
                          }`}>
                          {trade.market_state || '-'}
                        </span>
                      </td>
                      <td className="table-cell">
                        <span className="text-zinc-500 text-sm">{trade.comments || '-'}</span>
                      </td>
                      <td className="table-cell text-right">
                        <span className={`font-mono font-bold ${trade.pnl_amount >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                          {trade.pnl_amount >= 0 ? '+' : ''}₹{trade.pnl_amount.toLocaleString('en-IN')}
                        </span>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
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
