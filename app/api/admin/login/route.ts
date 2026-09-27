import { NextRequest, NextResponse } from 'next/server';
import { getAdminCredentials, createSessionToken, COOKIE_NAME } from '@/lib/security/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Username and password are required' },
        { status: 400 }
      );
    }

    const { username: validUsername, password: validPassword, isConfigured } = getAdminCredentials();

    if (!isConfigured) {
      return NextResponse.json(
        {
          success: false,
          error: 'Admin credentials are not configured in Vercel environment variables. Please add ADMIN_USERNAME and ADMIN_PASSWORD in your Vercel project settings.',
        },
        { status: 503 }
      );
    }

    if (username !== validUsername || password !== validPassword) {
      return NextResponse.json(
        { success: false, error: 'Invalid admin credentials' },
        { status: 401 }
      );
    }

    const token = createSessionToken(username);

    const response = NextResponse.json({
      success: true,
      message: 'Admin authenticated successfully',
    });

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 24 * 60 * 60, // 24 hours
    });

    return response;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Login failed';
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
