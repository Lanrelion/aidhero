import emergencyDataRaw from '../../../data/emergency-numbers.json';

// Handle Turbopack JSON import issue gracefully
const emergencyData = ((emergencyDataRaw as any).default || emergencyDataRaw) as any;

export function getPrimaryEmergencyNumber(detectedState: string | null): string {
  // 1. Try state-specific general emergency number first (e.g. LASEMA in Lagos)
  if (detectedState && emergencyData.states[detectedState]) {
    const stateContacts = emergencyData.states[detectedState].contacts;
    const general = stateContacts.find((c: any) => c.type === 'general');
    if (general) return general.number;
    
    // Fallback to police if no general line exists for state
    const police = stateContacts.find((c: any) => c.type === 'police');
    if (police) return police.number;
  }

  // 2. National Fallback
  // Try to find national-112 first, or fallback to national-199
  const nationalGeneral = emergencyData.national.find((c: any) => c.type === 'general' && c.number === '112');
  if (nationalGeneral) return nationalGeneral.number;

  // Final fallback
  return "199";
}
