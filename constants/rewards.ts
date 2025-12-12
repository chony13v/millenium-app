import { type Reward } from "@/types/rewards";

export const FALLBACK_REWARDS: Reward[] = [
  {
    id: "reward_4",
    title: "Entrada doble a evento municipal",
    description: "Válido para eventos gratuitos destacados del mes.",
    cost: 100,
    merchantId: "alcaldia_riobamba",
    merchantName: "Alcaldía de Riobamba",
    cityId: "riobamba",
  },
  {
    id: "reward_5",
    title: "10% de cashback en tu próxima compra",
    description: "Reembolsa hasta $5 en compras elegibles.",
    cost: 100,
    merchantId: "partner_cashback",
    merchantName: "Comercio aliado Cashback",
  },
  {
    id: "reward_1",
    title: "20% off en tu supermercado favorito",
    description: "Canje válido en locales participantes. Vence en 30 días.",
    cost: 100,
    merchantId: "super_local",
    merchantName: "Supermercado aliado",
  },
  {
    id: "reward_2",
    title: "Bono de $5 en efectivo",
    description: "Se acredita a tu cuenta de billetera en 48h.",
    cost: 1200,
    merchantId: "billetera_fc",
    merchantName: "Billetera Ciudad FC",
  },
  {
    id: "reward_3",
    title: "Kit deportivo básico",
    description: "Incluye botella y toalla Ciudad FC.",
    cost: 1500,
    merchantId: "ciudad_fc_store",
    merchantName: "Tienda Ciudad FC",
  },
].sort((a, b) => a.cost - b.cost);
