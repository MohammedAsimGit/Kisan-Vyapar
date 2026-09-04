export const CROP_CATEGORIES = {
  CEREALS: "cereals",
  VEGETABLES: "vegetables",
  FRUITS: "fruits",
  PULSES: "pulses",
  OILSEEDS: "oilseeds",
} as const;

export type CropCategory = (typeof CROP_CATEGORIES)[keyof typeof CROP_CATEGORIES];

export const CROP_CATEGORY_VALUES = Object.values(CROP_CATEGORIES);

export const CROP_CATEGORY_LABELS: Record<CropCategory, string> = {
  cereals: "Cereals",
  vegetables: "Vegetables",
  fruits: "Fruits",
  pulses: "Pulses",
  oilseeds: "Oilseeds",
};

export interface CropDefinition {
  id: string;
  name: string;
  category: CropCategory;
  emoji?: string;
  popular?: boolean;
  varieties?: string[];
}

export const CROPS: CropDefinition[] = [
  // Cereals
  { id: "wheat", name: "Wheat", category: CROP_CATEGORIES.CEREALS, popular: true, emoji: "🌾" },
  { id: "rice", name: "Rice", category: CROP_CATEGORIES.CEREALS, popular: true, emoji: "🍚" },
  { id: "maize", name: "Maize", category: CROP_CATEGORIES.CEREALS, popular: true, emoji: "🌽" },
  { id: "bajra", name: "Bajra", category: CROP_CATEGORIES.CEREALS, emoji: "🌾" },
  { id: "jowar", name: "Jowar", category: CROP_CATEGORIES.CEREALS, emoji: "🌾" },
  // Vegetables
  { id: "tomato", name: "Tomato", category: CROP_CATEGORIES.VEGETABLES, popular: true, emoji: "🍅", varieties: ["Hybrid", "Desi / Local"] },
  { id: "onion", name: "Onion", category: CROP_CATEGORIES.VEGETABLES, popular: true, emoji: "🧅", varieties: ["Red", "White", "Golden"] },
  { id: "potato", name: "Potato", category: CROP_CATEGORIES.VEGETABLES, popular: true, emoji: "🥔" },
  { id: "brinjal", name: "Brinjal", category: CROP_CATEGORIES.VEGETABLES, emoji: "🍆" },
  { id: "chilli", name: "Chilli", category: CROP_CATEGORIES.VEGETABLES, emoji: "🌶️", varieties: ["Green", "Red dry"] },
  { id: "capsicum", name: "Capsicum", category: CROP_CATEGORIES.VEGETABLES, emoji: "🫑" },
  { id: "cabbage", name: "Cabbage", category: CROP_CATEGORIES.VEGETABLES, emoji: "🥬" },
  { id: "cauliflower", name: "Cauliflower", category: CROP_CATEGORIES.VEGETABLES, emoji: "🥦" },
  { id: "carrot", name: "Carrot", category: CROP_CATEGORIES.VEGETABLES, emoji: "🥕" },
  { id: "cucumber", name: "Cucumber", category: CROP_CATEGORIES.VEGETABLES, emoji: "🥒" },
  { id: "pumpkin", name: "Pumpkin", category: CROP_CATEGORIES.VEGETABLES, emoji: "🎃" },
  { id: "garlic", name: "Garlic", category: CROP_CATEGORIES.VEGETABLES, emoji: "🧄" },
  // Fruits
  { id: "banana", name: "Banana", category: CROP_CATEGORIES.FRUITS, emoji: "🍌", varieties: ["Robusta", "Grand Naine"] },
  { id: "mango", name: "Mango", category: CROP_CATEGORIES.FRUITS, emoji: "🥭", varieties: ["Alphonso", "Kesar", "Totapuri"] },
  { id: "apple", name: "Apple", category: CROP_CATEGORIES.FRUITS, emoji: "🍎", varieties: ["Shimla", "Kashmiri"] },
  { id: "orange", name: "Orange", category: CROP_CATEGORIES.FRUITS, emoji: "🍊", varieties: ["Nagpur", "Kinnow"] },
  { id: "grapes", name: "Grapes", category: CROP_CATEGORIES.FRUITS, emoji: "🍇" },
  { id: "watermelon", name: "Watermelon", category: CROP_CATEGORIES.FRUITS, emoji: "🍉" },
  { id: "lemon", name: "Lemon", category: CROP_CATEGORIES.FRUITS, emoji: "🍋" },
  // Pulses
  { id: "chickpea", name: "Chickpea (Chana)", category: CROP_CATEGORIES.PULSES, emoji: "🫘" },
  { id: "green_gram", name: "Green Gram (Moong)", category: CROP_CATEGORIES.PULSES, emoji: "🫘" },
  { id: "black_gram", name: "Black Gram (Urad)", category: CROP_CATEGORIES.PULSES, emoji: "🫘" },
  { id: "red_lentil", name: "Red Lentil (Masoor)", category: CROP_CATEGORIES.PULSES, emoji: "🫘" },
  // Oilseeds
  { id: "groundnut", name: "Groundnut", category: CROP_CATEGORIES.OILSEEDS, emoji: "🥜", varieties: ["Kadiri", "TAG 24"] },
  { id: "soybean", name: "Soybean", category: CROP_CATEGORIES.OILSEEDS, emoji: "🫘", varieties: ["JS-335", "JS-9305"] },
  { id: "mustard", name: "Mustard", category: CROP_CATEGORIES.OILSEEDS, emoji: "🌼" },
  { id: "sesame", name: "Sesame (Til)", category: CROP_CATEGORIES.OILSEEDS, emoji: "🌱" },
];

const cropMap = new Map<string, CropDefinition>(CROPS.map((crop) => [crop.id, crop]));

export function getCropById(id: string): CropDefinition | undefined {
  return cropMap.get(id);
}

export function isSupportedCrop(id: string): boolean {
  return cropMap.has(id);
}

export const SUPPORTED_CROP_IDS = CROPS.map((crop) => crop.id);

export const POPULAR_CROPS = CROPS.filter((crop) => crop.popular);

export function getCropVarieties(id: string): string[] | undefined {
  return getCropById(id)?.varieties;
}
