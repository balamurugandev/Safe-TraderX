'use client';

import { motion } from 'framer-motion';
import { Quote } from 'lucide-react';

const TRADING_QUOTES = [
    { text: "The market is a device for transferring money from the impatient to the patient.", author: "Warren Buffett" },
    { text: "You don't need to be smarter than the rest. You have to be more disciplined.", author: "Warren Buffett" },
    { text: "If you can't take a small loss, sooner or later you will take the mother of all losses.", author: "Ed Seykota" },
    { text: "Amateurs think about how much money they can make. Professionals think about how much they could lose.", author: "Jack Schwager" },
    { text: "Revenge trading is the fastest way to blow up your account. Step away.", author: "Trading Wisdom" },
    { text: "Your capital is your ammunition. Don't waste it on low-probability shots.", author: "Trading Wisdom" },
    { text: "The elements of good trading are: cutting losses, cutting losses, and cutting losses.", author: "Ed Seykota" },
    { text: "Over-trading and over-leveraging are the two main killers of trading accounts.", author: "Mark Douglas" },
    { text: "It's not whether you're right or wrong, but how much money you make when you're right.", author: "George Soros" },
    { text: "The trend is your friend until the end when it bends.", author: "Ed Seykota" },
    { text: "In trading, you have to be aggressive when you're winning and protective when you're losing.", author: "Larry Hite" },
    { text: "The biggest risk is not taking any risk at all.", author: "Mark Zuckerberg" },
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
                        duration: 120,
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
