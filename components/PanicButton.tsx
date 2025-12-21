'use client';

import { useState } from 'react';
import { ShieldAlert, X, Brain, Quote } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const QUOTES = [
    {
        text: "The market is a device for transferring money from the impatient to the patient.",
        author: "Warren Buffett"
    },
    {
        text: "You don't need to be smarter than the rest. You have to be more disciplined than the rest.",
        author: "Warren Buffett"
    },
    {
        text: "If you can't take a small loss, sooner or later you will take the mother of all losses.",
        author: "Ed Seykota"
    },
    {
        text: "The goal of a successful trader is to make the best trades. Money is secondary.",
        author: "Alexander Elder"
    },
    {
        text: "Amateurs think about how much money they can make. Professionals think about how much money they could lose.",
        author: "Jack Schwager"
    },
    {
        text: "Revenge trading is the fastest way to blow up your account. Step away.",
        author: "Trading Wisdom"
    },
    {
        text: "Your capital is your ammunition. Don't waste it on low-probability shots.",
        author: "Trading Wisdom"
    },
    {
        text: "The elements of good trading are: cutting losses, cutting losses, and cutting losses.",
        author: "Ed Seykota"
    },
];

export default function PanicButton() {
    const [isOpen, setIsOpen] = useState(false);
    const [currentQuote, setCurrentQuote] = useState(QUOTES[0]);

    const handlePanic = () => {
        const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
        setCurrentQuote(randomQuote);
        setIsOpen(true);
    };

    return (
        <>
            {/* Floating Panic Button */}
            <motion.button
                onClick={handlePanic}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className="panic-btn fixed bottom-8 right-8 px-6 py-4 flex items-center gap-3 z-40 cursor-pointer border-0 rounded-2xl"
                title="Panic Button - Stop Revenge Trading"
            >
                <ShieldAlert className="w-7 h-7 text-white" />
                <span className="text-white font-bold text-lg tracking-wider">PANIC</span>
            </motion.button>

            {/* Modal */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4"
                        style={{ background: 'rgba(0, 0, 0, 0.9)' }}
                    >
                        {/* Backdrop blur */}
                        <div className="absolute inset-0 backdrop-blur-xl" onClick={() => setIsOpen(false)} />

                        {/* Modal Content */}
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            transition={{ type: "spring", damping: 25, stiffness: 300 }}
                            className="relative max-w-2xl w-full"
                        >
                            <div className="relative overflow-hidden rounded-3xl border border-red-500/20 bg-gradient-to-b from-zinc-900 to-black p-8 sm:p-12">
                                {/* Background Glow */}
                                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-red-500/20 rounded-full blur-[100px] -translate-y-1/2" />

                                {/* Grain Overlay */}
                                <div className="absolute inset-0 opacity-30 bg-[url('data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noise%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noise)%22/%3E%3C/svg%3E')]" />

                                {/* Close Button */}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="absolute top-6 right-6 w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center transition-colors"
                                >
                                    <X className="w-5 h-5 text-zinc-400" />
                                </button>

                                {/* Content */}
                                <div className="relative z-10 text-center space-y-8">
                                    {/* Icon */}
                                    <motion.div
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                                        className="inline-flex"
                                    >
                                        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-red-500 to-red-700 flex items-center justify-center shadow-[0_0_60px_rgba(239,68,68,0.5)]">
                                            <Brain className="w-10 h-10 text-white" />
                                        </div>
                                    </motion.div>

                                    {/* Title */}
                                    <div>
                                        <motion.h2
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ delay: 0.2 }}
                                            className="text-3xl sm:text-4xl font-bold text-white mb-2"
                                        >
                                            CIRCUIT BREAKER
                                        </motion.h2>
                                        <motion.p
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ delay: 0.3 }}
                                            className="text-red-400/80 text-sm uppercase tracking-[0.2em] font-medium"
                                        >
                                            Psychological Override Triggered
                                        </motion.p>
                                    </div>

                                    {/* Quote */}
                                    <motion.div
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.4 }}
                                        className="relative"
                                    >
                                        <Quote className="absolute -top-2 -left-2 w-8 h-8 text-white/10" />
                                        <div className="bg-white/5 border border-white/10 rounded-2xl p-8">
                                            <p className="text-xl sm:text-2xl text-zinc-200 font-light leading-relaxed italic">
                                                "{currentQuote.text}"
                                            </p>
                                            <p className="text-zinc-500 mt-4 text-sm font-medium">
                                                — {currentQuote.author}
                                            </p>
                                        </div>
                                    </motion.div>

                                    {/* Action */}
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.5 }}
                                        className="space-y-4"
                                    >
                                        <p className="text-zinc-500 text-sm">
                                            Take a deep breath. Step away from the screen.
                                        </p>
                                        <motion.button
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => setIsOpen(false)}
                                            className="px-10 py-4 rounded-full bg-white text-black font-bold text-lg shadow-[0_0_30px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-shadow"
                                        >
                                            I am calm now
                                        </motion.button>
                                    </motion.div>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
