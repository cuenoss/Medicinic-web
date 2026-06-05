import { Link } from 'react-router';
import { Plus, Search, Download, Eye, DollarSign, CheckCircle, Clock } from 'lucide-react';
import { Card } from '../ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { useState } from 'react';

export function BillingList() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');

  const invoices = [
    {
      id: 'INV-001',
      patient: 'Sarah Johnson',
      date: 'April 3, 2026',
      service: 'Consultation',
      amount: 150,
      status: 'paid',
    },
    {
      id: 'INV-002',
      patient: 'Michael Chen',
      date: 'April 2, 2026',
      service: 'Follow-up + Lab Tests',
      amount: 280,
      status: 'pending',
    },
    {
      id: 'INV-003',
      patient: 'Emma Davis',
      date: 'April 1, 2026',
      service: 'Consultation + Prescription',
      amount: 180,
      status: 'paid',
    },
    {
      id: 'INV-004',
      patient: 'James Wilson',
      date: 'March 31, 2026',
      service: 'Emergency Consultation',
      amount: 350,
      status: 'pending',
    },
    {
      id: 'INV-005',
      patient: 'Lisa Anderson',
      date: 'March 30, 2026',
      service: 'Annual Physical',
      amount: 200,
      status: 'paid',
    },
    {
      id: 'INV-006',
      patient: 'Robert Brown',
      date: 'March 29, 2026',
      service: 'Consultation',
      amount: 150,
      status: 'overdue',
    },
  ];

  const filteredInvoices = invoices.filter((invoice) =>
    invoice.patient.toLowerCase().includes(searchQuery.toLowerCase()) ||
    invoice.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalPaid = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.amount, 0);
  const totalPending = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.amount, 0);
  const totalOverdue = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.amount, 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'pending':
        return 'bg-yellow-100 text-yellow-700';
      case 'overdue':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-semibold text-slate-800 mb-2">
            Billing & Payments
          </h1>
          <p className="text-slate-600">{invoices.length} total invoices</p>
        </div>
        <Link to="/billing/new">
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Paid</p>
              <p className="text-2xl font-semibold text-slate-800">
                ${totalPaid.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Pending</p>
              <p className="text-2xl font-semibold text-slate-800">
                ${totalPending.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-slate-600">Overdue</p>
              <p className="text-2xl font-semibold text-slate-800">
                ${totalOverdue.toLocaleString()}
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <Input
            placeholder="Search by invoice ID or patient name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Invoices List */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Invoice ID
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Patient
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Service
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Date
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Amount
                </th>
                <th className="text-left py-3 px-4 text-sm font-medium text-slate-600">
                  Status
                </th>
                <th className="text-right py-3 px-4 text-sm font-medium text-slate-600">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredInvoices.map((invoice) => (
                <tr
                  key={invoice.id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-4">
                    <span className="font-medium text-slate-800">
                      {invoice.id}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-700">{invoice.patient}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-600">{invoice.service}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="text-slate-600">{invoice.date}</span>
                  </td>
                  <td className="py-4 px-4">
                    <span className="font-semibold text-slate-800">
                      ${invoice.amount}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                        invoice.status
                      )}`}
                    >
                      {invoice.status}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {filteredInvoices.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-slate-600">No invoices found</p>
        </Card>
      )}
    </div>
  );
}
