import "./globals.css";

export const metadata = {
  title: "MNÉMOS — La nuit sans aiguilles | Prompt Injection 101",
  description: "Une enquête conversationnelle dans les archives de l’observatoire des Marées. Trois documents, un archiviste et un secret à retrouver.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>
        <div className="page">{children}</div>
        <footer className="footer">Laboratoire CTF fictif &middot; Instructions, confiance et confidentialité</footer>
      </body>
    </html>
  );
}
