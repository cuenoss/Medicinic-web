import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, Save, User, DollarSign, FileText, Calendar } from 'lucide-react';
import { Card } from '../ui/card';
import { useTranslation } from 'react-i18next';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

export function CreateInvoice() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    service: '',
    description: '',
    amount: '',
    date: new Date().toISOString().split('T')[0],
  });

  const handleSave = () => {
    console.log('Creating invoice:', formData);
    alert('Invoice created successfully!');
    navigate('/billing');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/billing">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Billing
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-semibold text-slate-800 mb-2">
          Create Invoice
        </h1>
        <p className="text-slate-600">Generate a new invoice for patient services</p>
      </div>

      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h2 className="text-xl font-semibold">Invoice Details</h2>
        </div>

        {/* Form */}
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Patient Name */}
            <div className="space-y-2">
              <Label htmlFor="patientName" className="flex items-center gap-2">
                <User className="w-4 h-4 text-blue-600" />
                Patient Name
              </Label>
              <Input
                id="patientName"
                placeholder="Select or enter patient name..."
                value={formData.patientName}
                onChange={(e) =>
                  setFormData({ ...formData, patientName: e.target.value })
                }
                required
              />
            </div>

            {/* Date */}
            <div className="space-y-2">
              <Label htmlFor="date" className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                Invoice Date
              </Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
          </div>

          {/* Service */}
          <div className="space-y-2">
            <Label htmlFor="service" className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Service Name
            </Label>
            <Input
              id="service"
              placeholder="e.g., Consultation, Lab Tests, Annual Physical..."
              value={formData.service}
              onChange={(e) =>
                setFormData({ ...formData, service: e.target.value })
              }
              required
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Service Description</Label>
            <Textarea
              id="description"
              placeholder="Additional details about the service provided..."
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={4}
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-600" />
              Amount (USD)
            </Label>
            <Input
              id="amount"
              type="number"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              required
              min="0"
              step="0.01"
            />
          </div>

          {/* Invoice Preview */}
          {formData.patientName && formData.service && formData.amount && (
            <Card className="p-6 bg-slate-50 border-slate-200">
              <h3 className="font-semibold text-slate-800 mb-4">Invoice Preview</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-slate-600">Patient:</span>
                  <span className="font-medium text-slate-800">
                    {formData.patientName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Service:</span>
                  <span className="font-medium text-slate-800">
                    {formData.service}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Date:</span>
                  <span className="font-medium text-slate-800">
                    {new Date(formData.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </span>
                </div>
                <div className="pt-3 border-t border-slate-300">
                  <div className="flex justify-between">
                    <span className="font-semibold text-slate-800">Total Amount:</span>
                    <span className="text-2xl font-bold text-blue-600">
                      ${parseFloat(formData.amount).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </Card>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <Link to="/billing">
            <Button variant="outline">Cancel</Button>
          </Link>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            Create Invoice
          </Button>
        </div>
      </Card>
    </div>
  );
}
