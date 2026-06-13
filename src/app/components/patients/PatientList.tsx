import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router';
import { Search, UserPlus, Filter, Phone, Mail, X, ChevronDown } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Avatar } from '../ui/avatar';
import { api } from '../../services/api';
import { useTranslation } from 'react-i18next';

export function PatientList() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  const [filters, setFilters] = useState({
    gender: '',
    age_min: '',
    age_max: '',
    allergies: '',
    chronic_conditions: '',
  });
  const [activeFilters, setActiveFilters] = useState(filters);

  const fetchPatients = async (page = 1, name = searchQuery, applied = activeFilters) => {
    try {
      setLoading(true);
      const params: any = { name };
      if (applied.gender) params.gender = applied.gender;
      if (applied.age_min) params.age_min = applied.age_min;
      if (applied.age_max) params.age_max = applied.age_max;
      if (applied.allergies) params.allergies = applied.allergies;
      if (applied.chronic_conditions) params.chronic_conditions = applied.chronic_conditions;

      const response = await api.getPatients(page, 50, params) as any;
      const list = response.data || response || [];
      setPatients(list);
      setTotalPages(Math.ceil((response.total || list.length || 0) / 50));
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients(currentPage);
  }, [currentPage, searchQuery, activeFilters]);

  const handleApplyFilters = () => {
    setActiveFilters(filters);
    setCurrentPage(1);
    setShowFilters(false);
  };

  const handleClearFilters = () => {
    const empty = { gender: '', age_min: '', age_max: '', allergies: '', chronic_conditions: '' };
    setFilters(empty);
    setActiveFilters(empty);
    setCurrentPage(1);
  };

  const hasActiveFilters = Object.values(activeFilters).some(v => v !== '');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">{t('patients.title')}</h1>
          <p className="text-slate-600">{patients.length} {t('patients.totalPatients')}</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => navigate('/patients/new')}>
          <UserPlus className="w-5 h-5 mr-2" />
          {t('patients.addPatient')}
        </Button>
      </div>

      {/* Search and Filter */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder={t('patients.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={hasActiveFilters ? 'border-blue-500 text-blue-600' : ''}
          >
            <Filter className="w-5 h-5 mr-2" />
            {t('patients.filter')}
            {hasActiveFilters && <span className="ml-2 bg-blue-600 text-white text-xs rounded-full px-1.5">●</span>}
            <ChevronDown className={`w-4 h-4 ml-1 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 pt-4 border-t border-slate-200">
            <h4 className="text-sm font-semibold text-slate-700 mb-3">{t('patients.filters')}</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Gender */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('patients.gender')}</label>
                <select
                  value={filters.gender}
                  onChange={(e) => setFilters(f => ({ ...f, gender: e.target.value }))}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="">— {t('common.filter')} —</option>
                  <option value="Male">{t('patients.male')}</option>
                  <option value="Female">{t('patients.female')}</option>
                </select>
              </div>

              {/* Age min */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('patients.minAge')}</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="0"
                  value={filters.age_min}
                  onChange={(e) => setFilters(f => ({ ...f, age_min: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Age max */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('patients.maxAge')}</label>
                <Input
                  type="number"
                  min={0}
                  placeholder="120"
                  value={filters.age_max}
                  onChange={(e) => setFilters(f => ({ ...f, age_max: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Allergies */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('patients.filterAllergies')}</label>
                <Input
                  placeholder={t('patients.allergies')}
                  value={filters.allergies}
                  onChange={(e) => setFilters(f => ({ ...f, allergies: e.target.value }))}
                  className="text-sm"
                />
              </div>

              {/* Chronic conditions */}
              <div>
                <label className="block text-xs font-medium text-slate-600 mb-1">{t('patients.filterChronic')}</label>
                <Input
                  placeholder={t('patients.chronicConditions')}
                  value={filters.chronic_conditions}
                  onChange={(e) => setFilters(f => ({ ...f, chronic_conditions: e.target.value }))}
                  className="text-sm"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={handleApplyFilters}>
                {t('patients.applyFilters')}
              </Button>
              <Button size="sm" variant="outline" onClick={handleClearFilters}>
                <X className="w-4 h-4 mr-1" />
                {t('patients.clearFilters')}
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Patient Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {loading ? (
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
          patients.map((patient: any) => (
            <Link key={patient.id} to={`/patients/${patient.id}`}>
              <Card className="p-5 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 flex-shrink-0">
                    <div className="w-full h-full bg-blue-100 text-blue-700 flex items-center justify-center text-lg font-semibold">
                      {(patient.name || patient.full_name || 'P').split(' ').map((n: string) => n[0]).join('')}
                    </div>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h3 className="font-semibold text-slate-800 mb-1">
                          {patient.name || patient.full_name || 'Unknown Patient'}
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
                    {patient.allergies && (
                      <p className="text-xs text-orange-600 truncate">⚠ {patient.allergies}</p>
                    )}
                    <div className="text-xs text-slate-500 mt-1">
                      {t('patients.lastVisit')}: {patient.last_visit || new Date(patient.created_at || Date.now()).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>

      {!loading && patients.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-600">{t('patients.noPatients')}</p>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1}>
              {t('common.previous')}
            </Button>
            <span className="px-4 py-2 text-sm text-slate-600">
              {t('common.page')} {currentPage} {t('common.of')} {totalPages}
            </span>
            <Button variant="outline" onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages}>
              {t('common.next')}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
