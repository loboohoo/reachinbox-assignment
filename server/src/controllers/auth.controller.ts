import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import dotenv from 'dotenv';

dotenv.config();

const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

export class AuthController {
  /**
   * GET /api/auth/google
   * Redirects user to Google's OAuth 2.0 Consent Screen.
   */
  static googleAuth(_req: Request, res: Response) {
    const authUrl = AuthService.getGoogleAuthUrl();
    res.redirect(authUrl);
  }

  /**
   * GET /api/auth/google/callback
   * Processes authorization code, upserts user, sets HTTP-only cookie, and redirects to frontend.
   */
  static async googleCallback(req: Request, res: Response) {
    const { code, error } = req.query;

    if (error || !code) {
      console.warn('⚠️ Google OAuth cancelled or denied:', error);
      res.redirect(`${frontendUrl}/login?error=oauth_cancelled`);
      return;
    }

    try {
      const { user, token } = await AuthService.handleGoogleCallback(code as string);

      // Set HTTP-only Cookie containing signed JWT with explicit root path
      res.cookie('token', token, {
        path: '/',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days expiration
      });

      console.log(`✅ [Auth] User ${user.email} logged in successfully via Google OAuth.`);
      res.redirect(`${frontendUrl}/`);
    } catch (err: any) {
      console.error('❌ Google OAuth callback error:', err.message);
      if (err.cause) {
        console.error('   Cause:', err.cause);
      }
      if (err.stack) {
        console.error('   Stack:', err.stack);
      }
      res.redirect(`${frontendUrl}/login?error=oauth_failed`);
    }
  }

  /**
   * GET /api/auth/me
   * Returns current authenticated user details.
   */
  static async getMe(req: AuthenticatedRequest, res: Response) {
    if (!req.user) {
      res.status(401).json({ success: false, error: 'Not authenticated' });
      return;
    }
    res.json({
      success: true,
      user: req.user,
    });
  }

  /**
   * POST /api/auth/logout
   * Clears HTTP-only authentication cookie and invalidates session.
   */
  static async logout(_req: Request, res: Response) {
    res.clearCookie('token', {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    res.json({
      success: true,
      message: 'Logged out successfully',
    });
  }
}
