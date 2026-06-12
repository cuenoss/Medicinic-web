import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { Mail, AlertCircle, CheckCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60; // seconds

export function VerifyEmailScreen() {
  const navigate = useNavigate();
  const location = useLocation();
  const { verifyEmail, resendVerification, isLoading, error } = useAuth();

  const [email, setEmail] = useState<string>((location.state as any)?.email ?? '');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [success, setSuccess] = useState(false);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown((c) => (c > 0 ? c - 1 : 0)), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < CODE_LENGTH) return;
    try {
      await verifyEmail(email, code);
      setSuccess(true);
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch {
      // error shown via AuthContext
    }
  }

  async function handleResend() {
    if (cooldown > 0 || !email) return;
    try {
      await resendVerification(email);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN);
    } catch {
      // error shown via AuthContext
    }
  }

  return (
    <Card className="w-full max-w-md p-8 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <Mail className="text-white w-8 h-8" />
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">Check your email</h1>
        <p className="text-slate-600 text-sm">
          We sent a 6-digit code to{' '}
          {email
            ? <span className="font-medium text-slate-800">{email}</span>
            : 'your email address'
          }. Enter it below to verify your account.
        </p>
      </div>

      {success ? (
        <div className="flex flex-col items-center gap-3 py-4">
          <CheckCircle className="w-12 h-12 text-green-500" />
          <p className="text-green-700 font-medium">Email verified! Redirecting to login…</p>
        </div>
      ) : (
        <form onSubmit={handleVerify} className="space-y-6">
          {/* Code digit inputs */}
          <div className="flex justify-center gap-3" onPaste={handlePaste}>
            {digits.map((d, i) => (
              <input
                key={i}
                ref={(el) => { inputRefs.current[i] = el; }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleDigitChange(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                className={
                  'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors ' +
                  (d
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-300 bg-white text-slate-800') +
                  ' focus:border-blue-500'
                }
              />
            ))}
          </div>

          {!email && (
            <div className="space-y-1">
              <label className="text-sm text-slate-600">Your email address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="doctor@clinic.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading || digits.join('').length < CODE_LENGTH}
          >
            {isLoading ? 'Verifying…' : 'Verify Email'}
          </Button>

          <div className="text-center text-sm text-slate-600">
            Didn't receive the code?{' '}
            <button
              type="button"
              onClick={handleResend}
              disabled={cooldown > 0 || isLoading}
              className={
                'inline-flex items-center gap-1 font-medium ' +
                (cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700')
              }
            >
              <RefreshCw className="w-3 h-3" />
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </form>
      )}
    </Card>
  );
}
