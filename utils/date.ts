export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

export const isYesterday = (date: Date, now: Date = new Date()) => {
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  return isSameDay(date, yesterday);
};