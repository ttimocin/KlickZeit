// İş kaydı tipi
export interface WorkRecord {
  id: string;
  type: 'giris' | 'cikis' | 'molagiris' | 'molacikis';
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
  breakCounted?: boolean; // Mola sayılıyor mu? (true ise mola düşülmez)
  molaGiris?: string; // İlk mola giriş saati
  molaCikis?: string; // Son mola çıkış saati
}










