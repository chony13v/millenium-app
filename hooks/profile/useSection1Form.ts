import { useState, useCallback } from "react";
import { CITY_DATE_TIMES, FORM_CONSTANTS, VALIDATION_PATTERNS } from "@/constants/FormConstants";

export type Section1Errors = {
  nombreCompleto?: string;
  idNumber?: string;
  birthDate?: string;
  position?: string;
  city?: string;
  dateTime?: string;
  informacionMedica?: string;
  afiliacionEquipo?: string;
};

export const useSection1Form = () => {
  const [nombreCompleto, setNombreCompleto] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [selectedPosition, setSelectedPosition] = useState("");
  const [selectedCity, setSelectedCity] = useState("");
  const [selectedDateTime, setSelectedDateTime] = useState("");
  const [dateTimes, setDateTimes] = useState<{ key: string; label: string }[]>([]);
  const [informacionMedica, setInformacionMedica] = useState("");
  const [afiliacionEquipo, setAfiliacionEquipo] = useState("");
  const [errors, setErrors] = useState<Section1Errors>({});

  const calculateAge = useCallback((bdStr: string) => {
    const [d, m, y] = bdStr.split("/").map((n) => parseInt(n, 10));
    const bd = new Date(y, m - 1, d);
    const today = new Date();
    let age = today.getFullYear() - bd.getFullYear();
    const diff = today.getMonth() - bd.getMonth();
    if (diff < 0 || (diff === 0 && today.getDate() < bd.getDate())) age--;
    return age;
  }, []);

  const handleBirthDateChange = (text: string) => {
    const cleaned = text.replace(/[^0-9]/g, "");
    let formatted = cleaned;
    if (cleaned.length >= 4)
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}/${cleaned.slice(4, 8)}`;
    else if (cleaned.length >= 2) formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2)}`;
    setBirthDate(formatted);

    if (!VALIDATION_PATTERNS.DATE.test(formatted)) {
      setErrors((prev) => ({ ...prev, birthDate: "Ingresa DD/MM/YYYY" }));
    } else {
      const age = calculateAge(formatted);
      if (age < FORM_CONSTANTS.AGE_RANGE.min || age > FORM_CONSTANTS.AGE_RANGE.max) {
        setErrors((prev) => ({
          ...prev,
          birthDate: "Edad debe estar entre 12 y 18 años",
        }));
      } else {
        setErrors((prev) => ({ ...prev, birthDate: undefined }));
      }
    }
  };

  const handleCityChange = (opt: { key: string; label: string }) => {
    setSelectedCity(opt.key);
    setDateTimes(CITY_DATE_TIMES[opt.key] || []);
    setSelectedDateTime("");
  };

  const validateSection1 = () => {
    const newErr: Section1Errors = {};
    let ok = true;
    if (!nombreCompleto.trim()) {
      newErr.nombreCompleto = "Obligatorio";
      ok = false;
    }
    if (idNumber.length !== FORM_CONSTANTS.PHONE_LENGTH) {
      newErr.idNumber = "Debe tener 10 dígitos";
      ok = false;
    }
    if (!VALIDATION_PATTERNS.DATE.test(birthDate)) {
      newErr.birthDate = "Ingresa DD/MM/YYYY";
      ok = false;
    } else {
      const age = calculateAge(birthDate);
      if (age < FORM_CONSTANTS.AGE_RANGE.min || age > FORM_CONSTANTS.AGE_RANGE.max) {
        newErr.birthDate = "Edad debe estar entre 12 y 18 años";
        ok = false;
      }
    }
    if (!selectedPosition) {
      newErr.position = "Obligatorio";
      ok = false;
    }
    if (!selectedCity) {
      newErr.city = "Obligatorio";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  return {
    nombreCompleto,
    idNumber,
    birthDate,
    selectedPosition,
    selectedCity,
    selectedDateTime,
    dateTimes,
    informacionMedica,
    afiliacionEquipo,
    errors,
    setNombreCompleto,
    setIdNumber,
    setBirthDate,
    setSelectedPosition,
    setSelectedCity,
    setSelectedDateTime,
    setInformacionMedica,
    setAfiliacionEquipo,
    setDateTimes,
    handleBirthDateChange,
    handleCityChange,
    validateSection1,
    calculateAge,
  };
};

export type Section1FormState = ReturnType<typeof useSection1Form>;