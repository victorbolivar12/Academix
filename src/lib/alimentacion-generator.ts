import { computeCalories, MEAL_TYPES } from "@/lib/alimentacion";
import type { MealType } from "@/lib/types";

export interface GeneratorFood {
  id: number;
  nombre: string;
  categoria: string;
  calorias_por_100g: number;
}

export interface GeneratedRecord {
  fecha: string;
  tipo_comida: MealType;
  alimento_id: number;
  nombre: string;
  calorias_por_100g: number;
  gramos: number;
  calorias: number;
}

export type GenerationResult =
  | { ok: true; records: GeneratedRecord[] }
  | { ok: false; error: string };

interface MealConfig {
  targetCalories: number;
  proteinGrams: number;
  veggieGrams: number;
}

const MEAL_CONFIG: Record<MealType, MealConfig> = {
  desayuno: { targetCalories: 650, proteinGrams: 150, veggieGrams: 200 },
  almuerzo: { targetCalories: 800, proteinGrams: 220, veggieGrams: 250 },
  cena: { targetCalories: 650, proteinGrams: 200, veggieGrams: 250 },
};

const BREAKFAST_PROTEIN_NAMES = ["Huevo", "Atún en agua", "Pechuga de pollo"];

const LUNCH_PROTEIN_NAMES = [
  "Pechuga de pollo",
  "Muslo de pollo",
  "Carne de res",
  "Carne de cerdo",
  "Salmón",
  "Atún en agua",
  "Huevo",
  "Lentejas cocidas",
];

const PREFERRED_VEGGIE_NAMES = [
  "Ensalada",
  "Brócoli",
  "Espinaca",
  "Zanahoria",
  "Tomate",
  "Lechuga",
  "Pepino",
  "Calabacín",
  "Pimiento",
  "Champiñón",
];

const BREAKFAST_CARB_NAMES = ["Pan integral", "Pan blanco", "Tortilla de maíz"];

function cycle<T>(items: T[], index: number): T {
  return items[index % items.length];
}

function byCategory(foods: GeneratorFood[], category: string): GeneratorFood[] {
  return foods.filter((food) => food.categoria === category);
}

function byNames(foods: GeneratorFood[], names: string[]): GeneratorFood[] {
  const normalized = new Set(names.map((name) => name.toLowerCase()));
  return foods.filter((food) =>
    normalized.has(food.nombre.toLowerCase()),
  );
}

function buildMeal(
  fecha: string,
  meal: MealType,
  protein: GeneratorFood,
  veggie: GeneratorFood,
  carb: GeneratorFood,
): GeneratedRecord[] {
  const config = MEAL_CONFIG[meal];

  const baseCalories =
    (protein.calorias_por_100g * config.proteinGrams) / 100 +
    (veggie.calorias_por_100g * config.veggieGrams) / 100;

  const carbGrams = Math.min(
    450,
    Math.max(
      60,
      Math.round(
        ((config.targetCalories - baseCalories) / carb.calorias_por_100g) * 100,
      ),
    ),
  );

  return [
    {
      fecha,
      tipo_comida: meal,
      alimento_id: protein.id,
      nombre: protein.nombre,
      calorias_por_100g: protein.calorias_por_100g,
      gramos: config.proteinGrams,
      calorias: computeCalories(protein.calorias_por_100g, config.proteinGrams),
    },
    {
      fecha,
      tipo_comida: meal,
      alimento_id: veggie.id,
      nombre: veggie.nombre,
      calorias_por_100g: veggie.calorias_por_100g,
      gramos: config.veggieGrams,
      calorias: computeCalories(veggie.calorias_por_100g, config.veggieGrams),
    },
    {
      fecha,
      tipo_comida: meal,
      alimento_id: carb.id,
      nombre: carb.nombre,
      calorias_por_100g: carb.calorias_por_100g,
      gramos: carbGrams,
      calorias: computeCalories(carb.calorias_por_100g, carbGrams),
    },
  ];
}

export function generateWeekPlan(
  foods: GeneratorFood[],
  days: string[],
): GenerationResult {
  const proteins = byCategory(foods, "Proteínas");
  const carbs = byCategory(foods, "Carbohidratos");
  const veggies = byCategory(foods, "Verduras");

  if (proteins.length === 0 || carbs.length === 0 || veggies.length === 0) {
    return {
      ok: false,
      error:
        "El catálogo debe tener proteínas, carbohidratos y vegetales para generar el plan",
    };
  }

  const breakfastProteins = byNames(proteins, BREAKFAST_PROTEIN_NAMES);
  const lunchProteins = byNames(proteins, LUNCH_PROTEIN_NAMES);
  const preferredVeggies = byNames(veggies, PREFERRED_VEGGIE_NAMES);
  const breakfastCarbs = byNames(carbs, BREAKFAST_CARB_NAMES);

  const breakfastProteinPool =
    breakfastProteins.length > 0 ? breakfastProteins : proteins;
  const lunchProteinPool =
    lunchProteins.length > 0 ? lunchProteins : proteins;
  const veggiePool = preferredVeggies.length > 0 ? preferredVeggies : veggies;
  const breakfastCarbPool =
    breakfastCarbs.length > 0 ? breakfastCarbs : carbs;

  const records: GeneratedRecord[] = [];

  days.forEach((fecha, dayIndex) => {
    const dayRecords: GeneratedRecord[] = [];
    let dinnerCarbName = "";

    for (const meal of MEAL_TYPES) {
      let protein: GeneratorFood;
      let carb: GeneratorFood;

      if (meal === "desayuno") {
        protein = cycle(breakfastProteinPool, dayIndex);
        carb = cycle(breakfastCarbPool, dayIndex);
      } else if (meal === "cena") {
        protein = cycle(breakfastProteinPool, dayIndex + 1);
        carb = cycle(carbs, dayIndex + 3);
        dinnerCarbName = carb.nombre;
      } else {
        protein = cycle(lunchProteinPool, dayIndex * 3 + 1);
        carb = cycle(carbs, dayIndex + 1);
      }

      const veggie = cycle(
        veggiePool,
        dayIndex + MEAL_TYPES.indexOf(meal) * 2 + 1,
      );

      dayRecords.push(...buildMeal(fecha, meal, protein, veggie, carb));
    }

    const dayTotal = dayRecords.reduce((sum, item) => sum + item.calorias, 0);
    if (dayTotal < 2000 || dayTotal > 2200) {
      const dinnerCarb = dayRecords.find(
        (item) =>
          item.tipo_comida === "cena" && item.nombre === dinnerCarbName,
      );
      if (dinnerCarb) {
        const delta = 2100 - dayTotal;
        const extraGrams = Math.round(
          (delta / dinnerCarb.calorias_por_100g) * 100,
        );
        dinnerCarb.gramos = Math.max(
          40,
          Math.min(500, dinnerCarb.gramos + extraGrams),
        );
        dinnerCarb.calorias = computeCalories(
          dinnerCarb.calorias_por_100g,
          dinnerCarb.gramos,
        );
      }
    }

    records.push(...dayRecords);
  });

  return { ok: true, records };
}
