/* Types de l’API PULSAR (backend Python FastAPI prévu — voir docs/API-CONTRACT.md).
   Le JSON du serveur est en snake_case ; le client le convertit en camelCase (ces types). */

/** Niveau d’alerte du backend : vert = nominal, orange = attention, rouge = alerte. */
export type AlertLevel = "vert" | "orange" | "rouge";

/** GET /astronauts */
export type Astronaut = {
  id: string;            // "LK" (identifiant d’équipage, = crewId des utilisateurs)
  name: string;          // "Lina Kovacs"
  role: string;          // fonction à bord : "Ingénieure de vol"
  cabin: string;         // "Cabine 2"
  status: AlertLevel;    // état global calculé par le backend
  driftScore: number;    // 0–1, score de dérive du modèle (Isolation Forest / autoencodeur LSTM)
  lastSync: string;      // ISO 8601 UTC de la dernière synchro capteurs
};

/** GET /telemetry — un échantillon capteurs (ESP-32 : montre / ceinture / dosimètre). */
export type TelemetrySample = {
  astronautId: string;
  timestamp: string;              // ISO 8601 UTC
  heartRate: number;              // bpm
  spo2: number;                   // %
  radiationDoseRate: number;      // µSv/h (débit instantané)
  radiationCumulative: number;    // mSv cumulés sur la mission
  skinTemp?: number;              // °C
  hrv?: number;                   // ms (RMSSD)
  driftScore: number;             // 0–1 pour cet échantillon
  sensorId?: string;              // "esp32-lk-wrist"
};

export type AlertMetric = "heart_rate" | "spo2" | "radiation" | "skin_temp" | "hrv" | "drift";
export type AlertModel = "isolation_forest" | "lstm_autoencoder" | "rule";

/** Cycle de vie commun (alerte, solution, examen, rapport, montre). */
export type WorkflowStatus = "nouveau" | "vu" | "pris_en_charge" | "resolu" | "escalade";

/** GET /alerts */
export type Alert = {
  id: string;
  astronautId: string;
  level: AlertLevel;
  metric: AlertMetric;
  message: string;        // texte FR prêt à afficher
  value?: number;
  threshold?: number;
  driftScore: number;     // 0–1
  model: AlertModel;
  createdAt: string;      // ISO 8601 UTC
  acknowledged: boolean;
  /** Responsable courant (identifiant AST-/CMO-/NASA-FS- ou rôle court). */
  assignee?: string | null;
  /** Accusé / vu (montre ou tablette) — ISO 8601 UTC. */
  seenAt?: string | null;
  /** Qui a acquitté / accusé réception. */
  ackBy?: string | null;
  /** État workflow ; dérivé si absent. */
  workflowStatus?: WorkflowStatus | null;
};

/** Origine des données affichées : vraie API ou simulateur local (DÉMO). */
export type DataSource = "api" | "mock";

/* ───────── Prédictions et solutions proposées (aide à la décision, PAS un diagnostic) ───────── */

/** Indicateurs prévus par le modèle de prévision. */
export type PredictionMetric = "heart_rate" | "spo2" | "bp_systolic" | "skin_temp" | "glucose" | "sleep" | "radiation";
/** Horizon demandé : 24 h (pas horaire) ou 7 jours (pas journalier). */
export type Horizon = "24h" | "7d";

/** Un point de courbe : observé (passé) et/ou prévu (futur) avec intervalle de confiance [lower, upper]. */
export type ForecastPoint = {
  timestamp: string;     // ISO 8601 UTC
  observed?: number;     // mesure réelle (absente dans le futur ou entre deux mesures de kit)
  predicted?: number;    // valeur prévue (présente à partir du dernier point observé)
  lower?: number;        // borne basse de l’intervalle de confiance (80 %)
  upper?: number;        // borne haute
};

export type MetricForecast = {
  metric: PredictionMetric;
  label: string;                    // "FC de repos"
  unit: string;                     // "bpm"
  resolution: "hour" | "day";       // le sommeil est toujours journalier
  points: ForecastPoint[];          // ordre chronologique
  thresholds: { orange?: number; rouge?: number; direction: "above" | "below" };
  level: AlertLevel;                // niveau prévu au bout de l’horizon
  trend: "hausse" | "baisse" | "stable";
  timeToThresholdHours?: number | null; // délai estimé avant de franchir `thresholdLevel` (null = pas dans l’horizon)
  thresholdLevel?: AlertLevel;      // seuil concerné (orange ou rouge)
  summary: string;                  // phrase FR pour lecteur d’écran (EF-47)
};

/** Signal ayant contribué à une anomalie (poids 0–1, somme ≈ 1). */
export type Contributor = { signal: string; weight: number };

/** Anomalie détectée par un modèle. */
export type Anomaly = {
  id: string;
  astronautId: string;
  metric: PredictionMetric | "drift";
  label: string;                    // "FC de repos en hausse"
  value?: number;
  unit?: string;
  level: AlertLevel;
  model: AlertModel;
  driftScore: number;               // 0–1
  detectedAt: string;               // ISO 8601 UTC
  contributors: Contributor[];
  explanation: string;              // texte détaillé (médecin)
  plainExplanation: string;         // texte simple (astronaute)
};

/** GET /predictions/{astronaut_id}?horizon=24h|7d */
export type Prediction = {
  astronautId: string;
  generatedAt: string;
  horizon: Horizon;
  model: string;                    // "lstm_forecaster v0.3"
  riskLevel: AlertLevel;            // niveau de risque global prévu
  driftScore: number;               // 0–1
  nextThreshold?: { metric: PredictionMetric; label: string; level: AlertLevel; hours: number } | null;
  forecasts: MetricForecast[];
  anomalies: Anomaly[];
};

export type RecommendationCategory =
  | "hydratation" | "repos_sommeil" | "ajustement_exercice" | "abri_radiations"
  | "remesure" | "echographie" | "contact_medecin_bord" | "contact_flight_surgeon";
export type Priority = "haute" | "moyenne" | "basse";
/** Cycle de vie : proposée → appliquée / faite / escaladée ; le médecin de bord peut valider ou remplacer. */
export type RecommendationStatus = "proposee" | "appliquee" | "faite" | "escaladee" | "validee" | "remplacee";

/** GET /recommendations/{astronaut_id} — solution proposée, non diagnostique. */
export type Recommendation = {
  id: string;
  astronautId: string;
  anomalyId?: string | null;        // anomalie liée (ou null si issue d’une prévision)
  source: "anomalie" | "prevision";
  category: RecommendationCategory;
  priority: Priority;
  title: string;                    // "Boire 500 mL d’eau d’ici 12:00"
  rationale: string;                // pourquoi (texte médecin)
  plainText: string;                // consigne en langage simple (astronaute)
  status: RecommendationStatus;
  updatedAt?: string | null;
  updatedBy?: string | null;        // identifiant de l’utilisateur ("AST-001", "CMO-001")
  /** Responsable courant de la solution. */
  assignee?: string | null;
  note?: string | null;             // note du médecin de bord
  replacementTitle?: string | null; // nouvelle consigne si "remplacee"
};

/** PATCH /recommendations/{astronaut_id}/{recommendation_id} */
export type RecommendationUpdate = { status: RecommendationStatus; by: string; note?: string; replacementTitle?: string };
