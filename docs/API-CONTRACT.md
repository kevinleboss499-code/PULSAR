# Contrat d’API PULSAR (front ↔ backend FastAPI)

Ce document décrit **exactement** ce que le front-end (`frontend/src/api/`) attend du backend.
Le backend (voir `backend/README.md`) doit renvoyer ces formes JSON ; le front les convertit en types
TypeScript (`frontend/src/api/types.ts`) via `frontend/src/api/mapping.ts`.

## Généralités

- **URL de base** : `VITE_API_URL` (défaut `http://localhost:8000`).
- **Format** : JSON UTF-8, clés en **snake_case**.
- **Dates** : ISO 8601 en UTC, ex. `"2026-11-14T09:41:00Z"`.
- **Délai** : le front abandonne une requête après **4 s**.
- **Erreurs** : code HTTP ≠ 2xx + corps `{"detail": "message"}` (format FastAPI par défaut).
- **CORS** : autoriser `http://localhost:5173` et `http://localhost:4173`.
- **Identifiant astronaute (`astronaut_id`)** : code équipage court — `AM`, `LK`, `NO`, `SR`.
  Correspondance avec les identifiants de connexion : AST-001 → `LK`, AST-002 → `AM`, AST-003 → `NO`, AST-004 → `SR`.
- **Niveaux** : `"vert"` (dans la plage) · `"orange"` (attention) · `"rouge"` (alerte). Le front les affiche
  avec les voyants v6 (ok / caution / warning).
- **`drift_score`** : nombre **0 à 1** (0 = ligne de base personnelle, 1 = très anormal).

## Comportement du front si l’API manque

| Situation | Comportement |
| --- | --- |
| `VITE_USE_MOCK=true` | simulateur local uniquement, aucune requête |
| API injoignable (réseau / délai) | bascule sur le simulateur, nouvel essai de l’API toutes les 30 s ; puce « Simulateur » en haut |
| API répond 4xx/5xx | erreur affichée dans la carte concernée (pas de bascule) |

---

## GET `/astronauts`

Liste de l’équipage. Interrogé toutes les 30 s.

```json
[
  {
    "id": "LK",
    "name": "Lina Kovacs",
    "role": "Ingénieure de vol",
    "cabin": "Cabine 2",
    "status": "orange",
    "drift_score": 0.58,
    "last_sync": "2026-11-14T09:39:00Z"
  }
]
```

| Champ | Type | Description |
| --- | --- | --- |
| `id` | string | code équipage |
| `name`, `role`, `cabin` | string | affichage |
| `status` | `"vert" \| "orange" \| "rouge"` | état global calculé par le backend |
| `drift_score` | number 0–1 | dernier score de dérive |
| `last_sync` | string ISO | dernière synchronisation capteurs |

## GET `/telemetry`

Échantillons capteurs, **ordre chronologique croissant** (le plus récent en dernier). Interrogé toutes les **2 s** pour les courbes temps réel.

Paramètres : `astronaut_id` (obligatoire), `limit` (défaut 60), `since` (ISO, optionnel : seulement les points postérieurs), `until` (ISO, optionnel : fenêtre **fixe** se terminant à cet instant — utilisé par le conducteur de temps en mode « Fixe » ; sans `until`, la fenêtre se termine maintenant).

`GET /telemetry?astronaut_id=LK&limit=60`

```json
[
  {
    "astronaut_id": "LK",
    "timestamp": "2026-11-14T09:41:00Z",
    "heart_rate": 94,
    "spo2": 97,
    "radiation_dose_rate": 19.4,
    "radiation_cumulative": 42.1,
    "skin_temp": 36.9,
    "hrv": 41,
    "drift_score": 0.57,
    "sensor_id": "esp32-montre-lk"
  }
]
```

| Champ | Type | Unité |
| --- | --- | --- |
| `heart_rate` | number | battements / min |
| `spo2` | number | % (seuil d’alerte affiché : 92 %) |
| `radiation_dose_rate` | number | µSv/h (débit de dose instantané) |
| `radiation_cumulative` | number | mSv (cumul mission) |
| `skin_temp` | number \| null | °C (optionnel) |
| `hrv` | number \| null | ms, RMSSD (optionnel) |
| `drift_score` | number | 0–1 |
| `sensor_id` | string \| null | identifiant du module ESP-32 (optionnel) |

## GET `/alerts`

Alertes produites par les modèles ou les règles. Interrogé toutes les 15 s. **Plus récentes d’abord.**

Paramètres optionnels : `astronaut_id`, `level` (`vert|orange|rouge`).

`GET /alerts?astronaut_id=LK`

```json
[
  {
    "id": "AL-127-004",
    "astronaut_id": "LK",
    "level": "orange",
    "metric": "heart_rate",
    "message": "FC de repos en hausse sur 3 jours (94 bpm, plage 60–100).",
    "value": 94,
    "threshold": 90,
    "drift_score": 0.58,
    "model": "lstm_autoencoder",
    "created_at": "2026-11-14T15:00:00Z",
    "acknowledged": false,
    "assignee": "CMO-001",
    "seen_at": null,
    "ack_by": null,
    "workflow_status": "nouveau"
  }
]
```

| Champ | Type | Valeurs |
| --- | --- | --- |
| `level` | string | `vert`, `orange`, `rouge` |
| `metric` | string | `heart_rate`, `spo2`, `radiation`, `skin_temp`, `hrv`, `drift` |
| `value`, `threshold` | number \| null | valeur mesurée / seuil franchi |
| `model` | string | `isolation_forest`, `lstm_autoencoder`, `rule` |
| `acknowledged` | boolean | acquittée par le médecin de bord |
| `assignee` | string \| null | responsable (AST-/CMO-/NASA-FS-…) |
| `seen_at` | string ISO \| null | accusé « vu » (tablette ou montre) |
| `ack_by` | string \| null | qui a acquitté |
| `workflow_status` | string \| null | `nouveau` · `vu` · `pris_en_charge` · `resolu` · `escalade` |

## GET `/health` (optionnel)

```json
{ "status": "ok", "version": "0.1.0", "models": ["isolation_forest", "lstm_autoencoder"] }
```

## Authentification (optionnelle, plus tard)

Activée côté front en renseignant `VITE_AUTH_API_URL` (sinon : comptes de démonstration, voir `ROLES-ET-IDENTIFIANTS.md`).

`POST /auth/login` — corps `{"identifier": "AST-001", "code": "482105"}` → 200 :

```json
{
  "user": { "id": "AST-001", "role": "astronaute", "displayName": "Lina Kovacs", "title": "Ingénieure de vol", "crewId": "LK" },
  "token": "…",
  "issuedAt": 1794649260000,
  "expiresAt": 1794692460000
}
```

`role` ∈ `astronaute`, `medecin-bord`, `nasa`. Réponses d’erreur : 401 (identifiant/code incorrect), 429 (trop d’essais).
`POST /auth/logout` → 204. Les routes de données devront ensuite filtrer selon le rôle
(astronaute : uniquement ses données ; médecin de bord : tout l’équipage ; NASA : rapports).

---

## Prédictions et solutions proposées (aide à la décision, PAS un diagnostic)

Le front affiche ces données à trois niveaux : l’astronaute (ses données, langage simple : champs `plain_*`),
le médecin de bord (tout l’équipage, détail : modèles, scores, contributions, validation), la NASA (synthèse dans les rapports).

### GET `/predictions/{astronaut_id}?horizon=24h|7d`

- `24h` : pas **horaire**, 24 h passées observées + 24 h prévues ; `7d` : pas **journalier**, 7 j passés + 7 j prévus.
- Le sommeil est toujours journalier (`resolution: "day"`).
- Rafraîchi toutes les 60 s.

```json
{
  "astronaut_id": "LK",
  "generated_at": "2026-11-14T15:00:00Z",
  "horizon": "24h",
  "model": "lstm_forecaster v0.3",
  "risk_level": "orange",
  "drift_score": 0.58,
  "next_threshold": { "metric": "heart_rate", "label": "FC de repos", "level": "orange", "hours": 8 },
  "forecasts": [
    {
      "metric": "heart_rate", "label": "FC de repos", "unit": "bpm", "resolution": "hour",
      "points": [
        { "timestamp": "2026-11-14T14:00:00Z", "observed": 95 },
        { "timestamp": "2026-11-14T15:00:00Z", "observed": 96, "predicted": 96.0, "lower": 94.6, "upper": 97.4 },
        { "timestamp": "2026-11-14T16:00:00Z", "predicted": 96.8, "lower": 95.1, "upper": 98.5 }
      ],
      "thresholds": { "orange": 100, "rouge": 120, "direction": "above" },
      "level": "orange", "trend": "hausse",
      "time_to_threshold_hours": 8, "threshold_level": "orange",
      "summary": "FC de repos : 96 bpm maintenant, prévision hausse sur les 24 prochaines heures (109 bpm). Seuil orange (100 bpm) probable dans environ 8 h."
    }
  ],
  "anomalies": [
    {
      "id": "AN-LK-01", "astronaut_id": "LK", "metric": "heart_rate", "label": "FC de repos en hausse sur 3 jours",
      "value": 94, "unit": "bpm", "level": "orange", "model": "lstm_autoencoder", "drift_score": 0.58,
      "detected_at": "2026-11-14T14:00:00Z",
      "contributors": [ { "signal": "FC de repos", "weight": 0.46 }, { "signal": "Durée de sommeil", "weight": 0.31 }, { "signal": "VFC (RMSSD)", "weight": 0.15 }, { "signal": "Température", "weight": 0.08 } ],
      "explanation": "Erreur de reconstruction de l’autoencodeur LSTM au 97e centile de la ligne de base personnelle…",
      "plain_explanation": "Votre pouls au repos monte depuis 3 jours et vos nuits sont plus courtes que d’habitude."
    }
  ]
}
```

| Champ | Valeurs / unité |
| --- | --- |
| `forecasts[].metric` | `heart_rate` (bpm), `spo2` (%), `bp_systolic` (mmHg), `skin_temp` (°C), `glucose` (mg/dL), `sleep` (h), `radiation` (µSv/h) — **les 7 sont attendues** |
| `points[]` | `observed` absent dans le futur (ou entre deux mesures de kit) ; `predicted`, `lower`, `upper` (intervalle de confiance 80 %) présents à partir de « maintenant » |
| `thresholds.direction` | `above` (alerte si valeur ≥ seuil) ou `below` (≤ seuil, ex. SpO₂, sommeil) |
| `time_to_threshold_hours` | délai avant le premier franchissement prévu de `threshold_level` (`null` si aucun dans l’horizon) |
| `contributors[].weight` | 0–1, somme ≈ 1 (ex. SHAP ou erreur de reconstruction par variable) |
| `summary` | phrase FR lue par les lecteurs d’écran (CDC EF-47) |

### GET `/recommendations/{astronaut_id}`

Solutions **non diagnostiques** liées à une anomalie (`source: "anomalie"`) ou à une prévision (`"prevision"`).

```json
[
  {
    "id": "RC-LK-02", "astronaut_id": "LK", "anomaly_id": "AN-LK-01", "source": "anomalie",
    "category": "hydratation", "priority": "moyenne",
    "title": "Boire 500 mL d’eau d’ici 12:00",
    "rationale": "La déshydratation relative en microgravité peut augmenter la FC de repos…",
    "plain_text": "Buvez une poche d’eau de 500 mL avant midi.",
    "status": "proposee", "updated_at": null, "updated_by": null, "assignee": "AST-001", "note": null, "replacement_title": null
  }
]
```

| Champ | Valeurs |
| --- | --- |
| `category` | `hydratation`, `repos_sommeil`, `ajustement_exercice`, `abri_radiations`, `remesure`, `echographie`, `contact_medecin_bord`, `contact_flight_surgeon` |
| `priority` | `haute`, `moyenne`, `basse` |
| `status` | `proposee` → `appliquee` (en cours) / `faite` / `escaladee` ; médecin de bord : `validee` ou `remplacee` (avec `replacement_title`, `note`) — UI : Nouveau / Vu / Pris en charge / Résolu / Escaladé |
| `assignee` | responsable courant (identifiant) |

### PATCH `/recommendations/{astronaut_id}/{recommendation_id}`

Corps : `{"status": "escaladee", "by": "AST-001", "note": "…", "replacement_title": "…"}` → 200 + la recommandation à jour.
Droits attendus côté serveur : l’astronaute ne modifie que les siennes (`appliquee`, `faite`, `escaladee`) ;
seul le médecin de bord peut `validee` / `remplacee` ; la NASA est en lecture seule.

---

## Gamification (CDC § 5.9) — aucune route pour l’instant

Séries, badges et missions du jour sont calculés **localement** (démo) à partir de la **régularité** uniquement.
Si un backend les reprend : ne jamais exposer de valeur de santé, seulement des compteurs (mesures faites / prévues).
