import { ServiceArea } from "@/types/service";

/**
 * Formats service areas into a readable string grouped by county
 * @param areas Array of service areas
 * @returns Formatted string of areas grouped by county
 */
export function formatServiceAreas(areas: ServiceArea[]): string {
  if (areas.length === 0) return '';
  
  // Group by county using display names
  const countiesByName: { [key: string]: string[] } = {};
  areas.forEach(area => {
    // Use countyName if available, fallback to county ID
    const countyDisplay = area.countyName || area.county;
    
    if (!countiesByName[countyDisplay]) {
      countiesByName[countyDisplay] = [];
    }
    
    if (area.municipality) {
      // Use municipalityName if available, fallback to municipality ID
      const municipalityDisplay = area.municipalityName || area.municipality;
      countiesByName[countyDisplay].push(municipalityDisplay);
    }
  });

  // Format display
  const countyStrings = Object.entries(countiesByName).map(([county, municipalities]) => {
    if (municipalities.length === 0) {
      return county; // Whole county coverage
    }
    return `${municipalities.join(', ')} (${county})`;
  });

  return countyStrings.join(' • ');
}