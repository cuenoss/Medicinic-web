import { ApiClient } from './api';

export interface ClinicSettings {
  clinic_name?: string;
  clinic_address?: string;
  clinic_phone?: string;
  clinic_email?: string;
  clinic_website?: string;
  working_hours?: Record<string, { start: string; end: string }>;
  notification_settings?: {
    email_notifications: boolean;
    sms_notifications: boolean;
    appointment_reminders: boolean;
    reminder_hours_before: number;
  };
}

export class SettingsService extends ApiClient {
  async getAllSettings(): Promise<Record<string, any>> {
    try {
      return await this.request<Record<string, any>>('/api/settings/');
    } catch {
      return {};
    }
  }

  async updateSetting(key: string, value: any): Promise<void> {
    try {
      await this.request(`/api/settings/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ value }),
      });
    } catch {
      // If setting doesn't exist, create it
      await this.request('/api/settings/', {
        method: 'POST',
        body: JSON.stringify({ key, value, value_type: typeof value === 'object' ? 'json' : 'string' }),
      });
    }
  }

  async bulkUpdate(updates: Record<string, any>): Promise<void> {
    await this.request('/api/settings/bulk-update', {
      method: 'POST',
      body: JSON.stringify({ updates }),
    });
  }

  async initializeDefaults(): Promise<void> {
    await this.request('/api/settings/initialize', { method: 'POST' });
  }
}

export const settingsService = new SettingsService();
