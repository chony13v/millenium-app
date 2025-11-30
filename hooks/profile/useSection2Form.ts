import { useState } from "react";
import { VALIDATION_PATTERNS } from "@/constants/formConstants";

export type Section2Errors = {
  parentFullName?: string;
  relationship?: string;
  economicSituation?: string;
  parentEmail?: string;
};

export const useSection2Form = () => {
  const [parentFullName, setParentFullName] = useState("");
  const [relationship, setRelationship] = useState("");
  const [economicSituation, setEconomicSituation] = useState("");
  const [parentPhoneNumber, setParentPhoneNumber] = useState("");
  const [parentEmail, setParentEmail] = useState("");
  const [errors, setErrors] = useState<Section2Errors>({});

  const validateSection2 = () => {
    const newErr: Section2Errors = {};
    let ok = true;
    if (!parentFullName.trim()) {
      newErr.parentFullName = "Obligatorio";
      ok = false;
    }
    if (!relationship.trim()) {
      newErr.relationship = "Obligatorio";
      ok = false;
    }
    if (!economicSituation.trim()) {
      newErr.economicSituation = "Obligatorio";
      ok = false;
    }
    if (parentEmail.trim() && !VALIDATION_PATTERNS.EMAIL.test(parentEmail)) {
      newErr.parentEmail = "Correo inválido";
      ok = false;
    }
    setErrors((prev) => ({ ...prev, ...newErr }));
    return ok;
  };

  return {
    parentFullName,
    relationship,
    economicSituation,
    parentPhoneNumber,
    parentEmail,
    errors,
    setParentFullName,
    setRelationship,
    setEconomicSituation,
    setParentPhoneNumber,
    setParentEmail,
    validateSection2,
  };
};

export type Section2FormState = ReturnType<typeof useSection2Form>;
