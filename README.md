# 🛡️ Safe TradeX

A discipline-focused trading journal for Indian options traders. Built to help you stay disciplined, manage risk, and avoid emotional trading.

**Live App:** [safe-trader-x.vercel.app](https://safe-trader-x.vercel.app)

![Safe TradeX Dashboard](https://img.shields.io/badge/Status-Live-brightgreen)

## ✨ Features

### 📊 Dashboard (3-Column Desktop Layout)
- **Real-time P&L tracking** with gross and net calculations
- **Brokerage & tax estimator** (includes GST, STT, exchange charges)
- **Trade counter** with configurable daily limits
- **Kill switch** - auto-locks trading when max loss or profit target is hit
- **Live IST clock** for session awareness

### 📝 Trade Entry
- Quick trade logging with script name, P&L, setup type, and market state
- **Emotional checklist** - post-trade reflection for FOMO/Revenge awareness
- **Cool-off timer** after losses (configurable)
- **Post-trade pause** to prevent overtrading

### ⚠️ Behavioral Safeguards
- **Persistent warning banners** for emotional trades (FOMO/Revenge)
- Warnings only clear after logging a "high-probability" trade
- **Panic button** with motivational quotes and circuit breaker
- Market state warnings for Sideways/Choppy conditions

### 📈 History & Analytics
- Full trade history with edit/delete functionality
- Cumulative P&L tracking
- Date range filtering
- Setup and market state analysis

### ⚙️ Settings
- Starting capital configuration
- Max daily loss % and profit target %
- Max trades per day limit
- Brokerage per order setting
- Trading streak tracking

## 🛠️ Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **Database:** Supabase (PostgreSQL)
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Icons:** Lucide React
- **Hosting:** Vercel

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account

### Installation

1. Clone the repository:
```bash
git clone https://github.com/balamurugandev/Safe-TraderX.git
cd Safe-TraderX
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` with your Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000)

### Database Setup

Create these tables in Supabase:

**`trading_settings`**
```sql
CREATE TABLE trading_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  starting_capital NUMERIC DEFAULT 20000,
  max_daily_loss_percent NUMERIC DEFAULT 2,
  daily_profit_target_percent NUMERIC DEFAULT 5,
  max_trades_per_day INTEGER DEFAULT 10,
  brokerage_per_order NUMERIC DEFAULT 20,
  current_streak INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

**`daily_trades`**
```sql
CREATE TABLE daily_trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  trade_name TEXT NOT NULL,
  pnl_amount NUMERIC NOT NULL,
  comments TEXT,
  setup_type TEXT,
  market_state TEXT,
  trade_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 🌐 Deployment

The app is deployed on Vercel with automatic deployments from the `main` branch.

To deploy your own instance:
1. Fork/clone this repository
2. Connect to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

## 📱 Screenshots

The app features a responsive 3-column desktop layout:
- **Left:** P&L display + Stats + Brokerage calculator
- **Center:** Trade entry form with emotional checklist
- **Right:** Today's activity feed

## 🤝 Contributing

This is a personal trading discipline tool, but feel free to fork and customize for your own use!

## 📄 License

MIT License - feel free to use and modify.

---

**Built with discipline, for discipline. 🎯**
