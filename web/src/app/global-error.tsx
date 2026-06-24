"use client"; // Kök layout'taki hataları yakalar; kendi <html>/<body>'sini render etmeli.

import { useEffect } from "react";

export default function GlobalError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  unstable_retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "12px",
          background: "#16243F",
          color: "#fff",
          fontFamily: "system-ui, sans-serif",
          textAlign: "center",
          padding: "24px",
        }}
      >
        <p style={{ fontSize: "48px", fontWeight: 800, color: "#C9A23A", margin: 0 }}>Hata</p>
        <h1 style={{ fontSize: "20px", fontWeight: 700, margin: 0 }}>Bir şeyler ters gitti</h1>
        <p style={{ opacity: 0.7, margin: 0 }}>Uygulama beklenmeyen bir hatayla karşılaştı.</p>
        <button
          onClick={() => unstable_retry()}
          style={{
            marginTop: "12px",
            padding: "10px 20px",
            borderRadius: "9999px",
            border: "none",
            background: "#C9A23A",
            color: "#16243F",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Tekrar dene
        </button>
      </body>
    </html>
  );
}
