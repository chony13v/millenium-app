import { useState } from "react";

export type Section3Errors = {
  consentimientoParticipacion?: string;
  autorizacionFotos?: string;
  acuerdoPrivacidad?: string;
  esRiobambeno?: string;
};

export const useSection3Form = () => {
  const [consentimientoParticipacion, setConsentimientoParticipacion] = useState(false);
  const [autorizacionFotos, setAutorizacionFotos] = useState(false);
  const [acuerdoPrivacidad, setAcuerdoPrivacidad] = useState(false);
  const [esRiobambeno, setEsRiobambeno] = useState(false);
  const [errors, setErrors] = useState<Section3Errors>({});

  const validateSection3 = () => {
    const newErr: Section3Errors = {};
    let ok = true;
    if (!consentimientoParticipacion) {
      newErr.consentimientoParticipacion = "Requerido";
      ok = false;
    }
    if (!autorizacionFotos) {
      newErr.autorizacionFotos = "Requerido";
      ok = false;
    }
    if (!acuerdoPrivacidad) {
      newErr.acuerdoPrivacidad = "Requerido";
      ok = false;
    }
    if (!esRiobambeno) {
      newErr.esRiobambeno = "Requerido";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  return {
    consentimientoParticipacion,
    autorizacionFotos,
    acuerdoPrivacidad,
    esRiobambeno,
    errors,
    setConsentimientoParticipacion,
    setAutorizacionFotos,
    setAcuerdoPrivacidad,
    setEsRiobambeno,
    validateSection3,
  };
};

export type Section3FormState = ReturnType<typeof useSection3Form>;