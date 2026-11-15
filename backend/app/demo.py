"""Équipage fictif et textes de démo. Aucune donnée OSDR n'est présentée comme celle de l'équipage."""

CREW = {
    "AM": {"name": "Alex Morgan", "role": "Commandant", "cabin": "Cabine 1", "status": "vert", "drift": 0.12, "hr": 68, "spo2": 98, "dose": 18.5},
    "LK": {"name": "Lina Kovacs", "role": "Ingénieure de vol", "cabin": "Cabine 2", "status": "orange", "drift": 0.58, "hr": 94, "spo2": 97, "dose": 19.2},
    "NO": {"name": "Nolan Okafor", "role": "Scientifique · médecin de bord", "cabin": "Infirmerie", "status": "vert", "drift": 0.09, "hr": 62, "spo2": 99, "dose": 18.1},
    "SR": {"name": "Sofia Reyes", "role": "Pilote", "cabin": "Cabine 3", "status": "vert", "drift": 0.21, "hr": 71, "spo2": 98, "dose": 18.8},
}

# Codes de démo publics (les mêmes que le front). Seule l'empreinte est enregistrée.
USERS = [
    ("AST-001", "astronaute", "LK", "Lina Kovacs", "Ingénieure de vol", "482105"),
    ("AST-002", "astronaute", "AM", "Alex Morgan", "Commandant", "130742"),
    ("AST-003", "astronaute", "NO", "Nolan Okafor", "Scientifique", "559031"),
    ("AST-004", "astronaute", "SR", "Sofia Reyes", "Pilote", "246813"),
    ("CMO-001", "medecin-bord", "NO", "Dr Nolan Okafor", "Médecin de bord", "731406"),
    ("NASA-FS-001", "nasa", None, "Dr Maya Chen", "Flight surgeon", "905218"),
    ("NASA-FS-002", "nasa", None, "Dr Daniel Brooks", "Flight surgeon", "618847"),
]

# Clés factices. La montre ne peut envoyer que pouls, sommeil et SpO₂.
KEYS = [
    ("watch-lk", "demo-key-watch-lk", "montre", "LK", "heart_rate,sleep,spo2"),
    ("watch-am", "demo-key-watch-am", "montre", "AM", "heart_rate,sleep,spo2"),
    ("watch-no", "demo-key-watch-no", "montre", "NO", "heart_rate,sleep,spo2"),
    ("watch-sr", "demo-key-watch-sr", "montre", "SR", "heart_rate,sleep,spo2"),
    ("kit-lk", "demo-key-kit-lk", "kit", "LK", "glucose,temperature,mood,bp_systolic,bp_diastolic"),
    ("cmo", "demo-key-cmo", "medecin-bord", None, "heart_rate,sleep,spo2,glucose,temperature,mood,bp_systolic,bp_diastolic"),
]

RECS = [
    ("RC-LK-01", "LK", "AN-LK-02", "anomalie", "repos_sommeil", "haute", "Avancer le coucher de 45 min ce soir (créneau protégé)", "Dette de sommeil sur 4 nuits. SIMULÉ.", "Couchez-vous 45 minutes plus tôt ce soir.", "proposee", None, None, "AST-001", None, None),
    ("RC-LK-02", "LK", "AN-LK-01", "anomalie", "hydratation", "moyenne", "Boire 500 mL d’eau d’ici 12:00", "Aide à la décision, pas un diagnostic. SIMULÉ.", "Buvez une poche d’eau de 500 mL avant midi.", "proposee", None, None, "AST-001", None, None),
    ("RC-LK-05", "LK", "AN-LK-01", "anomalie", "echographie", "haute", "Échographie cardiaque guidée (vue 4 cavités)", "À réaliser par le médecin de bord. SIMULÉ.", "Le médecin de bord vous proposera une échographie du cœur.", "validee", "2026-11-15T08:00:00Z", "CMO-001", "CMO-001", "Prévue à 14:00 à l’infirmerie.", None),
    ("RC-SR-01", "SR", "AN-SR-01", "anomalie", "remesure", "moyenne", "Remesurer la SpO₂ ce soir", "Événement peut-être lié au capteur. SIMULÉ.", "Refaites la mesure d’oxygène ce soir.", "faite", "2026-11-14T22:55:00Z", "AST-004", "AST-004", None, None),
    ("RC-AM-01", "AM", None, "prevision", "abri_radiations", "moyenne", "Préparer le repli vers l’abri anti-radiations pendant la sortie de J128", "Prévision de dose simulée, pas une mesure d’équipage.", "Si le dosimètre passe à l’orange, rejoignez l’abri.", "proposee", None, None, "CMO-001", None, None),
]
