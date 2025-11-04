const VALIDATION_PATTERNS = {
    DATE: /^(\d{2})\/(\d{2})\/(\d{4})$/,
    EMAIL: /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/,
    PHONE: /^\d{10}$/,
  };
  
  const FORM_CONSTANTS = {
    AGE_RANGE: { min: 12, max: 18 },
    PHONE_LENGTH: 10,
    MAX_AFFILIATION_LENGTH: 50,
  };
  
  const COLORS = {
    GRADIENT: ["#2b2d42", "#3498db"],
    TEXT_WHITE: "#FFFFFF",
    TEXT_BLACK: "#000000",
    ACTIVITY_INDICATOR: "#4630EB",
  };
  
  const FONTS = {
    OUTFIT_BOLD: "outfit-bold",
    OUTFIT_MEDIUM: "outfit-medium",
    OUTFIT_REGULAR: "outfit-regular",
    OUTFIT_SEMIBOLD: "outfit-semibold",
  };
  
  const CITIES = [
    { key: "Portoviejo", label: "Portoviejo" },
    { key: "Riobamba", label: "Riobamba" },
  ].sort((a, b) => a.label.localeCompare(b.label));
  
  const POSITIONS = [
    { key: "Arquero", label: "Arquero" },
    { key: "Defensa", label: "Defensa" },
    { key: "Mediocampista", label: "Mediocampista" },
    { key: "Delantero", label: "Delantero" },
  ];
  
  const CITY_DATE_TIMES: { [key: string]: { key: string; label: string }[] } = {
 
    Portoviejo: [
      {
        key: "Portoviejo, 25 de abril - 8:00 am",
        label: "Estadio-Portoviejo, 25 de abril - 8:00 am",
      },
      {
        key: "Portoviejo, 25 de abril - 2:00 pm",
        label: "Estadio2-Portoviejo, 25 de abril - 2:00 pm",
      },
      {
        key: "Portoviejo, 26 de abril - 8:00 am",
        label: "Estadio3-Portoviejo, 26 de abril - 8:00 am",
      },
    ],
    Riobamba: [
      {
        key: "San Luis, 19 de julio - 10:00 am",
        label: "Estadio San Luis, 19 de julio - 10:00 am",
      },
      {
        key: "Licán, 20 de julio - 10:00 am",
        label: "Estadio San Pedro de Licán, 20 de julio - 10:00 am",
      },
      {
        key: "San Juan, 21 de julio - 10:00 am",
        label: "Estadio de San Juan, 21 de julio - 10:00 am",
      },
            {
        key: "Quimiag, 22 de julio - 10:00 am",
        label: "Estadio de Quimiag, 22 de julio - 10:00 am",
      },
            {
        key: "Olmedo, 23 de julio - 10:00 am",
        label: "Complejo Centro Deportivo Olmedo , 23 de julio - 10:00 am",
      },
            {
        key: "Pungalá, 24 de julio - 10:00 am",
        label: "Estadio de Pungalá, 24 de julio - 10:00 am",
      },
            {
        key: "UNACH, 26 de julio - 10:00 am",
        label: "Estadio de la UNACH, 26 de julio - 10:00 am",
      },
            {
        key: "Olmedo, 27 de julio - 10:00 am",
        label: "Complejo Centro Deportivo Olmedo, 27 de julio - 10:00 am",
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