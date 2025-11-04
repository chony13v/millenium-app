export const ADMIN_EMAILS = [
    "fvasconez13@icloud.com",
    "f13vasconez@gmail.com",
  ] as const;
  
  export const isAdmin = (email: string): boolean => {
    return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);
  };