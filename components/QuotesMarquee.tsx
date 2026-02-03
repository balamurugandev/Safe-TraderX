'use client';

import { motion } from 'framer-motion';
import { TriangleAlert } from 'lucide-react';

const TRADING_RULES = [
    "NEVER trade on a phone screen without proper charts and signals.",
    "NEVER trade after 3 PM on expiry days due to low decaying premiums.",
    "Switch to NEXT EXPIRY contracts after 1 PM on expiry day.",
    "ALWAYS use the signal generator and trade from a PC terminal with charts."
];

export default function QuotesMarquee() {
    // Creating a long repeated list for seamless scrolling
    const warnings = Array(6).fill(TRADING_RULES).flat();

    return (
        <div className="relative overflow-hidden rounded-xl py-3" style={{ background: 'var(--bg-card)', border: '1px solid rgba(234, 179, 8, 0.2)' }}>
            {/* Gradient masks */}
            <div className="absolute left-0 top-0 bottom-0 w-16 z-10" style={{ background: 'linear-gradient(to right, var(--bg-card), transparent)' }} />
            <div className="absolute right-0 top-0 bottom-0 w-16 z-10" style={{ background: 'linear-gradient(to left, var(--bg-card), transparent)' }} />

            <motion.div
                className="flex items-center gap-16 whitespace-nowrap"
                animate={{
                    x: [0, -100 * warnings.length * 4]
                }}
                transition={{
                    x: {
                        repeat: Infinity,
                        repeatType: "loop",
                        duration: 150,
                        ease: "linear",
                    },
                }}
            >
                {warnings.map((text, i) => (
                    <div
                        key={i}
                        className="flex items-center gap-3 text-sm font-bold tracking-wide uppercase"
                    >
                        <TriangleAlert className="w-5 h-5 text-yellow-500 flex-shrink-0" />
                        <span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]">{text}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
