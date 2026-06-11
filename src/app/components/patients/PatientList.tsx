import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router';
import { Search, UserPlus, Filter, Phone, Mail, Trash2, Edit } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { api } from '../../services/api';

export function PatientList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);

  const handleAddPatient = () => {
    navigate('/patients/new');
  };

  // Fetch patients from API
  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const response = await api.getPatients(currentPage, 50, { name: searchQuery }) as any;
        console.log('Search results for:', searchQuery, 'found:', response.data?.length || response?.length || 0, 'patients');
        setPatients(response.data || response || []);
        // Calculate total pages (mock - should come from API response)
        setTotalPages(Math.ceil((response.total || response.length || 0) / 50));
      } catch (error) {
        console.error('Failed to fetch patients:', error);
        setPatients([]);
      } finally {
        setLoading(false);
      }
    };

    fetchPatients();
  }, [currentPage, searchQuery]);

  // Use API search results directly - no frontend filtering needed
  const displayPatients = patients;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">{t('patients.title')}</h1>
          <p className="text-slate-600">{totalPatients} {t('patients.totalPatients')}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleAddPatient}>
          <UserPlus className="w-5 h-5 mr-2" />
          {t('patients.addNewPatient')}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder={t('patients.searchByName')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button variant="outline">
            <Filter className="w-5 h-5 mr-2" />
            {t('common.filter')}
          </Button>
        </div>
      </Card>

      {/* Patient Cards - Mobile Optimized */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
          // Loading skeleton
          [1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="p-5">
              <div className="animate-pulse">
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-slate-200 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-6 bg-slate-200 rounded mb-2 w-3/4"></div>
                    <div className="h-4 bg-slate-200 rounded mb-1 w-1/2"></div>
                    <div className="h-4 bg-slate-200 rounded w-1/3"></div>
                  </div>
                </div>
              </div>
            </Card>
          ))
        ) : (
          displayPatients.map((patient: any) => (
          <Link key={patient.id} to={`/patients/${patient.id}`}>
            <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <Avatar className="w-14 h-14 flex-shrink-0">
                  <div className="w-full h-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-semibold">
                    {(patient.name || patient.fullName || 'P').split(' ').map((n: string) => n[0]).join('')}
                  </div>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <h3 className="font-semibold text-slate-800 mb-1">
                        {patient.name || patient.fullName || 'Unknown Patient'}
                      </h3>
                      <p className="text-sm text-slate-600">
                        {patient.age || 'N/A'} {t('patients.years')} • {patient.gender || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-1 mb-3">
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Phone className="w-4 h-4" />
                      <span>{patient.phone || 'N/A'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Mail className="w-4 h-4" />
                      <span className="truncate">{patient.email || 'N/A'}</span>
                    </div>
                  </div>
                  <div className="text-xs text-slate-500">
                    {t('patients.lastVisit')}: {patient.lastVisit || new Date(patient.created_at || Date.now()).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        ))
        )}
      </div>

      {!loading && displayPatients.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-600">{t('patients.noPatients')}</p>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              {t('common.previous')}
            </Button>
            <span className="px-4 py-2 text-sm text-slate-600">
              {t('patients.page')} {currentPage} {t('patients.of')} {totalPages}
            </span>
            <Button
              variant="outline"
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              {t('common.next')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
