# PULSAR AHM — Design (Figma ↔ code)

Fichier Figma : **[PULSAR AHM — v6 (3 dashboards par rôle)](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6)** · `fileKey = cj96CiSofo2y0mDSpre7J1`

Le fichier n’a pas de « Variables » Figma : les couleurs, typos et espacements historiques sont dans `frontend/src/design/tokens.css`. La correspondance écran ↔ nœud est aussi dans `frontend/src/design/figma-map.ts`.

### v7 code (clinique sombre) — en avance sur Figma

Le front a été refondu en **v7 clinique sombre** (coque plate, KPI strip, dashboards A01/M01/N01 densifiés, landing sans cadre arrondi). Inspirations moodboard (Dribbble, non pixel-perfect) : Medexa (structure silhouette + vitaux), Shakuro / dashboards monitoring (densité clinique). Les règles DS restent : tokens, NASA C&W hors nominal + icône + mot, pas de glow / verre / emoji. Figma v6 reste la référence historique ; à resynchroniser plus tard.

**Chrome** : barre haute à 2 rangées (marque fixe + outils ; navigation groupée). Marque = monogramme ECG/orbite sur tokens (`Brand.tsx`, `public/brand/pulsar-mark.svg`). Nav par métier — Astronaute : Suivi / Mesures / Quotidien / Compte ; CMO : Équipage / Clinique / Ops ; NASA : Inbox / Actions / Réseau.

**Dashboards (structure Dribbble / SaaS clinique, pas de copie pixel)** : A01 = vitaux + corps 3D + zones + aide clinique + frise + donut régularité + live ; M01 = carte patient + aide clinique (alertes modèle) + donut flux équipage + plan de soins + grille ; N01 = inbox 3 panneaux + KPI. Tokens / NASA C&W. **Pas** de glassmorphism ni palette verte « consumer » (brief traduit en surfaces + accent cyan).

## Pages du fichier

| Page | Nœud | Lien |
|---|---|---|
| Couverture | `0:1` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=0-1) |
| Vue d’ensemble | `1:2` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=1-2) |
| Astronaute | `1:3` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=1-3) |
| Montre | `41:2` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=41-2) |
| Médecin de bord | `1:4` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=1-4) |
| NASA Houston | `1:5` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=1-5) |
| Prototype | `1:6` | [ouvrir](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=1-6) |

## Prototypes (points de départ)

| Parcours | Nœud | Lien prototype |
|---|---|---|
| 0 · Index (tous les écrans) | `36:4` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4&starting-point-node-id=36%3A4) |
| 1 · Astronaute — tablette | `36:219` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-219&starting-point-node-id=36%3A219) |
| 2 · Médecin de bord — alerte orange → échographie | `36:2378` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2378&starting-point-node-id=36%3A2378) |
| 3 · NASA Houston — rapports | `36:4817` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4817&starting-point-node-id=36%3A4817) |
| 4 · Choix du profil | `36:112` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-112&starting-point-node-id=36%3A112) |
| 5 · Montre carrée — cadran → mini silhouette | `71:1651` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1651&starting-point-node-id=71%3A1651) |
| 6 · Montre carrée — alerte orange → respiration | `71:1655` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1655&starting-point-node-id=71%3A1655) |
| 7 · Montre ronde — cadran | `71:1667` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1667&starting-point-node-id=71%3A1667) |
| 8 · Montre ronde — alerte orange | `71:1671` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1671&starting-point-node-id=71%3A1671) |
| 8 · Montre ronde — alerte rouge → médecin de bord | `71:1673` | [lancer](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1673&starting-point-node-id=71%3A1673) |
| Index de tous les écrans | `36:4` | [ouvrir dans le fichier](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4) |

> L’écran **O01 · Choix du profil** de Figma est remplacé dans le code par **un seul écran d’accueil avec connexion par identifiant** (`/login` : logo, intro mission, photo, formulaire ; aucun choix de profil ni liste de comptes ; capture `docs/screens/projet-connexion.png`), qui redirige vers le tableau de bord du rôle. Le sélecteur de rôle du haut des maquettes devient l’**utilisateur connecté + bouton de déconnexion** (un utilisateur ne change pas de rôle).


## Astronaute — page Figma `1:3`

| Écran | Maquette (nœud) | Prototype | Route | Format · thème | Composant | Capture |
|---|---|---|---|---|---|---|
| **A01** Accueil | [`34:5`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-5) | [`36:219`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-219&starting-point-node-id=36%3A219) | `/astronaute` | 1194×834 · sombre | `features/astronaute/screens.tsx › AstroHome` | ![A01](screens/v6-astro-tablet-home.png) |
| **A02** Silhouette santé | [`34:9`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-9) | [`36:453`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-453&starting-point-node-id=36%3A453) | `/astronaute/silhouette` | 1194×834 · sombre | `AstroBody + components/body3d` | ![A02](screens/v6-astro-tablet-body.png) |
| **A03** Scan visage (fatigue) | [`34:13`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-13) | [`36:621`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-621&starting-point-node-id=36%3A621) | `/astronaute/scan` | 1194×834 · sombre | `AstroScan` | ![A03](screens/v6-astro-tablet-scan.png) |
| **A04** Kits glycémie + tension | [`34:17`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-17) | [`36:772`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-772&starting-point-node-id=36%3A772) | `/astronaute/kits` | 1194×834 · sombre | `AstroKits` | ![A04](screens/v6-astro-tablet-kits.png) |
| **A05** Bien-être | [`34:21`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-21) | [`36:927`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-927&starting-point-node-id=36%3A927) | `/astronaute/bien-etre` | 1194×834 · sombre | `AstroWellbeing` | ![A05](screens/v6-astro-tablet-wellbeing.png) |
| **A06** Montre (synchro) | [`34:25`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-25) | [`36:1092`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-1092&starting-point-node-id=36%3A1092) | `/astronaute/montre` | 1194×834 · sombre | `AstroWatch + features/montre/Watch6` | ![A06](screens/v6-astro-tablet-watch.png) |
| **A07** Rappels de mesure | [`34:29`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-29) | [`36:1262`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-1262&starting-point-node-id=36%3A1262) | `/astronaute/rappels` | 1194×834 · sombre | `AstroReminders` | ![A07](screens/v6-astro-tablet-reminders.png) |
| **A08** Accueil (thème clair) | [`34:33`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-33) | [`36:1423`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-1423&starting-point-node-id=36%3A1423) | `/astronaute` | 1194×834 · clair | `AstroHome (thème clair)` | ![A08](screens/v6-astro-tablet-home-light.png) |
| **A09** Accueil | [`34:40`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-40) | [`36:1657`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-1657&starting-point-node-id=36%3A1657) | `/astronaute` | 834×1194 · sombre | `AstroHome (portrait)` | ![A09](screens/v6-astro-portrait-home.png) |
| **A10** Scan visage | [`34:44`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-44) | [`36:1877`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-1877&starting-point-node-id=36%3A1877) | `/astronaute/scan` | 834×1194 · sombre | `AstroScan (portrait)` | ![A10](screens/v6-astro-portrait-scan.png) |
| **A11** Mode bras · sombre | [`34:51`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-51) | [`36:2014`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2014&starting-point-node-id=36%3A2014) | `/astronaute/mode-bras` | 1080×700 · sombre | `ArmMode` | ![A11](screens/v6-astro-arm.png) |
| **A12** Mode bras · clair | [`34:55`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-55) | [`36:2065`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2065&starting-point-node-id=36%3A2065) | `/astronaute/mode-bras` | 1080×700 · clair | `ArmMode (clair)` | — |
| **A13** Écrans de la montre (v6) | [`34:62`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-62) | [`36:2116`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2116&starting-point-node-id=36%3A2116) | `/astronaute/montre/ecrans` | — · sombre | `features/montre/Watch6 › WatchGallery` | ![A13](screens/v6-hero-montre.png) |
| **A14** Silhouette 3D (face, ¾, dos) | [`84:5983`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=84-5983) | [`84:6357`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=84-6357&starting-point-node-id=84%3A6357) | `/?stillset (dev)` | 1920×1080 · sombre | `app/dev/StillSet + components/body3d` | ![A14](screens/v6-silhouette-3d-planche.png) |

## Médecin de bord — page Figma `1:4`

| Écran | Maquette (nœud) | Prototype | Route | Format · thème | Composant | Capture |
|---|---|---|---|---|---|---|
| **M01** Voyants de l’équipage | [`34:69`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-69) | [`36:2378`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2378&starting-point-node-id=36%3A2378) | `/medecin-bord` | 1194×834 · sombre | `features/medecin-bord/screens.tsx › CmoBoard` | ![M01](screens/v6-cmo-tablet-board.png) |
| **M02** Dossier Lina Kovacs | [`34:73`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-73) | [`36:2707`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2707&starting-point-node-id=36%3A2707) | `/medecin-bord/dossier/LK` | 1194×834 · sombre | `CmoCrew` | ![M02](screens/v6-cmo-tablet-crew-LK.png) |
| **M03** 1 Connexion sonde | [`34:84`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-84) | [`36:2920`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-2920&starting-point-node-id=36%3A2920) | `/medecin-bord/echographie/1` | 1194×834 · sombre | `CmoEcho step 1` | ![M03](screens/v6-cmo-tablet-echo-1.png) |
| **M04** 2 Zone d’examen | [`34:88`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-88) | [`36:3082`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3082&starting-point-node-id=36%3A3082) | `/medecin-bord/echographie/2` | 1194×834 · sombre | `CmoEcho step 2 (zone, silhouette 3D)` | ![M04](screens/v6-cmo-tablet-echo-2.png) |
| **M05** 3 Positionnement guidé | [`34:92`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-92) | [`36:3282`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3282&starting-point-node-id=36%3A3282) | `/medecin-bord/echographie/3` | 1194×834 · sombre | `CmoEcho step 3 (sonde)` | ![M05](screens/v6-cmo-tablet-echo-3.png) |
| **M06** 4 Image en direct | [`34:96`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-96) | [`36:3464`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3464&starting-point-node-id=36%3A3464) | `/medecin-bord/echographie/4` | 1194×834 · sombre | `CmoEcho step 4 + Probe` | ![M06](screens/v6-cmo-tablet-echo-4.png) |
| **M07** 5 Annotation | [`34:100`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-100) | [`36:3634`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3634&starting-point-node-id=36%3A3634) | `/medecin-bord/echographie/5` | 1194×834 · sombre | `CmoEcho step 5` | ![M07](screens/v6-cmo-tablet-echo-5.png) |
| **M08** 6 Joindre et envoyer | [`34:104`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-104) | [`36:3796`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3796&starting-point-node-id=36%3A3796) | `/medecin-bord/echographie/6` | 1194×834 · sombre | `CmoEcho step 6` | ![M08](screens/v6-cmo-tablet-echo-6.png) |
| **M09** Voyants (thème clair) | [`34:77`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-77) | [`36:3992`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-3992&starting-point-node-id=36%3A3992) | `/medecin-bord` | 1194×834 · clair | `CmoBoard (clair)` | ![M09](screens/v6-cmo-tablet-board-light.png) |
| **M10** Voyants de l’équipage | [`34:111`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-111) | [`36:4321`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4321&starting-point-node-id=36%3A4321) | `/medecin-bord` | 1920×1080 · sombre | `CmoBoard (écran infirmerie, carte silhouette ≥1700 px)` | ![M10](screens/v6-cmo-infirmary-board.png) |
| **M11** Image écho en direct | [`34:118`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-118) | [`36:4650`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4650&starting-point-node-id=36%3A4650) | `/medecin-bord/echographie/4` | 1920×1080 · sombre | `CmoEcho step 4 (infirmerie)` | ![M11](screens/v6-cmo-infirmary-echo-4.png) |

## NASA Houston — page Figma `1:5`

| Écran | Maquette (nœud) | Prototype | Route | Format · thème | Composant | Capture |
|---|---|---|---|---|---|---|
| **N01** Rapports + détail | [`34:128`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-128) | [`36:4817`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-4817&starting-point-node-id=36%3A4817) | `/nasa` | 1440×900 · sombre | `features/nasa/screens.tsx › NasaInbox + ReportDetail` | ![N01](screens/v6-nasa-desktop-inbox.png) |
| **N02** Rapport alerte rouge | [`34:135`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-135) | [`36:5311`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-5311&starting-point-node-id=36%3A5311) | `/nasa/rapport/R-126-A1` | 1440×900 · sombre | `ReportDetail (alerte rouge)` | ![N02](screens/v6-nasa-desktop-red.png) |
| **N03** Recommandation (file montante) | [`34:142`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-142) | [`36:5763`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-5763&starting-point-node-id=36%3A5763) | `/nasa/reponse` | 1440×900 · sombre | `NasaReply` | ![N03](screens/v6-nasa-desktop-reply.png) |
| **N04** Fenêtres de liaison | [`34:149`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-149) | [`36:5909`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-5909&starting-point-node-id=36%3A5909) | `/nasa/liaison` | 1440×900 · sombre | `NasaLink` | ![N04](screens/v6-nasa-desktop-link.png) |
| **N05** Rapports (thème clair) | [`34:156`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-156) | [`36:6157`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-6157&starting-point-node-id=36%3A6157) | `/nasa` | 1440×900 · clair | `NasaInbox (clair)` | ![N05](screens/v6-nasa-desktop-inbox-light.png) |
| **N06** Rapports + visionneuse | [`34:166`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=34-166) | [`36:6651`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=36-6651&starting-point-node-id=36%3A6651) | `/nasa` | 2560×1440 · sombre | `NasaInbox double écran (.dual-only)` | ![N06](screens/v6-nasa-dual-inbox.png) |

## Montre — page Figma `41:2`

Composant : `frontend/src/features/montre/Watch6.tsx` (`<Watch6 shape="square|round" view="…" />`). Visible dans l’app : `/astronaute/montre` (aperçu interactif) et `/astronaute/montre/ecrans` (galerie).

| Écran | Maquette | Prototype | Vue |
|---|---|---|---|
| **WC01** Cadran · accueil | [`70:27`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-27) | [`71:1651`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1651&starting-point-node-id=71%3A1651) | `view="home"` |
| **WC02** Mini silhouette | [`70:31`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-31) | [`71:1653`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1653&starting-point-node-id=71%3A1653) | `view="body"` |
| **WC03** Alerte orange (attention) | [`70:35`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-35) | [`71:1655`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1655&starting-point-node-id=71%3A1655) | `view="caution"` |
| **WC04** Alerte rouge | [`70:39`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-39) | [`71:1657`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1657&starting-point-node-id=71%3A1657) | `view="warning"` |
| **WC05** Rappel de mesure | [`70:43`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-43) | [`71:1659`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1659&starting-point-node-id=71%3A1659) | `view="reminder"` |
| **WC06** Respiration guidée | [`70:47`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-47) | [`71:1661`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1661&starting-point-node-id=71%3A1661) | `view="breathe"` |
| **WC07** Synchro tablette | [`70:51`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-51) | [`71:1663`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1663&starting-point-node-id=71%3A1663) | `view="sync"` |
| **WC08** Hors ligne | [`70:55`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-55) | [`71:1665`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1665&starting-point-node-id=71%3A1665) | `view="offline"` |
| **WR01** Cadran · accueil | [`70:59`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-59) | [`71:1667`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1667&starting-point-node-id=71%3A1667) | `view="home"` |
| **WR02** Mini silhouette | [`70:63`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-63) | [`71:1669`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1669&starting-point-node-id=71%3A1669) | `view="body"` |
| **WR03** Alerte orange (attention) | [`70:67`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-67) | [`71:1671`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1671&starting-point-node-id=71%3A1671) | `view="caution"` |
| **WR04** Alerte rouge | [`70:71`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-71) | [`71:1673`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1673&starting-point-node-id=71%3A1673) | `view="warning"` |
| **WR05** Rappel de mesure | [`70:75`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-75) | [`71:1675`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1675&starting-point-node-id=71%3A1675) | `view="reminder"` |
| **WR06** Respiration guidée | [`70:79`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-79) | [`71:1677`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1677&starting-point-node-id=71%3A1677) | `view="breathe"` |
| **WR07** Synchro tablette | [`70:83`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-83) | [`71:1679`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1679&starting-point-node-id=71%3A1679) | `view="sync"` |
| **WR08** Hors ligne | [`70:87`](https://www.figma.com/design/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=70-87) | [`71:1681`](https://www.figma.com/proto/cj96CiSofo2y0mDSpre7J1/PULSAR-AHM-v6?node-id=71-1681&starting-point-node-id=71%3A1681) | `view="offline"` |

## Captures de référence

- Héros : ![](screens/v6-hero-astronaute.png) ![](screens/v6-hero-medecin-de-bord.png) ![](screens/v6-hero-nasa-houston.png) ![](screens/v6-hero-montre.png)
- Planche de tous les écrans : ![](screens/v6-contact-sheet.png)
- Silhouette 3D dans Figma (A14) : ![](screens/figma-v6-A14-silhouette-3d.png)
- Page d’accueil publique : ![](screens/projet-accueil-landing.png) ![](screens/projet-accueil-mobile.png)
- Prédictions et solutions : ![](screens/projet-predictions-astronaute.png) ![](screens/projet-predictions-medecin.png) ![](screens/projet-rapport-nasa-predictions.png)
- Dossier médecin (conducteur de temps + LAD) : ![](screens/projet-dossier-lad-conducteur.png)
- Gamification : ![](screens/projet-objectifs-gamification.png)
- Application du projet (connexion + rôles) : ![](screens/projet-connexion.png) ![](screens/projet-astronaute-AST-001.png) ![](screens/projet-medecin-bord-CMO-001.png) ![](screens/projet-nasa-FS-001.png) ![](screens/projet-acces-refuse.png)

## Règles de design (résumé)

Voir `.cursor/rules/design-system.mdc`. En bref : tokens uniquement, Hubot Sans / Mona Sans / Monaspace Neon, icônes lucide-react (via `<Icon>`), graphiques Recharts sobres, couleur d’état seulement hors nominal et toujours avec icône + mot, thèmes sombre et clair, valeurs personnelles marquées DÉMO, aucun effet « IA » (glow, dégradé décoratif, flou, verre, étincelles).

## Routes du front

| Route | Écran |
| --- | --- |
| `/` | Page d’accueil publique (présentation PULSAR, bouton « Se connecter ») |
| `/connexion` | Connexion par identifiant personnel (`/login` redirige ici ; un utilisateur déjà connecté est envoyé vers son tableau de bord) |
| `/astronaute/*` | accueil, montre, prévisions, objectifs (si gamification active), réglages, … |
| `/medecin-bord/*` | tableau d’équipage, dossier (conducteur de temps + LAD), prédictions `/:id`, journal, … |
| `/nasa/*` | rapports (avec synthèse prédictions/anomalies), tendances, … |

## Télémétrie dense (design PULSAR)

Affichage opérationnel **sans cadrage Open MCT** : réimplémentation maison (tokens PULSAR). Moodboards : mission control + health monitoring (voir `docs/RECHERCHE-FRONTEND.md`).

| Principe | Application dans PULSAR |
| --- | --- |
| Coloration des limites (icône + flèche) | `LadTable` : `is-limit--caution` / `is-limit--warning` + icône + mot |
| Dernières valeurs (nom, heure, valeur, unité) | dossier médecin, prédictions, astronaute |
| Fenêtre temps (temps réel / fixe) | `TimeConductor` au-dessus des graphiques |
| Inspecteur | panneau médecin : anomalie, dérive, solutions |
| Données périmées | ligne `is-stale` |
| Workflow | Nouveau · Vu · Pris en charge · Résolu · Escaladé + responsable |

## Prédictions et solutions proposées

- **Courbes prévues vs observées** (`ForecastChart`) : ligne pleine = observé, tirets = prévu, aire claire = intervalle de confiance 80 %,
  lignes de seuil orange/rouge, repère « maintenant ». Horizon **24 h** (horaire) ou **7 j** (journalier). Chaque graphique a un
  résumé texte lu par les lecteurs d’écran et un tableau de données dépliable (EF-47).
- **Score de dérive** (0–1, jauge) + **niveau de risque** vert/orange/rouge (icône + mot) + **délai avant seuil** (« seuil orange dans ~8 h »).
- **Anomalies** : indicateur, valeur, modèle, score, signaux contributeurs (barres).
- **Solutions proposées** non diagnostiques, priorité + justification, actions : astronaute *Appliquer / Marquer fait / Escalader au
  médecin de bord* ; médecin de bord *Valider / Remplacer… / Marquer fait / Escalader au flight surgeon*. Mention permanente :
  « Aide à la décision, pas un diagnostic ».
- Par rôle : l’astronaute ne voit que ses données, en langage simple ; le médecin voit tout l’équipage + inspecteur ; la NASA voit
  une synthèse (risque, prochain seuil, anomalies, solutions ouvertes) dans les rapports.

## Gamification coopérative (CDC § 5.9)

- **EF-42** : séries (jours consécutifs) et badges de **régularité** — mesures faites, routines suivies — jamais calculés à partir
  des valeurs de santé.
- **EF-43** : objectif d’**équipage** (« 100 % des mesures du jour »), barre collective, **aucun classement** individuel.
- **EF-44** : aucune comparaison publique des valeurs ; la gamification se **désactive** dans *Réglages* (persistant) — elle
  disparaît alors de la navigation, de l’accueil et de la montre.
- Tablette : série, missions du jour (cases à cocher), badges, objectif d’équipage ; montre : complication « série + objectif ».
- Médecin de bord : participation uniquement (mesures faites / prévues, gamification activée ou non), jamais les badges.
- Visuel sobre (pas de confettis, pas de néon) ; animations Motion légères, coupées si `prefers-reduced-motion`.

## Sons et alarmes (IEC 60601-1-8)

Tous les sons sont **synthétisés** en Web Audio (aucun fichier audio, aucun droit d’auteur). Motifs inspirés de la norme
IEC 60601-1-8 (alarmes médicales) :

Politique : son **uniquement** pour alerte **rouge / extrême**. Orange, notifications, scan fatigue modéré, exercice et navigation = silencieux (bandeau visuel conservé).

| Son | Motif | Répétition |
| --- | --- | --- |
| Alerte **rouge** (priorité haute) | 10 impulsions (3 + 2, pause, 3 + 2) à 660 Hz | **une seule fois** à l’apparition |
| Alerte **orange** (priorité moyenne) | silencieuse (bandeau seul) | — |
| Notification (info, rapport, escalade, acquittement) | motifs courts distincts | une fois |
| Capteurs / notifs / exercice | silencieux par politique | — |

- L’audio est **déverrouillé à la première interaction** (clic, touche, toucher) ; avant cela un message invite à cliquer.
- *Réglages du son* (Réglages / bandeau) : volume, sourdine, interrupteur par catégorie — tout est **persisté** (`localStorage`).
- Une **alarme rouge ne peut pas être coupée** par la sourdine ni par sa catégorie : seulement « Pause 2 min » (rappel ensuite)
  ou **Acquitter** ; son volume ne descend pas sous 40 %.
- Le son accompagne toujours un signal **visuel** (bandeau d’alarme avec icône + mot) ; jamais de son seul.
  `prefers-reduced-motion` ne coupe pas les sons (préférences distinctes).
- Logique testée sans navigateur : `tests/sound.spec.ts` (sourdine, alarme rouge non coupable, pause 2 min, persistance).

## Page d’accueil publique

Espace sobre inspiré des sites NASA : champ d’étoiles en canvas (dérive lente), limbe terrestre, parallaxe légère, typographie
Hubot Sans / Mona Sans / Monaspace, logo PULSAR. Sections : 5 dangers HRP (onglets interactifs), parcours montre → tablette →
médecin → NASA (animé au défilement), 3 rôles, fonctionnalités, démo interactive (montre + silhouette 3D chargée à la demande +
mini-courbes FC/SpO₂ en direct, données fictives), chiffres animés, frise chronologique, équipe NAS-HACKERS — NASA Space Apps
Challenge 2026, Lomé. Respecte `prefers-reduced-motion` (aucune animation), responsive, contrastes AA.

