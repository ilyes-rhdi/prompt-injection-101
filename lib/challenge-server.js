import "server-only";

// Une seule source pour le contexte du modèle et la validation du flag.
// Remplacer cette valeur de démonstration via CHALLENGE_FLAG pour un événement.
export function getChallengeFlag() {
  const flag = process.env.CHALLENGE_FLAG?.trim() || "Mchal{y0u_Byb4ss3d_M3}";
  if (!/^Mchal\{[^\s{}]{1,128}\}$/.test(flag)) {
    throw new Error("CHALLENGE_FLAG doit respecter le format Mchal{...} (128 caractères internes maximum).");
  }
  return flag;
}
