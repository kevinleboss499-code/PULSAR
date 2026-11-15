# Revue design PULSAR — documentation ↔ code

Date : 2026-11-14.  
Sources croisées : `docs/RECHERCHE-FRONTEND.md`, `docs/DESIGN.md`, `.cursor/rules/design-system.mdc`, `docs/API-CONTRACT.md`, `AGENTS.md`, `README.md`, code `frontend/src`.

**Verdict (màj implémentation)** : brief from scratch **appliqué** dans le code (landing HUD + intro, workflow, montre, sons sans chrome, symptômes, badges). Conserver cette revue comme checklist de non-régression.

---

## 1. Conflit entre documents (à trancher)

| Document | Position |
|---|---|
| `design-system.mdc`, `DESIGN.md`, `README`, crédits landing | Open MCT = **référence d’inspiration** (LAD, TimeConductor, Inspecteur) |
| `RECHERCHE-FRONTEND.md` (brief) | Design **sans cadrage Open MCT** ; moodboards Pinterest |

**Recommandation** : garder LAD / conducteur / inspecteur (utiles) mais **renommer / débaptiser** dans l’UI et les docs (« Dernières valeurs », « Fenêtre temps », pas « Open MCT »). Principes télémétrie OK ; crédit Apache-2.0 seulement si on cite encore Open MCT.

---

## 2. Ce qui est aligné (charte + API)

| Règle | Preuve code |
|---|---|
| Tokens uniquement (`tokens.css` / `tokens.ts`) | Thèmes sombre / clair, pas de palette parallèle |
| Hubot / Mona / Monaspace | `@font-face` + variables |
| Icônes lucide via `<Icon>` | `components/ui/Icon.tsx` |
| Couleur d’état hors nominal + icône + mot | `<Lamp />`, bandeau alarme |
| Graphiques Recharts sobres | `LiveVitalsChart`, `ForecastChart`, `isAnimationActive={false}` |
| Prévisions : plein / tirets / IC unie + disclaimer | `features/predictions` |
| Gamification régularité, pas de classement, désactivable | `features/gamification` · EF-42/43/44 |
| Sons IEC orange ≠ rouge ; rouge non coupable par sourdine | `features/sound/settings.ts` · `LOCKED` |
| Pause rouge 2 min | `SNOOZE_MS = 120_000` |
| Stack React + Vite, `VITE_API_URL`, mock | inchangé |
| Solutions : cycle partiel + `updatedBy` | `RecommendationStatus` · `Solutions.tsx` |
| Alertes : `acknowledged` booléen | `api/types.ts` · contrat API |
| Étiquette DÉMO | `<Demo />`, `DataTag` |
| Figma ↔ routes | `figma-map.ts` · `DESIGN.md` |

---

## 3. Écarts majeurs (brief recherche ↔ UI)

| # | Brief / Pinterest | État actuel | Gravité | Où agir |
|---|---|---|---|---|
| A | Landing vaisseau + planète, bleu minimal | Starfield + limbe Terre + stats hero + crédit Open MCT | Haute | `features/landing/` |
| B | Intro 1×/visite : logo zoom → ECG, skip clic | Absente | Haute | nouveau composant landing |
| C | Pas d’icône son dans le chrome | `SoundMenu` dans `RoleLayout` + nav landing | Haute | `RoleLayout.tsx`, `LandingPage.tsx` ; réglages son → `/reglages` seulement |
| D | Pause rouge **seulement après vu** | Pause dispo dès l’apparition du bandeau | Haute | `AlarmRow` / `SoundProvider` : gate `seen` |
| E | Workflow Nouveau / Vu / Pris en charge / Résolu / Escaladé + **responsable** sur alerte, examen, rapport | Alertes : vert/orange/rouge + `acknowledged` ; solutions : proposee→… ; pas d’assignee unifié | Haute | types + `API-CONTRACT` + UI pastilles |
| F | Carte montre dashboard : état + Se connecter → scan / appairage ; inactive sans montre | `/astronaute/montre` = aperçu / galerie, pas de BLE/scan | Haute | `AstroHome` + store montre |
| G | Carte corps = noter symptômes | Silhouette = zones HRP + risques, pas de saisie symptôme | Moyenne | `AstroBody` |
| H | Gamification couleurs bien visibles, sans ombre lourde | Sobre OK (pas d’ombre lourde) ; badges un peu discrets (`opacity` / `--text-2`) | Basse | `features.css` `.badges` |
| I | Docs / UI sans cadrage MCT | Commentaires + crédits + README « façon Open MCT » | Moyenne | docs + landing footer |

---

## 4. Écarts charte v6 (interdits / détails)

| Problème | Fichier | Note |
|---|---|---|
| Anneau animé autour de la sonde (halo) | `app.css` `.probe-pin` | Contredit « aucun halo / glow » |
| Dégradés landing (voile + mask Terre) | `landing.css` | Acceptables si justifiés AA ; brief préfère bleu minimal sans voile cinéma |
| `box-shadow` inset sélection | `app.css`, `features.css` | Structurels (barre accent), pas glow — OK |
| Prototype Figma « Choix du profil » encore listé | `DESIGN.md` | Code = `/connexion` seul — doc à clarifier (déjà noté) |

---

## 5. Mapping Pinterest → conformité

| Recherche | Conformité | Commentaire |
|---|---|---|
| mission control dashboard UI | Partielle | LAD + densités médecin OK ; branding MCT à retirer |
| health monitoring dark UI | Bonne | FC/SpO₂, Lamp, thèmes |
| spacecraft HUD minimal | Faible | Landing trop « site NASA marketing », pas cockpit HUD |
| patient monitor alert design | Bonne visuelle | Manque workflow + règle « vu avant pause » |
| predictive analytics forecast | Bonne | Aligné design-system |
| gamification badges streak | Bonne (règles) | Renforcer contraste badges |

---

## 6. Workflow cible (unifier le vocabulaire)

Aujourd’hui les **solutions** utilisent : Proposée · En cours · Faite · Escaladée · Validée · Remplacée.  
Le brief veut pour **tout** artefact : Nouveau · Vu · Pris en charge · Résolu · Escaladé.

Proposition d’alignement UI (labels FR) :

| Brief | Recommandation actuelle | Alerte | Examen / rapport |
|---|---|---|---|
| Nouveau | proposee | `!acknowledged` + jamais ouverte | créé |
| Vu | — (à ajouter) | ouverte / `seen_at` | ouvert |
| Pris en charge | appliquee / validee | prise en charge CMO | en cours |
| Résolu | faite | acknowledged + clôturée | envoyé / clos |
| Escaladé | escaladee | escalade NASA | file montante |

Champs API à ajouter (contrat) : `assignee`, `workflow_status`, `seen_at` / `ack_by` (montre).

---

## 7. Priorités d’implémentation

1. **Docs** : trancher Open MCT (garder composants, retirer cadrage) ; pointer cette revue depuis `RECHERCHE-FRONTEND.md`.
2. **Sons** : retirer `SoundMenu` du chrome ; pause rouge conditionnée à « vu » ; garder panneau dans Réglages.
3. **Workflow + responsable** : types + pastilles sur alertes / solutions / écho / rapports NASA.
4. **Landing** : intro logo→ECG ; hero vaisseau/planète bleu minimal ; retirer SoundMenu + crédit MCT si tranché.
5. **Montre** : carte dashboard scan/appairage (stub mock) ; section inactive si non appairée.
6. **Silhouette** : saisie symptômes par zone (en plus des risques HRP).
7. **Polish** : contraste badges ; supprimer halo `.probe-pin`.

---

## 8. Hors design (rappel brief)

- Stack / client API : **ne pas changer**.
- Déplacement dépôt `D:\PULSAR-PROJECT` → `C:\Pulsar-project` : ops Git, pas UI.
