import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { Mail, Lock, User, Phone, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

export function RegisterScreen() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { register, isLoading, error } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await register(formData);
      navigate('/auth/login');
    } catch (error) {
      console.error('Registration failed:', error);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-xl">
      <div className="flex justify-center mb-6">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
          <span className="text-white text-2xl font-bold">MC</span>
        </div>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-2xl font-semibold text-slate-800 mb-2">{t('auth.createAccountBtn')}</h1>
        <p className="text-slate-600">{t('auth.registerClinicProfile')}</p>
      </div>

      <form onSubmit={handleRegister} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="fullName">{t('auth.fullName')}</Label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="fullName"
              type="text"
              placeholder="Dr. John Smith"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">{t('auth.emailAddress')}</Label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="email"
              type="email"
              placeholder="doctor@clinic.com"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">{t('auth.phone')}</Label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="phone"
              type="tel"
              placeholder="+1 (555) 000-0000"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">{t('auth.password')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={t('auth.createStrongPassword')}
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              className="pl-10 pr-10"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">{t('auth.confirmPassword')}</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              id="confirmPassword"
              type="password"
              placeholder={t('auth.reenterPassword')}
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              className="pl-10"
              required
            />
          </div>
        </div>

        <div className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1 rounded border-slate-300" required />
          <span className="text-slate-600">
            {t('auth.termsAgree')}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">{t('auth.termsOfService')}</a>
            {' '}{t('auth.and')}{' '}
            <a href="#" className="text-blue-600 hover:text-blue-700">{t('auth.privacyPolicy')}</a>
          </span>
        </div>

        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700" disabled={isLoading}>
          {isLoading ? t('auth.creatingAccount') : t('auth.createAccountBtn')}
        </Button>
      </form>

      <div className="mt-6 text-center text-sm">
        <span className="text-slate-600">{t('auth.hasAccount')} </span>
        <Link to="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
          {t('auth.signIn')}
        </Link>
      </div>
    </Card>
  );
}
