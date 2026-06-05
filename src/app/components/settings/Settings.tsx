import { useState, useEffect } from 'react';
import {
  Building, Clock, Bell, Database, User, Mail, Phone, Globe, Save,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';
import { useAuth } from '../../contexts/AuthContext';
import { settingsService } from '../../services/settings';
import { useTranslation } from 'react-i18next';

export function Settings() {
  const { user } = useAuth();
  const { t } = useTranslation();

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingClinic, setSavingClinic] = useState(false);
  const [savingHours, setSavingHours] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);

  const [clinicInfo, setClinicInfo] = useState({
    name: '',
    address: '',
    phone: '',
    email: '',
    website: '',
  });

  const [workingHours, setWorkingHours] = useState({
    monday: '09:00 AM - 05:00 PM',
    tuesday: '09:00 AM - 05:00 PM',
    wednesday: '09:00 AM - 05:00 PM',
    thursday: '09:00 AM - 05:00 PM',
    friday: '09:00 AM - 05:00 PM',
    saturday: '10:00 AM - 02:00 PM',
    sunday: 'Closed',
  });

  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsNotifications: false,
    appointmentReminders: true,
    paymentAlerts: true,
  });

  const [profile, setProfile] = useState({
    fullName: '',
    specialization: 'General Practitioner',
    license: '',
    email: '',
    phone: '',
  });

  // Load settings from API on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoadingSettings(true);
        // Initialize defaults first (no-op if already initialized)
        await settingsService.initializeDefaults().catch(() => {});
        const data = await settingsService.getAllSettings();

        const val = (key: string) => data[key]?.value ?? data[key] ?? '';

        setClinicInfo({
          name: val('clinic_name') || 'MediClinic Health Center',
          address: val('clinic_address') || '',
          phone: val('clinic_phone') || '',
          email: val('clinic_email') || '',
          website: val('clinic_website') || '',
        });

        const wh = val('working_hours');
        if (wh && typeof wh === 'object') {
          setWorkingHours({
            monday: wh.monday ? `${wh.monday.start || '09:00'} - ${wh.monday.end || '17:00'}` : '09:00 AM - 05:00 PM',
            tuesday: wh.tuesday ? `${wh.tuesday.start || '09:00'} - ${wh.tuesday.end || '17:00'}` : '09:00 AM - 05:00 PM',
            wednesday: wh.wednesday ? `${wh.wednesday.start || '09:00'} - ${wh.wednesday.end || '17:00'}` : '09:00 AM - 05:00 PM',
            thursday: wh.thursday ? `${wh.thursday.start || '09:00'} - ${wh.thursday.end || '17:00'}` : '09:00 AM - 05:00 PM',
            friday: wh.friday ? `${wh.friday.start || '09:00'} - ${wh.friday.end || '17:00'}` : '09:00 AM - 05:00 PM',
            saturday: wh.saturday ? `${wh.saturday.start || '09:00'} - ${wh.saturday.end || '13:00'}` : '10:00 AM - 02:00 PM',
            sunday: wh.sunday?.closed !== false ? 'Closed' : `${wh.sunday.start || ''} - ${wh.sunday.end || ''}`,
          });
        }

        const ns = val('notification_settings');
        if (ns && typeof ns === 'object') {
          setNotifications({
            emailNotifications: ns.email_notifications ?? true,
            smsNotifications: ns.sms_notifications ?? false,
            appointmentReminders: ns.appointment_reminders ?? true,
            paymentAlerts: ns.payment_alerts ?? true,
          });
        }
      } catch (err) {
        console.error('Failed to load settings:', err);
      } finally {
        setLoadingSettings(false);
      }
    };

    // Pre-fill profile from auth context
    if (user) {
      setProfile(p => ({
        ...p,
        fullName: user.fullName || '',
        email: user.email || '',
      }));
    }

    loadSettings();
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await settingsService.bulkUpdate({
        doctor_full_name: profile.fullName,
        doctor_specialization: profile.specialization,
        doctor_license: profile.license,
        doctor_email: profile.email,
        doctor_phone: profile.phone,
      });
      alert(t('settings.saved'));
    } catch (err) {
      console.error('Failed to save profile:', err);
      alert(t('common.error'));
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveClinic = async () => {
    setSavingClinic(true);
    try {
      await settingsService.bulkUpdate({
        clinic_name: clinicInfo.name,
        clinic_address: clinicInfo.address,
        clinic_phone: clinicInfo.phone,
        clinic_email: clinicInfo.email,
        clinic_website: clinicInfo.website,
      });
      alert(t('settings.saved'));
    } catch (err) {
      console.error('Failed to save clinic info:', err);
      alert(t('common.error'));
    } finally {
      setSavingClinic(false);
    }
  };

  const handleSaveHours = async () => {
    setSavingHours(true);
    try {
      const parseHours = (val: string) => {
        if (!val || val.toLowerCase() === 'closed') return { start: null, end: null, closed: true };
        const parts = val.split('-').map(s => s.trim());
        return { start: parts[0] || null, end: parts[1] || null, closed: false };
      };
      await settingsService.updateSetting('working_hours', {
        monday: parseHours(workingHours.monday),
        tuesday: parseHours(workingHours.tuesday),
        wednesday: parseHours(workingHours.wednesday),
        thursday: parseHours(workingHours.thursday),
        friday: parseHours(workingHours.friday),
        saturday: parseHours(workingHours.saturday),
        sunday: parseHours(workingHours.sunday),
      });
      alert(t('settings.saved'));
    } catch (err) {
      console.error('Failed to save hours:', err);
      alert(t('common.error'));
    } finally {
      setSavingHours(false);
    }
  };

  const handleSaveNotifications = async () => {
    try {
      await settingsService.updateSetting('notification_settings', {
        email_notifications: notifications.emailNotifications,
        sms_notifications: notifications.smsNotifications,
        appointment_reminders: notifications.appointmentReminders,
        payment_alerts: notifications.paymentAlerts,
      });
    } catch (err) {
      console.error('Failed to save notifications:', err);
    }
  };

  if (loadingSettings) {
    return (
      <div className="flex items-center justify-center h-48">
        <p className="text-slate-500">{t('common.loading')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">{t('settings.title')}</h1>
        <p className="text-slate-600">{t('settings.subtitle')}</p>
      </div>

      {/* User Profile */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-2">
          <User className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t('settings.profile')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.fullName')}</Label>
              <Input value={profile.fullName} onChange={(e) => setProfile({ ...profile, fullName: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.specialization')}</Label>
              <Input value={profile.specialization} onChange={(e) => setProfile({ ...profile, specialization: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.medicalLicense')}</Label>
              <Input value={profile.license} onChange={(e) => setProfile({ ...profile, license: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.email')}</Label>
              <Input type="email" value={profile.email} onChange={(e) => setProfile({ ...profile, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>{t('settings.phone')}</Label>
              <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveProfile} className="bg-blue-600 hover:bg-blue-700" disabled={savingProfile}>
              <Save className="w-4 h-4 mr-2" />
              {savingProfile ? t('settings.saving') : t('settings.saveProfile')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Clinic Information */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-2">
          <Building className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t('settings.clinicInfo')}</h2>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label>{t('settings.clinicName')}</Label>
            <Input value={clinicInfo.name} onChange={(e) => setClinicInfo({ ...clinicInfo, name: e.target.value })} />
          </div>
          <div className="space-y-2">
            <Label>{t('settings.address')}</Label>
            <Textarea value={clinicInfo.address} onChange={(e) => setClinicInfo({ ...clinicInfo, address: e.target.value })} rows={2} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('settings.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input value={clinicInfo.phone} onChange={(e) => setClinicInfo({ ...clinicInfo, phone: e.target.value })} className="pl-10" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('settings.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input type="email" value={clinicInfo.email} onChange={(e) => setClinicInfo({ ...clinicInfo, email: e.target.value })} className="pl-10" />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t('settings.website')}</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input value={clinicInfo.website} onChange={(e) => setClinicInfo({ ...clinicInfo, website: e.target.value })} className="pl-10" />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveClinic} className="bg-blue-600 hover:bg-blue-700" disabled={savingClinic}>
              <Save className="w-4 h-4 mr-2" />
              {savingClinic ? t('settings.saving') : t('settings.saveClinic')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Working Hours */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-2">
          <Clock className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t('settings.workingHours')}</h2>
        </div>
        <div className="p-6 space-y-3">
          {Object.entries(workingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="font-medium text-slate-700 capitalize w-32">{day}</span>
              <Input value={hours} onChange={(e) => setWorkingHours({ ...workingHours, [day]: e.target.value })} className="max-w-xs" />
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Button onClick={handleSaveHours} className="bg-blue-600 hover:bg-blue-700" disabled={savingHours}>
              <Save className="w-4 h-4 mr-2" />
              {savingHours ? t('settings.saving') : t('settings.saveHours')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notifications */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-2">
          <Bell className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t('settings.notifications')}</h2>
        </div>
        <div className="p-6 space-y-4">
          {[
            { key: 'emailNotifications', label: t('settings.emailNotifications'), desc: t('settings.emailNotificationsDesc') },
            { key: 'smsNotifications', label: t('settings.smsNotifications'), desc: t('settings.smsNotificationsDesc') },
            { key: 'appointmentReminders', label: t('settings.appointmentReminders'), desc: t('settings.appointmentRemindersDesc') },
            { key: 'paymentAlerts', label: t('settings.paymentAlerts'), desc: t('settings.paymentAlertsDesc') },
          ].map(({ key, label, desc }) => (
            <div key={key} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-slate-800">{label}</p>
                <p className="text-sm text-slate-600">{desc}</p>
              </div>
              <Switch
                checked={notifications[key as keyof typeof notifications] as boolean}
                onCheckedChange={(checked) => {
                  const updated = { ...notifications, [key]: checked };
                  setNotifications(updated);
                  // Save immediately on toggle
                  settingsService.updateSetting('notification_settings', {
                    email_notifications: updated.emailNotifications,
                    sms_notifications: updated.smsNotifications,
                    appointment_reminders: updated.appointmentReminders,
                    payment_alerts: updated.paymentAlerts,
                  }).catch(console.error);
                }}
              />
            </div>
          ))}
        </div>
      </Card>

      {/* Data Backup */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4 flex items-center gap-2">
          <Database className="w-5 h-5" />
          <h2 className="text-xl font-semibold">{t('settings.dataBackup')}</h2>
        </div>
        <div className="p-6">
          <p className="text-slate-600 mb-6">{t('settings.backupDesc')}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-2 border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">{t('settings.localBackup')}</h3>
              <p className="text-sm text-slate-600 mb-4">{t('settings.localBackupDesc')}</p>
              <Button variant="outline" className="w-full" onClick={() => alert('Local backup initiated...')}>
                <Database className="w-4 h-4 mr-2" />
                {t('settings.backupLocally')}
              </Button>
            </Card>
            <Card className="p-5 border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-slate-800 mb-2">{t('settings.cloudBackup')}</h3>
              <p className="text-sm text-slate-600 mb-4">{t('settings.cloudBackupDesc')}</p>
              <Button className="w-full bg-blue-600 hover:bg-blue-700" onClick={() => alert('Cloud backup initiated...')}>
                <Database className="w-4 h-4 mr-2" />
                {t('settings.backupToCloud')}
              </Button>
            </Card>
          </div>
        </div>
      </Card>
    </div>
  );
}
