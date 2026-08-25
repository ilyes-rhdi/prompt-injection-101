import "./globals.css";

export const metadata = {
  title: "Prompt Injection 101",
  description: "Beginner CTF Challenge - Direct Prompt Injection against a Gemini chatbot.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="page">{children}</div>
        <footer className="footer">Educational CTF &middot; Learn how LLM prompt injection works</footer>
      </body>
    </html>
  );
}
