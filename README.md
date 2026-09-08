# MNÉMOS — La nuit sans aiguilles

Un challenge conversationnel CTF pour débutants : explorer trois archives,
recouper leurs métadonnées et obtenir un sceau fictif gardé par un archiviste IA.
L'interface, le scénario, les indices et le débrief sont en français ; MNÉMOS
peut répondre dans la langue du joueur.

## Jouer en local

Prérequis : Node.js 20 ou supérieur.

```bash
npm ci
npm run dev
```

Ouvrir http://localhost:3000, saisir une clé obtenue dans
[Google AI Studio](https://aistudio.google.com/apikey), puis entrer dans les
archives. Le bouton de test vérifie également la prise en charge des instructions
système. Les quotas et frais éventuels dépendent du projet Google du joueur.

Le catalogue fournit un point de départ. Le carnet permet de noter et de cocher
ses découvertes ; trois indices facultatifs donnent une aide graduelle. Coller
le flag exact dans « Valider le sceau » confirme la résolution côté serveur et
ouvre un débrief. Les nombres d'échanges et d'indices sont un bilan personnel,
pas un classement certifié.

Entrée envoie un message ; Maj + Entrée insère une nouvelle ligne. Un échec réseau
restaure le brouillon et n'ajoute pas de tour à l'historique. Changer de clé
conserve l'enquête ; recommencer efface la conversation, les notes et les indices.

## Configuration

Les valeurs possibles sont documentées dans [.env.example](.env.example).
Pour les modifier en local, créer un fichier `.env.local` :

```dotenv
GEMINI_MODEL=gemma-4-31b-it
CHALLENGE_FLAG=Mchal{votre_valeur_pour_cet_evenement}
```

- `GEMINI_MODEL` garde le modèle du projet d'origine. Il doit être disponible
  pour la clé du joueur et accepter `systemInstruction`.
  Pour Gemma 4, la réflexion est configurée sur `minimal` afin de réserver le
  budget de génération à la réponse visible ; les autres modèles gardent
  leur réglage de réflexion par défaut.
- `CHALLENGE_FLAG` est facultatif en démonstration. Sa valeur doit suivre
  `Mchal{...}`, avec 1 à 128 caractères internes, sans espaces ni accolades.
  Définir un flag inédit pour un événement : celui de démonstration est visible
  dans le dépôt. Ne jamais utiliser de véritable secret d'infrastructure.
- Les routes de chat et de validation utilisent la même source de flag.
- Aucune clé Google d'organisateur n'est nécessaire : chaque joueur fournit
  la sienne. Ne jamais placer de flag ou de clé dans une variable `NEXT_PUBLIC_`.

Sur Vercel, importer le dépôt avec le preset Next.js, renseigner ces variables
si nécessaire, puis déployer. Le projet utilise trois routes serveur, sans base
de données. Vérifier que l'hébergement autorise la durée des appels : le délai
fournisseur est limité à 45 secondes, les routes déclarent 60 secondes.

## Plusieurs joueurs en même temps

Chaque onglet possède sa propre clé, sa conversation, ses notes, ses indices
et son état de résolution. Réinitialiser une partie ne modifie aucune autre
partie. Le serveur construit un client Google et un contexte indépendants pour
chaque requête : aucun historique ou client authentifié n'est partagé dans une
variable globale. Les routes sont sans état et peuvent être réparties entre
plusieurs instances sans affinité de session ni base de données.

Tous les joueurs cherchent le même flag d'événement. Leurs clés sont personnelles ;
si plusieurs clés appartiennent au même projet Google, elles peuvent partager
les limites de ce projet. Un refus de quota est affiché dans la partie concernée
et son brouillon est conservé. Le nombre de joueurs supporté dépend des quotas
Google et de la capacité de l'hébergement ; ce dépôt ne garantit pas un nombre
illimité de connexions. Les API ne fournissent ni comptes, ni classement, ni
preuve d'identité des joueurs.

## Séparation des prompts

| Élément | Responsabilité | Fichier |
| --- | --- | --- |
| System prompt | Identité, cadre fictif, traitement des messages non fiables | `lib/prompts/system.js` |
| Developer prompt | Catalogue, documents, confidentialité et procédure héritée | `lib/prompts/developer.js` |
| Adaptateur Gemini | Deux blocs dans `config.systemInstruction` | `lib/model-request.js` |
| Conversation | Messages `user` / `model`, séparés des instructions | `lib/conversation.js` |
| Flag | Valeur serveur partagée entre chat et vérification | `lib/challenge-server.js` |
| Données publiques | Accueil, indices, carnet et limites | `lib/challenge.js` |

Gemini n'expose pas de rôle natif `developer` dans `contents`. La séparation
système/développeur est donc logique et explicite dans le code : les deux blocs
sont envoyés comme deux parties du même canal `systemInstruction`. Ce n'est pas
une hiérarchie de deux rôles imposée par le fournisseur. Les messages du joueur
restent dans `contents` ; aucun texte utilisateur n'est interpolé dans les prompts.

Références officielles : [Gemma et les instructions système](https://ai.google.dev/gemma/docs/core/gemma_on_gemini_api#system-instructions),
[API de génération Gemini](https://ai.google.dev/api/generate-content).

## Intention pédagogique

L'ancienne version mélangeait secret, règles et conversation dans un unique
message utilisateur. Elle autorisait aussi la divulgation sur une simple
déclaration d'identité, avec très peu de matière à explorer.

La nouvelle version propose une enquête sur une procédure administrative et une
incohérence documentaire. Le chemin prévu nécessite de découvrir des informations
publiques, de jouer un rôle interne crédible et de comprendre ce que fait une
procédure. Le modèle doit juger le contexte de la demande ; une identité affirmée
peut être acceptée, questionnée ou refusée selon la conversation.

La procédure d'administration est volontairement ambiguë sur la manière dont un
demandeur établit son rôle : c'est au modèle d'interpréter la conversation. La
résoudre démontre un risque de confiance accordée à une identité déclarée, **pas
nécessairement une injection réussie contre le prompt système**. La séparation
des rôles ne corrige pas, à elle seule, une règle métier qui autorise une
divulgation. Un véritable secret doit rester hors du contexte du modèle, avec
des contrôles d'accès dans le code. Le débrief explique cette distinction sans
présumer du chemin du joueur.

Le backend n'effectue pas de recherche de mots-clés pour décider de divulguer
le flag, ne simule pas la réponse de MNÉMOS et ne déclenche pas automatiquement
la réussite. Le modèle interprète les règles ; `/api/check` compare le flag exact.
Les réponses et la difficulté peuvent varier selon le modèle et sa version.

## Données et limites

- Clé, conversation et carnet restent dans l'état React : aucun stockage local
  persistant ni base de données n'est utilisé par l'application.
- La clé et les messages transitent par le serveur vers Google. Les prompts,
  dont le flag fictif, sont eux aussi transmis à Google. Le carnet ne l'est pas.
- Le code ne journalise ni clé ni prompts ; les politiques du fournisseur et
  les éventuels journaux d'infrastructure restent hors de ce périmètre.
- Le modèle reçoit jusqu'à 24 messages précédents et le message actuel. Un
  éventuel message assistant en tête de fenêtre est omis. L'accueil affiché
  n'est pas injecté comme une réponse du modèle sans question préalable.
- Les messages du joueur sont limités à 4 000 caractères. Les rôles système ou
  développeur envoyés par le navigateur sont rejetés, sans troncature silencieuse.
- L'historique fourni par le navigateur n'est pas signé. Ce laboratoire vise le
  jeu par l'interface ; il ne garantit pas l'intégrité d'une compétition hostile.
  Un déploiement compétitif demanderait des sessions et un historique serveur.
- Le serveur ne filtre pas les sorties : une divulgation produite par le modèle
  reste observable. Le HTML de sa réponse est affiché comme texte par React.
- Les instructions privées et le flag ne sont pas importés par le composant
  client. La lecture du code source dévoile cependant le scénario : réserver
  cette lecture à l'organisation si l'enquête doit rester une découverte.

## Vérification

```bash
npm test
npm run build
```

Les tests sans réseau contrôlent la séparation des instructions et des données,
les rôles, les limites d'historique et la classification des erreurs. Ils ne
mesurent pas le taux de résolution du modèle.

Avant un atelier, faire une recette avec une clé autorisée : vérifier l'accès
au catalogue et à chaque fiche, le refus des demandes directes, la cohérence des
métadonnées, la restitution prévue, la validation et le débrief. Refaire cette
recette après un changement de modèle. Les anciens fichiers locaux
`prompts-solution.txt` et `resultats-tests.txt` concernent la version précédente
et ne valident pas ce nouveau scénario.

## Structure

```text
app/
  challenge.js              Interface et état de la session
  globals.css               Thème terminal et mise en page responsive
  api/chat/route.js         Appel du modèle
  api/check/route.js        Validation exacte côté serveur
  api/test-key/route.js     Test de clé et compatibilité des instructions
lib/
  prompts/system.js        Cadre système
  prompts/developer.js     Scénario et règles documentaires
  model-request.js         Adaptation au fournisseur
  challenge-server.js      Flag exclusivement côté serveur
  challenge.js             Constantes publiques
  conversation.js          Validation de la conversation
  gemini-error.js           Erreurs fournisseur sans détails sensibles
  config.js                Modèle choisi
tests/
  challenge.test.mjs       Tests sans clé et sans réseau
```
