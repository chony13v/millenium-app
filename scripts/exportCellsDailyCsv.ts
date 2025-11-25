import { getApp, getApps, initializeApp } from "firebase/app";
import { collection, getDocs, getFirestore, query, where } from "firebase/firestore";
import fs from "fs";
import path from "path";

const REQUIRED_ENV_KEYS = [
  "EXPO_PUBLIC_FIREBASE_API_KEY",
  "EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN",
  "EXPO_PUBLIC_FIREBASE_PROJECT_ID",
  "EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET",
  "EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID",
  "EXPO_PUBLIC_FIREBASE_APP_ID",
];

type CliArgs = {
  date: string;
  cityId: string;
};

type CellsDailyDoc = {
  date: string;
  cityId: string | null;
  parishId: string | null;
  neighborhoodSlug: string | null;
  geohash: string;
  pings: number;
  uniqueUsers: number;
  medianAccuracy: number;
  hourlyHistogram?: number[];
  isPublishable?: boolean;
};

const validateEnv = (): void => {
  const missing = REQUIRED_ENV_KEYS.filter((key) => !process.env[key]);

  if (missing.length) {
    throw new Error(
      `Faltan variables de entorno requeridas: ${missing.join(", ")}. ` +
        "Verifica tu configuración de Firebase antes de exportar."
    );
  }
};

const parseArgs = (): CliArgs => {
  const args = process.argv.slice(2);
  const result: Partial<CliArgs> = {};

  args.forEach((arg) => {
    const [rawKey, value] = arg.split("=");
    const key = rawKey?.replace(/^--/, "");

    if (key === "date") result.date = value;
    if (key === "cityId") result.cityId = value;
  });

  if (!result.date || !/^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
    throw new Error(
      "Argumento --date inválido o faltante. Usa el formato YYYY-MM-DD."
    );
  }

  if (!result.cityId) {
    throw new Error("Argumento --cityId es obligatorio (ej. riobamba).");
  }

  return result as CliArgs;
};

const initDb = () => {
  const firebaseConfig = {
    apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
  };

  const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
  return getFirestore(app);
};

const ensureHistogram = (histogram?: number[]): number[] => {
  const base = Array.isArray(histogram) ? [...histogram] : [];

  while (base.length < 24) {
    base.push(0);
  }

  return base.slice(0, 24);
};

const fetchCellsDaily = async (
  db: ReturnType<typeof getFirestore>,
  { date, cityId }: CliArgs
): Promise<CellsDailyDoc[]> => {
  const cellsRef = collection(db, "cellsDaily");
  const q = query(
    cellsRef,
    where("date", "==", date),
    where("cityId", "==", cityId),
    where("isPublishable", "==", true)
  );
  const snapshot = await getDocs(q);

  return snapshot.docs
    .map((doc) => {
      const data = doc.data() as CellsDailyDoc;
      return { ...data, geohash: data.geohash ?? doc.id };
    })
    .sort((a, b) => (a.geohash ?? "").localeCompare(b.geohash ?? ""));
};

const formatCsvValue = (value: string | number): string => {
  const stringValue = typeof value === "string" ? value : String(value);
  const escaped = stringValue.replace(/"/g, '""');

  if (/[",\n]/.test(escaped)) {
    return `"${escaped}"`;
  }

  return escaped;
};

const buildCsv = (records: CellsDailyDoc[]): string => {
  const headers = [
    "date",
    "cityId",
    "parishId",
    "neighborhoodSlug",
    "geohash",
    "pings",
    "uniqueUsers",
    "medianAccuracy",
    ...Array.from({ length: 24 }, (_, i) => `hour_${i}`),
  ];

  const rows = records.map((record) => {
    const histogram = ensureHistogram(record.hourlyHistogram);

    return [
      record.date,
      record.cityId ?? "",
      record.parishId ?? "",
      record.neighborhoodSlug ?? "",
      record.geohash,
      record.pings ?? 0,
      record.uniqueUsers ?? 0,
      record.medianAccuracy ?? 0,
      ...histogram,
    ]
      .map((value) => formatCsvValue(value))
      .join(",");
  });

  return [headers.join(","), ...rows].join("\n");
};

const writeCsv = (date: string, content: string): string => {
  const outputDir = path.join(process.cwd(), "exports");
  const filename = `cellsDaily_${date.replace(/-/g, "")}.csv`;
  const outputPath = path.join(outputDir, filename);

  fs.mkdirSync(outputDir, { recursive: true });
  fs.writeFileSync(outputPath, content);

  return outputPath;
};

const main = async () => {
  try {
    const args = parseArgs();
    validateEnv();

    console.log("Iniciando exporte...");
    const db = initDb();
    const records = await fetchCellsDaily(db, args);

    if (!records.length) {
      console.log("No se encontraron registros para exportar.");
      return;
    }

    const csv = buildCsv(records);
    const outputPath = writeCsv(args.date, csv);

    console.log(`Exportación lista: ${outputPath}`);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Error desconocido durante el exporte";
    console.error(`Fallo al exportar cellsDaily: ${message}`);
    process.exit(1);
  }
};

void main();