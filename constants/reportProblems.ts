import type { ProblemType } from "@/types/reports";

export const PROBLEM_TYPES: { id: ProblemType; label: string }[] = [
  { id: "basura", label: "Basura" },
  { id: "huecos", label: "Huecos" },
  { id: "alumbrado", label: "Alumbrado" },
  { id: "infraestructura", label: "Infraestructura" },
  { id: "seguridad", label: "Seguridad" },
  { id: "otros", label: "Otros" },
];
