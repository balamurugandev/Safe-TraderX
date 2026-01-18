import SettingsForm from '@/components/SettingsForm';
import { Shield } from 'lucide-react';

export default function SettingsPage() {
    return (
        <div className="pt-24 pb-12 space-y-8">
            {/* Header */}
            <div className="text-center space-y-4 max-w-lg mx-auto">
                <div className="inline-flex p-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-4">
                    <Shield className="w-6 h-6 text-indigo-500" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)]">
                    Risk Management
                </h1>
                <p className="text-[var(--text-muted)] leading-relaxed">
                    Define your trading boundaries. These parameters will protect your capital by enforcing discipline.
                </p>
            </div>

            <SettingsForm />
        </div>
    );
}
