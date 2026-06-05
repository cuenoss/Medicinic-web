import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, User, Mail, Phone, Heart, AlertTriangle, Shield, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { patientsService } from '../../services/patients';
import { useTranslation } from 'react-i18next';

const SECTIONS = ['personal', 'contact', 'medical', 'emergency'] as const;
type Section = typeof SECTIONS[number];

export function CreatePatient() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('personal');
  const [formData, setFormData] = useState({
    full_name: '', email: '', phone: '', address: '',
    date_of_birth: '', blood_type: '', allergies: '',
    chronic_conditions: '', relationship_status: '',
    emergency_contact_name: '', emergency_contact_phone: '',
    gender: '', age: ''
  });

  const set = (field: string, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.phone) {
      alert('Please fill in Name, Email and Phone');
      return;
    }
    try {
      setLoading(true);
      const newPatient = await patientsService.createPatient(formData);
      navigate(`/patients/${newPatient.id}`);
    } catch (error) {
      console.error('Failed to create patient:', error);
      alert('Failed to create patient. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const sectionConfig = [
    { key: 'personal', icon: User,          color: 'blue',   label: t('patients.personalInfo') },
    { key: 'contact',  icon: Mail,          color: 'green',  label: t('patients.contactInfo') },
    { key: 'medical',  icon: Heart,         color: 'red',    label: t('patients.medicalInfo') },
    { key: 'emergency',icon: Shield,        color: 'orange', label: t('patients.emergencyContact') },
  ] as const;

  const colorMap: Record<string, string> = {
    blue:   'bg-blue-600',
    green:  'bg-emerald-600',
    red:    'bg-rose-600',
    orange: 'bg-orange-500',
  };
  const borderMap: Record<string, string> = {
    blue:   'border-blue-500',
    green:  'border-emerald-500',
    red:    'border-rose-500',
    orange: 'border-orange-500',
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center gap-4">
        <Link to="/patients">
          <Button variant="ghost" size="sm" className="gap-2">
            <ArrowLeft className="w-4 h-4" />
            {t('patients.backToPatients')}
          </Button>
        </Link>
        <div className="h-6 w-px bg-slate-200" />
        <div>
          <h1 className="text-xl font-semibold text-slate-800">{t('patients.addNewPatient')}</h1>
          <p className="text-sm text-slate-500">{t('patients.fillInfo')}</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto p-6 space-y-6">

        {/* Section tabs */}
        <div className="grid grid-cols-4 gap-3">
          {sectionConfig.map(({ key, icon: Icon, color, label }) => {
            const active = activeSection === key;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setActiveSection(key as Section)}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  active
                    ? `${borderMap[color]} bg-white shadow-sm`
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white ${colorMap[color]}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <span className={`text-xs font-medium text-center ${active ? 'text-slate-800' : 'text-slate-500'}`}>
                  {label}
                </span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleSubmit}>
          {/* Personal Information */}
          {activeSection === 'personal' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-blue-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <User className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">{t('patients.personalInfo')}</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('patients.fullName')} <span className="text-red-500">*</span>
                  </label>
                  <Input value={formData.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder={t('patients.enterFullName')} className="h-11" required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.gender')}</label>
                  <select value={formData.gender} onChange={e => set('gender', e.target.value)}
                    className="w-full h-11 border border-slate-300 rounded-lg px-3 bg-white text-slate-800 focus:ring-2 focus:ring-blue-500 focus:border-blue-500">
                    <option value="">{t('patients.selectGender')}</option>
                    <option value="Male">{t('patients.male')}</option>
                    <option value="Female">{t('patients.female')}</option>
                    <option value="Other">{t('patients.other')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.age')}</label>
                  <Input type="number" value={formData.age} onChange={e => set('age', e.target.value)}
                    placeholder={t('patients.enterAge')} className="h-11" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.dateOfBirth')}</label>
                  <Input type="date" value={formData.date_of_birth} onChange={e => set('date_of_birth', e.target.value)} className="h-11" />
                </div>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {activeSection === 'contact' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-emerald-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">{t('patients.contactInfo')}</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('patients.email')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="email" value={formData.email} onChange={e => set('email', e.target.value)}
                      placeholder={t('patients.enterEmail')} className="h-11 pl-10" required />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('patients.phone')} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="tel" value={formData.phone} onChange={e => set('phone', e.target.value)}
                      placeholder={t('patients.enterPhone')} className="h-11 pl-10" required />
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.address')}</label>
                  <textarea value={formData.address} onChange={e => set('address', e.target.value)}
                    placeholder={t('patients.enterAddress')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 h-24 resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* Medical Information */}
          {activeSection === 'medical' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-rose-600 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Heart className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">{t('patients.medicalInfo')}</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.bloodType')}</label>
                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                      <button key={bt} type="button"
                        onClick={() => set('blood_type', formData.blood_type === bt ? '' : bt)}
                        className={`py-2.5 rounded-lg border-2 text-sm font-semibold transition-all ${
                          formData.blood_type === bt
                            ? 'bg-rose-600 border-rose-600 text-white shadow-sm'
                            : 'border-slate-200 text-slate-700 hover:border-rose-300'
                        }`}
                      >{bt}</button>
                    ))}
                  </div>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    {t('patients.allergies')}
                  </label>
                  <textarea value={formData.allergies} onChange={e => set('allergies', e.target.value)}
                    placeholder={t('patients.enterAllergies')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 h-24 resize-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.chronicConditions')}</label>
                  <textarea value={formData.chronic_conditions} onChange={e => set('chronic_conditions', e.target.value)}
                    placeholder={t('patients.enterChronicConditions')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2.5 h-24 resize-none focus:ring-2 focus:ring-rose-500 focus:border-rose-500" />
                </div>
              </div>
            </div>
          )}

          {/* Emergency Contact */}
          {activeSection === 'emergency' && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="bg-orange-500 px-6 py-4 flex items-center gap-3">
                <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
                  <Shield className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-white">{t('patients.emergencyContact')}</h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.emergencyContactName')}</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input value={formData.emergency_contact_name}
                      onChange={e => set('emergency_contact_name', e.target.value)}
                      placeholder={t('patients.enterEmergencyName')} className="h-11 pl-10" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.emergencyContactPhone')}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input type="tel" value={formData.emergency_contact_phone}
                      onChange={e => set('emergency_contact_phone', e.target.value)}
                      placeholder={t('patients.enterEmergencyPhone')} className="h-11 pl-10" />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Navigation footer */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 flex items-center justify-between">
            <div className="flex gap-2">
              {SECTIONS.map((s, i) => (
                <button key={s} type="button" onClick={() => setActiveSection(s)}
                  className={`w-2.5 h-2.5 rounded-full transition-all ${
                    activeSection === s ? 'bg-blue-600 scale-125' : 'bg-slate-300 hover:bg-slate-400'
                  }`} />
              ))}
            </div>

            <div className="flex gap-3">
              {/* Prev / Next section */}
              {SECTIONS.indexOf(activeSection) > 0 && (
                <Button type="button" variant="outline"
                  onClick={() => setActiveSection(SECTIONS[SECTIONS.indexOf(activeSection) - 1])}>
                  ← {t('common.previous')}
                </Button>
              )}
              {SECTIONS.indexOf(activeSection) < SECTIONS.length - 1 ? (
                <Button type="button" className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => setActiveSection(SECTIONS[SECTIONS.indexOf(activeSection) + 1])}>
                  {t('common.next')} →
                </Button>
              ) : (
                <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700 gap-2" disabled={loading}>
                  <Check className="w-4 h-4" />
                  {loading ? t('patients.creating') : t('patients.createPatient')}
                </Button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
