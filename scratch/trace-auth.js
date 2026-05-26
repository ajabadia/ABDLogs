// eslint-disable-next-line @typescript-eslint/no-require-imports
const fetch = require('node:crypto') ? global.fetch : null; // fetch is global in node 18+

async function trace(url, depth = 0) {
  if (depth > 15) {
    console.log("Too many redirects!");
    return;
  }
  console.log(`[${depth}] Fetching: ${url}`);
  try {
    const res = await fetch(url, {
      redirect: 'manual',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      }
    });
    console.log(`Status: ${res.status} ${res.statusText}`);
    const location = res.headers.get('location');
    console.log(`Location: ${location}`);
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      console.log(`Set-Cookie: ${setCookie}`);
    }
    console.log('---');
    if (location && (res.status === 301 || res.status === 302 || res.status === 303 || res.status === 307 || res.status === 308)) {
      const nextUrl = new URL(location, url).toString();
      await trace(nextUrl, depth + 1);
    }
  } catch (err) {
    console.error("Error:", err.message);
  }
}

const target = "https://abd-logs.vercel.app/api/auth/federated/callback?code=ce8548011b355582d190ad7fee889c2c43764fc8a919884f&state=%2Fadmin";
trace(target);
