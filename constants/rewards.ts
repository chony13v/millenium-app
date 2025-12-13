import { type Reward } from "@/types/rewards";

export const FALLBACK_REWARDS: Reward[] = [
  

  {
    id: "10% de cashback en tu próxima compra",
    title: "10% de cashback en tu próxima compra",
    description: "Reembolsa hasta $5 en compras elegibles.",
    cost: 100,
    merchantId: "partner_cashback",
    merchantName: "Comercio aliado Cashback",
  },
  {
    id: "20% off en tu supermercado favorito",
    title: "20% off en tu supermercado favorito",
    description: "Canje válido en locales participantes. Vence en 30 días.",
    cost: 100,
    merchantId: "super_local",
    merchantName: "Supermercado aliado",
  },
  {
    id: "Bono de $5 en efectivo",
    title: "Bono de $5 en efectivo",
    description: "Se acredita a tu cuenta de billetera en 48h.",
    cost: 1200,
    merchantId: "billetera_fc",
    merchantName: "Billetera Ciudad FC",
  },
  {
    id: "Kit deportivo básico",
    title: "Kit deportivo básico",
    description: "Incluye botella y toalla Ciudad FC.",
    cost: 1500,
    merchantId: "ciudad_fc_store",
    merchantName: "Tienda Ciudad FC",
  },
].sort((a, b) => a.cost - b.cost);
