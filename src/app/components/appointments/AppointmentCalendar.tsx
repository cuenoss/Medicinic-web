import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ChevronLeft, ChevronRight, Plus, Clock, User, X, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { appointmentsService, Appointment } from '../../services/appointments';
import { patientsService } from '../../services/patients';
import { useTranslation } from 'react-i18next';

export function AppointmentCalendar() {
  const { t, i18n } = useTranslation();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showNewAppointmentModal, setShowNewAppointmentModal] = useState(false);
  const [showAppointmentsModal, setShowAppointmentsModal] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedDateAppointments, setSelectedDateAppointments] = useState<Appointment[]>([]);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [appointmentsLoading, setAppointmentsLoading] = useState(false);
  const [newAppointment, setNewAppointment] = useState({
    phoneNumber: '',
    day: '',
    time: '',
    date: '',
    patientId: null as number | null,
    patientName: ''
  });
  const [searchedPatient, setSearchedPatient] = useState<any>(null);
  const [searching, setSearching] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [reschedulingAppointment, setReschedulingAppointment] = useState<Appointment | null>(null);
  const [rescheduleData, setRescheduleData] = useState({
    date: '',
    time: ''
  });

  const monthNames = t('appointments.months', { returnObjects: true }) as string[];
  const dayNames = t('appointments.days', { returnObjects: true }) as string[];

  const fetchMonthAppointments = async () => {
    try {
      setLoading(true);
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      const allAppointments = await appointmentsService.getAppointments() as Appointment[];
      const startDateStr = `${startDate.getFullYear()}-${String(startDate.getMonth() + 1).padStart(2, '0')}-${String(startDate.getDate()).padStart(2, '0')}`;
      const endDateStr = `${endDate.getFullYear()}-${String(endDate.getMonth() + 1).padStart(2, '0')}-${String(endDate.getDate()).padStart(2, '0')}`;
      const appointmentsData = allAppointments.filter(apt =>
        apt.date >= startDateStr && apt.date <= endDateStr
      );
      setAppointments(appointmentsData || []);
    } catch (error) {
      console.error('Failed to fetch appointments:', error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMonthAppointments();
  }, [currentDate]);

  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();

  const getAppointmentsForDay = (day: number) => {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const calendarDateStr = `${year}-${month}-${dayStr}`;
    return appointments.filter(apt => apt.date === calendarDateStr);
  };

  const getAppointmentCountForDay = (day: number) => getAppointmentsForDay(day).length;

  const handleDayClick = async (day: number) => {
    setSelectedDay(day);
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const dateStr = `${year}-${month}-${dayStr}`;
    setSelectedDate(dateStr);
    try {
      setAppointmentsLoading(true);
      const appointmentsData = await appointmentsService.getAppointmentsByDate(dateStr) as Appointment[];
      setSelectedDateAppointments(appointmentsData || []);
      setShowAppointmentsModal(true);
    } catch (error) {
      console.error('Failed to fetch appointments for date:', error);
      setSelectedDateAppointments([]);
      setShowAppointmentsModal(true);
    } finally {
      setAppointmentsLoading(false);
    }
  };

  const searchPatientByPhone = async (phoneNumber: string) => {
    if (!phoneNumber || phoneNumber.length < 3) {
      setSearchedPatient(null);
      return;
    }
    try {
      setSearching(true);
      const patients = await patientsService.searchPatientsByPhone(phoneNumber);
      if (patients && patients.length > 0) {
        const patient = patients[0];
        setSearchedPatient(patient);
        setNewAppointment(prev => ({ ...prev, patientId: patient.id, patientName: patient.full_name }));
      } else {
        setSearchedPatient(null);
        setNewAppointment(prev => ({ ...prev, patientId: null, patientName: '' }));
      }
    } catch (error) {
      console.error('Error searching patient:', error);
      setSearchedPatient(null);
    } finally {
      setSearching(false);
    }
  };

  const handleRescheduleAppointment = (appointment: Appointment) => {
    setReschedulingAppointment(appointment);
    setRescheduleData({ date: appointment.date, time: appointment.time });
    setShowRescheduleModal(true);
  };

  const handleSaveReschedule = async () => {
    if (!reschedulingAppointment || !rescheduleData.date || !rescheduleData.time) return;
    try {
      await appointmentsService.updateAppointment(reschedulingAppointment.id, {
        date: rescheduleData.date,
        time: rescheduleData.time
      });
      await fetchMonthAppointments();
      setShowRescheduleModal(false);
      setReschedulingAppointment(null);
      setRescheduleData({ date: '', time: '' });
      alert(t('appointments.saveChanges') + '!');
    } catch (error) {
      console.error('Failed to reschedule appointment:', error);
      alert(t('common.error'));
    }
  };

  const handleAddToCalendar = async () => {
    if (newAppointment.patientId && newAppointment.day && newAppointment.time && newAppointment.date) {
      try {
        await appointmentsService.createAppointment({
          patient_name: newAppointment.patientName,
          phone_number: newAppointment.phoneNumber,
          date: newAppointment.date,
          time: newAppointment.time,
          type: 'Check-up',
          duration: 60,
          patient_id: newAppointment.patientId,
        });
        await fetchMonthAppointments();
        setShowNewAppointmentModal(false);
        setSelectedDay(null);
        setNewAppointment({ phoneNumber: '', day: '', time: '', date: '', patientId: null, patientName: '' });
        setSearchedPatient(null);
      } catch (error) {
        console.error('Failed to create appointment:', error);
        alert(`${t('common.error')}: ${(error as Error).message}`);
      }
    }
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const formatSelectedDate = (dateStr: string) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-DZ' : 'en-US';
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">
            {t('appointments.title')}
          </h1>
          <p className="text-slate-600">{t('appointments.manageSchedule')}</p>
        </div>
        <div className="flex gap-3">
          <Link to="/appointments/schedule">
            <Button variant="outline">
              <Clock className="w-5 h-5 mr-2" />
              {t('appointments.dailySchedule')}
            </Button>
          </Link>
          <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowNewAppointmentModal(true)}>
            <Plus className="w-5 h-5 mr-2" />
            {t('appointments.newAppointment')}
          </Button>
        </div>
      </div>

      {/* Calendar Card */}
      <Card className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-800">
            {Array.isArray(monthNames) ? monthNames[currentDate.getMonth()] : ''} {currentDate.getFullYear()}
          </h2>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={previousMonth}>
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={nextMonth}>
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {/* Day Headers */}
          {(Array.isArray(dayNames) ? dayNames : ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']).map((day) => (
            <div key={day} className="text-center text-sm font-medium text-slate-600 py-2">
              {day}
            </div>
          ))}

          {/* Empty cells */}
          {Array.from({ length: firstDayOfMonth }).map((_, index) => (
            <div key={`empty-${index}`} className="aspect-square" />
          ))}

          {/* Calendar Days */}
          {Array.from({ length: daysInMonth }).map((_, index) => {
            const day = index + 1;
            const dayAppointments = getAppointmentsForDay(day);
            const appointmentCount = getAppointmentCountForDay(day);
            const isToday = new Date().getDate() === day &&
                           new Date().getMonth() === currentDate.getMonth() &&
                           new Date().getFullYear() === currentDate.getFullYear();
            const isPastDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), day) < new Date() && !isToday;
            const hasAppointments = dayAppointments.length > 0;

            return (
              <div
                key={day}
                className={`aspect-square p-2 rounded-lg border transition-all cursor-pointer ${
                  isToday
                    ? 'bg-blue-600 text-white border-blue-600'
                    : hasAppointments && !isPastDay
                    ? 'bg-yellow-300 border-yellow-500 hover:bg-yellow-400 text-yellow-900 font-bold shadow-lg'
                    : hasAppointments && isPastDay
                    ? 'bg-gray-50 border-gray-200 hover:bg-gray-100 text-gray-600'
                    : selectedDay === day
                    ? 'bg-blue-100 border-blue-300 hover:bg-blue-200'
                    : isPastDay
                    ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
                onClick={() => !isPastDay && handleDayClick(day)}
              >
                <div className="text-sm font-medium mb-1">{day}</div>
                {hasAppointments && (
                  <div className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                    isToday ? 'bg-white/20 text-white' : isPastDay ? 'bg-gray-200 text-gray-600' : 'bg-yellow-500 text-yellow-900'
                  }`}>
                    {appointmentCount} {appointmentCount === 1 ? t('appointments.apt') : t('appointments.apts')}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Legend */}
        <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-600 rounded"></div>
            <span className="text-sm text-slate-600">{t('appointments.legendToday')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-300 border border-yellow-500 rounded"></div>
            <span className="text-sm text-slate-600">{t('appointments.legendFuture')}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-50 border border-gray-200 rounded"></div>
            <span className="text-sm text-slate-600">{t('appointments.legendPast')}</span>
          </div>
        </div>
      </Card>

      {/* New Appointment Modal */}
      {showNewAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                {selectedDay
                  ? `${t('appointments.newAppointment')} — ${Array.isArray(monthNames) ? monthNames[currentDate.getMonth()] : ''} ${selectedDay}`
                  : t('appointments.newAppointment')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowNewAppointmentModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              {selectedDay && (
                <div className="bg-green-50 p-3 rounded-lg mb-4">
                  <p className="text-sm font-medium text-green-800">
                    {t('appointments.selectedDate')}: {Array.isArray(monthNames) ? monthNames[currentDate.getMonth()] : ''} {selectedDay}, {currentDate.getFullYear()}
                  </p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.phoneNumber')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('appointments.phoneNumber')}
                    value={newAppointment.phoneNumber}
                    onChange={(e) => {
                      setNewAppointment({ ...newAppointment, phoneNumber: e.target.value });
                      searchPatientByPhone(e.target.value);
                    }}
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400"
                  />
                  {searching && (
                    <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  )}
                </div>
                {searchedPatient && (
                  <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-sm font-medium text-green-800">
                      {t('appointments.foundPatient')}: {searchedPatient.full_name}
                    </p>
                    <p className="text-xs text-green-600">
                      ID: {searchedPatient.id} | {t('appointments.phoneNumber')}: {searchedPatient.phone}
                    </p>
                  </div>
                )}
                {newAppointment.phoneNumber && !searchedPatient && !searching && (
                  <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{t('appointments.phoneNotFound')}</p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.appointmentTime')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={newAppointment.time}
                    onChange={(e) => setNewAppointment({ ...newAppointment, time: e.target.value })}
                    className="flex-1 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowNewAppointmentModal(false)} className="flex-1">
                  {t('appointments.cancel')}
                </Button>
                <Button
                  onClick={handleAddToCalendar}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newAppointment.patientId || !newAppointment.day || !newAppointment.time || !newAppointment.date}
                >
                  {t('appointments.addToCalendar')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Appointments for Selected Date Modal */}
      {showAppointmentsModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('appointments.appointmentsFor')} {formatSelectedDate(selectedDate)}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAppointmentsModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            {appointmentsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="text-slate-600">{t('appointments.loadingAppointments')}</div>
              </div>
            ) : selectedDateAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600 mb-4">{t('appointments.noAppointmentsDay')}</p>
                <Button
                  className="bg-blue-600 hover:bg-blue-700"
                  onClick={() => {
                    setShowAppointmentsModal(false);
                    setShowNewAppointmentModal(true);
                    setNewAppointment({ phoneNumber: '', day: selectedDay?.toString() || '', time: '', date: selectedDate, patientId: null, patientName: '' });
                    setSearchedPatient(null);
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {t('appointments.addAppointment')}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm text-slate-600">
                    {selectedDateAppointments.length} {selectedDateAppointments.length !== 1 ? t('appointments.apts') : t('appointments.apt')}
                  </p>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700"
                    onClick={() => {
                      setShowAppointmentsModal(false);
                      setShowNewAppointmentModal(true);
                      setNewAppointment({ phoneNumber: '', day: selectedDay?.toString() || '', time: '', date: selectedDate, patientId: null, patientName: '' });
                      setSearchedPatient(null);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t('appointments.addAppointment')}
                  </Button>
                </div>

                {selectedDateAppointments.map((appointment) => (
                  <div
                    key={appointment.id}
                    className="flex flex-col md:flex-row gap-4 p-4 rounded-lg border-2 bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3 md:w-32 flex-shrink-0">
                      <Clock className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-semibold text-slate-800">{appointment.time}</p>
                        <p className="text-xs text-slate-500">{t('appointments.appointmentLabel')}</p>
                      </div>
                    </div>
                    <div className="hidden md:block w-px bg-slate-200"></div>
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <User className="w-4 h-4 text-slate-400" />
                            <h4 className="font-semibold text-slate-800">{appointment.phone_number}</h4>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-slate-600">
                            <span>{appointment.patient_name}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="px-3 py-1 bg-blue-50 text-blue-700 text-sm rounded-full">
                            {appointment.type}
                          </div>
                          {appointment.payment_amount && appointment.payment_amount > 0 && (
                            <div className="px-3 py-1 bg-green-50 text-green-700 text-sm rounded-full">
                              {appointment.payment_amount} DA
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" onClick={() => handleRescheduleAppointment(appointment)}>
                            {t('appointments.reschedule')}
                          </Button>
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                            {t('appointments.startConsultation')}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && reschedulingAppointment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('appointments.rescheduleAppointment')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowRescheduleModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-lg mb-4">
                <p className="text-sm font-medium text-slate-800 mb-1">
                  {t('appointments.patientName')}: {reschedulingAppointment.patient_name}
                </p>
                <p className="text-sm text-slate-600 mb-1">
                  {t('appointments.phoneNumber')}: {reschedulingAppointment.phone_number}
                </p>
                <p className="text-sm text-slate-600">
                  {t('appointments.current')}: {reschedulingAppointment.date} — {reschedulingAppointment.time}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.newDate')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <Calendar className="w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={rescheduleData.date}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, date: e.target.value })}
                    className="flex-1 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.newTime')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <input
                    type="time"
                    value={rescheduleData.time}
                    onChange={(e) => setRescheduleData({ ...rescheduleData, time: e.target.value })}
                    className="flex-1 outline-none text-slate-800"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowRescheduleModal(false)} className="flex-1">
                  {t('appointments.cancel')}
                </Button>
                <Button
                  onClick={handleSaveReschedule}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!rescheduleData.date || !rescheduleData.time}
                >
                  {t('appointments.saveChanges')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
