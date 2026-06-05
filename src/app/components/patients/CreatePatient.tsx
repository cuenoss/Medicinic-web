import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { ArrowLeft, User, Mail, Phone, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { patientsService } from '../../services/patients';
import { useTranslation } from 'react-i18next';

export function CreatePatient() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    address: '',
    date_of_birth: '',
    blood_type: '',
    allergies: '',
    chronic_conditions: '',
    relationship_status: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    gender: '',
    age: ''
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name || !formData.email || !formData.phone) {
      alert('Please fill in all required fields (Name, Email, Phone)');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/patients">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('patients.backToPatients')}
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-semibold text-slate-800">{t('patients.addNewPatient')}</h1>
          <p className="text-slate-600">{t('patients.fillInfo')}</p>
        </div>
      </div>

      {/* Form */}
      <Card className="max-w-2xl mx-auto p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  {t('patients.personalInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.fullName')} *</label>
                    <Input value={formData.full_name} onChange={(e) => handleInputChange('full_name', e.target.value)} placeholder={t('patients.enterFullName')} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.gender')}</label>
                    <select value={formData.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                      <option value="">{t('patients.selectGender')}</option>
                      <option value="Male">{t('patients.male')}</option>
                      <option value="Female">{t('patients.female')}</option>
                      <option value="Other">{t('patients.other')}</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.age')}</label>
                    <Input type="number" value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} placeholder={t('patients.enterAge')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.dateOfBirth')}</label>
                    <Input type="date" value={formData.date_of_birth} onChange={(e) => handleInputChange('date_of_birth', e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  {t('patients.contactInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.email')} *</label>
                    <Input type="email" value={formData.email} onChange={(e) => handleInputChange('email', e.target.value)} placeholder={t('patients.enterEmail')} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.phone')} *</label>
                    <Input type="tel" value={formData.phone} onChange={(e) => handleInputChange('phone', e.target.value)} placeholder={t('patients.enterPhone')} required />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.address')}</label>
                    <textarea value={formData.address} onChange={(e) => handleInputChange('address', e.target.value)} placeholder={t('patients.enterAddress')} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none" />
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('patients.medicalInfo')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.bloodType')}</label>
                    <select value={formData.blood_type} onChange={(e) => handleInputChange('blood_type', e.target.value)} className="w-full border border-slate-300 rounded-lg px-3 py-2">
                      <option value="">{t('patients.selectBloodType')}</option>
                      {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(bt => (
                        <option key={bt} value={bt}>{bt}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.allergies')}</label>
                    <textarea value={formData.allergies} onChange={(e) => handleInputChange('allergies', e.target.value)} placeholder={t('patients.enterAllergies')} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.chronicConditions')}</label>
                    <textarea value={formData.chronic_conditions} onChange={(e) => handleInputChange('chronic_conditions', e.target.value)} placeholder={t('patients.enterChronicConditions')} className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20 resize-none" />
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                  <Phone className="w-5 h-5" />
                  {t('patients.emergencyContact')}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.emergencyContactName')}</label>
                    <Input value={formData.emergency_contact_name} onChange={(e) => handleInputChange('emergency_contact_name', e.target.value)} placeholder={t('patients.enterEmergencyName')} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('patients.emergencyContactPhone')}</label>
                    <Input type="tel" value={formData.emergency_contact_phone} onChange={(e) => handleInputChange('emergency_contact_phone', e.target.value)} placeholder={t('patients.enterEmergencyPhone')} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-6 border-t">
            <Button type="button" variant="outline" onClick={() => navigate('/patients')} className="flex-1">
              {t('common.cancel')}
            </Button>
            <Button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-700" disabled={loading}>
              {loading ? t('patients.creating') : t('patients.createPatient')}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
