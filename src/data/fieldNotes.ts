export type FieldLocation = {
  id: string;
  region: "Taiwan" | "SF Bay Area";
  place: string;
  prompt: string;
  coordinates: string;
  imageUrl?: string;
  imageAlt?: string;
  source: string;
  url?: string;
};

export const fieldLocations: FieldLocation[] = [
  {
    id: "yilan-coast",
    region: "Taiwan",
    place: "Yilan coast",
    prompt: "Trace the edge where mist, concrete, and tidal plants overlap.",
    coordinates: "24.7N / 121.8E approx.",
    source: "local field note database",
  },
  {
    id: "taipei-basin",
    region: "Taiwan",
    place: "Taipei basin",
    prompt: "Compare elevated routes, night markets, and soft infrastructure.",
    coordinates: "25.0N / 121.5E approx.",
    source: "local field note database",
  },
  {
    id: "alishan-forest-rail",
    region: "Taiwan",
    place: "Alishan forest rail",
    prompt: "Observe slow curvature, timber memory, and altitude as material.",
    coordinates: "23.5N / 120.8E approx.",
    source: "local field note database",
  },
  {
    id: "tainan-alleys",
    region: "Taiwan",
    place: "Tainan alleys",
    prompt: "Look for repair details, thresholds, tiles, and hand-built shade.",
    coordinates: "23.0N / 120.2E approx.",
    source: "local field note database",
  },
  {
    id: "sutro-baths",
    region: "SF Bay Area",
    place: "Sutro Baths",
    prompt: "Read erosion, ruins, fog, and Pacific edge conditions.",
    coordinates: "37.8N / 122.5W approx.",
    source: "local field note database",
  },
  {
    id: "albany-bulb",
    region: "SF Bay Area",
    place: "Albany Bulb",
    prompt: "Map improvised structures, landfill ecologies, and informal paths.",
    coordinates: "37.9N / 122.3W approx.",
    source: "local field note database",
  },
  {
    id: "stanford-dish",
    region: "SF Bay Area",
    place: "Stanford Dish",
    prompt: "Watch horizon data, walking loops, grass movement, and antenna scale.",
    coordinates: "37.4N / 122.2W approx.",
    source: "local field note database",
  },
  {
    id: "berkeley-marina",
    region: "SF Bay Area",
    place: "Berkeley Marina",
    prompt: "Follow wind, sail hardware, landfill geometry, and shore vegetation.",
    coordinates: "37.9N / 122.3W approx.",
    source: "local field note database",
  },
];

export const fieldMaterials = [
  "humidity as actuator / wood remembers water",
  "perception shifts when scale loses its anchor",
  "assembly logic: align, constrain, release",
  "data is a field before it becomes a chart",
  "handwork leaves calibration marks",
];
