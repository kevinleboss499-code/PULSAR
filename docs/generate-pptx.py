"""PULSAR AHM — présentation projet (style concours / carton).
Démonstratif · infos claires et précises · captures d’écran · sans bordures bizarres."""
from pathlib import Path

from PIL import Image, ImageOps
from pptx import Presentation
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE
from pptx.enum.text import PP_ALIGN
from pptx.util import Inches, Pt

ROOT = Path(__file__).resolve().parent
ASSETS = ROOT / "pptx-assets"
SCREENS = ROOT / "screens"
CACHE = ASSETS / "_cropped"
OUT = ROOT / "PULSAR-AHM-presentation.pptx"
OUT_ALT = ROOT / "PULSAR-AHM-pitch.pptx"

BLACK = RGBColor(0x08, 0x0C, 0x14)
SURFACE = RGBColor(0x14, 0x1C, 0x2A)
CYAN = RGBColor(0x3D, 0xC2, 0xD1)
WHITE = RGBColor(0xF0, 0xF4, 0xF8)
MUTED = RGBColor(0xA0, 0xAC, 0xBA)
GREEN = RGBColor(0x4C, 0xB8, 0x7A)
ORANGE = RGBColor(0xE8, 0xA8, 0x38)
RED = RGBColor(0xE0, 0x5A, 0x4C)

W, H = Inches(13.333), Inches(7.5)
FONT = "Calibri"
TOTAL = 8


def run(p, text, size=15, bold=False, color=WHITE, italic=False):
    r = p.add_run()
    r.text = text
    r.font.size = Pt(size)
    r.font.bold = bold
    r.font.italic = italic
    r.font.color.rgb = color
    r.font.name = FONT
    return r


def fill(shape, color):
    shape.fill.solid()
    shape.fill.fore_color.rgb = color
    shape.line.fill.background()


def blank(prs):
    return prs.slides.add_slide(prs.slide_layouts[6])


def find_img(name):
    for base in (ASSETS, SCREENS):
        p = base / name
        if p.exists():
            return p
    return None


def crop(src: Path, tag, w_in, h_in):
    CACHE.mkdir(exist_ok=True)
    out = CACHE / f"{tag}.jpg"
    im = Image.open(src).convert("RGB")
    im = ImageOps.fit(
        im,
        (max(1, int(w_in * 140)), max(1, int(h_in * 140))),
        Image.Resampling.LANCZOS,
        centering=(0.5, 0.35),
    )
    im.save(out, "JPEG", quality=88)
    return out


def pic(slide, name, l, t, w, h, tag):
    src = find_img(name)
    if not src:
        sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(l), Inches(t), Inches(w), Inches(h))
        fill(sh, SURFACE)
        return sh
    path = crop(src, tag, w, h)
    return slide.shapes.add_picture(str(path), Inches(l), Inches(t), Inches(w), Inches(h))


def block(slide, l, t, w, h, color):
    sh = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(l), Inches(t), Inches(w), Inches(h))
    fill(sh, color)
    return sh


def link(shape, slides, idx):
    try:
        shape.click_action.target_slide = slides[idx]
    except Exception:
        pass


def chrome(slide, n, title):
    box = slide.shapes.add_textbox(Inches(0.55), Inches(0.25), Inches(3), Inches(0.28))
    run(box.text_frame.paragraphs[0], "PULSAR AHM", 11, True, CYAN)
    num = slide.shapes.add_textbox(Inches(11.8), Inches(0.25), Inches(1), Inches(0.28))
    p = num.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.RIGHT
    run(p, f"{n}/{TOTAL}", 11, False, MUTED)
    if title:
        t = slide.shapes.add_textbox(Inches(0.55), Inches(0.65), Inches(12.2), Inches(0.45))
        run(t.text_frame.paragraphs[0], title, 24, True, WHITE)


def arrows(slide, slides, n):
    if n > 1:
        b = block(slide, 11.2, 7.0, 0.8, 0.3, SURFACE)
        tb = slide.shapes.add_textbox(Inches(11.2), Inches(7.02), Inches(0.8), Inches(0.28))
        p = tb.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run(p, "←", 13, True, MUTED)
        link(b, slides, n - 2)
    if n < TOTAL:
        b = block(slide, 12.15, 7.0, 0.8, 0.3, CYAN)
        tb = slide.shapes.add_textbox(Inches(12.15), Inches(7.02), Inches(0.8), Inches(0.28))
        p = tb.text_frame.paragraphs[0]
        p.alignment = PP_ALIGN.CENTER
        run(p, "→", 13, True, BLACK)
        link(b, slides, n)


def bullet_block(slide, l, t, w, h, lines, size=14):
    box = slide.shapes.add_textbox(Inches(l), Inches(t), Inches(w), Inches(h))
    tf = box.text_frame
    tf.word_wrap = True
    for i, line in enumerate(lines):
        p = tf.paragraphs[0] if i == 0 else tf.add_paragraph()
        p.space_after = Pt(6)
        run(p, line, size, False, MUTED)
    return box


def build():
    if CACHE.exists():
        for f in CACHE.glob("*"):
            f.unlink()

    prs = Presentation()
    prs.slide_width = W
    prs.slide_height = H
    slides = [blank(prs) for _ in range(TOTAL)]

    # ════════ 1 TITRE ════════
    s = slides[0]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    pic(s, "pptx-space-bg.jpg", 6.6, 0, 6.733, 7.5, "t1")
    block(s, 0, 0, 6.9, 7.5, BLACK)

    chrome(s, 1, None)
    t = s.shapes.add_textbox(Inches(0.55), Inches(1.8), Inches(5.8), Inches(2.8))
    tf = t.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "PULSAR AHM", 42, True, WHITE, italic=True)
    p = tf.add_paragraph()
    p.space_before = Pt(10)
    run(p, "Astronaut Health Monitoring", 18, False, CYAN)
    p = tf.add_paragraph()
    p.space_before = Pt(12)
    run(
        p,
        "Logiciel de suivi de santé pour missions longues.\n"
        "NASA Space Apps Challenge 2026",
        14,
        False,
        MUTED,
    )

    cta = block(s, 0.55, 5.4, 2.6, 0.45, CYAN)
    tb = s.shapes.add_textbox(Inches(0.55), Inches(5.48), Inches(2.6), Inches(0.32))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run(p, "Présentation  →", 13, True, BLACK)
    link(cta, slides, 1)
    arrows(s, slides, 1)

    # ════════ 2 CONTEXTE ════════
    s = slides[1]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 2, "Contexte et problème")

    # three info panels — no borders, just fills
    panels = [
        (
            "Contexte",
            "Défi NASA Space Apps 2026 :\n"
            "créer un logiciel de suivi de santé\n"
            "pour les astronautes en mission.",
        ),
        (
            "Problème",
            "Délai Terre ↔ Mars jusqu’à 20 min\n"
            "dans chaque sens. Pas de suivi live.\n"
            "Rayonnement, isolement, microgravité.",
        ),
        (
            "Enjeu",
            "L’équipage doit évaluer son état\n"
            "et agir à bord, sans dépendre\n"
            "d’une connexion permanente.",
        ),
    ]
    for i, (title, body) in enumerate(panels):
        x = 0.55 + i * 4.2
        block(s, x, 1.4, 4.0, 3.3, SURFACE)
        box = s.shapes.add_textbox(Inches(x + 0.3), Inches(1.65), Inches(3.4), Inches(2.8))
        tf = box.text_frame
        tf.word_wrap = True
        run(tf.paragraphs[0], title, 16, True, CYAN)
        p = tf.add_paragraph()
        p.space_before = Pt(12)
        run(p, body, 14, False, MUTED)

    note = s.shapes.add_textbox(Inches(0.55), Inches(5.1), Inches(12.2), Inches(1.2))
    tf = note.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "Important", 13, True, ORANGE)
    p = tf.add_paragraph()
    run(
        p,
        "PULSAR est un prototype de concours. Ce n’est pas un dispositif médical "
        "et il ne pose pas de diagnostic. Les valeurs affichées sont fictives (DÉMO).",
        13,
        False,
        MUTED,
    )
    arrows(s, slides, 2)

    # ════════ 3 SOLUTION ════════
    s = slides[2]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 3, "La solution PULSAR")

    pic(s, "projet-accueil-landing.png", 7.0, 1.3, 5.8, 5.2, "landing")

    box = s.shapes.add_textbox(Inches(0.55), Inches(1.35), Inches(6.1), Inches(5.0))
    tf = box.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "Application web hors-ligne à bord", 16, True, CYAN)
    p = tf.add_paragraph()
    p.space_before = Pt(14)
    run(
        p,
        "Montre connectée\n"
        "Pouls et sommeil en continu, alertes,\n"
        "rappels de mesures manuelles.\n\n"
        "Tablette astronaute\n"
        "État de santé, saisie tension / glycémie,\n"
        "historique, bien-être.\n\n"
        "Serveur du vaisseau\n"
        "Données équipage, calcul d’alertes,\n"
        "rapports vers Houston dès liaison.",
        14,
        False,
        MUTED,
    )
    arrows(s, slides, 3)

    # ════════ 4 PARCOURS ════════
    s = slides[3]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 4, "Parcours utilisateur")

    steps = [
        ("1", "Accueil", "Présentation publique\ndu projet PULSAR", "projet-accueil-landing.png"),
        ("2", "Connexion", "Identifiant + code\nRôle déduit automatiquement", "projet-connexion.png"),
        ("3", "Tableau de bord", "Données selon le rôle\nAST · CMO · NASA-FS", "projet-astronaute-AST-001.png"),
        ("4", "Action", "Alertes, mesures,\nrapports et consignes", "projet-predictions-medecin.png"),
    ]
    for i, (num, title, desc, img) in enumerate(steps):
        x = 0.4 + i * 3.25
        pic(s, img, x, 1.35, 3.05, 2.9, f"flow{i}")
        box = s.shapes.add_textbox(Inches(x), Inches(4.45), Inches(3.05), Inches(1.8))
        tf = box.text_frame
        tf.word_wrap = True
        run(tf.paragraphs[0], f"{num}  {title}", 15, True, CYAN)
        p = tf.add_paragraph()
        p.space_before = Pt(6)
        run(p, desc, 12, False, MUTED)
    arrows(s, slides, 4)

    # ════════ 5 RÔLES ════════
    s = slides[4]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 5, "Trois rôles — trois interfaces")

    roles = [
        (
            "Astronaute  ·  AST-",
            "Ses données uniquement\n"
            "Montre · silhouette · kits\n"
            "Prédictions · objectifs",
            "projet-astronaute-AST-001.png",
        ),
        (
            "Médecin de bord  ·  CMO-",
            "Tout l’équipage\n"
            "Alertes · dossiers · LAD\n"
            "Échographie guidée",
            "projet-medecin-bord-CMO-001.png",
        ),
        (
            "NASA Houston  ·  NASA-FS-",
            "Rapports reçus au sol\n"
            "Liaison satellite\n"
            "Réponse / consignes",
            "projet-nasa-FS-001.png",
        ),
    ]
    for i, (title, desc, img) in enumerate(roles):
        x = 0.45 + i * 4.25
        pic(s, img, x, 1.3, 4.05, 3.15, f"role{i}")
        box = s.shapes.add_textbox(Inches(x), Inches(4.6), Inches(4.05), Inches(1.9))
        tf = box.text_frame
        tf.word_wrap = True
        run(tf.paragraphs[0], title, 13, True, CYAN)
        p = tf.add_paragraph()
        p.space_before = Pt(8)
        run(p, desc, 12, False, MUTED)
    arrows(s, slides, 5)

    # ════════ 6 INDICATEURS + ALERTES ════════
    s = slides[5]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 6, "Indicateurs et niveaux d’alerte")

    # left: indicators table-like
    block(s, 0.55, 1.3, 6.3, 5.2, SURFACE)
    box = s.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(5.8), Inches(4.8))
    tf = box.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "6 indicateurs suivis", 15, True, CYAN)
    rows = [
        "Fréquence cardiaque — montre — 60–100 / min",
        "Sommeil — montre — ≥ 7 h / nuit",
        "Tension — tensiomètre — < 120/80 mmHg",
        "Glycémie — glucomètre — 70–99 mg/dL",
        "Température — thermomètre — 36,1–37,2 °C",
        "Humeur — saisie tablette — score 1 à 5",
    ]
    for line in rows:
        p = tf.add_paragraph()
        p.space_before = Pt(10)
        run(p, f"•  {line}", 13, False, MUTED)

    # right: 3 alert levels — pastilles, no bars
    levels = [
        (GREEN, "VERT", "Nominal — routine normale"),
        (ORANGE, "ORANGE", "Attention — médecin de bord"),
        (RED, "ROUGE", "Urgence — rapport Houston"),
    ]
    for i, (color, code, desc) in enumerate(levels):
        y = 1.3 + i * 1.75
        block(s, 7.15, y, 5.6, 1.55, SURFACE)
        dot = s.shapes.add_shape(
            MSO_SHAPE.OVAL, Inches(7.45), Inches(y + 0.55), Inches(0.35), Inches(0.35)
        )
        fill(dot, color)
        box = s.shapes.add_textbox(Inches(8.0), Inches(y + 0.35), Inches(4.4), Inches(1.0))
        tf = box.text_frame
        tf.word_wrap = True
        run(tf.paragraphs[0], code, 18, True, color)
        p = tf.add_paragraph()
        p.space_before = Pt(4)
        run(p, desc, 13, False, MUTED)
    arrows(s, slides, 6)

    # ════════ 7 DÉMO ÉCRANS ════════
    s = slides[6]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 7, "Démonstration — ce que l’on voit")

    demos = [
        ("Montre", "projet-astronaute-montre.png", "Mesures continues\net alertes au poignet"),
        ("Dossier médecin", "projet-medecin-dossier-temps-reel.png", "Télémétrie temps réel\net historique"),
        ("Prédictions", "projet-predictions-medecin.png", "Prévu vs observé\nAide à la décision"),
        ("Rapport NASA", "projet-rapport-nasa-predictions.png", "Synthèse envoyée\nau sol"),
    ]
    for i, (title, img, desc) in enumerate(demos):
        x = 0.4 + i * 3.25
        pic(s, img, x, 1.3, 3.05, 3.4, f"demo{i}")
        box = s.shapes.add_textbox(Inches(x), Inches(4.9), Inches(3.05), Inches(1.5))
        tf = box.text_frame
        tf.word_wrap = True
        run(tf.paragraphs[0], title, 14, True, CYAN)
        p = tf.add_paragraph()
        p.space_before = Pt(6)
        run(p, desc, 12, False, MUTED)
    arrows(s, slides, 7)

    # ════════ 8 LIVRABLES ════════
    s = slides[7]
    block(s, 0, 0, 13.333, 7.5, BLACK)
    chrome(s, 8, "Livrables et critères de réussite")

    left_items = [
        "Prototype fonctionnel (tablette, médecin, montre)",
        "Code source public",
        "Vidéo de démonstration (≤ 30 s)",
        "Page projet Space Apps (anglais)",
        "Cahier des charges v2.0",
    ]
    right_items = [
        "6 indicateurs saisis et affichés avec état",
        "Alerte orange / rouge + action claire",
        "Équipage visible en un seul écran",
        "Rapport « envoyé » au sol (simulation)",
        "Fonctionne entièrement en mode avion",
        "État compris en moins de 10 secondes",
    ]

    block(s, 0.55, 1.3, 6.0, 4.6, SURFACE)
    box = s.shapes.add_textbox(Inches(0.8), Inches(1.5), Inches(5.5), Inches(4.2))
    tf = box.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "Livrables", 16, True, CYAN)
    for line in left_items:
        p = tf.add_paragraph()
        p.space_before = Pt(10)
        run(p, f"•  {line}", 13, False, MUTED)

    block(s, 6.85, 1.3, 5.9, 4.6, SURFACE)
    box = s.shapes.add_textbox(Inches(7.1), Inches(1.5), Inches(5.4), Inches(4.2))
    tf = box.text_frame
    tf.word_wrap = True
    run(tf.paragraphs[0], "Critères de réussite", 16, True, CYAN)
    for line in right_items:
        p = tf.add_paragraph()
        p.space_before = Pt(8)
        run(p, f"•  {line}", 13, False, MUTED)

    cta = block(s, 5.2, 6.2, 2.8, 0.42, CYAN)
    tb = s.shapes.add_textbox(Inches(5.2), Inches(6.28), Inches(2.8), Inches(0.3))
    p = tb.text_frame.paragraphs[0]
    p.alignment = PP_ALIGN.CENTER
    run(p, "↩  Retour à l’accueil", 12, True, BLACK)
    link(cta, slides, 0)
    arrows(s, slides, 8)

    saved = []
    for path in (OUT, OUT_ALT):
        try:
            prs.save(path)
            saved.append(path.name)
        except PermissionError:
            print(f"Locked: {path.name}")
    print("Wrote:", ", ".join(saved) if saved else "none")


if __name__ == "__main__":
    build()
