export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { password } = req.body;

  if (!password || typeof password !== 'string') {
    return res.status(400).json({ error: 'Missing password' });
  }

  // Map: password keyword (public) → env var name (secret URL lives on Vercel)
  // Add as many as you want — the keyword is NOT secret, the URL is.
  // On Vercel: Settings → Environment Variables → add e.g. PWD_RIDER = https://...
  const map = {
    'rider':      process.env.PWD_RIDER,
    'backstage':  process.env.PWD_BACKSTAGE,
    'booking':    process.env.PWD_BOOKING,
    'press':      process.env.PWD_PRESS,
  };

  const url = map[password.trim().toLowerCase()];

  if (url) {
    return res.status(200).json({ url });
  } else {
    return res.status(401).json({ error: 'Invalid password' });
  }
}
