
export const getAnonSalt = (): string | undefined =>
  process.env.ANON_SALT ?? process.env.EXPO_PUBLIC_ANON_SALT;
