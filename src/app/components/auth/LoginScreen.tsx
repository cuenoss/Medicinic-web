import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, Eye, EyeOff, AlertCircle, RefreshCw } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

const CODE_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export function LoginScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { login, isLoading, error } = useAuth();

  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // OTP phase
  const [phase, setPhase] = useState<'credentials' | 'otp'>('credentials');
  const [digits, setDigits] = useState<string[]>(Array(CODE_LENGTH).fill(''));
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (phase === 'otp') inputRefs.current[0]?.focus();
  }, [phase]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const id = setInterval(() => setCooldown(c => c > 0 ? c - 1 : 0), 1000);
    return () => clearInterval(id);
  }, [cooldown]);

  // ── Phase 1: credentials ───────────────────────────────────────────────
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await api.login(formData.email, formData.password) as any;
      if (response?.status === 'code_sent') {
        setPhase('otp');
        setCooldown(RESEND_COOLDOWN);
      } else {
        // direct token (shouldn't happen but handle gracefully)
        navigate('/');
      }
    } catch (err: any) {
      if (err?.status === 403) {
        navigate('/auth/verify-email', { state: { email: formData.email } });
      }
    }
  };

  // ── Phase 2: OTP ───────────────────────────────────────────────────────
  function handleDigitChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...digits];
    next[index] = digit;
    setDigits(next);
    if (digit && index < CODE_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !digits[index] && index > 0) inputRefs.current[index - 1]?.focus();
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH);
    const next = [...digits];
    for (let i = 0; i < pasted.length; i++) next[i] = pasted[i];
    setDigits(next);
    inputRefs.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus();
  }

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = digits.join('');
    if (code.length < CODE_LENGTH) return;
    setOtpLoading(true);
    setOtpError(null);
    try {
      const response = await api.verifyLogin(formData.email, code) as any;
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('user', JSON.stringify(response.doctor));
      // Force a full reload so AuthContext picks up the new token
      window.location.href = '/';
    } catch (err: any) {
      setOtpError(err.message || 'Invalid code');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleResend = async () => {
    if (cooldown > 0) return;
    try {
      await api.resendLoginCode(formData.email);
      setDigits(Array(CODE_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
      setCooldown(RESEND_COOLDOWN);
    } catch (err: any) {
      setOtpError(err.message || 'Failed to resend');
    }
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">MC</span>
        </div>
      </div>

      {phase === 'credentials' ? (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">{t('auth.welcomeBack')}</h1>
            <p className="text-slate-600">{t('auth.signInToAccount')}</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">{t('auth.emailAddress')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input id="email" type="email" placeholder="doctor@clinic.com"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="pl-10" required />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">{t('auth.password')}</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input id="password" type={showPassword ? 'text' : 'password'}
                  placeholder={t('auth.enterPassword')}
                  value={formData.password}
                  onChange={e => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10" required />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="rounded border-slate-300" />
                <span className="text-slate-600">{t('auth.rememberMe')}</span>
              </label>
              <Link to="/auth/reset-password" className="text-blue-600 hover:text-blue-700">
                {t('auth.forgotPassword')}
              </Link>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
              {isLoading ? t('auth.signingIn') : t('auth.signIn')}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">{t('auth.noAccount')} </span>
            <Link to="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
              {t('auth.signUp')}
            </Link>
          </div>
        </>
      ) : (
        <>
          <div className="text-center mb-8">
            <h1 className="text-2xl font-semibold text-slate-800 mb-2">Check your email</h1>
            <p className="text-slate-600 text-sm">
              We sent a 6-digit code to{' '}
              <span className="font-medium text-slate-800">{formData.email}</span>.
              Enter it below to sign in.
            </p>
          </div>

          <form onSubmit={handleVerifyOtp} className="space-y-6">
            <div className="flex justify-center gap-3" onPaste={handlePaste}>
              {digits.map((d, i) => (
                <input key={i}
                  ref={el => { inputRefs.current[i] = el; }}
                  type="text" inputMode="numeric" maxLength={1} value={d}
                  onChange={e => handleDigitChange(i, e.target.value)}
                  onKeyDown={e => handleKeyDown(i, e)}
                  className={
                    'w-12 h-14 text-center text-xl font-bold rounded-lg border-2 outline-none transition-colors ' +
                    (d ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-300 bg-white text-slate-800') +
                    ' focus:border-blue-500'
                  }
                />
              ))}
            </div>

            {otpError && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{otpError}</span>
              </div>
            )}

            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700"
              disabled={otpLoading || digits.join('').length < CODE_LENGTH}>
              {otpLoading ? 'Verifying…' : 'Sign In'}
            </Button>

            <div className="text-center text-sm text-slate-600">
              Didn't receive the code?{' '}
              <button type="button" onClick={handleResend} disabled={cooldown > 0}
                className={'inline-flex items-center gap-1 font-medium ' +
                  (cooldown > 0 ? 'text-slate-400 cursor-not-allowed' : 'text-blue-600 hover:text-blue-700')}>
                <RefreshCw className="w-3 h-3" />
                {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
              </button>
            </div>

            <div className="text-center">
              <button type="button" onClick={() => { setPhase('credentials'); setDigits(Array(CODE_LENGTH).fill('')); setOtpError(null); }}
                className="text-sm text-slate-500 hover:text-slate-700">
                ← Back to login
              </button>
            </div>
          </form>
        </>
      )}
    </Card>
  );
}
