// İş kaydı tipi
export interface WorkRecord {
  id: string;
  type: 'giris' | 'cikis';
  timestamp: number; // Unix timestamp
  date: string; // YYYY-MM-DD formatında
  time: string; // HH:mm formatında
  synced: boolean; // Firebase'e yedeklendi mi?
  isHoliday?: boolean; // Tatil günü mü?
}

// Günlük özet tipi
export interface DailySummary {
  date: string;
  giris?: string;
  cikis?: string;
  calismaSuresi?: string;
  isHoliday?: boolean;
}



