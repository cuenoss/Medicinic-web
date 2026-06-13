import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, Link } from 'react-router';
import {
  ArrowLeft,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Edit,
  FileText,
  CreditCard,
  FolderOpen,
  AlertCircle,
  X,
  Upload,
  File,
  Trash2,
  Save,
  User,
  Download,
} from 'lucide-react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Avatar } from '../ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { patientsService, Patient, PatientUpdate, AttachedFile } from '../../services/patients';
import { consultationsService, Consultation } from '../../services/consultations';
import { ordonnancesService, Ordonnance } from '../../services/ordonnances';
import { useAuth } from '../../contexts/AuthContext';

export function PatientProfile() {
  const { t } = useTranslation();
  const { user, token } = useAuth();
  const { id } = useParams();
  const patientId = id ? parseInt(id) : null;
  
  // Debug logging for ID
  console.log('URL ID parameter:', id);
  console.log('Parsed patient ID:', patientId);
  console.log('Is valid ID:', !!(patientId && patientId > 0));
  const [activeTab, setActiveTab] = useState('information');
  const [showConsultationModal, setShowConsultationModal] = useState(false);
  const [showOrdonnanceModal, setShowOrdonnanceModal] = useState(false);
  const [ordonnanceContent, setOrdonnanceContent] = useState('');
  // Doctor details printed on the prescription header — remembered in the browser
  const [ordonnanceSpeciality, setOrdonnanceSpeciality] = useState(() => localStorage.getItem('ordonnance_speciality') || '');
  const [ordonnanceAddress, setOrdonnanceAddress] = useState(() => localStorage.getItem('ordonnance_address') || '');
  const [ordonnancePhone, setOrdonnancePhone] = useState(() => localStorage.getItem('ordonnance_phone') || '');
  const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
  const [showConsultationDetails, setShowConsultationDetails] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState<AttachedFile[]>([]);
  const [consultations, setConsultations] = useState<Consultation[]>([]);
  const [ordonnances, setOrdonnances] = useState<Ordonnance[]>([]);
  
  // Edit profile state
  const [showEditModal, setShowEditModal] = useState(false);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [editForm, setEditForm] = useState<PatientUpdate>({
    full_name: '',
    gender: '',
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
  });
  const [newConsultation, setNewConsultation] = useState({
    // Basic Personal Information
    name: '',
    age: '',
    sex: '',
    weight: '',
    height: '',
    contact: '',
    
    // Main Complaint
    complaint: '',
    
    // History of the problem
    whenStarted: '',
    howOften: '',
    gettingBetter: '',
    triggers: '',
    makesBetter: '',
    
    // Current Medications
    medications: '',
    
    // Symptoms Checklist
    fever: false,
    pain: false,
    nausea: false,
    cough: false,
    dizziness: false,
    fatigue: false,
    
    // Medical History
    allergies: '',
    chronicConditions: '',
    surgeries: '',
    
    // Family Medical History
    familyHistory: '',
    
    // Consultation Details
    diagnosis: '',
    date: '',
    doctor: ''
  });

  // Load patient data
  useEffect(() => {
    const loadPatient = async () => {
      if (patientId && patientId > 0) {
        try {
          setLoading(true);
          const patientData = await patientsService.getPatient(patientId);
          setPatient(patientData);
          
          // Load patient consultations
          const consultationsData = await consultationsService.getPatientConsultations(patientId);
          console.log('Consultations loaded from API:', consultationsData);
          setConsultations(consultationsData);
          
          // Load ordonnances for this patient
          if (patientId) {
            try {
              const ordonnancesData = await ordonnancesService.getPatientOrdonnances(patientId);
              setOrdonnances(ordonnancesData);
            } catch (error) {
              console.error('Failed to load ordonnances:', error);
            }
          }

          // Load patient files
          if (patientId) {
            try {
              const filesData = await patientsService.getPatientFiles(patientId);
              setUploadedFiles(filesData);
            } catch (error) {
              console.error('Failed to load patient files:', error);
            }
          }
          
          // Initialize edit form with current data
          setEditForm({
            full_name: patientData.full_name || '',
            gender: patientData.gender || '',
            email: patientData.email || '',
            phone: patientData.phone || '',
            address: patientData.address || '',
            date_of_birth: patientData.date_of_birth || '',
            blood_type: patientData.blood_type || '',
            allergies: patientData.allergies || '',
            chronic_conditions: patientData.chronic_conditions || '',
            relationship_status: patientData.relationship_status || '',
            emergency_contact_name: patientData.emergency_contact_name || '',
            emergency_contact_phone: patientData.emergency_contact_phone || '',
          });
        } catch (error) {
          console.error('Failed to load patient:', error);
        } finally {
          setLoading(false);
        }
      }
    };

    loadPatient();
  }, [id]);

  // Handle edit profile
  const handleEditProfile = () => {
    if (patient) {
      setEditForm({
        full_name: patient.full_name || '',
        gender: patient.gender || '',
        email: patient.email || '',
        phone: patient.phone || '',
        address: patient.address || '',
        date_of_birth: patient.date_of_birth || '',
        blood_type: patient.blood_type || '',
        allergies: patient.allergies || '',
        chronic_conditions: patient.chronic_conditions || '',
        relationship_status: patient.relationship_status || '',
        emergency_contact_name: patient.emergency_contact_name || '',
        emergency_contact_phone: patient.emergency_contact_phone || '',
      });
      setShowEditModal(true);
    }
  };

  // Handle save profile
  const handleSaveProfile = async () => {
    if (id) {
      try {
        const updatedPatient = await patientsService.updatePatient(parseInt(id), editForm);
        setPatient(updatedPatient);
        setShowEditModal(false);
      } catch (error) {
        console.error('Failed to update patient:', error);
        alert(t('profile.updateFailed'));
      }
    }
  };

  
  const payments = [
    { id: 1, date: 'April 1, 2026', service: 'Ordonnance #001', amount: 'Prescription', status: 'active' },
    { id: 2, date: 'January 15, 2026', service: 'Ordonnance #002', amount: 'Medical Certificate', status: 'completed' },
    { id: 3, date: 'October 10, 2025', service: 'Ordonnance #003', amount: 'Lab Results', status: 'completed' },
  ];

  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = event.target.files;
    if (selectedFiles && patientId) {
      try {
        const uploadPromises = Array.from(selectedFiles).map(async (file) => {
          return await patientsService.uploadPatientFile(patientId, file);
        });
        
        const uploadedResults = await Promise.all(uploadPromises);
        setUploadedFiles(prev => [...prev, ...uploadedResults]);
        console.log('Uploaded files:', uploadedResults);
        alert(t('profile.filesUploaded'));
      } catch (error) {
        console.error('Failed to upload files:', error);
        alert(t('profile.filesUploadFailed'));
      }
    }
  };

  const [showFilesModal, setShowFilesModal] = useState(false);
  const [selectedFile, setSelectedFile] = useState<AttachedFile | null>(null);
  const [showFileViewer, setShowFileViewer] = useState(false);
  const [imageSrc, setImageSrc] = useState<string>("");
  const [imgError, setImgError] = useState(false);

  const handleViewFile = (file: AttachedFile) => {
    console.log('Viewing file:', file);
    console.log('File URL should be:', `/api/patients/${patient?.id}/files/${file.id}`);
    setSelectedFile(file);
    setShowFileViewer(true);
    setImgError(false);
    setImageSrc("");
  };

  // Fetch image with authentication when file viewer is opened for an image
  useEffect(() => {
    if (!showFileViewer) return;

    let objectUrl = "";

    const fetchImage = async () => {
      if (selectedFile?.id && selectedFile.file_type.toLowerCase().startsWith('image/') && patient?.id) {
        try {
          const response = await fetch(patientsService.getFileUrl(patient.id, selectedFile.id), {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const blob = await response.blob();
            objectUrl = URL.createObjectURL(blob);
            setImageSrc(objectUrl);
            setImgError(false);
          } else {
            console.error('Failed to fetch image:', response.status);
            setImgError(true);
          }
        } catch (e) {
          console.error("Failed to fetch image", e);
          setImgError(true);
        }
      }
    };

    if (selectedFile) {
      fetchImage();
    }

    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [selectedFile?.id, patient?.id, token, showFileViewer]);

  const handleDeleteFile = async (fileId: number) => {
    if (!confirm(t('profile.confirmDeleteFile'))) return;
    
    try {
      console.log(`Deleting file ${fileId} for patient ${patient!.id}`);
      await patientsService.deletePatientFile(patient!.id, fileId);
      
      // Force refresh cache on server
      console.log('Refreshing files cache...');
      await patientsService.refreshPatientFiles(patient!.id);
      
      // Wait a moment then refetch files from server
      setTimeout(async () => {
        const updatedFiles = await patientsService.getPatientFiles(patient!.id);
        console.log('Updated files after refresh:', updatedFiles.map(f => ({ id: f.id, name: f.file_name })));
        setUploadedFiles(updatedFiles);
      }, 500);
      
      // Remove from selected file if it was the one being viewed
      if (selectedFile?.id === fileId) {
        setSelectedFile(null);
        setShowFileViewer(false);
      }
      
      alert(t('profile.fileDeleted'));
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert(t('profile.fileDeleteFailed'));
    }
  };

  const handleViewConsultationDetails = (consultation: Consultation) => {
    console.log('Viewing consultation details:', consultation);
    setSelectedConsultation(consultation);
    setShowConsultationDetails(true);
  };

  const handleAddConsultation = async () => {
    if (newConsultation.complaint && newConsultation.date && newConsultation.doctor && patient && (patient?.id || 0) > 0) {
      
      // Debug logging
      console.log('Creating consultation for patient:', patient);
      console.log('Patient ID:', patient.id);
      console.log('Patient data:', patient);
      try {
        // Ensure patient_id is valid before proceeding
        if (!patient?.id || patient.id <= 0) {
          throw new Error('Invalid patient ID. Please refresh the page and try again.');
        }
        
        // Prepare consultation data for API
        const consultationData = {
          patient_id: patient.id,
          name: newConsultation.name || patient.name || '',
          age: newConsultation.age || patient.age?.toString() || '',
          sex: newConsultation.sex || patient.gender || '',
          weight: newConsultation.weight,
          height: newConsultation.height,
          contact: newConsultation.contact || patient.phone || '',
          complaint: newConsultation.complaint,
          when_started: newConsultation.whenStarted,
          how_often: newConsultation.howOften,
          getting_better: newConsultation.gettingBetter,
          triggers: newConsultation.triggers,
          makes_better: newConsultation.makesBetter,
          medications: newConsultation.medications,
          fever: newConsultation.fever,
          pain: newConsultation.pain,
          nausea: newConsultation.nausea,
          cough: newConsultation.cough,
          dizziness: newConsultation.dizziness,
          fatigue: newConsultation.fatigue,
          allergies: newConsultation.allergies,
          chronic_conditions: newConsultation.chronicConditions,
          surgeries: newConsultation.surgeries,
          family_history: newConsultation.familyHistory,
          diagnosis: newConsultation.diagnosis,
          date: newConsultation.date,
          doctor: newConsultation.doctor
        };

        const createdConsultation = await consultationsService.createConsultation(consultationData);
        
        // Refresh consultations list
        const updatedConsultations = await consultationsService.getPatientConsultations(patient?.id || 0);
        setConsultations(updatedConsultations);
        
        // Reset form and close modal
        setShowConsultationModal(false);
        setNewConsultation({
          // Basic Personal Information
          name: '',
          age: '',
          sex: '',
          weight: '',
          height: '',
          contact: '',
          
          // Main Complaint
          complaint: '',
          
          // History of the problem
          whenStarted: '',
          howOften: '',
          gettingBetter: '',
          triggers: '',
          makesBetter: '',
          
          // Current Medications
          medications: '',
          
          // Symptoms Checklist
          fever: false,
          pain: false,
          nausea: false,
          cough: false,
          dizziness: false,
          fatigue: false,
          
          // Medical History
          allergies: '',
          chronicConditions: '',
          surgeries: '',
          
          // Family Medical History
          familyHistory: '',
          
          // Consultation Details
          diagnosis: '',
          date: '',
          doctor: ''
        });
        
        alert(t('profile.consultationAdded'));
      } catch (error) {
        console.error('Failed to add consultation:', error);
        alert(t('profile.consultationFailed'));
      }
    } else {
      console.error('Cannot create consultation - invalid patient data');
      console.error('Patient:', patient);
      console.error('Required fields:', {
        complaint: !!newConsultation.complaint,
        date: !!newConsultation.date,
        doctor: !!newConsultation.doctor,
        patient: !!patient,
        patientId: patient?.id || 0,
        patientIdValid: (patient?.id || 0) > 0
      });
      alert(t('profile.consultationInvalid'));
    }
  };

  const handleAddOrdonnance = async () => {
    if (ordonnanceContent && patient && patient.id) {
      try {
        const ordonnanceData = {
          patient_id: patient.id,
          content: ordonnanceContent,
          doctor: user?.fullName || 'Unknown Doctor', // Use logged-in user's name
          date: new Date().toISOString()
        };
        
        console.log('Sending ordonnance data:', ordonnanceData);
        const savedOrdonnance = await ordonnancesService.createOrdonnance(ordonnanceData);
        console.log('Saved ordonnance:', savedOrdonnance);
        
        // Refresh ordonnances list
        const updatedOrdonnances = await ordonnancesService.getPatientOrdonnances(patient.id);
        setOrdonnances(updatedOrdonnances);
        
        // Clear the form
        setOrdonnanceContent('');
        
        alert(t('profile.ordonnanceSaved'));
      } catch (error) {
        console.error('Failed to save ordonnance:', error);
        alert(t('profile.ordonnanceFailed'));
      }
    }
  };

  const handlePrintOrdonnanceWithContent = (content: string) => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ordonnance - ${patient?.name || 'Loading...'}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                background: white;
                line-height: 1.6;
              }
              .header { 
                border-bottom: 2px solid #333; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
                text-align: center;
              }
              .header h1 { 
                font-size: 24px; 
                margin: 0 0 10px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .patient-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                font-size: 14px;
              }
              .content { 
                margin-bottom: 40px;
                min-height: 400px;
                border: 1px solid #ddd;
                padding: 20px;
                background: #fafafa;
                white-space: pre-wrap;
                font-family: 'Courier New', monospace;
                font-size: 14px;
              }
              .footer {
                border-top: 2px solid #333;
                padding-top: 20px;
                margin-top: 40px;
                text-align: center;
                font-size: 12px;
              }
              .signature {
                margin-top: 60px;
                text-align: right;
              }
              .signature-line {
                border-bottom: 1px solid #333;
                width: 200px;
                margin-left: auto;
              }
            </style>
          </head>
          <body>
            <div style="margin-bottom: 6px;">
              <div style="font-size: 26px; font-weight: bold; text-transform: uppercase;">Dr ${user?.fullName || ''}</div>
              ${ordonnanceSpeciality ? `<div style="font-size: 15px; font-weight: bold; margin-top: 2px;">${ordonnanceSpeciality}</div>` : ''}
              ${ordonnanceAddress ? `<div style="font-size: 12px; margin-top: 2px;">${ordonnanceAddress}</div>` : ''}
            </div>
            <div style="border-bottom: 3px solid #000; margin: 10px 0 26px 0;"></div>
            <div style="text-align: center; font-size: 26px; font-weight: bold; margin: 0 0 26px 0;">Ordonnance</div>

            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 26px;">
              <div>Fait le : ${new Date().toLocaleDateString()}</div>
              <div style="text-align: right;">
                A Patient(e) : <strong>${patient?.name || ''}</strong>
                <div style="font-size: 13px; margin-top: 2px;">Age : ${patient?.age || ''} ans</div>
              </div>
            </div>
            
            <div class="content">
${content}
            </div>
            
            <div class="signature">
              <p>_________________________</p>
              <p>Signature et cachet</p>
            </div>
            <div class="footer" style="display:flex; justify-content:space-between; text-align:left;">
              <div>${ordonnanceAddress || ''}${ordonnancePhone ? `<br>${ordonnancePhone}` : ''}</div>
              <div>Généré par MediClinic</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  const handlePrintOrdonnance = () => {
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Ordonnance - ${patient?.name || 'Loading...'}</title>
            <style>
              body { 
                font-family: 'Times New Roman', serif; 
                margin: 40px; 
                background: white;
                line-height: 1.6;
              }
              .header { 
                border-bottom: 2px solid #333; 
                padding-bottom: 20px; 
                margin-bottom: 30px;
                text-align: center;
              }
              .header h1 { 
                font-size: 24px; 
                margin: 0 0 10px 0;
                text-transform: uppercase;
                letter-spacing: 2px;
              }
              .patient-info {
                display: flex;
                justify-content: space-between;
                margin-bottom: 30px;
                font-size: 14px;
              }
              .content { 
                margin-bottom: 40px;
                min-height: 400px;
                border: 1px solid #ddd;
                padding: 20px;
                background: #fafafa;
                white-space: pre-wrap;
                font-family: 'Courier New', monospace;
                font-size: 14px;
                line-height: 1.8;
              }
              .footer { 
                margin-top: 50px;
                text-align: right;
                font-size: 12px;
                color: #666;
              }
              .signature {
                margin-top: 80px;
                border-top: 1px solid #333;
                padding-top: 20px;
                text-align: center;
              }
            </style>
          </head>
          <body>
            <div style="margin-bottom: 6px;">
              <div style="font-size: 26px; font-weight: bold; text-transform: uppercase;">Dr ${user?.fullName || ''}</div>
              ${ordonnanceSpeciality ? `<div style="font-size: 15px; font-weight: bold; margin-top: 2px;">${ordonnanceSpeciality}</div>` : ''}
              ${ordonnanceAddress ? `<div style="font-size: 12px; margin-top: 2px;">${ordonnanceAddress}</div>` : ''}
            </div>
            <div style="border-bottom: 3px solid #000; margin: 10px 0 26px 0;"></div>
            <div style="text-align: center; font-size: 26px; font-weight: bold; margin: 0 0 26px 0;">Ordonnance</div>

            <div style="display: flex; justify-content: space-between; font-size: 14px; margin-bottom: 26px;">
              <div>Fait le : ${new Date().toLocaleDateString()}</div>
              <div style="text-align: right;">
                A Patient(e) : <strong>${patient?.name || ''}</strong>
                <div style="font-size: 13px; margin-top: 2px;">Age : ${patient?.age || ''} ans</div>
              </div>
            </div>
            <div class="content">
${ordonnanceContent}
            </div>
            <div class="signature">
              <p>_________________________</p>
              <p>Signature et cachet</p>
            </div>
            <div class="footer" style="display:flex; justify-content:space-between; text-align:left;">
              <div>${ordonnanceAddress || ''}${ordonnancePhone ? `<br>${ordonnancePhone}` : ''}</div>
              <div>Généré par MediClinic</div>
            </div>
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/patients">
        <Button variant="ghost" size="sm">
          <ArrowLeft className="w-4 h-4 mr-2" />
          {t('profile.backToPatients')}
        </Button>
      </Link>

      {/* Patient Header Card */}
      <Card className="p-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Avatar className="w-24 h-24 flex-shrink-0">
            <div className="w-full h-full bg-blue-100 text-blue-700 flex items-center justify-center text-3xl font-semibold">
              {patient?.name?.split(' ').map(n => n[0]).join('') || 'P'}
            </div>
          </Avatar>
          <div className="flex-1">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-4">
              <div>
                <h1 className="text-2xl font-semibold text-slate-800 mb-1">
                  {patient?.name || 'Loading...'}
                </h1>
                <p className="text-slate-600">
                  {patient?.age} {t('profile.years')} • {patient?.gender} • {t('profile.bloodType')}: {patient?.blood_type}
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditProfile}>
                <Edit className="w-4 h-4 mr-2" />
                {t('profile.editProfile')}
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">{t('profile.dob')}: {patient?.date_of_birth}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Phone className="w-4 h-4" />
                <span className="text-sm">{patient?.phone}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <Mail className="w-4 h-4" />
                <span className="text-sm">{patient?.email}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-600">
                <MapPin className="w-4 h-4" />
                <span className="text-sm">{patient?.address || t('profile.na')}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Chronic Diseases Alert */}
        {patient?.chronic_conditions?.split(',').filter(d => d.trim()) || [].length > 0 && (
          <div className="mt-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-orange-900 mb-1">{t('profile.chronicDiseases')}</p>
                <div className="flex flex-wrap gap-2">
                  {patient?.chronic_conditions?.split(',').filter(d => d.trim()) || [].map((disease, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded"
                    >
                      {disease}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full grid grid-cols-4 h-auto">
          <TabsTrigger value="information" className="py-3">
            {t('profile.information')}
          </TabsTrigger>
          <TabsTrigger value="consultations" className="py-3">
            {t('profile.consultations')}
          </TabsTrigger>
          <TabsTrigger value="ordonnances" className="py-3">
            {t('profile.ordonnances')}
          </TabsTrigger>
          <TabsTrigger value="files" className="py-3">
            {t('profile.files')}
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="information" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">{t('profile.medicalInformation')}</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600">{t('profile.bloodType')}</label>
                  <p className="font-medium text-slate-800">{patient?.blood_type || t('profile.na')}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">{t('profile.allergies')}</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient?.allergies?.split(',').filter(a => a.trim()) || [].map((allergy, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-red-100 text-red-800 text-sm rounded"
                      >
                        {allergy}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">{t('profile.chronicDiseases')}</label>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {patient?.chronic_conditions?.split(',').filter(d => d.trim()) || [].map((disease, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-orange-100 text-orange-800 text-sm rounded"
                      >
                        {disease}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm text-slate-600">{t('profile.ordonnance')}</label>
                  <p className="font-medium text-slate-800">{t('profile.noOrdonnances')}</p>
                </div>
              </div>
            </Card>

                      </div>
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">{t('profile.consultationHistory')}</h3>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowConsultationModal(true)}>
              <FileText className="w-4 h-4 mr-2" />
              {t('profile.newConsultation')}
            </Button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                {t('profile.loadingConsultations')}
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>{t('profile.noConsultations')}</p>
                <p className="text-sm">{t('profile.noConsultationsDesc')}</p>
              </div>
            ) : (
              consultations.map((consultation) => (
              <Card key={consultation.id} className="p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-600" />
                      <p className="font-medium text-slate-800">
                        {consultation.complaint}
                      </p>
                    </div>
                    <p className="text-sm text-slate-600 mb-2">
                      {consultation.diagnosis}
                    </p>
                    <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                      <span>{new Date(consultation.date).toLocaleDateString()}</span>
                      <span>•</span>
                      <span>{consultation.doctor}</span>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleViewConsultationDetails(consultation)}>
                    {t('profile.viewDetails')}
                  </Button>
                </div>
              </Card>
            )))}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">{t('profile.patientFiles')}</h3>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                {t('profile.uploadFiles')}
              </Button>
            </div>
          </div>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>{t('profile.noFiles')}</p>
              <p className="text-sm">{t('profile.noFilesDesc')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {uploadedFiles.map((file) => (
                <Card key={file.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-6 h-6 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-800 truncate">{file.file_name}</p>
                      <p className="text-sm text-slate-600">{file.created_at ? new Date(file.created_at).toLocaleDateString() : t('profile.unknownDate')} · {file.file_type?.toUpperCase() || 'FILE'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewFile(file)}
                      >
                        {t('profile.view')}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleDeleteFile(file.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Ordonnances Tab */}
        <TabsContent value="ordonnances" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">{t('profile.ordonnances')}</h3>
          </div>
          
          {/* Ordonnances List */}
          <div className="space-y-3 mb-6">
            {ordonnances.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>{t('profile.noOrdonnancesYet')}</p>
                <p className="text-sm">{t('profile.noOrdonnancesDesc')}</p>
              </div>
            ) : (
              ordonnances.map((ordonnance) => (
                <Card key={ordonnance.id} className="p-5 hover:shadow-md transition-shadow">
                  <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-5 h-5 text-blue-600" />
                        <p className="font-medium text-slate-800">
                          {ordonnance.content.substring(0, 100)}...
                        </p>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-slate-500">
                        <span>{new Date(ordonnance.date).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{ordonnance.doctor}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={() => setOrdonnanceContent(ordonnance.content)}>
                        {t('profile.view')}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrintOrdonnanceWithContent(ordonnance.content)}>
                        {t('profile.print')}
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create New Ordonnance */}
          <Card className="p-6">
            <h4 className="font-semibold text-slate-800 mb-4">{t('profile.createNewOrdonnance')}</h4>
            <div className="space-y-4">
              {/* Doctor details — printed at the top of the prescription, remembered in the browser */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.speciality')}</label>
                  <input
                    type="text"
                    value={ordonnanceSpeciality}
                    onChange={(e) => { setOrdonnanceSpeciality(e.target.value); localStorage.setItem('ordonnance_speciality', e.target.value); }}
                    placeholder={t('profile.specialityPlaceholder')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.clinicAddress')}</label>
                  <input
                    type="text"
                    value={ordonnanceAddress}
                    onChange={(e) => { setOrdonnanceAddress(e.target.value); localStorage.setItem('ordonnance_address', e.target.value); }}
                    placeholder={t('profile.clinicAddressPlaceholder')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.clinicPhone')}</label>
                  <input
                    type="text"
                    value={ordonnancePhone}
                    onChange={(e) => { setOrdonnancePhone(e.target.value); localStorage.setItem('ordonnance_phone', e.target.value); }}
                    placeholder={t('profile.clinicPhonePlaceholder')}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {t('profile.ordonnanceContent')}
                </label>
                <div className="border border-slate-300 rounded-lg p-4 min-h-[300px]">
                  <textarea
                    placeholder={t('profile.writeOrdonnance')}
                    value={ordonnanceContent}
                    onChange={(e) => setOrdonnanceContent(e.target.value)}
                    className="w-full h-48 outline-none text-slate-800 placeholder-slate-400 resize-none"
                    rows={8}
                  />
                </div>
              </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setOrdonnanceContent('')}
                  className="flex-1"
                >
                  {t('profile.clear')}
                </Button>
                <Button
                  onClick={handleAddOrdonnance}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!ordonnanceContent}
                >
                  {t('profile.saveOrdonnance')}
                </Button>
                <Button
                  onClick={handlePrintOrdonnance}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!ordonnanceContent}
                >
                  {t('profile.print')}
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Consultation Modal */}
      {showConsultationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('profile.newConsultation')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConsultationModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* 1. Basic Personal Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">{t('profile.basicPersonalInfo')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.name')}</label>
                      <input
                        type="text"
                        value={newConsultation.name || patient?.name}
                        onChange={(e) => setNewConsultation({...newConsultation, name: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.patientNamePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.age')}</label>
                      <input
                        type="text"
                        value={newConsultation.age || patient?.age.toString()}
                        onChange={(e) => setNewConsultation({...newConsultation, age: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.agePlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.sex')}</label>
                      <select
                        value={newConsultation.sex || patient?.gender}
                        onChange={(e) => setNewConsultation({...newConsultation, sex: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      >
                        <option value="">{t('profile.select')}</option>
                        <option value="Male">{t('common.male')}</option>
                        <option value="Female">{t('common.female')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.weight')}</label>
                      <input
                        type="text"
                        value={newConsultation.weight}
                        onChange={(e) => setNewConsultation({...newConsultation, weight: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.weightPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.height')}</label>
                      <input
                        type="text"
                        value={newConsultation.height}
                        onChange={(e) => setNewConsultation({...newConsultation, height: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.heightPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.contact')}</label>
                      <input
                        type="text"
                        value={newConsultation.contact || patient?.phone}
                        onChange={(e) => setNewConsultation({...newConsultation, contact: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.contactPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Main Complaint */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">{t('profile.mainComplaint')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.complaintQuestion')}</label>
                    <textarea
                      value={newConsultation.complaint}
                      onChange={(e) => setNewConsultation({...newConsultation, complaint: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder={t('profile.complaintPlaceholder')}
                    />
                  </div>
                </div>

                {/* 3. History of the problem */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4">{t('profile.historyProblem')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.whenStarted')}</label>
                      <input
                        type="text"
                        value={newConsultation.whenStarted}
                        onChange={(e) => setNewConsultation({...newConsultation, whenStarted: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.whenStartedPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.howOften')}</label>
                      <input
                        type="text"
                        value={newConsultation.howOften}
                        onChange={(e) => setNewConsultation({...newConsultation, howOften: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.howOftenPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.gettingBetterWorse')}</label>
                      <select
                        value={newConsultation.gettingBetter}
                        onChange={(e) => setNewConsultation({...newConsultation, gettingBetter: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      >
                        <option value="">{t('profile.select')}</option>
                        <option value="Better">{t('profile.gettingBetterOpt')}</option>
                        <option value="Worse">{t('profile.gettingWorseOpt')}</option>
                        <option value="Same">{t('profile.staysSame')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.triggers')}</label>
                      <input
                        type="text"
                        value={newConsultation.triggers}
                        onChange={(e) => setNewConsultation({...newConsultation, triggers: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.triggersPlaceholder')}
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.makesBetter')}</label>
                      <input
                        type="text"
                        value={newConsultation.makesBetter}
                        onChange={(e) => setNewConsultation({...newConsultation, makesBetter: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.makesBetterPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Current Medications */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">{t('profile.currentMedications')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.medicationsQuestion')}</label>
                    <textarea
                      value={newConsultation.medications}
                      onChange={(e) => setNewConsultation({...newConsultation, medications: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder={t('profile.medicationsPlaceholder')}
                    />
                  </div>
                </div>

                {/* 5. Symptoms Checklist */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4">{t('profile.symptomsChecklist')}</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'fever' as const, label: t('profile.fever') },
                      { key: 'pain' as const, label: t('profile.pain') },
                      { key: 'nausea' as const, label: t('profile.nausea') },
                      { key: 'cough' as const, label: t('profile.cough') },
                      { key: 'dizziness' as const, label: t('profile.dizziness') },
                      { key: 'fatigue' as const, label: t('profile.fatigue') }
                    ].map(symptom => (
                      <label key={symptom.key} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={newConsultation[symptom.key]}
                          onChange={(e) => setNewConsultation({...newConsultation, [symptom.key]: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">{symptom.label}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 6. Medical History */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-orange-800 mb-4">{t('profile.medicalHistory')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.allergiesQuestion')}</label>
                      <input
                        type="text"
                        value={newConsultation.allergies}
                        onChange={(e) => setNewConsultation({...newConsultation, allergies: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.allergiesPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.chronicQuestion')}</label>
                      <input
                        type="text"
                        value={newConsultation.chronicConditions}
                        onChange={(e) => setNewConsultation({...newConsultation, chronicConditions: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.chronicPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.surgeriesQuestion')}</label>
                      <input
                        type="text"
                        value={newConsultation.surgeries}
                        onChange={(e) => setNewConsultation({...newConsultation, surgeries: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.surgeriesPlaceholder')}
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Family Medical History */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-pink-800 mb-4">{t('profile.familyHistoryTitle')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.familyQuestion')}</label>
                    <textarea
                      value={newConsultation.familyHistory}
                      onChange={(e) => setNewConsultation({...newConsultation, familyHistory: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-16"
                      placeholder={t('profile.familyPlaceholder')}
                    />
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">{t('profile.consultationDetails')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.date')}</label>
                      <input
                        type="date"
                        value={newConsultation.date}
                        onChange={(e) => setNewConsultation({...newConsultation, date: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.doctor')}</label>
                      <input
                        type="text"
                        value={newConsultation.doctor}
                        onChange={(e) => setNewConsultation({...newConsultation, doctor: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.doctorPlaceholder')}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.diagnosis')}</label>
                      <input
                        type="text"
                        value={newConsultation.diagnosis}
                        onChange={(e) => setNewConsultation({...newConsultation, diagnosis: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder={t('profile.diagnosisPlaceholder')}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowConsultationModal(false)}
                className="flex-1"
              >
                {t('profile.cancel')}
              </Button>
              <Button
                onClick={handleAddConsultation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newConsultation.complaint || !newConsultation.date || !newConsultation.doctor}
              >
                {t('profile.addConsultation')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Consultation Details Modal */}
      {showConsultationDetails && selectedConsultation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('profile.consultationDetailsTitle')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConsultationDetails(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">{t('profile.basicInformation')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.name')}</label>
                      <p className="text-slate-800">{selectedConsultation.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.age')}</label>
                      <p className="text-slate-800">{selectedConsultation.age}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.sex')}</label>
                      <p className="text-slate-800">{selectedConsultation.sex}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.contact')}</label>
                      <p className="text-slate-800">{selectedConsultation.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.weight')}</label>
                      <p className="text-slate-800">{selectedConsultation.weight}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.height')}</label>
                      <p className="text-slate-800">{selectedConsultation.height}</p>
                    </div>
                  </div>
                </div>

                {/* Main Complaint */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">{t('profile.mainComplaintTitle')}</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.complaintLabel')}</label>
                    <p className="text-slate-800">{selectedConsultation.complaint}</p>
                  </div>
                </div>

                {/* History of the Problem */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4">{t('profile.historyProblemTitle')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.whenStartedLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.when_started}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.howOftenLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.how_often}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.gettingBetterLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.getting_better}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.triggersLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.triggers}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.makesBetterLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.makes_better}</p>
                    </div>
                  </div>
                </div>

                {/* Current Medications */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4">{t('profile.currentMedicationsTitle')}</h4>
                  <p className="text-slate-800">{selectedConsultation.medications || t('profile.none')}</p>
                </div>

                {/* Symptoms Checklist */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">{t('profile.symptomsChecklist')}</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.fever ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.fever')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.pain ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.pain')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.nausea ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.nausea')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.cough ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.cough')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.dizziness ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.dizziness')}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.fatigue ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">{t('profile.fatigue')}</span>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-orange-800 mb-4">{t('profile.medicalHistoryTitle')}</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.allergies')}</label>
                      <p className="text-slate-800">{selectedConsultation.allergies || t('profile.none')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.chronicConditionsLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.chronic_conditions || t('profile.none')}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.surgeriesLabel')}</label>
                      <p className="text-slate-800">{selectedConsultation.surgeries || t('profile.none')}</p>
                    </div>
                  </div>
                </div>

                {/* Family Medical History */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-pink-800 mb-4">{t('profile.familyMedicalHistory')}</h4>
                  <p className="text-slate-800">{selectedConsultation.family_history || t('profile.none')}</p>
                </div>

                {/* Consultation Details */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4">{t('profile.consultationDetails')}</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.date')}</label>
                      <p className="text-slate-800">{new Date(selectedConsultation.date).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.doctor')}</label>
                      <p className="text-slate-800">{selectedConsultation.doctor}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">{t('profile.diagnosis')}</label>
                      <p className="text-slate-800">{selectedConsultation.diagnosis || t('profile.notSpecified')}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowConsultationDetails(false)}
                className="flex-1"
              >
                {t('profile.close')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h3 className="text-xl font-semibold text-slate-800">
                {t('profile.editPatientProfile')}
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowEditModal(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">{t('profile.personalInformation')}</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.fullName')}</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder={t('profile.fullNamePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.email')}</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder={t('profile.emailPlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.phone')}</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder={t('profile.phonePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.address')}</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder={t('profile.addressPlaceholder')}
                    />
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">{t('profile.medicalInformation')}</h4>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.dateOfBirth')}</label>
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.gender')}</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="">{t('profile.select')}</option>
                      <option value="Male">{t('common.male')}</option>
                      <option value="Female">{t('common.female')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.bloodType')}</label>
                    <select
                      value={editForm.blood_type}
                      onChange={(e) => setEditForm({...editForm, blood_type: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="">{t('profile.select')}</option>
                      <option value="A+">A+</option>
                      <option value="A-">A-</option>
                      <option value="B+">B+</option>
                      <option value="B-">B-</option>
                      <option value="AB+">AB+</option>
                      <option value="AB-">AB-</option>
                      <option value="O+">O+</option>
                      <option value="O-">O-</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.allergies')}</label>
                    <textarea
                      value={editForm.allergies}
                      onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder={t('profile.allergiesEditPlaceholder')}
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">{t('profile.chronicConditionsLabel')}</label>
                    <textarea
                      value={editForm.chronic_conditions}
                      onChange={(e) => setEditForm({...editForm, chronic_conditions: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder={t('profile.chronicEditPlaceholder')}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={() => setShowEditModal(false)}
                className="flex-1"
              >
                {t('profile.cancel')}
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {t('profile.saveChanges')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* File Viewer Modal */}
      {console.log('Modal should show:', showFileViewer, 'Selected file:', selectedFile)}
      {showFileViewer && selectedFile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h3 className="text-xl font-semibold text-slate-800">{t('profile.fileViewer')}</h3>
                <p className="text-sm text-slate-600 mt-1">{selectedFile.file_name}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowFileViewer(false)}
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* File Content */}
            <div className="p-6 overflow-auto" style={{ maxHeight: 'calc(90vh - 200px)' }}>
              {selectedFile.file_type.toLowerCase().startsWith('image/') ? (
                // Image files
                <div className="flex justify-center">
                  {imgError ? (
                    <div className="text-center py-12">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText className="w-8 h-8 text-slate-400" />
                      </div>
                      <p className="text-slate-600 mb-4">{t('profile.failedLoadImage')}</p>
                      <Button
                        onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t('profile.download')}
                      </Button>
                    </div>
                  ) : imageSrc ? (
                    <img
                      src={imageSrc}
                      alt={selectedFile.file_name}
                      className="max-w-full max-h-[600px] object-contain"
                      onError={() => setImgError(true)}
                    />
                  ) : (
                    <div className="flex items-center justify-center h-[400px]">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  )}
                </div>
              ) : selectedFile.file_type.toLowerCase().includes('pdf') ? (
                // PDF files
                <div className="flex flex-col items-center gap-4">
                  <p className="text-slate-600">{t('profile.pdfNoPreview')}</p>
                  <Button
                    onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('profile.downloadPdf')}
                  </Button>
                </div>
              ) : selectedFile.file_type.toLowerCase().includes('text') ? (
                // Text files
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    {t('profile.textContentHere')}
                  </p>
                </div>
              ) : (
                // Other file types
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4">{t('profile.cannotPreview')}</p>
                  <Button
                    onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    {t('profile.downloadFile')}
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  {t('profile.fileTypeLabel')}: <span className="font-medium">{selectedFile.file_type}</span>
                </p>
                <p className="text-sm text-slate-600">
                  {t('profile.createdLabel')}: <span className="font-medium">
                    {selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString() : t('profile.unknown')}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  {t('profile.download')}
                </Button>
                <Button
                  onClick={() => setShowFileViewer(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {t('profile.close')}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
