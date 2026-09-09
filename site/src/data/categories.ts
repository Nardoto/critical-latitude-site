export const categorySlugs = [
  'earthquakes', 'volcanoes', 'tsunamis', 'landslides-and-lahars',
  'glaciers-and-sea-level', 'extreme-weather', 'infrastructure', 'preparedness',
] as const;
export type Category = typeof categorySlugs[number];
export const categories: Record<Category, { name: string; description: string }> = {
  earthquakes: { name: 'Earthquakes', description: 'Faults, shaking, and what the published record can tell us.' },
  volcanoes: { name: 'Volcanoes', description: 'Eruptions, unstable slopes, and the limits of monitoring.' },
  tsunamis: { name: 'Tsunamis', description: 'Coastal risk, evacuation routes, and the distance to safety.' },
  'landslides-and-lahars': { name: 'Landslides & lahars', description: 'What moves downhill, and the communities in its path.' },
  'glaciers-and-sea-level': { name: 'Glaciers & sea level', description: 'Changing ice and the questions it raises for coastal life.' },
  'extreme-weather': { name: 'Extreme weather', description: 'Climate signals, weather claims, and useful questions about uncertainty.' },
  infrastructure: { name: 'Infrastructure', description: 'Water, roads, power, and the systems a household depends on.' },
  preparedness: { name: 'Preparedness', description: 'Turn a clearer understanding of risk into a practical household plan.' },
};
