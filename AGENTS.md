# AGENTS.md — PULSAR AHM (front-end v6)

Consignes pour tout agent IA (Cursor, etc.) qui lit ou modifie ce projet. Détails : `.cursor/rules/*.mdc`.

## But
Application de suivi de santé d’astronautes (NASA Space Apps 2026), en **français**. Page d’accueil publique `/`, connexion `/connexion` par **identifiant personnel**, trois tableaux de bord par rôle + une montre. Prédictions et solutions proposées (aide à la décision, pas de diagnostic), gamification coopérative (CDC § 5.9), sons d’alarme IEC 60601-1-8.

## Design = Figma
- Fichier : https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1 (fileKey `cj96CiSofo2y0mDSpre7J1`), serveur MCP `figma` dans `.cursor/mcp.json`.
- Pages : Astronaute `1:3`, Montre `41:2`, Médecin de bord `1:4`, NASA Houston `1:5`, Prototype `1:6` (index `36:4`).
- Avant de créer ou modifier un écran : trouver son nœud dans `frontend/src/design/figma-map.ts` (ou `docs/DESIGN.md`) puis appeler **`get_design_context`** (et `get_screenshot`) sur ce nœud. Traduire avec nos tokens et composants, ne pas coller le code généré.

## Système de design (non négociable)
- Tokens uniquement : `frontend/src/design/tokens.css` + `tokens.ts` (identiques). Tailwind v4 branché dessus.
- Polices : Space Grotesk (titres), IBM Plex Sans (UI), IBM Plex Mono (chiffres, unités, identifiants).
- Icônes : **lucide-react**, uniquement via `<Icon name="…" />` (table `ICONS` dans `components/ui/Icon.tsx`).
- Graphiques : **Recharts** (`components/charts/`), traits fins, couleurs des tokens, sans effet.
- Couleur d’état NASA C&W **seulement hors nominal**, **toujours icône + mot** (`<Lamp />`).
- Thèmes sombre et clair, à vérifier tous les deux. Valeurs fictives marquées **DÉMO**.
- Interdit : glow, dégradé décoratif, flou/verre, étincelles, emoji, animations gratuites.

## Architecture (`frontend/src`)
`app/` routeur + coque `RoleLayout` · `api/` (client typé, mock, hooks React Query) · `features/{landing,auth,astronaute,medecin-bord,nasa,montre,predictions,gamification,sound}` · `components/{ui,charts,telemetry,body3d}` · `design/` · `data/{types.ts,demo/}` · `styles/`.

**Front-end uniquement.** `backend/` ne contient qu’un README (API FastAPI prévue). Données temps réel : `src/api` (contrat `docs/API-CONTRACT.md`), simulateur si `VITE_USE_MOCK=true` ou API injoignable.

## Rôles, routes, accès
| Rôle | Identifiants | Route | Accès |
|---|---|---|---|
| astronaute | AST-001…004 | `/astronaute/*` | ses propres données (`useMe()`), montre incluse |
| medecin-bord | CMO-001 | `/medecin-bord/*` | tout l’équipage |
| nasa | NASA-FS-001, NASA-FS-002 | `/nasa/*` | rapports |
Garde : `RequireRole`. Auth : `authService.ts` (interface `AuthService` ; `DemoAuthService` actif ; `HttpAuthService` si `VITE_AUTH_API_URL`). Session `localStorage["pulsar.session"]`. Comptes : `data/demo/users.ts`, `docs/ROLES-ET-IDENTIFIANTS.md`.

## Commandes (`cd frontend`)
`npm i` · `npm run dev` · `npm run typecheck` · `npm run build` · `npm run test:e2e` (après `npm run test:e2e:install`).
Avant de terminer une tâche : `npm run typecheck` et `npm run test:e2e` doivent passer.

## Ne pas faire
- Ne pas réintroduire d’écran « Choix du profil », de sélecteur de rôle ni de liste de comptes de démo dans l’UI : un seul écran d’accueil + connexion, rôle déduit de l’identifiant (`roleFromId`).
- Ne pas écrire de code backend dans ce dépôt (seulement le contrat dans `docs/API-CONTRACT.md`).
- Ne pas mettre de vrai secret, de vraie donnée médicale ou de clé d’API dans le front.
- Gamification : jamais basée sur une valeur de santé, jamais de classement ni de comparaison entre membres, toujours désactivable (EF-42/43/44).
- Sons : ne jamais permettre de couper une alarme rouge sans acquittement (pause 2 min max) ; jamais de son sans signal visuel ; pas de fichier audio sous droits.
- Design télémétrie maison (LAD, fenêtre temps) : pas de cadrage Open MCT ; ne pas copier de code tiers.
- Ne pas changer le modèle 3D sans conserver une licence compatible (actuel : MakeHuman CC0).
