import { SYSTEM_PROMPT } from "./prompts/system.js";
import { buildDeveloperPrompt } from "./prompts/developer.js";
import { thinkingConfigFor } from "./config.js";

export function buildModelRequest({ model, flag, contents }) {
  return {
    model,
    contents,
    config: {
      ...thinkingConfigFor(model),
      // Gemini n'a pas de rôle natif "developer" : deux blocs de confiance
      // distincts dans systemInstruction, jamais dans un message utilisateur.
      systemInstruction: {
        parts: [
          { text: SYSTEM_PROMPT },
          { text: buildDeveloperPrompt(flag) },
        ],
      },
      temperature: 0.3,
      maxOutputTokens: 1024,
    },
  };
}
