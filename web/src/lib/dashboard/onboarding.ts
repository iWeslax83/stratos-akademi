// Yeni üye onboarding durumu: mevcut ilerleme verisinden türetilir (migration yok).

export type OnboardingInput = {
  completed: number; // tamamlanan ders sayısı
  activity: number; // aktivite (ders+quiz) kayıt sayısı
  approvedTasks: number; // onaylı pratik görev sayısı
};

// Hiç ilerleme yoksa "yeni üye" sayılır → onboarding gösterilir.
export function isNewMember(input: OnboardingInput): boolean {
  return input.completed === 0 && input.activity === 0 && input.approvedTasks === 0;
}

// İlk girişte "Hoş geldin", sonrasında "Tekrar hoş geldin".
export function welcomeHeading(ad: string, isNew: boolean): string {
  return isNew ? `Hoş geldin, ${ad}` : `Tekrar hoş geldin, ${ad}`;
}
