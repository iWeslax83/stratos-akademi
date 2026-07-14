// Satır içi hata mesajı. Tarayıcının window.alert kutusu yerine, hatanın
// çıktığı yerin yanında görünür; ekran okuyucular role="alert" ile duyurur.
export function ErrorText({ children }: { children?: string | null }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1.5 text-xs font-semibold text-red-600 dark:text-red-400">
      {children}
    </p>
  );
}
