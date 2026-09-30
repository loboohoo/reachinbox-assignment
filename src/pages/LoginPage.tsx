import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

export const LoginPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleGoogleLogin = () => {
    // Redirect browser directly to real Google OAuth 2.0 backend authorization route
    window.location.href = 'http://localhost:5000/api/auth/google';
  };

  const handleFrontendLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Also trigger Google OAuth for seamless flow
    handleGoogleLogin();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC] p-4 font-sans selection:bg-[#00A859]/20 selection:text-[#00A859]">
      {/* Figma Frame Outer Bounds: 496px x 494px Card */}
      <div className="w-full max-w-[496px] bg-white border border-[#E5E7EB] rounded-[10px] p-8 sm:p-10 shadow-2xs flex flex-col items-center justify-center">
        {/* Figma Form Container: 380px x 389px */}
        <div className="w-full max-w-[380px] space-y-6">
          {/* Login Heading */}
          <h1 className="text-2xl font-bold text-[#111827] text-center tracking-tight">
            Login
          </h1>

          {/* Real Google OAuth Login Button */}
          <Button variant="google" onClick={handleGoogleLogin}>
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Login with Google</span>
          </Button>

          {/* Divider */}
          <div className="relative flex items-center justify-center my-4">
            <div className="border-t border-[#E5E7EB] w-full" />
            <span className="bg-white px-3 text-[11px] text-[#9CA3AF] whitespace-nowrap absolute">
              or sign up through email
            </span>
          </div>

          {/* Login Form */}
          <form onSubmit={handleFrontendLogin} className="space-y-3.5 pt-1">
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email ID"
              required
            />

            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              required
            />

            <div className="pt-2">
              <Button type="submit" variant="primary">
                Login
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
