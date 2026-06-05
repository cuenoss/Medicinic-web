import { Link } from 'react-router';
import { Plus, Search, FileText, Calendar, User } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';

export function ConsultationList() {
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();

  const consultations = [
    {
      id: 1,
      patientName: 'Sarah Johnson',
      date: 'April 3, 2026',
      time: '09:00 AM',
      complaint: 'Regular check-up',
      diagnosis: 'Healthy, blood sugar stable',
      status: 'completed',
    },
    {
      id: 2,
      patientName: 'Michael Chen',
      date: 'April 2, 2026',
      time: '10:30 AM',
      complaint: 'Follow-up consultation',
      diagnosis: 'Recovery progressing well',
      status: 'completed',
    },
    {
      id: 3,
      patientName: 'Emma Davis',
      date: 'April 1, 2026',
      time: '02:00 PM',
      complaint: 'Headache and nausea',
      diagnosis: 'Migraine, prescribed medication',
      status: 'completed',
    },
    {
      id: 4,
      patientName: 'James Wilson',
      date: 'March 31, 2026',
      time: '03:30 PM',
      complaint: 'Chest pain',
      diagnosis: 'Referred to cardiologist',
      status: 'follow-up',
    },
    {
      id: 5,
      patientName: 'Lisa Anderson',
      date: 'March 30, 2026',
      time: '11:00 AM',
      complaint: 'Skin rash',
      diagnosis: 'Allergic reaction, prescribed antihistamine',
      status: 'completed',
    },
  ];

  const filteredConsultations = consultations.filter((consultation) =>
    consultation.patientName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">{t('patients.tabs.consultations')}</h1>
          <p className="text-slate-600">{consultations.length} total consultations</p>
        </div>
        <Link to="/consultations/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            New Consultation
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder={t('patients.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Consultations List */}
      <div className="space-y-3">
        {filteredConsultations.map((consultation) => (
          <Card
            key={consultation.id}
            className="p-5 hover:shadow-lg transition-shadow cursor-pointer"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-4">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-800 mb-1">
                      {consultation.complaint}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <User className="w-4 h-4" />
                      <span>{consultation.patientName}</span>
                    </div>
                  </div>
                  <span
                    className={`text-xs px-3 py-1 rounded-full whitespace-nowrap ${
                      consultation.status === 'follow-up'
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {consultation.status}
                  </span>
                </div>
                <p className="text-sm text-slate-600 mb-3">
                  <strong>Diagnosis:</strong> {consultation.diagnosis}
                </p>
                <div className="flex items-center gap-4 text-sm text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    <span>{consultation.date}</span>
                  </div>
                  <span>•</span>
                  <span>{consultation.time}</span>
                </div>
              </div>
              <Link to={`/consultations/${consultation.id}`}>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </Link>
            </div>
          </Card>
        ))}
      </div>

      {filteredConsultations.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-600">{t('patients.consultations.noConsultations")}</p>
        </Card>
      )}
    </div>
  );
}
