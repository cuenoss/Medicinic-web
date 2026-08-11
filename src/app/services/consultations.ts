import { ApiClient } from './api';

export interface Consultation {
  id: number;
  patient_id: number;
  name: string;
  age: string;
  sex?: string;
  weight?: string;
  height?: string;
  contact?: string;
  complaint: string;
  when_started?: string;
  how_often?: string;
  getting_better?: string;
  triggers?: string;
  makes_better?: string;
  medications?: string;
  fever: boolean;
  pain: boolean;
  nausea: boolean;
  cough: boolean;
  dizziness: boolean;
  fatigue: boolean;
  allergies?: string;
  chronic_conditions?: string;
  surgeries?: string;
  family_history?: string;
  diagnosis?: string;
  diagnostic_procedures?: string[];
  therapeutic_procedures?: string[];
  date: string;
  doctor: string;
  created_at: string;
  updated_at?: string;
}

export interface ConsultationCreate {
  patient_id: number;
  name: string;
  age: string;
  sex?: string;
  weight?: string;
  height?: string;
  contact?: string;
  complaint: string;
  when_started?: string;
  how_often?: string;
  getting_better?: string;
  triggers?: string;
  makes_better?: string;
  medications?: string;
  fever: boolean;
  pain: boolean;
  nausea: boolean;
  cough: boolean;
  dizziness: boolean;
  fatigue: boolean;
  allergies?: string;
  chronic_conditions?: string;
  surgeries?: string;
  family_history?: string;
  diagnosis?: string;
  diagnostic_procedures?: string[];
  therapeutic_procedures?: string[];
  date: string;
  doctor: string;
}

export interface ConsultationUpdate {
  name?: string;
  age?: string;
  sex?: string;
  weight?: string;
  height?: string;
  contact?: string;
  complaint?: string;
  when_started?: string;
  how_often?: string;
  getting_better?: string;
  triggers?: string;
  makes_better?: string;
  medications?: string;
  fever?: boolean;
  pain?: boolean;
  nausea?: boolean;
  cough?: boolean;
  dizziness?: boolean;
  fatigue?: boolean;
  allergies?: string;
  chronic_conditions?: string;
  surgeries?: string;
  family_history?: string;
  diagnosis?: string;
  diagnostic_procedures?: string[];
  therapeutic_procedures?: string[];
  date?: string;
  doctor?: string;
}

export class ConsultationsService extends ApiClient {
  constructor() {
    super();
  }

  async createConsultation(consultationData: ConsultationCreate): Promise<Consultation> {
    return this.request<Consultation>('/api/consultations/', {
      method: 'POST',
      body: JSON.stringify(consultationData),
    });
  }

  async getPatientConsultations(patientId: number): Promise<Consultation[]> {
    return this.request<Consultation[]>(`/api/consultations/patient/${patientId}`);
  }

  async getConsultation(consultationId: number): Promise<Consultation> {
    return this.request<Consultation>(`/api/consultations/${consultationId}`);
  }

  async updateConsultation(consultationId: number, consultationData: ConsultationUpdate): Promise<Consultation> {
    return this.request<Consultation>(`/api/consultations/${consultationId}`, {
      method: 'PUT',
      body: JSON.stringify(consultationData),
    });
  }

  async deleteConsultation(consultationId: number): Promise<{ message: string }> {
    return this.request<{ message: string }>(`/api/consultations/${consultationId}`, {
      method: 'DELETE',
    });
  }
}

export const consultationsService = new ConsultationsService();
