import type { LanguageMap } from './scenario';

export type EmergencyType = 'medical' | 'police' | 'fire' | 'general';

export interface EmergencyContact {
  id: string;
  name: string;
  name_translations: LanguageMap;
  number: string;
  type: EmergencyType;
}

export interface StateEmergencyData {
  state: string;
  contacts: EmergencyContact[];
}

export interface EmergencyNumbersSchema {
  national: EmergencyContact[];
  states: Record<string, StateEmergencyData>;
}
