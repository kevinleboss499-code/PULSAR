/* Types du domaine PULSAR (partagés par les données de démo et, plus tard, l’API). */

/** Voyant d’état NASA C&W : ok = nominal, caution = attention (orange/jaune), warning = alerte (rouge). */
export type Light = "ok" | "caution" | "warning";

/** Membre d’équipage (les valeurs de démo sont marquées DÉMO à l’écran). */
export type Member = {
  id: string; name: string; role: string; light: Light; reason: string;
  hr: number; bp: string; spo2: number; temp: string; sleep: string; mood: number; fatigue: string; sync: string; cabin: string;
};

/** Mesure lue sur une échographie, avec l’intervalle qui permet de ne pas se tromper. */
export type EchoMeasure = {
  label: string;
  value: string;
  unit: string;
  /** Intervalle de lecture, ex. « 3,5–5,6 cm ». */
  range: string;
  light: Light;
  /** « Dans les limites » ou « Hors limites ». */
  verdict: string;
};

/** Pièce jointe échographique d’un rapport sol. Une image et un clip ne portent pas la même lecture. */
export type EchoStudy = {
  id: string;
  astronautId: string;
  zone: "heart" | "eye";
  /** Nom de la coupe, sans abréviation. */
  view: string;
  kind: "still" | "clip";
  captured: string;
  operator: string;
  preset: string;
  depthCm: number;
  gain: string;
  quality: Light;
  qualityLabel: string;
  /** Durée du clip, ex. « 6 s ». */
  duration?: string;
  annotated: boolean;
  /** Texte court brûlé sur le caliper, ex. « VG 4,1 cm ». */
  mark?: string;
  finding: string;
  measures: EchoMeasure[];
  /** Ce que le trait jaune désigne. Absent s’il n’y a pas de caliper. */
  legend?: string;
};

/** Rapport médical envoyé au sol par liaison satellite. */
export type Report = {
  id: string; kind: "scheduled" | "red"; title: string; generated: string; received: string; age: string; size: string;
  lights: Record<string, Light>; images: number; notes: string; unread: boolean;
  /** Responsable sol / bord. */
  assignee?: string;
  /** Nouveau | Vu | Pris en charge | Résolu | Escaladé */
  workflowStatus?: "nouveau" | "vu" | "pris_en_charge" | "resolu" | "escalade";
  /** Images et clips réellement joints. Vide si le rapport n’a pas d’échographie. */
  studies?: EchoStudy[];
};

/** Rôles applicatifs = un tableau de bord chacun. */
export type Role = "astronaute" | "medecin-bord" | "nasa";
