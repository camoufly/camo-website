// pages/api/auth.js
import fetch from 'node-fetch';

export default async function handler(req, res) {
  const { code } = req.query;

  if (!code) {
    // Step 1: redirect user to Dropbox auth
    const params = new URLSearchParams({
      client_id: process.env.DROPBOX_APP_KEY,
      response_type: 'code',
      token_access_type: 'offline',
      redirect_uri: process.env.DROPBOX_REDIRECT_URI,
    });

    res.redirect(`https://www.dropbox.com/oauth2/authorize?${params.toString()}`);
  } else {
    // Step 2: exchange code for refresh_token
    const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        client_id: process.env.DROPBOX_APP_KEY,
        client_secret: process.env.DROPBOX_APP_SECRET,
        redirect_uri: process.env.DROPBOX_REDIRECT_URI,
      }),
    });

    const tokenData = await tokenRes.json();

    if (!tokenData.refresh_token) {
      return res.status(400).json({ error: 'Failed to get refresh token', details: tokenData });
    }

    console.log('✅ Store this in Vercel:', tokenData.refresh_token);

    // In a real app, redirect to a success page
    res.send(`
      <h2>🎉 Authorized!</h2>
      <p>Copy this refresh token and store it in Vercel as:</p>
      <code>DROPBOX_REFRESH_TOKEN=${tokenData.refresh_token}</code>
    `);
  }
}
