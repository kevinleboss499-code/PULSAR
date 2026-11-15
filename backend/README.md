# PULSAR — backend (prévu, non implémenté)

> Ce dossier est **volontairement vide** : le dépôt ne contient aujourd’hui que le **front-end** (`../frontend`).
> Ce README décrit le backend Python à développer. Le contrat JSON exact attendu par le front est dans
> [`../docs/API-CONTRACT.md`](../docs/API-CONTRACT.md) — c’est la référence à respecter.

Tant que ce backend n’existe pas (ou n’est pas joignable), le front bascule automatiquement sur son
**simulateur local** (badge « Simulateur » / « DÉMO » dans l’interface).

## Rôle

Recevoir la télémétrie des capteurs portés par l’équipage, détecter les dérives physiologiques
(anomalies) et exposer au front trois ressources : **astronautes**, **télémétrie**, **alertes**.

```
Capteurs ESP-32 (montre, oxymètre, dosimètre, température)
        │  Wi-Fi local du vaisseau (HTTP POST ou MQTT)
        ▼
  FastAPI ── ingestion ──► stockage (CSV / SQLite au départ)
        │                        │
        │                 modèles d’anomalie (Isolation Forest, autoencodeur LSTM)
        │                        │  → drift_score 0–1 → niveau vert / orange / rouge
        ▼                        ▼
  GET /astronauts   GET /telemetry   GET /alerts   ──►  frontend React (VITE_API_URL)
```

## Pile technique prévue

| Élément | Choix |
| --- | --- |
| Langage | Python **3.10+** |
| API | **FastAPI** + **Uvicorn** (ASGI) |
| Données | **Pandas**, **NumPy** |
| Détection d’anomalies | **scikit-learn** (`IsolationForest`) et/ou **PyTorch** (autoencodeur **LSTM** sur fenêtres temporelles) |
| Validation | Pydantic (modèles de réponse = contrat JSON) |
| Matériel | Capteurs sur microcontrôleurs **ESP-32** (FC, SpO₂, dosimètre, température cutanée) |

## Données d’entrée

- `data/vitals_daily.csv` — constantes quotidiennes par astronaute (FC repos, SpO₂, sommeil, VFC, température, dose…), historique pour entraîner / calibrer les modèles.
- `data/alerts_examples.csv` — exemples d’alertes étiquetées (niveau vert/orange/rouge, métrique, message) pour valider les seuils et les messages.

Les deux fichiers sont chargés au démarrage (Pandas) ; les colonnes seront mappées vers les champs du contrat (`heart_rate`, `spo2`, `radiation_dose_rate`, …).

## Routes à exposer (détail : `docs/API-CONTRACT.md`)

| Méthode | Route | Usage côté front |
| --- | --- | --- |
| GET | `/astronauts` | liste de l’équipage + état global + `drift_score` |
| GET | `/telemetry?astronaut_id=LK&limit=60&since=…` | courbes temps réel FC / SpO₂ / rayonnement (interrogé toutes les 2 s) |
| GET | `/alerts?astronaut_id=LK&level=orange` | alertes du modèle (toutes les 15 s) |
| GET | `/predictions/{astronaut_id}?horizon=24h\|7d` | prévisions (prévu vs observé + intervalle), anomalies, risque, délai avant seuil |
| GET | `/recommendations/{astronaut_id}` | solutions proposées non diagnostiques |
| PATCH | `/recommendations/{astronaut_id}/{id}` | appliquer / fait / escalader (astronaute), valider / remplacer (médecin de bord) |
| GET | `/health` | (optionnel) supervision |
| POST | `/auth/login`, `/auth/logout` | (optionnel, plus tard) remplace l’authentification de démo du front |

## Score de dérive (`drift_score`)

Nombre **0 → 1** par astronaute et par échantillon : 0 = conforme à sa ligne de base personnelle, 1 = très anormal.
Proposition : score normalisé de l’Isolation Forest (ou erreur de reconstruction de l’autoencodeur LSTM ramenée sur 0–1).
Niveaux suggérés : **vert** < 0,40 ≤ **orange** < 0,70 ≤ **rouge** (à calibrer avec `alerts_examples.csv`).
Les règles seuils absolues restent prioritaires (ex. SpO₂ < 92 % → rouge).

## Sorties attendues des modèles (à respecter, voir le contrat)

- **Prévision** (par astronaute, 7 indicateurs : FC de repos, SpO₂, tension systolique, température, glycémie, sommeil, débit de dose) :
  valeurs prévues + **intervalle de confiance 80 %** (`lower`/`upper`), horizon 24 h (pas horaire) et 7 j (pas journalier),
  niveau prévu, tendance, **délai avant seuil** (`time_to_threshold_hours`) et phrase de résumé en français.
  Ex. modèle : LSTM de prévision ou modèle saisonnier (cycle circadien) + tendance, recalé sur la ligne de base personnelle.
- **Anomalies** : modèle (`isolation_forest`, `lstm_autoencoder`, `rule`), `drift_score` 0–1, **signaux contributeurs** pondérés
  (ex. erreur de reconstruction par variable, valeurs SHAP), explication détaillée + explication en langage simple.
- **Solutions proposées** : règles métier (pas d’IA générative médicale) reliant anomalie/prévision → action non diagnostique
  (hydratation, sommeil, exercice adapté, abri anti-radiations, remesure, échographie, contact médecin de bord / flight surgeon),
  avec priorité et justification ; le statut est modifié par l’équipage puis validé ou remplacé par le médecin de bord.
- Toute sortie est une **aide à la décision**, jamais un diagnostic.

## Démarrage (quand le code existera)

```bash
cd backend
python -m venv .venv
# Windows : .venv\Scripts\activate     macOS/Linux : source .venv/bin/activate
pip install fastapi "uvicorn[standard]" pandas numpy scikit-learn torch
uvicorn app.main:app --reload --port 8000
```

Arborescence suggérée : `app/main.py` (FastAPI + CORS), `app/routers/{astronauts,telemetry,alerts}.py`,
`app/models/{isolation_forest,lstm_ae}.py`, `app/schemas.py` (Pydantic), `data/*.csv`.

**CORS** : autoriser `http://localhost:5173` (Vite dev) et `http://localhost:4173` (preview).

Côté front, il suffit alors de mettre dans `frontend/.env` :

```
VITE_API_URL=http://localhost:8000
VITE_USE_MOCK=false
```
