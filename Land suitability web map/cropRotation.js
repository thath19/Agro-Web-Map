export function getRotationPattern(soilType) {
  const patterns = {
    "Loam": "Season 1: Maize → Season 2: Legumes → Season 3: Vegetables",
    "Clay": "Season 1: Rice → Season 2: Green gram → Season 3: Sunflower",
    "Sandy": "Season 1: Groundnut → Season 2: Cowpea → Season 3: Onion",
  };
  return patterns[soilType] || "Generic rotation: Maize → Beans → Vegetables";
}
