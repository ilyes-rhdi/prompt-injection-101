export const GEMINI_MODEL =
  process.env.GEMINI_MODEL || "gemma-4-31b-it";

// Gemma 4 : préserver le budget de sortie pour le texte visible du jeu.
export function thinkingConfigFor(model) {
  return model.replace(/^models\//, "").startsWith("gemma-4-")
    ? { thinkingConfig: { thinkingLevel: "minimal" } }
    : {};
}
