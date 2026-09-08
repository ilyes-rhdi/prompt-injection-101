import { MAX_ASSISTANT_MESSAGE_CHARS, MAX_HISTORY_MESSAGES, MAX_MESSAGE_CHARS } from "./challenge.js";

export function extractConversation(rawMessages) {
  if (!Array.isArray(rawMessages) || !rawMessages.length || rawMessages.length > MAX_HISTORY_MESSAGES + 1) {
    throw new Error("Historique invalide ou trop long. Recommence une conversation.");
  }
  const messages = rawMessages.map((message) => {
    if (!message || !["user", "ai", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || !message.content.trim()) {
      throw new Error("Chaque message doit contenir un rôle autorisé et un texte non vide.");
    }
    const limit = message.role === "user" ? MAX_MESSAGE_CHARS : MAX_ASSISTANT_MESSAGE_CHARS;
    if (message.content.length > limit) {
      throw new Error(`Un message de ce rôle ne peut pas dépasser ${limit} caractères.`);
    }
    return {
      role: message.role === "user" ? "user" : "model",
      parts: [{ text: message.content.trim() }],
    };
  });
  if (messages.at(-1).role !== "user") {
    throw new Error("Le dernier message doit venir du joueur.");
  }
  const firstUser = messages.findIndex((message) => message.role === "user");
  return messages.slice(firstUser);
}
