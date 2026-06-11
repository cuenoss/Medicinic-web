import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Shield, Users, Mail, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { api } from '../../services/api';

interface AdminDoctor {
  id: number;
  fullName: string;
  email: string;
  is_admin: boolean;
  created_at: string | null;
  patient_count: number;
}

export function AdminPanel() {
  const { t } = useTranslation();
  const [doctors, setDoctors] = useState<AdminDoctor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDoctors = async () => {
      try {
        setLoading(true);
        const data = (await api.getAdminDoctors()) as AdminDoctor[];
        setDoctors(data || []);
      } catch (error) {
        console.error('Failed to fetch accounts:', error);
        setDoctors([]);
      } finally {
        setLoading(false);
      }
    };
    fetchDoctors();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold text-slate-800">{t('admin.title')}</h1>
          <p className="text-slate-600">{t('admin.subtitle')}</p>
        </div>
      </div>

      {/* Count */}
      {!loading && (
        <p className="text-sm text-slate-600">
          {doctors.length} {t('admin.totalAccounts')}
        </p>
      )}

      {loading ? (
        <Card className="p-12 text-center text-slate-500">{t('admin.loading')}</Card>
      ) : doctors.length === 0 ? (
        <Card className="p-12 text-center text-slate-500">{t('admin.noAccounts')}</Card>
      ) : (
        <Card className="overflow-hidden">
          {/* Table header (desktop) */}
          <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-3 bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-600">
            <div className="col-span-4">{t('admin.name')}</div>
            <div className="col-span-4">{t('admin.email')}</div>
            <div className="col-span-2">{t('admin.role')}</div>
            <div className="col-span-1 text-center">{t('admin.patients')}</div>
            <div className="col-span-1">{t('admin.joined')}</div>
          </div>

          <div className="divide-y divide-slate-100">
            {doctors.map((doc) => (
              <div
                key={doc.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-2 md:gap-4 px-6 py-4 items-center hover:bg-slate-50 transition-colors"
              >
                <div className="md:col-span-4 font-medium text-slate-800">{doc.fullName}</div>
                <div className="md:col-span-4 flex items-center gap-2 text-sm text-slate-600">
                  <Mail className="w-4 h-4 md:hidden" />
                  <span className="truncate">{doc.email}</span>
                </div>
                <div className="md:col-span-2">
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full ${
                      doc.is_admin
                        ? 'bg-blue-100 text-blue-700'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {doc.is_admin ? t('admin.roleAdmin') : t('admin.roleDoctor')}
                  </span>
                </div>
                <div className="md:col-span-1 flex items-center gap-1 md:justify-center text-sm text-slate-700">
                  <Users className="w-4 h-4 text-slate-400 md:hidden" />
                  {doc.patient_count}
                </div>
                <div className="md:col-span-1 flex items-center gap-1 text-xs text-slate-500">
                  <Calendar className="w-4 h-4 md:hidden" />
                  {doc.created_at ? new Date(doc.created_at).toLocaleDateString() : '—'}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
