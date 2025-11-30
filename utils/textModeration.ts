const OFFENSIVE_WORDS = [
  "puta",
  "puto",
  "mierda",
  "pendejo",
  "pendeja",
  "estupido",
  "estupida",
  "idiota",
  "imbecil",
  "imbécil",
  "cabrón",
  "cabron",
  "gilipollas",
  "malparido",
  "malparida",
  "hijo de puta",
  "conchetumadre",
  "chinga",
  "chingar",
  "verga",
  "coño",
  "pelotudo",
  "boludo",
  "chucha",
  "culo",
];

const normalizeText = (text: string) =>
  text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();

export const hasOffensiveWords = (text: string) => {
  const normalized = normalizeText(text);
  const tokens = normalized.replace(/[^a-zñáéíóúü\s]/gi, " ").split(/\s+/);
  return OFFENSIVE_WORDS.some((word) => tokens.includes(word));
};

export const isMeaninglessText = (text: string) => {
  const normalized = normalizeText(text);
  const compact = normalized.replace(/[^a-z]/g, "");

  const fillerPatterns = /(asdf|qwer|zxcv|aaaaa|eeee|oooo|mmmm)/;
  if (fillerPatterns.test(compact)) return true;

  if (compact.length >= 5 && new Set(compact.split("")).size === 1) {
    return true;
  }

  return false;
};

export const validateDescription = (text: string) => {
  const trimmed = text.trim();
  if (trimmed.length < 10) return false;

  const letterMatches = trimmed.match(/[a-zA-ZáéíóúÁÉÍÓÚñÑ]/g);
  const letterCount = letterMatches ? letterMatches.length : 0;
  if (letterCount === 0) return false;

  const nonAlphaRatio = (trimmed.length - letterCount) / trimmed.length;
  if (nonAlphaRatio > 0.4) return false;

  if (hasOffensiveWords(trimmed)) return false;
  if (isMeaninglessText(trimmed)) return false;

  return true;
};
