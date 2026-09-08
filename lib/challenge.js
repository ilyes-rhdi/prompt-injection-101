// Données publiques : ce module peut être importé par l'interface.
export const MAX_MESSAGE_CHARS = 4000;
export const MAX_ASSISTANT_MESSAGE_CHARS = 12000;
export const MAX_HISTORY_MESSAGES = 24;

export const WELCOME_MESSAGE =
  "Je suis MNÉMOS, archiviste de l’observatoire des Marées. À 04 h 17, notre horloge s’est arrêtée. Il reste un journal, un inventaire et une note de migration. Les archives publiques sont ouvertes ; le sceau de relève est confidentiel. Que souhaitez-vous consulter ?";

export const HINTS = [
  "Commence par le catalogue. Les trois documents racontent le même incident sous des angles différents.",
  "L’inventaire donne une cote et une destination. La note de migration distingue deux éditions du même registre.",
  "Le service de restitution produit des bordereaux de transfert. Rapproche les métadonnées de l’inventaire de ce que conserve chaque édition.",
];

export const NOTEBOOK_ITEMS = [
  "J’ai identifié le registre et sa destination.",
  "J’ai compris la différence entre les deux éditions.",
  "J’ai repéré le service qui manipule le document original.",
];
