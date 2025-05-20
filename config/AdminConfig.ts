export const ADMIN_EMAILS = [
    "fvasconez13@icloud.com",
  ] as const;
  
  export const isAdmin = (email: string): boolean => {
    return ADMIN_EMAILS.includes(email as typeof ADMIN_EMAILS[number]);
  };