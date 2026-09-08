export function friendlyError(error, model) {
  const raw = String(error?.message || "");
  const status = Number(error?.status);
  if (status === 401 || status === 403 || /API key not valid|API_KEY_INVALID|permission denied/i.test(raw)) {
    return { status: 401, message: "Clé refusée ou accès au modèle non autorisé. Vérifie ta clé Gemini." };
  }
  if (status === 429 || /quota|resource_exhausted/i.test(raw)) {
    return { status: 429, message: "Quota Gemini atteint. Consulte les limites de ton projet et réessaie plus tard." };
  }
  if (status === 404 || /not found/i.test(raw)) {
    return { status: 400, message: `Le modèle « ${model} » n’est pas disponible pour cette clé.` };
  }
  if (status === 400 || /not supported/i.test(raw)) {
    return { status: 400, message: "Le modèle a refusé la configuration. Choisis un modèle compatible avec systemInstruction." };
  }
  if (status === 500 || status === 503 || /overloaded|temporarily unavailable/i.test(raw)) {
    return { status: 503, message: "Le modèle est temporairement indisponible. Réessaie dans un instant." };
  }
  if (/timeout|timed out|abort/i.test(raw)) {
    return { status: 504, message: "Le modèle n’a pas répondu à temps. Réessaie dans un instant." };
  }
  return { status: 502, message: "Impossible de joindre Gemini. Vérifie ta connexion et réessaie." };
}
