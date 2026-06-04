/** İşe başlama tarihinden (dahil) bugünün haftasına kadar Pazartesi hafta anahtarları (YYYY-MM-DD). */
export const formatDateStr = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const parseLocalDate = (dateStr: string): Date => {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, month - 1, day);
};

export const getWeekStartMonday = (date: Date): Date => {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
};

export const getWeekKeysFromWorkStart = (
  workStartDate: string,
  until: Date = new Date()
): string[] => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(workStartDate)) return [];

  let cursor = getWeekStartMonday(parseLocalDate(workStartDate));
  const end = getWeekStartMonday(until);
  const keys: string[] = [];

  while (cursor.getTime() <= end.getTime()) {
    keys.push(formatDateStr(cursor));
    const next = new Date(cursor);
    next.setDate(next.getDate() + 7);
    cursor = next;
  }

  return keys;
};
