async function testLiveLogin() {
    console.log('=== Testing live login at carshopsystem.vercel.app ===');
    try {
        const res = await fetch('https://carshopsystem.vercel.app/api/v1/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@carshop.com', password: 'password' })
        });
        console.log('HTTP Status:', res.status);
        const text = await res.text();
        console.log('Raw response:', text);
    } catch (err) {
        console.error('Request failed:', err.message);
    }

    // Also try without /v1
    console.log('\n=== Testing /api/auth/login ===');
    try {
        const res2 = await fetch('https://carshopsystem.vercel.app/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'admin@carshop.com', password: 'password' })
        });
        console.log('HTTP Status:', res2.status);
        const text2 = await res2.text();
        console.log('Raw response:', text2);
    } catch (err) {
        console.error('Request failed:', err.message);
    }
}

testLiveLogin();
