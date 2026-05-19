import { NextRequest, NextResponse } from 'next/server';

/**
 * 🛰️ Federated Callback Handler (ABDQuiz)
 * Receives the authorization code from ABDAuth and exchanges it for a user profile.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const state = searchParams.get('state') || '/';

  if (!code) {
    return NextResponse.json({ error: 'No authorization code provided' }, { status: 400 });
  }

  try {
    // 1. Exchange code for token & profile
    const providerUrl = process.env.AUTH_PROVIDER_URL || 'https://abd-auth.vercel.app';
    const tokenUrl = `${providerUrl}/api/auth/federated/token`;
    const currentUrl = new URL(request.url);
    const dynamicRedirectUri = `${currentUrl.protocol}//${currentUrl.host}/api/auth/federated/callback`;

    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.AUTH_CLIENT_ID,
        client_secret: process.env.AUTH_CLIENT_SECRET,
        redirect_uri: dynamicRedirectUri,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      return NextResponse.json({ error: 'Token exchange failed', detail: errorData }, { status: 401 });
    }

    const data = await response.json(); // Contiene { token, user }

    // 2. Create the local session storing the cryptographically signed JWT
    const nextResponse = NextResponse.redirect(new URL(state, request.url));
    
    nextResponse.cookies.set('abd_session', data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 8, // Turno industrial de 8 horas
    });

    return nextResponse;
  } catch (error) {
    console.error('[FEDERATED_CALLBACK_ERROR]', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
