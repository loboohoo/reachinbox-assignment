import jwt from 'jsonwebtoken';
import { prisma } from '../config/database';
import dotenv from 'dotenv';

dotenv.config();

export class AuthService {
  /**
   * Constructs the Google OAuth 2.0 Authorization Consent URL.
   */
  static getGoogleAuthUrl(): string {
    const rootUrl = 'https://accounts.google.com/o/oauth2/v2/auth';
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
    const clientId = process.env.GOOGLE_CLIENT_ID || '';

    const options = {
      redirect_uri: redirectUri,
      client_id: clientId,
      access_type: 'offline',
      response_type: 'code',
      prompt: 'consent',
      scope: [
        'https://www.googleapis.com/auth/userinfo.profile',
        'https://www.googleapis.com/auth/userinfo.email',
      ].join(' '),
    };

    const qs = new URLSearchParams(options).toString();
    return `${rootUrl}?${qs}`;
  }

  /**
   * Exchanges authorization code for Google user profile and upserts user in PostgreSQL.
   */
  static async handleGoogleCallback(code: string) {
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const redirectUri = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    // 1. Exchange auth code for tokens
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      throw new Error(`Failed to exchange Google OAuth code: ${errorText}`);
    }

    const tokenData = (await tokenResponse.json()) as { access_token: string; id_token: string };

    // 2. Fetch Google User Profile using access token
    const userProfileResponse = await fetch(
      `https://www.googleapis.com/oauth2/v2/userinfo?access_token=${tokenData.access_token}`
    );

    if (!userProfileResponse.ok) {
      throw new Error('Failed to retrieve Google user profile');
    }

    const googleUser = (await userProfileResponse.json()) as {
      id: string;
      email: string;
      name: string;
      picture?: string;
    };

    // 3. Upsert User in PostgreSQL using googleId / email
    const user = await prisma.user.upsert({
      where: { email: googleUser.email },
      update: {
        googleId: googleUser.id,
        name: googleUser.name,
        avatar: googleUser.picture || null,
      },
      create: {
        googleId: googleUser.id,
        email: googleUser.email,
        name: googleUser.name,
        avatar: googleUser.picture || null,
      },
    });

    // 4. Generate JWT session token
    const token = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET || 'reachinbox_default_secret',
      { expiresIn: '7d' }
    );

    return { user, token };
  }
}
