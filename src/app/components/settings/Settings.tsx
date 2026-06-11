import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building,
  Clock,
  Bell,
  Database,
  User,
  Mail,
  Phone,
  MapPin,
  Save,
  Globe,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Switch } from '../ui/switch';

export function Settings() {
  const { t } = useTranslation();
  const [clinicInfo, setClinicInfo] = useState({
    name: 'MediClinic Health Center',
    address: '123 Medical Plaza, Suite 100, New York, NY 10001',
    phone: '+1 (555) 000-0000',
    email: 'info@mediclinic.com',
    website: 'www.mediclinic.com',
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
    fullName: 'Dr. John Smith',
    specialization: 'General Practitioner',
    license: 'MD-123456',
    email: 'dr.smith@mediclinic.com',
    phone: '+1 (555) 123-4567',
  });

  const handleSaveClinic = () => {
    alert(t('settings.clinicSaved'));
  };

  const handleSaveProfile = () => {
    alert(t('settings.profileSaved'));
  };

  const handleBackup = (type: string) => {
    alert(`${type} ${t('settings.backupInitiated')}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">{t('settings.title')}</h1>
        <p className="text-slate-600">{t('settings.subtitle')}</p>
      </div>

      {/* User Profile */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <User className="w-5 h-5" />
            <h2 className="text-xl font-semibold">{t('settings.userProfile')}</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">{t('settings.fullName')}</Label>
              <Input
                id="fullName"
                value={profile.fullName}
                onChange={(e) =>
                  setProfile({ ...profile, fullName: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="specialization">{t('settings.specialization')}</Label>
              <Input
                id="specialization"
                value={profile.specialization}
                onChange={(e) =>
                  setProfile({ ...profile, specialization: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license">{t('settings.medicalLicense')}</Label>
              <Input
                id="license"
                value={profile.license}
                onChange={(e) =>
                  setProfile({ ...profile, license: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profileEmail">{t('settings.email')}</Label>
              <Input
                id="profileEmail"
                type="email"
                value={profile.email}
                onChange={(e) =>
                  setProfile({ ...profile, email: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="profilePhone">{t('settings.phone')}</Label>
              <Input
                id="profilePhone"
                value={profile.phone}
                onChange={(e) =>
                  setProfile({ ...profile, phone: e.target.value })
                }
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveProfile}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('settings.saveProfile')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Clinic Information */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            <h2 className="text-xl font-semibold">{t('settings.clinicInfo')}</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clinicName">{t('settings.clinicName')}</Label>
            <Input
              id="clinicName"
              value={clinicInfo.name}
              onChange={(e) =>
                setClinicInfo({ ...clinicInfo, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">{t('settings.address')}</Label>
            <Textarea
              id="address"
              value={clinicInfo.address}
              onChange={(e) =>
                setClinicInfo({ ...clinicInfo, address: e.target.value })
              }
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="clinicPhone">{t('settings.phone')}</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="clinicPhone"
                  value={clinicInfo.phone}
                  onChange={(e) =>
                    setClinicInfo({ ...clinicInfo, phone: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="clinicEmail">{t('settings.email')}</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <Input
                  id="clinicEmail"
                  type="email"
                  value={clinicInfo.email}
                  onChange={(e) =>
                    setClinicInfo({ ...clinicInfo, email: e.target.value })
                  }
                  className="pl-10"
                />
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="website">{t('settings.website')}</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                id="website"
                value={clinicInfo.website}
                onChange={(e) =>
                  setClinicInfo({ ...clinicInfo, website: e.target.value })
                }
                className="pl-10"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleSaveClinic}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Save className="w-4 h-4 mr-2" />
              {t('settings.saveChanges')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Working Hours */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            <h2 className="text-xl font-semibold">{t('settings.workingHours')}</h2>
          </div>
        </div>
        <div className="p-6 space-y-3">
          {Object.entries(workingHours).map(([day, hours]) => (
            <div key={day} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
              <span className="font-medium text-slate-700 w-32">
                {t(`settings.days.${day}`)}
              </span>
              <Input
                value={hours}
                onChange={(e) =>
                  setWorkingHours({ ...workingHours, [day]: e.target.value })
                }
                className="max-w-xs"
              />
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Save className="w-4 h-4 mr-2" />
              {t('settings.saveHours')}
            </Button>
          </div>
        </div>
      </Card>

      {/* Notification Settings */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5" />
            <h2 className="text-xl font-semibold">{t('settings.notificationSettings')}</h2>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">{t('settings.emailNotifications')}</p>
              <p className="text-sm text-slate-600">
                {t('settings.emailNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={notifications.emailNotifications}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, emailNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">{t('settings.smsNotifications')}</p>
              <p className="text-sm text-slate-600">
                {t('settings.smsNotificationsDesc')}
              </p>
            </div>
            <Switch
              checked={notifications.smsNotifications}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, smsNotifications: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">{t('settings.appointmentReminders')}</p>
              <p className="text-sm text-slate-600">
                {t('settings.appointmentRemindersDesc')}
              </p>
            </div>
            <Switch
              checked={notifications.appointmentReminders}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, appointmentReminders: checked })
              }
            />
          </div>
          <div className="flex items-center justify-between py-3">
            <div>
              <p className="font-medium text-slate-800">{t('settings.paymentAlerts')}</p>
              <p className="text-sm text-slate-600">
                {t('settings.paymentAlertsDesc')}
              </p>
            </div>
            <Switch
              checked={notifications.paymentAlerts}
              onCheckedChange={(checked) =>
                setNotifications({ ...notifications, paymentAlerts: checked })
              }
            />
          </div>
        </div>
      </Card>

      {/* Data Backup */}
      <Card className="overflow-hidden">
        <div className="bg-blue-600 text-white px-6 py-4">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            <h2 className="text-xl font-semibold">{t('settings.dataBackup')}</h2>
          </div>
        </div>
        <div className="p-6">
          <p className="text-slate-600 mb-6">
            {t('settings.dataBackupDesc')}
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="p-5 border-2 border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-2">{t('settings.localBackup')}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {t('settings.localBackupDesc')}
              </p>
              <Button
                onClick={() => handleBackup('Local')}
                variant="outline"
                className="w-full"
              >
                <Database className="w-4 h-4 mr-2" />
                {t('settings.backupLocally')}
              </Button>
            </Card>
            <Card className="p-5 border-2 border-blue-200 bg-blue-50">
              <h3 className="font-semibold text-slate-800 mb-2">{t('settings.cloudBackup')}</h3>
              <p className="text-sm text-slate-600 mb-4">
                {t('settings.cloudBackupDesc')}
              </p>
              <Button
                onClick={() => handleBackup('Cloud')}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Database className="w-4 h-4 mr-2" />
                {t('settings.backupToCloud')}
              </Button>
            </Card>
          </div>
          <p className="text-sm text-slate-500 mt-4">
            {t('settings.lastBackup')}: March 31, 2026 at 11:30 PM
          </p>
        </div>
      </Card>
    </div>
  );
}
