/*
Este archivo es el registro centralizado de features del producto.
Es la única fuente de verdad para IDs, labels, colores y tablas fuente de cada feature.
Para agregar una nueva feature solo hay que añadir un objeto en FEATURE_REGISTRY.

Funciones exportadas:
- getFeatureById: busca una feature por su ID en el registro.
- isValidFeatureId: type guard para validar que un string es un FeatureId conocido.
- isValidDimension: type guard para validar la dimensión de análisis.
*/

export type FeatureId = "split_expenses" | "installments";
export type FeatureSource = "transaction_splits" | "installment_plans";
export type FeatureDimension = "users" | "count";

export type FeatureConfig = {
  id: FeatureId;
  label: string;
  color: string;
  source: FeatureSource;
};

export type ChartPoint = {
  date: string;
  value: number;
};

export const FEATURE_REGISTRY: FeatureConfig[] = [
  {
    id: "split_expenses",
    label: "Dividir Gastos",
    color: "#f16f84",
    source: "transaction_splits",
  },
  {
    id: "installments",
    label: "Cuotas",
    color: "#aeb6fb",
    source: "installment_plans",
  },
];

export function getFeatureById(id: FeatureId): FeatureConfig | undefined {
  return FEATURE_REGISTRY.find((f) => f.id === id);
}

export function isValidFeatureId(id: string): id is FeatureId {
  return FEATURE_REGISTRY.some((f) => f.id === id);
}

export function isValidDimension(dim: string): dim is FeatureDimension {
  return dim === "users" || dim === "count";
}
