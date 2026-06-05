import { useState, useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';

export function PatientProfile() {
  const { user, token } = useAuth();
  const { t } = useTranslation();
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
        alert('Failed to update patient profile');
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
        alert('Files uploaded successfully!');
      } catch (error) {
        console.error('Failed to upload files:', error);
        alert('Failed to upload files. Please try again.');
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
    if (!confirm('Are you sure you want to delete this file?')) return;
    
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
      
      alert('File deleted successfully!');
    } catch (error) {
      console.error('Failed to delete file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleDeleteConsultation = async (consultationId: number) => {
    if (!window.confirm('Delete this consultation?')) return;
    try {
      await consultationsService.deleteConsultation(consultationId);
      setConsultations(prev => prev.filter(c => c.id !== consultationId));
    } catch (error) {
      console.error('Failed to delete consultation:', error);
      alert('Failed to delete consultation. Please try again.');
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
        
        alert('Consultation added successfully!');
      } catch (error) {
        console.error('Failed to add consultation:', error);
        alert('Failed to add consultation. Please try again.');
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
      alert('Cannot create consultation: Patient data is not loaded properly. Please refresh the page and try again.');
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
        
        alert('Ordonnance saved successfully!');
      } catch (error) {
        console.error('Failed to save ordonnance:', error);
        alert('Failed to save ordonnance. Please try again.');
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
            <div class="header">
              <h1>Médiclinic</h1>
              <p>Ordonnance Médicale</p>
            </div>
            
            <div class="patient-info">
              <div>
                <strong>Patient:</strong> ${patient?.name || 'Loading...'}
              </div>
              <div>
                <strong>Date:</strong> ${new Date().toLocaleString()}
              </div>
            </div>
            
            <div class="content">
${content}
            </div>
            
            <div class="footer">
              <p>Doctor: ${user?.fullName || 'Unknown Doctor'}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="signature">
              <p>_________________________</p>
              <p>Doctor's Signature</p>
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
            <div class="header">
              <h1>ORDONNANCE</h1>
            </div>
            <div class="patient-info">
              <div>
                <strong>Patient:</strong> ${patient?.name || 'Loading...'}<br>
                <strong>Age:</strong> ${patient?.age || 'N/A'} years<br>
                <strong>Gender:</strong> ${patient?.gender || 'N/A'}
              </div>
              <div>
                <strong>Date:</strong> ${new Date().toLocaleDateString()}<br>
                <strong>Type:</strong> Prescription
              </div>
            </div>
            <div class="content">
${ordonnanceContent}
            </div>
            <div class="footer">
              <p>Doctor: ${user?.fullName || 'Unknown Doctor'}</p>
              <p>Generated: ${new Date().toLocaleString()}</p>
            </div>
            <div class="signature">
              <p>_________________________</p>
              <p>Doctor's Signature</p>
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
          Back to Patients
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
                  {patient?.age} years • {patient?.gender} • Blood Type: {patient?.blood_type}
                </p>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700" onClick={handleEditProfile}>
                <Edit className="w-4 h-4 mr-2" />
                Edit Profile
              </Button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 text-slate-600">
                <Calendar className="w-4 h-4" />
                <span className="text-sm">DOB: {patient?.date_of_birth}</span>
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
                <span className="text-sm">{patient?.address || 'N/A'}</span>
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
                <p className="font-medium text-orange-900 mb-1">Chronic Diseases</p>
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
            Information
          </TabsTrigger>
          <TabsTrigger value="consultations" className="py-3">
            Consultations
          </TabsTrigger>
          <TabsTrigger value="ordonnances" className="py-3">
            Ordonnances
          </TabsTrigger>
          <TabsTrigger value="files" className="py-3">
            Files
          </TabsTrigger>
        </TabsList>

        {/* Information Tab */}
        <TabsContent value="information" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="p-6">
              <h3 className="font-semibold text-slate-800 mb-4">Medical Information</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-slate-600">Blood Type</label>
                  <p className="font-medium text-slate-800">{patient?.blood_type || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-slate-600">Allergies</label>
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
                  <label className="text-sm text-slate-600">Chronic Diseases</label>
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
                  <label className="text-sm text-slate-600">Ordonnance</label>
                  <p className="font-medium text-slate-800">No ordonnances</p>
                </div>
              </div>
            </Card>

                      </div>
        </TabsContent>

        {/* Consultations Tab */}
        <TabsContent value="consultations" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">{t('patients.consultations.title')}</h3>
            <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => setShowConsultationModal(true)}>
              <FileText className="w-4 h-4 mr-2" />
              {t('patients.consultations.newConsultation')}
            </Button>
          </div>
          <div className="space-y-3">
            {loading ? (
              <div className="text-center py-8 text-slate-500">
                {t('patients.consultations.loading')}
              </div>
            ) : consultations.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>{t('patients.consultations.noConsultations')}</p>
                <p className="text-sm">{t('patients.consultations.clickNew')}</p>
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
                  <div className="flex gap-2 flex-shrink-0">
                    <Button variant="outline" size="sm" onClick={() => handleViewConsultationDetails(consultation)}>
                      {t('patients.consultations.viewDetails')}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 border-red-300 hover:bg-red-50"
                      onClick={() => handleDeleteConsultation(consultation.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            )))}
          </div>
        </TabsContent>

        {/* Files Tab */}
        <TabsContent value="files" className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800">Patient Files</h3>
            <div className="relative">
              <input
                type="file"
                multiple
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Upload className="w-4 h-4 mr-2" />
                Upload Files
              </Button>
            </div>
          </div>
          {uploadedFiles.length === 0 ? (
            <div className="text-center py-8 text-slate-500">
              <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p>No files uploaded yet</p>
              <p className="text-sm">Click "Upload Files" to add the first file</p>
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
                      <p className="text-sm text-slate-600">{file.created_at ? new Date(file.created_at).toLocaleDateString() : 'Unknown date'} · {file.file_type?.toUpperCase() || 'FILE'}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleViewFile(file)}
                      >
                        View
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
            <h3 className="font-semibold text-slate-800">Ordonnances</h3>
          </div>
          
          {/* Ordonnances List */}
          <div className="space-y-3 mb-6">
            {ordonnances.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <FileText className="w-12 h-12 mx-auto mb-4 text-slate-300" />
                <p>No ordonnances yet</p>
                <p className="text-sm">Create your first ordonnance below</p>
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
                        View
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handlePrintOrdonnanceWithContent(ordonnance.content)}>
                        Print
                      </Button>
                    </div>
                  </div>
                </Card>
              ))
            )}
          </div>

          {/* Create New Ordonnance */}
          <Card className="p-6">
            <h4 className="font-semibold text-slate-800 mb-4">Create New Ordonnance</h4>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Ordonnance Content
                </label>
                <div className="border border-slate-300 rounded-lg p-4 min-h-[300px]">
                  <textarea
                    placeholder="Write ordonnance content here..."
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
                  Clear
                </Button>
                <Button
                  onClick={handleAddOrdonnance}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={!ordonnanceContent}
                >
                  Save Ordonnance
                </Button>
                <Button
                  onClick={handlePrintOrdonnance}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!ordonnanceContent}
                >
                  Print
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
                New Consultation
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
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">1. Basic Personal Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                      <input
                        type="text"
                        value={newConsultation.name || patient?.name}
                        onChange={(e) => setNewConsultation({...newConsultation, name: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Patient name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Age</label>
                      <input
                        type="text"
                        value={newConsultation.age || patient?.age.toString()}
                        onChange={(e) => setNewConsultation({...newConsultation, age: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Age"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Sex</label>
                      <select
                        value={newConsultation.sex || patient?.gender}
                        onChange={(e) => setNewConsultation({...newConsultation, sex: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Weight</label>
                      <input
                        type="text"
                        value={newConsultation.weight}
                        onChange={(e) => setNewConsultation({...newConsultation, weight: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Weight (kg)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Height</label>
                      <input
                        type="text"
                        value={newConsultation.height}
                        onChange={(e) => setNewConsultation({...newConsultation, height: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Height (cm)"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Contact</label>
                      <input
                        type="text"
                        value={newConsultation.contact || patient?.phone}
                        onChange={(e) => setNewConsultation({...newConsultation, contact: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Main Complaint */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">2. Main Complaint (Reason for the visit)</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">What is bothering you right now?</label>
                    <textarea
                      value={newConsultation.complaint}
                      onChange={(e) => setNewConsultation({...newConsultation, complaint: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder="I have a headache / I have stomach pain / I feel tired / I have a cough"
                    />
                  </div>
                </div>

                {/* 3. History of the problem */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4">3. History of the problem</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">When it started?</label>
                      <input
                        type="text"
                        value={newConsultation.whenStarted}
                        onChange={(e) => setNewConsultation({...newConsultation, whenStarted: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="2 days ago / Last week"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">How often it happens?</label>
                      <input
                        type="text"
                        value={newConsultation.howOften}
                        onChange={(e) => setNewConsultation({...newConsultation, howOften: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Daily / Weekly / Sometimes"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Getting better or worse?</label>
                      <select
                        value={newConsultation.gettingBetter}
                        onChange={(e) => setNewConsultation({...newConsultation, gettingBetter: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      >
                        <option value="">Select</option>
                        <option value="Better">Getting better</option>
                        <option value="Worse">Getting worse</option>
                        <option value="Same">Stays the same</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">What triggers it?</label>
                      <input
                        type="text"
                        value={newConsultation.triggers}
                        onChange={(e) => setNewConsultation({...newConsultation, triggers: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Stress / Food / Activity"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-2">What makes it better?</label>
                      <input
                        type="text"
                        value={newConsultation.makesBetter}
                        onChange={(e) => setNewConsultation({...newConsultation, makesBetter: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Rest / Medicine / Cold compress"
                      />
                    </div>
                  </div>
                </div>

                {/* 4. Current Medications */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">4. Current Medications</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Anything you are taking?</label>
                    <textarea
                      value={newConsultation.medications}
                      onChange={(e) => setNewConsultation({...newConsultation, medications: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder="Prescribed medicine / Over-the-counter medicine / Vitamins or supplements"
                    />
                  </div>
                </div>

                {/* 5. Symptoms Checklist */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4">5. Symptoms Checklist</h4>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { key: 'fever' as const, label: 'Fever' },
                      { key: 'pain' as const, label: 'Pain' },
                      { key: 'nausea' as const, label: 'Nausea' },
                      { key: 'cough' as const, label: 'Cough' },
                      { key: 'dizziness' as const, label: 'Dizziness' },
                      { key: 'fatigue' as const, label: 'Fatigue' }
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
                  <h4 className="text-lg font-semibold text-orange-800 mb-4">6. Medical History</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Do you have allergies?</label>
                      <input
                        type="text"
                        value={newConsultation.allergies}
                        onChange={(e) => setNewConsultation({...newConsultation, allergies: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Penicillin, Peanuts, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Do you have chronic conditions?</label>
                      <input
                        type="text"
                        value={newConsultation.chronicConditions}
                        onChange={(e) => setNewConsultation({...newConsultation, chronicConditions: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Asthma, Diabetes, etc."
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Have you had recent surgeries?</label>
                      <input
                        type="text"
                        value={newConsultation.surgeries}
                        onChange={(e) => setNewConsultation({...newConsultation, surgeries: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Date and type of surgery"
                      />
                    </div>
                  </div>
                </div>

                {/* 7. Family Medical History */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-pink-800 mb-4">7. Family Medical History (Optional)</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Does anyone in your family have genetic conditions?</label>
                    <textarea
                      value={newConsultation.familyHistory}
                      onChange={(e) => setNewConsultation({...newConsultation, familyHistory: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-16"
                      placeholder="Diabetes, heart disease, etc. in family members"
                    />
                  </div>
                </div>

                {/* Consultation Details */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Consultation Details</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                      <input
                        type="date"
                        value={newConsultation.date}
                        onChange={(e) => setNewConsultation({...newConsultation, date: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Doctor</label>
                      <input
                        type="text"
                        value={newConsultation.doctor}
                        onChange={(e) => setNewConsultation({...newConsultation, doctor: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Doctor name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Diagnosis</label>
                      <input
                        type="text"
                        value={newConsultation.diagnosis}
                        onChange={(e) => setNewConsultation({...newConsultation, diagnosis: e.target.value})}
                        className="w-full border border-slate-300 rounded-lg px-3 py-2"
                        placeholder="Diagnosis"
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
                Cancel
              </Button>
              <Button
                onClick={handleAddConsultation}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
                disabled={!newConsultation.complaint || !newConsultation.date || !newConsultation.doctor}
              >
                Add Consultation
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
                Consultation Details
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
                  <h4 className="text-lg font-semibold text-blue-800 mb-4">Basic Information</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                      <p className="text-slate-800">{selectedConsultation.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Age</label>
                      <p className="text-slate-800">{selectedConsultation.age}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Sex</label>
                      <p className="text-slate-800">{selectedConsultation.sex}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Contact</label>
                      <p className="text-slate-800">{selectedConsultation.contact}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Weight</label>
                      <p className="text-slate-800">{selectedConsultation.weight}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Height</label>
                      <p className="text-slate-800">{selectedConsultation.height}</p>
                    </div>
                  </div>
                </div>

                {/* Main Complaint */}
                <div className="bg-red-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-red-800 mb-4">Main Complaint</h4>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Complaint</label>
                    <p className="text-slate-800">{selectedConsultation.complaint}</p>
                  </div>
                </div>

                {/* History of the Problem */}
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-yellow-800 mb-4">History of the Problem</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">When Started</label>
                      <p className="text-slate-800">{selectedConsultation.when_started}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">How Often</label>
                      <p className="text-slate-800">{selectedConsultation.how_often}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Getting Better</label>
                      <p className="text-slate-800">{selectedConsultation.getting_better}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Triggers</label>
                      <p className="text-slate-800">{selectedConsultation.triggers}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Makes Better</label>
                      <p className="text-slate-800">{selectedConsultation.makes_better}</p>
                    </div>
                  </div>
                </div>

                {/* Current Medications */}
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-purple-800 mb-4">Current Medications</h4>
                  <p className="text-slate-800">{selectedConsultation.medications || 'None'}</p>
                </div>

                {/* Symptoms Checklist */}
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-green-800 mb-4">Symptoms Checklist</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.fever ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Fever</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.pain ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Pain</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.nausea ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Nausea</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.cough ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Cough</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.dizziness ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Dizziness</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${selectedConsultation.fatigue ? 'bg-green-600' : 'bg-gray-300'}`}></span>
                      <span className="text-slate-800">Fatigue</span>
                    </div>
                  </div>
                </div>

                {/* Medical History */}
                <div className="bg-orange-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-orange-800 mb-4">Medical History</h4>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Allergies</label>
                      <p className="text-slate-800">{selectedConsultation.allergies || 'None'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Chronic Conditions</label>
                      <p className="text-slate-800">{selectedConsultation.chronic_conditions || 'None'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Surgeries</label>
                      <p className="text-slate-800">{selectedConsultation.surgeries || 'None'}</p>
                    </div>
                  </div>
                </div>

                {/* Family Medical History */}
                <div className="bg-pink-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-pink-800 mb-4">Family Medical History</h4>
                  <p className="text-slate-800">{selectedConsultation.family_history || 'None'}</p>
                </div>

                {/* Consultation Details */}
                <div className="bg-indigo-50 p-4 rounded-lg">
                  <h4 className="text-lg font-semibold text-indigo-800 mb-4">Consultation Details</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Date</label>
                      <p className="text-slate-800">{new Date(selectedConsultation.date).toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">Doctor</label>
                      <p className="text-slate-800">{selectedConsultation.doctor}</p>
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Diagnosis</label>
                      <p className="text-slate-800">{selectedConsultation.diagnosis || 'Not specified'}</p>
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
                Close
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
                Edit Patient Profile
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
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Full Name</label>
                    <input
                      type="text"
                      value={editForm.full_name}
                      onChange={(e) => setEditForm({...editForm, full_name: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Full name"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input
                      type="email"
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Email address"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Phone</label>
                    <input
                      type="tel"
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                      placeholder="Phone number"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Address</label>
                    <textarea
                      value={editForm.address}
                      onChange={(e) => setEditForm({...editForm, address: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder="Address"
                    />
                  </div>
                </div>

                {/* Medical Information */}
                <div className="space-y-4">
                  <h4 className="text-lg font-semibold text-slate-800 mb-4">Medical Information</h4>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date of Birth</label>
                    <input
                      type="date"
                      value={editForm.date_of_birth}
                      onChange={(e) => setEditForm({...editForm, date_of_birth: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({...editForm, gender: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Blood Type</label>
                    <select
                      value={editForm.blood_type}
                      onChange={(e) => setEditForm({...editForm, blood_type: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2"
                    >
                      <option value="">Select</option>
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
                    <label className="block text-sm font-medium text-slate-700 mb-2">Allergies</label>
                    <textarea
                      value={editForm.allergies}
                      onChange={(e) => setEditForm({...editForm, allergies: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder="List any allergies (comma separated)"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Chronic Conditions</label>
                    <textarea
                      value={editForm.chronic_conditions}
                      onChange={(e) => setEditForm({...editForm, chronic_conditions: e.target.value})}
                      className="w-full border border-slate-300 rounded-lg px-3 py-2 h-20"
                      placeholder="List chronic conditions (comma separated)"
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
                Cancel
              </Button>
              <Button
                onClick={handleSaveProfile}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-4 h-4 mr-2" />
                Save Changes
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
                <h3 className="text-xl font-semibold text-slate-800">File Viewer</h3>
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
                      <p className="text-slate-600 mb-4">Failed to load image</p>
                      <Button
                        onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Download
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
                  <p className="text-slate-600">PDF files cannot be previewed directly due to authentication requirements</p>
                  <Button
                    onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download PDF
                  </Button>
                </div>
              ) : selectedFile.file_type.toLowerCase().includes('text') ? (
                // Text files
                <div className="bg-slate-50 p-4 rounded border border-slate-200">
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">
                    Text file content would be displayed here
                  </p>
                </div>
              ) : (
                // Other file types
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="w-8 h-8 text-slate-400" />
                  </div>
                  <p className="text-slate-600 mb-4">This file type cannot be previewed</p>
                  <Button
                    onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download File
                  </Button>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-6 border-t border-slate-200 bg-slate-50">
              <div className="flex-1">
                <p className="text-sm text-slate-600">
                  File Type: <span className="font-medium">{selectedFile.file_type}</span>
                </p>
                <p className="text-sm text-slate-600">
                  Created: <span className="font-medium">
                    {selectedFile.created_at ? new Date(selectedFile.created_at).toLocaleDateString() : 'Unknown'}
                  </span>
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={() => patientsService.downloadFile(patient!.id, selectedFile.id, selectedFile.file_name)}
                  variant="outline"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => setShowFileViewer(false)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
