import { CROPS, getCropById } from "@/constants/crops";

/**
 * Centralized mapping between Kisan Vyapar crop ids and the commodity names used
 * by official agricultural market data.
 *
 * IMPORTANT: These candidate names are directional and MUST be validated against
 * the verified AGMARKNET 2.0 commodity masters (`/commodities`) before the live
 * provider is enabled (real AGMARKNET access was not available during this
 * migration, so the mapping could not be verified against live master data).
 */

const CROP_TO_COMMODITIES: Record<string, string[]> = {
  wheat: ["Wheat"],
  rice: ["Paddy", "Rice", "Paddy(Common)", "Paddy(Basmati)"],
  maize: ["Maize"],
  bajra: ["Bajra"],
  jowar: ["Jowar"],
  tomato: ["Tomato"],
  onion: ["Onion"],
  potato: ["Potato"],
  brinjal: ["Brinjal"],
  chilli: ["Chilli", "Green Chilli", "Dry Chilli"],
  capsicum: ["Capsicum"],
  cabbage: ["Cabbage"],
  cauliflower: ["Cauliflower"],
  carrot: ["Carrot"],
  cucumber: ["Cucumber"],
  pumpkin: ["Pumpkin"],
  garlic: ["Garlic"],
  banana: ["Banana"],
  mango: ["Mango"],
  apple: ["Apple"],
  orange: ["Orange"],
  grapes: ["Grapes"],
  watermelon: ["Watermelon"],
  lemon: ["Lemon"],
  chickpea: ["Chana", "Bengal Gram"],
  green_gram: ["Moong", "Green Gram"],
  black_gram: ["Urad", "Black Gram"],
  red_lentil: ["Masoor"],
  groundnut: ["Groundnut"],
  soybean: ["Soyabean", "Soybean"],
  mustard: ["Mustard"],
  sesame: ["Sesamum", "Sesame"],
};

export function getCommoditiesForCrop(cropId: string): string[] {
  return CROP_TO_COMMODITIES[cropId] ?? [];
}

export function hasCropMapping(cropId: string): boolean {
  return CROP_TO_COMMODITIES[cropId] !== undefined;
}

export function getMappedCropIds(): string[] {
  return Object.keys(CROP_TO_COMMODITIES);
}

export function getCropName(cropId: string): string | undefined {
  return getCropById(cropId)?.name;
}

export function isKnownCrop(cropId: string): boolean {
  return CROPS.some((crop) => crop.id === cropId);
}
