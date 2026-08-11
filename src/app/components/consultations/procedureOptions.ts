export interface ProcedureOption {
  value: string;
  labelKey: string;
}

export const DIAGNOSTIC_PROCEDURE_OPTIONS: ProcedureOption[] = [
  { value: 'ecg', labelKey: 'consultations.procedureEcg' },
  { value: 'echocardiogram', labelKey: 'consultations.procedureEchocardiogram' },
  { value: 'xray', labelKey: 'consultations.procedureXray' },
  { value: 'ultrasound', labelKey: 'consultations.procedureUltrasound' },
  { value: 'ctScan', labelKey: 'consultations.procedureCtScan' },
  { value: 'mri', labelKey: 'consultations.procedureMri' },
  { value: 'bloodTests', labelKey: 'consultations.procedureBloodTests' },
  { value: 'biopsy', labelKey: 'consultations.procedureBiopsy' },
  { value: 'endoscopy', labelKey: 'consultations.procedureEndoscopy' },
  { value: 'colonoscopy', labelKey: 'consultations.procedureColonoscopy' },
  { value: 'eeg', labelKey: 'consultations.procedureEeg' },
  { value: 'spirometry', labelKey: 'consultations.procedureSpirometry' },
  { value: 'urinalysis', labelKey: 'consultations.procedureUrinalysis' },
];

export const THERAPEUTIC_PROCEDURE_OPTIONS: ProcedureOption[] = [
  { value: 'surgery', labelKey: 'consultations.procedureSurgery' },
  { value: 'dialysis', labelKey: 'consultations.procedureDialysis' },
  { value: 'radiotherapy', labelKey: 'consultations.procedureRadiotherapy' },
  { value: 'chemotherapy', labelKey: 'consultations.procedureChemotherapy' },
  { value: 'catheterInsertion', labelKey: 'consultations.procedureCatheterInsertion' },
  { value: 'bloodTransfusion', labelKey: 'consultations.procedureBloodTransfusion' },
  { value: 'woundSuturing', labelKey: 'consultations.procedureWoundSuturing' },
  { value: 'castingSplinting', labelKey: 'consultations.procedureCastingSplinting' },
  { value: 'injection', labelKey: 'consultations.procedureInjection' },
  { value: 'vaccination', labelKey: 'consultations.procedureVaccination' },
  { value: 'physicalTherapy', labelKey: 'consultations.procedurePhysicalTherapy' },
];

// Merges checked options with free-typed "Other" text into one flat list for storage.
export function buildProcedureList(selected: string[], otherText: string): string[] {
  const other = otherText
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return [...selected, ...other];
}

// Maps a stored procedure value back to its translation key, for display.
// Values with no match are free-typed "Other" entries — i18next returns them unchanged.
export const PROCEDURE_LABEL_KEYS: Record<string, string> = Object.fromEntries(
  [...DIAGNOSTIC_PROCEDURE_OPTIONS, ...THERAPEUTIC_PROCEDURE_OPTIONS].map((option) => [
    option.value,
    option.labelKey,
  ])
);
