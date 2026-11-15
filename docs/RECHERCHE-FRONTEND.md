# Recherches front-end PULSAR — synthèse

Document de cadrage : moodboards Pinterest, décisions produit « from scratch », et écarts avec le code actuel.  
Objectif : une UI santé spatiale **sobre**, lisible en mission, sans coller Open MCT ni un look « dashboard générique ».

---

## 1. Moodboards Pinterest (sources)

| # | Recherche | Lien | Ce qu’on en tire | Ce qu’on refuse |
|---|---|---|---|---|
| 1 | **mission control dashboard UI** | [ouvrir](https://www.pinterest.com/search/pins/?q=mission%20control%20dashboard%20UI) | Densité télémétrique, colonnes nom / heure / valeur / unité, hiérarchie claire, fond sombre opérationnel | Grilles saturées, néons, panneaux « sci-fi » ornés |
| 2 | **health monitoring dashboard dark UI** | [ouvrir](https://www.pinterest.com/search/pins/?q=health%20monitoring%20dashboard%20dark%20UI) | Constantes vitales (FC, SpO₂), courbes temps réel, cartes de statut sobres | Gadgets médicaux grand public, glassmorphism, cards décoratives |
| 3 | **spacecraft HUD interface minimal** | [ouvrir](https://www.pinterest.com/search/pins/?q=spacecraft%20HUD%20interface%20minimal) | Landing et chrome façon cockpit : traits fins, bleu minimal, vaisseau / planète en atmosphère | HUD militaire surchargé, scanlines, glow, hologrammes |
| 4 | **patient monitor UI alert design** | [ouvrir](https://www.pinterest.com/search/pins/?q=patient%20monitor%20UI%20alert%20design) | Code couleur hors nominal seulement ; orange ≠ rouge ; **toujours icône + mot** | Couleur seule comme signal ; alarme purement cosmétique |
| 5 | **predictive analytics dashboard forecast chart** | [ouvrir](https://www.pinterest.com/search/pins/?q=predictive%20analytics%20dashboard%20forecast%20chart) | Observé plein / prévu tirets / bande de confiance unie claire ; seuils visibles | Aires dégradées, sparklines floues, « AI purple » |
| 6 | **health app gamification badges streak UI** | [ouvrir](https://www.pinterest.com/search/pins/?q=health%20app%20gamification%20badges%20streak%20UI) | Séries et badges de **régularité** (mesures faites), couleurs lisibles, défis légers | Classements, scores de santé, confettis, ombres lourdes, néon |

Ces six fils restent les références visuelles à rouvrir avant toute itération Figma / landing / alertes / prévisions / objectifs.

### Pins / modèles à viser (parcourus 2026-04)

| Source | Modèle | À reprendre pour PULSAR |
|---|---|---|
| Pinterest `health monitoring dashboard dark UI` | Aura Health, SAAS Health Dashboard, widgets fitness dark | Rail large + libellés, cartes mesures, vitaux, anneau / barres, panneau droit profil |
| Ref utilisateur (Oniexly) | Overview 3 colonnes, project cards, progress pills, CTA primaire, donut stats | **Composition de l’accueil astronaute** (`dash-product`) |
| `mission control dashboard UI` | densités ops | Médecin de bord / LAD (pas le chrome astronaute) |
| `spacecraft HUD interface minimal` | traits fins | Landing + mode bras |

**Ne plus dériver** vers un « vehicle overview » générique pour l’astronaute : la cible produit = dashboard santé dark type Oniexly / SAAS Health, tokens PULSAR (cyan, Lamp, pas de violet).

### Langage UI appliqué (`frontend/src/styles/hud.css`)
- Accueil astronaute : `dash-product` (cartes mesures, pills, panneau droit, ProgressRing)
- Rail desktop ~200 px, libellés lisibles ; compact ≤ 1180 px
- Médecin : densité liste ops / hud-strip conservée
- Tokens navy console (`--bg` / `--surface`) ; pas de glass violet

---

## 2. Direction produit (brief « from scratch »)

### Positionnement
Application de **suivi santé pour astronautes** (tablette + montre). Design **indépendant d’Open MCT** : on ne copie ni layout ni composants Open MCT ; on s’inspire des moodboards ci-dessus et de la charte PULSAR (tokens, polices, Lamp).

### Landing
- Spatiale et sobre : vaisseau + planète qui flottent, touches de couleur **médicale** sur fond **bleu minimal**.
- Au démarrage, **une fois par visite** : ~1 s logo PULSAR en zoom de fond, puis ligne **ECG** qui se trace ; **sautable d’un clic**.

### Responsabilité & cycle de vie
Chaque alerte, solution, examen ou rapport affiche clairement **qui est responsable** et **où ça en est** :

| État | Signification |
|---|---|
| Nouveau | créé, pas encore ouvert |
| Vu | ouvert par le destinataire |
| Pris en charge | quelqu’un agit |
| Résolu | clôturé |
| Escaladé | remonté (médecin ↔ NASA / flight surgeon) |

### Astronaute
- Carte du corps pour noter les symptômes.
- Mesures guidées + graphiques en parcours.
- Actions rapides tablette et montre.

### Sons (IEC 60601-1-8)
- Motif **différent** orange vs rouge.
- Rouge : pause **2 min max**, et **seulement après avoir été vue** ; pas de coupe via sourdine globale.
- **Pas d’icône son dédiée** dans le chrome : le son part de l’app (bandeau / flux d’alerte), pas d’un menu haut-parleur séparé.

### Gamification
- Défis de régularité, **sans ombre lourde**, couleurs bien visibles.
- Jamais de valeur de santé, jamais de classement, désactivable (CDC § 5.9 / EF-42–44).

### Stack
- **React + Vite** (pas Next.js : pas de SSR utile pour une API locale).
- Client API inchangé : `VITE_API_URL`, routes astronautes / télémétrie / alertes / prédictions / recommandations.
- Stubs / mock locaux pour le dev (`VITE_USE_MOCK` ou API injoignable).

### Montre connectée
- Carte en haut du dashboard : icône, **état**, bouton **Se connecter**.
- Au clic : scan des montres à proximité → appairage.
- Sans montre : section **inactive**.
- Champs API à prévoir / étendre : **responsable** + **accusé** (accusé de réception / vu) pour lier tablette ↔ montre.

### Dépôt
- Le dépôt Vite jetable créé par Cursor a été écarté ; on garde le dépôt projet intact.
- Cible d’installation souhaitée : `C:\Pulsar-project` (depuis `D:\PULSAR-PROJECT` si déplacement).

---

## 3. Mapping recherche → modules front

| Thème Pinterest / brief | Module actuel (indicatif) | Priorité évolution |
|---|---|---|
| Mission control + health dark | `features/medecin-bord`, `components/charts`, `components/telemetry` | Densité + LAD ; **retirer la dépendance conceptuelle « Open MCT »** des docs/UI si on assume from scratch |
| HUD spatial minimal | `features/landing` | Refonte landing : vaisseau/planète, intro logo+ECG 1×/visite |
| Alertes patient monitor | `features/sound`, `Lamp`, bandeau alarme | Cycle Nouveau→…→Escaladé ; responsable visible ; pas d’icône son chrome |
| Forecast charts | `features/predictions` | Conserver observé/prévu/IC ; mention aide à la décision |
| Gamification streaks | `features/gamification` | Alléger ombres ; renforcer contraste badges |
| Carte corps / symptômes | `components/body3d`, `/astronaute/silhouette` | Symptômes annotables, pas seulement zones |
| Montre | `features/montre`, `/astronaute/montre` | Carte appairage scan + états connecté/inactif |
| Workflow responsable | alertes / recommandations / rapports | Champs `assignee` / `ack` / `status` dans contrat API |

---

## 4. Écarts code actuel ↔ brief

| Sujet | Aujourd’hui | Brief |
|---|---|---|
| Référence Open MCT | Documentée + TimeConductor / LadTable « inspirés » | Design **sans MCT** (principes télémétrie OK, pas de cadrage Open MCT) |
| Landing | Starfield / limbe / démo | Vaisseau + planète, intro logo→ECG skippable |
| Statuts workflow | Niveaux vert/orange/rouge | + cycle Nouveau / Vu / Pris en charge / Résolu / Escaladé + responsable |
| Sons | Menu haut-parleur + réglages | Pas d’icône son ; pause rouge 2 min **après vu** |
| Montre | Galerie / synchro UI | Carte dashboard + scan / appairage ; inactive si absente |
| Gamification | Sobre, EF-42–44 | Idem + couleurs plus visibles, moins d’ombre |
| Stack / API | React Vite, `VITE_API_URL` | **Inchangé** |

---

## 5. Checklist avant implémentation

1. Rouvrir les 6 recherches Pinterest ; épingler 2–3 refs max par thème (pas de collage).
2. Décider Figma : nouveaux nœuds landing + carte montre + pastilles de statut workflow.
3. Étendre `docs/API-CONTRACT.md` : `status` workflow, `assignee`, `acknowledged_at` / `ack_by` (montre).
4. Landing : intro sessionStorage « déjà vue cette visite », skip clic.
5. Sons : retirer contrôle chrome dédié ; garder bandeau + pause 2 min post-vu pour rouge.
6. Typecheck + e2e après chaque tranche.

---

## 6. Revue design (code ↔ docs)

Voir **[REVUE-DESIGN.md](./REVUE-DESIGN.md)** — croisement charte v6 + Figma + contrat API + ce brief.  
**Verdict** : charte technique OK ; brief from scratch (landing, workflow, montre, icône son, intro ECG) encore à faire.

## 7. Liens utiles du repo

- Charte : `.cursor/rules/design-system.mdc`, `frontend/src/design/tokens.css`
- Écrans Figma : `docs/DESIGN.md`, `frontend/src/design/figma-map.ts`
- Contrat API : `docs/API-CONTRACT.md`
- Rôles / comptes démo : `docs/ROLES-ET-IDENTIFIANTS.md`
- Revue : `docs/REVUE-DESIGN.md`
