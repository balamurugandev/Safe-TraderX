import SettingsForm from '@/components/SettingsForm';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="pt-24 pb-12 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 max-w-lg mx-auto">
                <div className="inline-flex p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 mb-4">
                    <Shield className="w-6 h-6 text-emerald-400" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent">
                    Risk Management
                </h1>
                <p className="text-zinc-500 leading-relaxed">
                    Define your trading boundaries. These parameters will protect your capital by enforcing discipline.
                </p>
            </div>

            <SettingsForm />
        </div>
    );
}
