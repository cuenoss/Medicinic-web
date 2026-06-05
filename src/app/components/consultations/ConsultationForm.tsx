import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import {
  FileText,
  Stethoscope,
  ClipboardList,
  Pill,
  FileCheck,
  Upload,
  Calendar,
  Save,
  X,
  ArrowLeft,
  User,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { useTranslation } from 'react-i18next';

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
}

export function ConsultationForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    patientName: '',
    chiefComplaint: '',
    clinicalExamination: '',
    diagnosis: '',
    treatment: '',
    notes: '',
  });

  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const currentDate = new Date().toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const handleInputChange = (
    field: keyof typeof formData,
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: AttachedFile[] = Array.from(files).map((file) => ({
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: file.type,
      }));
      setAttachedFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (id: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== id));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSave = () => {
    console.log('Saving consultation:', { ...formData, attachedFiles });
    alert(t('consultations.savedSuccess'));
    navigate('/consultations');
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/consultations">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('consultations.backToConsultations')}
        </Button>
      </Link>

      <Card className="overflow-hidden">
        {/* Header */}
        <div className="bg-blue-600 text-white px-6 py-4">
          <h1 className="text-2xl font-semibold">{t('consultations.newConsultation')}</h1>
          <p className="text-blue-100 text-sm mt-1">
            {t('consultations.chiefComplaintPlaceholder')}
          </p>
        </div>

        {/* Date Badge */}
        <div className="px-6 py-4 bg-blue-50 border-b border-blue-100">
          <div className="flex items-center gap-2 text-blue-900">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{currentDate}</span>
          </div>
        </div>

        {/* Form Content */}
        <div className="px-6 py-6 space-y-6">
          {/* {t('consultations.patientName')} */}
          <div className="space-y-2">
            <Label
              htmlFor="patientName"
              className="flex items-center gap-2 text-slate-700"
            >
              <User className="w-4 h-4 text-blue-600" />
              {t('consultations.patientName')}
            </Label>
            <Input
              id="patientName"
              placeholder="Select or enter patient name..."
              value={formData.patientName}
              onChange={(e) =>
                handleInputChange('patientName', e.target.value)
              }
              className="border-slate-300"
            />
          </div>

          {/* {t('consultations.chiefComplaint')} */}
          <div className="space-y-2">
            <Label
              htmlFor="chiefComplaint"
              className="flex items-center gap-2 text-slate-700"
            >
              <FileText className="w-4 h-4 text-blue-600" />
              {t('consultations.chiefComplaint')}
            </Label>
            <Input
              id="chiefComplaint"
              placeholder="Enter the patient's main concern or symptoms..."
              value={formData.chiefComplaint}
              onChange={(e) =>
                handleInputChange('chiefComplaint', e.target.value)
              }
              className="border-slate-300"
            />
          </div>

          {/* {t('consultations.clinicalExamination')} */}
          <div className="space-y-2">
            <Label
              htmlFor="clinicalExamination"
              className="flex items-center gap-2 text-slate-700"
            >
              <Stethoscope className="w-4 h-4 text-blue-600" />
              {t('consultations.clinicalExamination')}
            </Label>
            <Textarea
              id="clinicalExamination"
              placeholder="Document physical examination findings, vital signs, and observations..."
              value={formData.clinicalExamination}
              onChange={(e) =>
                handleInputChange('clinicalExamination', e.target.value)
              }
              rows={4}
              className="border-slate-300 resize-none"
            />
          </div>

          {/* {t('consultations.diagnosis')} */}
          <div className="space-y-2">
            <Label
              htmlFor="diagnosis"
              className="flex items-center gap-2 text-slate-700"
            >
              <ClipboardList className="w-4 h-4 text-blue-600" />
              {t('consultations.diagnosis')}
            </Label>
            <Textarea
              id="diagnosis"
              placeholder="Enter diagnosis or differential diagnoses..."
              value={formData.diagnosis}
              onChange={(e) =>
                handleInputChange('diagnosis', e.target.value)
              }
              rows={3}
              className="border-slate-300 resize-none"
            />
          </div>

          {/* Treatment/Prescription */}
          <div className="space-y-2">
            <Label
              htmlFor="treatment"
              className="flex items-center gap-2 text-slate-700"
            >
              <Pill className="w-4 h-4 text-blue-600" />
              {t('consultations.treatment')}
            </Label>
            <Textarea
              id="treatment"
              placeholder="List medications, dosages, treatment plan, and follow-up instructions..."
              value={formData.treatment}
              onChange={(e) =>
                handleInputChange('treatment', e.target.value)
              }
              rows={4}
              className="border-slate-300 resize-none"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label
              htmlFor="notes"
              className="flex items-center gap-2 text-slate-700"
            >
              <FileCheck className="w-4 h-4 text-blue-600" />
              {t('consultations.notes')}
            </Label>
            <Textarea
              id="notes"
              placeholder="Any additional observations, patient education provided, or special instructions..."
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              rows={3}
              className="border-slate-300 resize-none"
            />
          </div>

          {/* File Attachments */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-slate-700">
              <Upload className="w-4 h-4 text-blue-600" />
              {t('consultations.attachFiles')}
            </Label>
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 hover:border-blue-400 transition-colors">
              <input
                type="file"
                id="fileUpload"
                multiple
                accept="image/*,.pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
              <label
                htmlFor="fileUpload"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="w-8 h-8 text-slate-400" />
                <span className="text-sm text-slate-600">
                  Click to upload images or PDFs
                </span>
                <span className="text-xs text-slate-400">
                  Supports: JPG, PNG, PDF
                </span>
              </label>
            </div>

            {/* Attached Files List */}
            {attachedFiles.length > 0 && (
              <div className="space-y-2">
                {attachedFiles.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 bg-blue-100 rounded flex items-center justify-center flex-shrink-0">
                        {file.type.includes('image') ? (
                          <FileText className="w-5 h-5 text-blue-600" />
                        ) : (
                          <FileText className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatFileSize(file.size)}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                      className="flex-shrink-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer with Save Button */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-3">
          <Link to="/consultations">
            <Button variant="outline">{t('common.cancel')}</Button>
          </Link>
          <Button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8"
          >
            <Save className="w-4 h-4 mr-2" />
            {t('consultations.saveConsultation')}
          </Button>
        </div>
      </Card>
    </div>
  );
}
