# Rôles et identifiants de connexion (DÉMO)

> ⚠️ **Comptes de démonstration.** L’authentification est simulée dans le navigateur
> (`frontend/src/features/auth/authService.ts` → `DemoAuthService`, comptes dans
> `frontend/src/data/demo/users.ts`). Aucune sécurité réelle : à remplacer par une API
> (`VITE_AUTH_API_URL` → `HttpAuthService`) avant toute utilisation réelle.

| Identifiant | Code | Rôle | Nom affiché | Fonction | Tableau de bord | Dossier équipage |
|---|---|---|---|---|---|---|
| `AST-001` | `482105` | Astronaute | Lina Kovacs | Ingénieure de vol | `/astronaute` | LK (état « Attention ») |
| `AST-002` | `130742` | Astronaute | Alex Morgan | Commandant | `/astronaute` | AM (nominal) |
| `AST-003` | `559031` | Astronaute | Nolan Okafor | Scientifique · médecin de bord | `/astronaute` | NO (nominal) |
| `AST-004` | `246813` | Astronaute | Sofia Reyes | Pilote | `/astronaute` | SR (nominal) |
| `CMO-001` | `731406` | Médecin de bord | Dr Nolan Okafor | Médecin de bord (CMO) · astronaute | `/medecin-bord` | NO |
| `NASA-FS-001` | `905218` | NASA Houston | Dr Maya Chen | Flight surgeon · MCC Houston | `/nasa` | — |
| `NASA-FS-002` | `618847` | NASA Houston | Dr Daniel Brooks | Flight surgeon · MCC Houston | `/nasa` | — |

Nolan Okafor a deux identifiants : `AST-003` (son espace personnel d’astronaute) et `CMO-001` (sa fonction de médecin de bord, qui voit tout l’équipage).

## Ce que voit chaque rôle
- **Astronaute** : uniquement ses propres données (accueil, silhouette 3D, scan visage, kits, bien-être, **montre** `/astronaute/montre` et `/astronaute/montre/ecrans`, rappels, mode bras EVA).
- **Médecin de bord** : voyants de tout l’équipage, dossier de chaque membre, échographie guidée en 6 étapes, journal.
- **NASA Houston** : rapports reçus par liaison satellite, détail, recommandation (file montante), fenêtres de liaison.

## Règles de connexion
- Page d’accueil publique `/`, puis l’écran `/connexion` (`/login` y redirige). Trois boutons de rôle ouvrent l’interface de démo (Astronaute → AST-001, Médecin de bord → CMO-001, NASA Houston → NASA-FS-001). Pas de formulaire identifiant + code. Les codes ne figurent que dans ce document et le README.
- Le **rôle est déduit du préfixe** de l’identifiant (`roleFromId` dans `features/auth/roles.ts`) : `AST-` → astronaute, `CMO-` → médecin de bord, `NASA-FS-` → NASA Houston ; redirection automatique vers le tableau de bord correspondant.
- Données temps réel : l’identifiant de connexion est relié au code équipage utilisé par l’API (`crewId`) : AST-001 → `LK`, AST-002 → `AM`, AST-003 → `NO`, AST-004 → `SR`, CMO-001 → `NO`.
- Format : `AST-000`, `CMO-000`, `NASA-FS-000` (majuscules automatiques, espaces ignorés). Code : 6 chiffres.
- Erreurs affichées : champs vides · format d’identifiant · identifiant inconnu · code incorrect (avec essais restants) · 5 échecs → blocage 30 s.
- Session : `localStorage["pulsar.session"]`, valable 12 h, effacée à la déconnexion (icône en haut à droite).
- Accès à l’espace d’un autre rôle : redirection vers son propre tableau de bord avec le message « Accès réservé à un autre rôle ».
- En production, l’API doit renvoyer un message générique (« Identifiant ou code incorrect ») pour ne pas révéler quels identifiants existent.
