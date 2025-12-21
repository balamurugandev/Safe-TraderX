'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TRADING_QUOTES = [
    // On Precision & Quick Exits
    { text: "In scalping, you don't need to be right about the trend; you just need to be right about the next few minutes.", author: "Unknown Scalper" },
    { text: "The desire to maximize every trade is the enemy of the scalper. Take the meat of the move and leave the bones for someone else.", author: "Martin Schwartz" },
    { text: "I am a hunter of pips. I don't care about the forest; I care about the rabbit in front of me.", author: "Anonymous Professional Scalper" },
    { text: "Get in, get out, stay alive.", author: "Mark Weinstein" },
    { text: "A scalper who holds for a 'big move' is just a trader who is afraid to admit they missed their exit.", author: "Trade Psychology Today" },
    { text: "The market doesn't pay you to be right; it pays you to be fast when you are wrong.", author: "Naval Ravikant" },
    { text: "Small wins, repeated consistently, create an unbreakable equity curve.", author: "Alexander Elder" },
    { text: "Scalping is like surgery: precision matters more than power.", author: "Dr. Brett Steenbarger" },
    { text: "If the price doesn't do what you expected immediately, get out. The market is telling you your timing is off.", author: "Linda Raschke" },
    { text: "Don't marry the trade. You are a scalper; it's a one-night stand.", author: "Trading Floor Wisdom" },

    // On the Danger of Over-Scalping
    { text: "Trading more doesn't make you a better trader; it just makes your broker richer.", author: "Jack Schwager" },
    { text: "The more trades you take, the more you invite the 'Law of Averages' to take your money back.", author: "Mark Douglas" },
    { text: "A scalper’s greatest skill is knowing when the market is too noisy to trade.", author: "Bill Lipschutz" },
    { text: "Overtrading is the result of trying to force the market to give you what it doesn't have.", author: "Alexander Elder" },
    { text: "Every extra click of the mouse increases the probability of a mistake.", author: "Martin Schwartz" },
    { text: "If you're scalping and find yourself sweating, you've either taken too many trades or too much size.", author: "Larry Hite" },
    { text: "Scalpers die by a thousand cuts, usually self-inflicted through overtrading.", author: "Brett Steenbarger" },
    { text: "The best scalping days are often the ones where you stop after two perfect trades.", author: "Unknown" },
    { text: "Clicking the button should feel like an obligation, not a thrill.", author: "Mark Douglas" },
    { text: "In the Indian options market, STT and brokerage are the silent killers of the high-frequency scalper.", author: "Anand Srinivasan" },

    // On Greed & Cutting Losses
    { text: "If you can't take a small loss, you will eventually take the mother of all losses.", author: "Ed Seykota" },
    { text: "A stop loss is not a suggestion; it's a command.", author: "Martin Zweig" },
    { text: "Greed in scalping is waiting for 10 points when your system gave you 4. You usually end up with -2.", author: "Anonymous" },
    { text: "The moment you feel the urge to 'double up' to recover a loss, close your terminal and walk away.", author: "Paul Tudor Jones" },
    { text: "You don't have to make it back the same way you lost it.", author: "David Ricardo" },
    { text: "Successful scalping is 10% strategy and 90% emotional control.", author: "Mark Douglas" },
    { text: "Accept the loss. The market is not a vending machine; it doesn't owe you a refund.", author: "Yvan Byeajee" },
    { text: "The market can stay irrational longer than you can stay solvent.", author: "John Maynard Keynes" },
    { text: "Your job is to protect your capital. The profits will take care of themselves.", author: "Bernard Baruch" },
    { text: "When in doubt, get out and wait for clarity. The market will be there tomorrow.", author: "Jesse Livermore" },
];

export default function QuotesMarquee() {
    // Double the quotes for seamless loop
    const allQuotes = [...TRADING_QUOTES, ...TRADING_QUOTES];

    return (
        <div className="relative overflow-hidden rounded-xl border border-white/5 bg-white/[0.02] py-3">
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 bg-gradient-to-r from-[#1a1a24] to-transparent z-10" />
            <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-l from-[#1a1a24] to-transparent z-10" />

            <motion.div
                className="flex items-center gap-12 whitespace-nowrap"
                animate={{
                    x: [0, -50 * TRADING_QUOTES.length * 10]
                }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 300,
                        ease: "linear",
                    },
                }}
            >
                {allQuotes.map((quote, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                        <Quote className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                        <span className="text-zinc-200 italic">"{quote.text}"</span>
                        <span className="text-emerald-400/80 font-medium">— {quote.author}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
