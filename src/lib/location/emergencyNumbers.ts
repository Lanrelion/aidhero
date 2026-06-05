import emergencyData from '../../../data/emergency-numbers.json';
import type { EmergencyContact, EmergencyNumbersSchema } from '@/types/emergency';

const data = emergencyData as EmergencyNumbersSchema;

// Simple rough bounding boxes for the 6 seeded states to allow OFFLINE reverse geocoding
const stateBounds = [
  { state: 'Lagos', minLat: 6.3, maxLat: 6.8, minLng: 3.1, maxLng: 4.2 },
  { state: 'Abuja (FCT)', minLat: 8.6, maxLat: 9.3, minLng: 6.7, maxLng: 7.6 },
  { state: 'Rivers', minLat: 4.2, maxLat: 5.8, minLng: 6.3, maxLng: 7.6 },
  { state: 'Kano', minLat: 10.5, maxLat: 12.5, minLng: 7.6, maxLng: 9.3 },
  { state: 'Oyo', minLat: 7.0, maxLat: 9.2, minLng: 2.7, maxLng: 4.6 },
  { state: 'Kaduna', minLat: 9.0, maxLat: 11.5, minLng: 6.0, maxLng: 8.8 }
];

function getStateFromCoords(lat: number, lng: number): string | null {
  for (const bounds of stateBounds) {
    if (lat >= bounds.minLat && lat <= bounds.maxLat && lng >= bounds.minLng && lng <= bounds.maxLng) {
      return bounds.state;
    }
  }
  return null;
}

export async function getEmergencyNumbers(state?: string): Promise<EmergencyContact[]> {
  if (state && data.states[state]) {
    // Return state contacts. If less than 3, pad with national numbers.
    const stateContacts = data.states[state].contacts;
    const combined = [...stateContacts, ...data.national];
    
    // Deduplicate by ID just in case
    const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
    return unique.slice(0, 3);
  }

  // If no state provided, try geolocation
  if (typeof window !== 'undefined' && 'geolocation' in navigator) {
    try {
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
      });
      
      const detectedState = getStateFromCoords(position.coords.latitude, position.coords.longitude);
      if (detectedState && data.states[detectedState]) {
        const stateContacts = data.states[detectedState].contacts;
        const combined = [...stateContacts, ...data.national];
        const unique = Array.from(new Map(combined.map(item => [item.id, item])).values());
        return unique.slice(0, 3);
      }
    } catch (error) {
      // Geolocation denied, timed out, or unavailable
      console.warn("Geolocation failed or denied, falling back to national numbers.");
    }
  }

  // Fallback to national
  return data.national.slice(0, 3);
}
