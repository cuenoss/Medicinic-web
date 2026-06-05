import { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { ArrowLeft, Clock, User, Phone, Calendar, Plus, X } from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { appointmentsService, Appointment } from '../../services/appointments';
import { useTranslation } from 'react-i18next';

export function AppointmentSchedule() {
  const { t, i18n } = useTranslation();
  const [showAddAppointmentModal, setShowAddAppointmentModal] = useState(false);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newAppointment, setNewAppointment] = useState({
    patientName: '',
    phone_number: '',
    date: new Date().toLocaleDateString('en-CA'),
    time: '',
    type: 'Check-up',
    duration: 30,
    payment_amount: 0
  });

  const todayFormatted = (() => {
    const now = new Date();
    const locale = i18n.language === 'fr' ? 'fr-FR' : i18n.language === 'ar' ? 'ar-DZ' : 'en-US';
    return now.toLocaleDateString(locale, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  })();

  useEffect(() => {
    const fetchTodayAppointments = async () => {
      try {
        setLoading(true);
        const today = new Date().toLocaleDateString('en-CA');
        const appointmentsData = await appointmentsService.getAppointmentsByDate(today) as Appointment[];
        setTodayAppointments(appointmentsData || []);
      } catch (error) {
        console.error('Failed to fetch today\'s appointments:', error);
        setTodayAppointments([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayAppointments();
    const interval = setInterval(fetchTodayAppointments, 60000);
    return () => clearInterval(interval);
  }, []);

  const handleAddAppointment = async () => {
    if (newAppointment.patientName && newAppointment.phone_number && newAppointment.time) {
      try {
        await appointmentsService.createAppointment({
          patient_name: newAppointment.patientName,
          phone_number: newAppointment.phone_number,
          date: newAppointment.date,
          time: newAppointment.time,
          type: newAppointment.type,
          duration: newAppointment.duration,
          payment_amount: newAppointment.payment_amount,
        });

        const today = new Date().toLocaleDateString('en-CA');
        const appointmentsData = await appointmentsService.getAppointmentsByDate(today) as Appointment[];
        setTodayAppointments(appointmentsData || []);

        setShowAddAppointmentModal(false);
        setNewAppointment({
          patientName: '',
          phone_number: '',
          date: new Date().toLocaleDateString('en-CA'),
          time: '',
          type: 'Check-up',
          duration: 30,
          payment_amount: 0
        });
      } catch (error) {
        console.error('Failed to create appointment:', error);
        alert(t('common.error'));
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/appointments">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('appointments.backToCalendar')}
        </Button>
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">
            {t('appointments.dailySchedule')}
          </h1>
          <div className="flex items-center gap-2 text-slate-600">
            <Calendar className="w-5 h-5" />
            <span>{todayFormatted}</span>
          </div>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowAddAppointmentModal(true)}>
          <Plus className="w-5 h-5 mr-2" />
          {t('appointments.addAppointment')}
        </Button>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 gap-4">
        <Card className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600 mb-1">{t('appointments.todayTotal')}</p>
              <p className="text-3xl font-semibold text-slate-800">{todayAppointments.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-6">
          {t('appointments.todayTimeline')}
        </h3>

        {loading ? (
          <div className="text-center py-8 text-slate-600">{t('common.loading')}</div>
        ) : todayAppointments.length === 0 ? (
          <div className="text-center py-8 text-slate-600">{t('appointments.noAppointmentsDay')}</div>
        ) : (
          <div className="space-y-4">
            {todayAppointments.map((appointment) => (
              <div
                key={appointment.id}
                className="flex flex-col md:flex-row gap-4 p-5 rounded-lg border-2 bg-white border-slate-200 hover:border-blue-300 hover:shadow-md transition-all"
              >
                {/* Time */}
                <div className="flex items-center gap-3 md:w-32 flex-shrink-0">
                  <Clock className="w-5 h-5 text-slate-400" />
                  <div>
                    <p className="font-semibold text-slate-800">{appointment.time}</p>
                    <p className="text-xs text-slate-500">{t('appointments.appointmentLabel')}</p>
                  </div>
                </div>

                <div className="hidden md:block w-px bg-slate-200"></div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <User className="w-4 h-4 text-slate-400" />
                        <h4 className="font-semibold text-slate-800">{appointment.patient_name}</h4>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Phone className="w-4 h-4" />
                        <span>{appointment.phone_number}</span>
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
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.location.href = `/patients/${appointment.patient_id}`}
                    >
                      {t('appointments.viewDetails')}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Add Appointment Modal */}
      {showAddAppointmentModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('appointments.addDailyAppointment')}
              </h3>
              <Button variant="ghost" size="sm" onClick={() => setShowAddAppointmentModal(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.patientName')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <User className="w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder={t('appointments.patientName')}
                    value={newAppointment.patientName}
                    onChange={(e) => setNewAppointment({ ...newAppointment, patientName: e.target.value })}
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.phoneNumber')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <Phone className="w-4 h-4 text-slate-400" />
                  <input
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={newAppointment.phone_number}
                    onChange={(e) => setNewAppointment({ ...newAppointment, phone_number: e.target.value })}
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">
                    {t('appointments.type')}
                  </label>
                  <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                    <select
                      value={newAppointment.type}
                      onChange={(e) => setNewAppointment({ ...newAppointment, type: e.target.value })}
                      className="flex-1 outline-none text-slate-800 bg-transparent"
                    >
                      <option value="Check-up">{t('appointments.checkUp')}</option>
                      <option value="Follow-up">{t('appointments.followUp')}</option>
                      <option value="Consultation">{t('appointments.consultation')}</option>
                      <option value="Emergency">{t('appointments.emergency')}</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.duration')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4 text-slate-400" />
                  <select
                    value={newAppointment.duration}
                    onChange={(e) => setNewAppointment({ ...newAppointment, duration: parseInt(e.target.value) })}
                    className="flex-1 outline-none text-slate-800 bg-transparent"
                  >
                    <option value={15}>15 {t('appointments.minutes')}</option>
                    <option value={20}>20 {t('appointments.minutes')}</option>
                    <option value={30}>30 {t('appointments.minutes')}</option>
                    <option value={45}>45 {t('appointments.minutes')}</option>
                    <option value={60}>{t('appointments.oneHour')}</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('appointments.paymentAmount')}
                </label>
                <div className="flex items-center gap-2 border border-slate-300 rounded-lg px-3 py-2">
                  <span className="text-slate-400">DA</span>
                  <input
                    type="number"
                    placeholder="0.00"
                    value={newAppointment.payment_amount || ''}
                    onChange={(e) => setNewAppointment({ ...newAppointment, payment_amount: parseFloat(e.target.value) || 0 })}
                    className="flex-1 outline-none text-slate-800 placeholder-slate-400"
                    step="0.01"
                    min="0"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setShowAddAppointmentModal(false)} className="flex-1">
                  {t('appointments.cancel')}
                </Button>
                <Button
                  onClick={handleAddAppointment}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!newAppointment.patientName || !newAppointment.phone_number || !newAppointment.time}
                >
                  {t('appointments.addAppointment')}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
