const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');

const SUPABASE_URL = 'https://yqigmkwdkwjmsvtcztai.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxaWdta3dka3dqbXN2dGN6dGFpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3ODcxMTAxMCwiZXhwIjoyMDk0Mjg3MDEwfQ.9IAkjxPYaXj8m09d1m-1MiWFfu6uYxpxo2SIbMTlVdc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debug() {
    console.log('=== Fetching all users from Supabase ===');
    const { data: users, error } = await supabase.from('users').select('*');
    
    if (error) {
        console.error('ERROR fetching users:', error.message);
        return;
    }

    console.log('Total users found:', users.length);
    users.forEach(u => {
        console.log('---');
        console.log('ID:', u.id);
        console.log('Name:', u.name);
        console.log('Email:', u.email);
        console.log('Role:', u.role);
        console.log('Password hash:', u.password ? u.password.substring(0, 30) + '...' : 'NULL');
        console.log('Created at:', u.created_at);
    });

    // Now test bcrypt verification
    console.log('\n=== Testing password match for "password" ===');
    if (users.length > 0) {
        const user = users.find(u => u.email === 'admin@carshop.com') || users[0];
        if (user && user.password) {
            const match = await bcrypt.compare('password', user.password);
            console.log('Password "password" matches hash:', match);
        } else {
            console.log('No password stored for this user!');
        }
    }
}

debug();
