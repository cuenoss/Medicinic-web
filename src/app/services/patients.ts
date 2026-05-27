import { ApiClient } from './api';

const apiClient = new ApiClient();

export interface AttachedFile {
  id: number;
  patient_id: number;
  file_name: string;
  file_path: string;
  file_type: string;
  created_at?: string;
}

export interface Patient {
  id: number;
  full_name: string;
  name: string; // same as full_name
  age: number;
  gender?: string;
  email: string;
  phone: string;
  address?: string;
  amount_paid?: number;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  relationship_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  last_visit?: string;
  next_appointment?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PatientCreate {
  full_name: string;
  gender?: string;
  email: string;
  phone: string;
  address?: string;
  amount_paid?: number;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  relationship_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  last_visit?: string;
  next_appointment?: string;
}

export interface PatientUpdate {
  full_name?: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  amount_paid?: number;
  date_of_birth?: string;
  blood_type?: string;
  allergies?: string;
  chronic_conditions?: string;
  relationship_status?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  last_visit?: string;
  next_appointment?: string;
}

export class PatientsService extends ApiClient {
  // Get patient by ID
  async getPatient(id: number): Promise<Patient> {
    return this.request(`/api/patients/${id}`);
  }

  // Update patient
  async updatePatient(id: number, patientData: PatientUpdate): Promise<Patient> {
    return this.request(`/api/patients/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(patientData),
    });
  }

  // Create patient
  async createPatient(patientData: PatientCreate): Promise<Patient> {
    return this.request('/api/patients/', {
      method: 'POST',
      body: JSON.stringify(patientData),
    });
  }

  // Get all patients
  async getPatients(): Promise<Patient[]> {
    console.log('Fetching all patients with page_size=1000');
    const patients = await apiClient.getPatients(1, 1000);
    return patients as Patient[];
  }

  // Search patients
  async searchPatients(query: string): Promise<Patient[]> {
    return this.request(`/api/patients/search?q=${encodeURIComponent(query)}`);
  }

  // Delete patient
  async deletePatient(id: number): Promise<void> {
    return this.request(`/api/patients/${id}`, {
      method: 'DELETE',
    });
  }

  // Upload file for patient
  async uploadPatientFile(patientId: number, file: File): Promise<AttachedFile> {
    const formData = new FormData();
    formData.append('file', file);

    return this.request(`/api/patients/${patientId}/files`, {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set Content-Type for FormData
    });
  }

  // Get patient files
  async getPatientFiles(patientId: number): Promise<AttachedFile[]> {
    return this.request(`/api/patients/${patientId}/files`);
  }

  // Delete patient file
  async deletePatientFile(patientId: number, fileId: number): Promise<void> {
    return this.request(`/api/patients/${patientId}/files/${fileId}`, {
      method: 'DELETE',
    });
  }

  // Get file URL for viewing
  getFileUrl(patientId: number, fileId: number): string {
    const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';
    return `${base}/api/patients/${patientId}/files/${fileId}`;
  }

  // Download file with authentication
  async downloadFile(patientId: number, fileId: number, fileName: string): Promise<void> {
    try {
      const response = await fetch(this.getFileUrl(patientId, fileId), {
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('access_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to download file');
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to download file:', error);
      throw error;
    }
  }

  // Refresh files cache
  async refreshPatientFiles(patientId: number): Promise<any> {
    return this.request(`/api/patients/${patientId}/files/refresh`, {
      method: 'POST',
    });
  }

  // Search patients by phone number
  async searchPatientsByPhone(phoneNumber: string): Promise<any[]> {
    return this.request(`/api/patients/search/by-phone?phone=${encodeURIComponent(phoneNumber)}`);
  }
}

export const patientsService = new PatientsService();
