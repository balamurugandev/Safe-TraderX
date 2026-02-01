const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envConfig = require('dotenv').config({ path: envPath }).parsed;

if (!envConfig) {
    console.error('Error: Could not load .env.local file');
    process.exit(1);
}

const supabaseUrl = envConfig.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = envConfig.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Error: Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function clearOldTrades() {
    console.log('Clearing trades before 2026-01-31...');

    const cutoffDate = '2026-01-31';

    const { error, count } = await supabase
        .from('daily_trades')
        .delete({ count: 'exact' })
        .lt('trade_date', cutoffDate);

    if (error) {
        console.error('Error deleting trades:', error);
    } else {
        console.log(`Successfully deleted ${count ?? 'some'} trades before ${cutoffDate}`);
    }
}

clearOldTrades();
