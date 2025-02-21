// Validation Patterns
const VALIDATION_PATTERNS = {
    DATE: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    PHONE: /^\d{10}$/,
  };
  
  // Form Constants
  const FORM_CONSTANTS = {
    AGE_RANGE: { min: 13, max: 20 },
    PHONE_LENGTH: 10,
    MAX_AFFILIATION_LENGTH: 50,
  };
  
  // Color Constants
  const COLORS = {
    GRADIENT: ["#2b2d42", "#3498db"],
    TEXT_WHITE: "#FFFFFF",
    TEXT_BLACK: "#000000",
    ACTIVITY_INDICATOR: "#4630EB",
  };
  
  // Font Constants
  const FONTS = {
    OUTFIT_BOLD: "outfit-bold",
    OUTFIT_MEDIUM: "outfit-medium",
    OUTFIT_REGULAR: "outfit-regular",
    OUTFIT_SEMIBOLD: "outfit-semibold",
  };
  
  // Static Data
  const CITIES = [
    { key: "Ambato", label: "Ambato" },
    { key: "Guayaquil", label: "Guayaquil" },
    { key: "Manta", label: "Manta" },
    { key: "Quito", label: "Quito" },
    { key: "Riobamba", label: "Riobamba" },
  ].sort((a, b) => a.label.localeCompare(b.label));
  
  const POSITIONS = [
    { key: "Arquero", label: "Arquero" },
    { key: "Defensa", label: "Defensa" },
    { key: "Mediocampista", label: "Mediocampista" },
    { key: "Delantero", label: "Delantero" },
  ];
  
  const CITY_DATE_TIMES: { [key: string]: { key: string; label: string }[] } = {
    Ambato: [
      {
        key: "Ambato, 25 de abril - 8:00 am",
        label: "Ambato, 25 de abril - 8:00 am",
      },
      {
        key: "Ambato, 25 de abril - 2:00 pm",
        label: "Ambato, 25 de abril - 2:00 pm",
      },
      {
        key: "Ambato, 26 de abril - 8:00 am",
        label: "Ambato, 26 de abril - 8:00 am",
      },
    ],
    Guayaquil: [
      {
        key: "Guayaquil, 25 de abril - 8:00 am",
        label: "Guayaquil, 25 de abril - 8:00 am",
      },
      {
        key: "Guayaquil, 25 de abril - 2:00 pm",
        label: "Guayaquil, 25 de abril - 2:00 pm",
      },
      {
        key: "Guayaquil, 26 de abril - 8:00 am",
        label: "Guayaquil, 26 de abril - 8:00 am",
      },
    ],
    Manta: [
      {
        key: "Manta, 25 de abril - 8:00 am",
        label: "Manta, 25 de abril - 8:00 am",
      },
      {
        key: "Manta, 25 de abril - 2:00 pm",
        label: "Manta, 25 de abril - 2:00 pm",
      },
      {
        key: "Manta, 26 de abril - 8:00 am",
        label: "Manta, 26 de abril - 8:00 am",
      },
    ],
    Quito: [
      {
        key: "Quito, 25 de abril - 8:00 am",
        label: "Quito, 25 de abril - 8:00 am",
      },
      {
        key: "Quito, 25 de abril - 2:00 pm",
        label: "Quito, 25 de abril - 2:00 pm",
      },
      {
        key: "Quito, 26 de abril - 8:00 am",
        label: "Quito, 26 de abril - 8:00 am",
      },
    ],
    Riobamba: [
      {
        key: "Riobamba, 25 de abril - 8:00 am",
        label: "Riobamba, 25 de abril - 8:00 am",
      },
      {
        key: "Riobamba, 25 de abril - 2:00 pm",
        label: "Riobamba, 25 de abril - 2:00 pm",
      },
      {
        key: "Riobamba, 26 de abril - 8:00 am",
        label: "Riobamba, 26 de abril - 8:00 am",
      },
    ],
  };
  
  export {
    FORM_CONSTANTS,
    VALIDATION_PATTERNS,
    COLORS,
    FONTS,
    CITIES,
    POSITIONS,
    CITY_DATE_TIMES,
  };