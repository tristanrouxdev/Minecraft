# PLAN — Guide Suprême du Survivant (Minecraft Java 26.2 + snapshots 26.3)

> Spécification d'implémentation destinée à Claude Code.
> Lire ce document en entier avant d'écrire la moindre ligne de code.
> Exécuter les phases dans l'ordre (§10). Ne pas dévier des contraintes (§2) ni des interdits (§11).

---

## 1. Contexte & objectif

Site web statique de type "guide de survie exhaustif" pour Minecraft Java Edition, hébergé sur un dépôt Git privé (GitHub Pages possible). Aucune contrainte SEO. Public : le propriétaire du dépôt et ses proches.

- **Version de référence du contenu : Java 26.2 "Chaos Cubed" (stable, sortie 16/06/2026).**
- **Contenu 26.3 (snapshots en cours)** : intégré uniquement dans des blocs balisés `data-version="26.3-snapshot"`, masquables par l'utilisateur.
- Cumul couvert : 1.21 (Tricky Trials) → 1.21.4 → 1.21.6 → 1.21.9 (Copper Age) → 1.21.11 (Mounts of Mayhem) → 26.1 (Tiny Takeover) → 26.2 (Chaos Cubed) → 26.3 (snapshots).
- Langue du site : **français**.

## 2. Contraintes non négociables

- **HTML/CSS/JS vanilla uniquement.** Zéro framework, zéro librairie tierce, zéro CDN, zéro dépendance npm (pas de `package.json` avec deps ; un `package.json` minimal avec des `scripts` est autorisé).
- **Aucun build step au runtime** : le site servi est du HTML statique final.
- **Un seul script de génération** : `scripts/build.mjs`, Node ≥ 20, zéro dépendance, qui injecte les partials (voir §4).
- **Chemins relatifs partout** (`../assets/...`) : le site doit fonctionner en `file://` ET sur GitHub Pages (sous-chemin `/repo/`).
- Le JS est **progressif** : toute page reste lisible et navigable avec JS désactivé (les widgets affichent alors un fallback `<noscript>` court).
- Compatibilité : derniers Chrome/Firefox/Edge. Pas de support legacy.
- **Ne jamais éditer `docs/` à la main** : c'est la sortie générée.

## 3. Arborescence cible

```
guide-survivant/
├── src/                          # SOURCE DE VÉRITÉ (éditable)
│   ├── index.html
│   ├── pages/
│   │   ├── fondations.html
│   │   ├── combat.html
│   │   ├── exploration.html
│   │   ├── dimensions.html
│   │   ├── technique.html
│   │   └── changelog.html
│   └── partials/
│       ├── head.html             # <meta>, liens CSS communs
│       ├── header.html           # Bandeau + nav principale
│       └── footer.html
├── docs/                         # SORTIE GÉNÉRÉE = site servi (GitHub Pages "docs/")
│   ├── index.html
│   ├── pages/*.html
│   ├── css/  js/  assets/  data/ # copiés/symétriques depuis la racine
│   └── .nojekyll
├── css/
│   ├── variables.css             # Design tokens (§6)
│   ├── base.css                  # Reset léger, typo, éléments natifs
│   ├── layout.css                # Grid, sidebar, TOC, responsive
│   ├── components.css            # Cards "slot", badges, encadrés, tableaux, tooltips
│   └── tools.css                 # Styles des widgets/calculateurs
├── js/
│   ├── main.js                   # Bootstrap commun : thème, TOC/scrollspy, badges version
│   ├── components/
│   │   ├── tooltip.js
│   │   ├── search.js
│   │   ├── toc.js
│   │   └── version-badge.js
│   └── tools/
│       ├── checklist.js
│       ├── nether-calc.js
│       ├── mining-calc.js
│       ├── stack-calc.js
│       └── craft-viewer.js
├── data/
│   ├── versions.json
│   ├── checklists.json
│   ├── recipes.json
│   ├── ores.json
│   ├── mobs.json
│   └── search-index.json
├── assets/
│   ├── img/icons/                # Sprite sheet d'items (placeholder au départ, voir §6)
│   ├── img/screenshots/          # WebP, loading=lazy
│   └── fonts/                    # Police pixel en woff2 (voir §6)
├── scripts/
│   └── build.mjs
├── .gitignore
├── package.json                  # scripts only: "build", "watch"
└── README.md                     # Setup, conventions, procédure de maj snapshot
```

## 4. Système de build (`scripts/build.mjs`)

Comportement exact attendu :

1. Lit récursivement `src/**/*.html`.
2. Remplace chaque marqueur `<!-- @include:NOM -->` par le contenu de `src/partials/NOM.html`.
3. Supporte des variables simples dans les partials : `{{title}}`, `{{depth}}` (préfixe relatif `./` ou `../`), déclarées en tête de page source via un commentaire front-matter :
   `<!-- @page title="Combat" depth="../" -->`
4. Écrit le résultat dans `docs/` en conservant l'arborescence.
5. Copie (ou synchronise) `css/`, `js/`, `data/`, `assets/` vers `docs/`.
6. Crée `docs/.nojekyll`.
7. Flag `--watch` : re-build sur modification via `fs.watch` (best effort, pas de lib).
8. Sort avec un code d'erreur non nul et un message clair si un partial référencé est manquant.

`package.json` → `"scripts": { "build": "node scripts/build.mjs", "watch": "node scripts/build.mjs --watch" }`.

## 5. Conventions

- **Balisage de version** : tout bloc de contenu lié à un drop porte `data-version` (`"26.2"`, `"26.3-snapshot"`, `"1.21.11"`, etc.). Le badge visuel est généré par `version-badge.js` à partir de cet attribut + `data/versions.json`. Un toggle global "Masquer le contenu snapshot" (persisté) applique `display:none` aux blocs `*-snapshot`.
- **localStorage** : toutes les clés préfixées `gs_` (`gs_theme`, `gs_hide_snapshot`, `gs_checklist_<page>`).
- **Items** : un terme de jeu interactif est balisé `<span class="item" data-item="mace">Masse</span>` ; `tooltip.js` résout `data-item` dans `mobs.json`/`recipes.json`.
- **JS** : modules ES (`type="module"`), pas de globals, chaque widget s'auto-initialise sur `[data-widget="..."]`. Le JS d'un outil n'est chargé que sur les pages qui l'utilisent.
- **CSS** : nommage type BEM léger (`.card`, `.card--danger`, `.badge`, `.badge--snapshot`). Pas de `!important`. Attention aux collisions de spécificité entre sélecteurs de section et de composant.
- **Accessibilité** : contrastes AA, `:focus-visible` stylé, `prefers-reduced-motion` respecté, widgets navigables au clavier, `aria-live="polite"` sur les résultats de calculateurs.

## 6. Design system

Direction : **"terminal de survie"** — la lisibilité d'une doc technique, l'ADN Minecraft en clins d'œil précis, pas en pastiche. L'élément signature (unique, tout le reste reste sobre) : **les conteneurs "slot d'inventaire"** — bordure 2px double-ton effet inset (clair haut/gauche, sombre bas/droite), coins carrés, zéro border-radius sur tout le site — et les **barres de progression style barre d'XP**.

Tokens (`variables.css`) :

```css
:root[data-theme="dark"] {  /* défaut */
  --bg: #17181c;            /* deepslate */
  --surface: #232529;
  --surface-2: #2c2f35;
  --text: #e8e6e3;
  --text-dim: #a8a5a0;
  --border-light: #3d4046;  /* haut/gauche des slots */
  --border-dark: #0d0e10;   /* bas/droite des slots */
  --accent-emerald: #2fbf71;   /* validation, checklists, barres XP */
  --accent-gold: #e6b31e;      /* astuces, loot */
  --accent-redstone: #d64541;  /* danger */
  --accent-amethyst: #9a6fd0;  /* liens, badge snapshot */
  --accent-copper: #c47a4a;    /* accents secondaires 26.x */
}
```

- **Typographie** : police pixel (Monocraft ou équivalent libre, woff2 auto-hébergé, `font-display: swap`) **réservée aux h1/h2, badges et chiffres des barres de progression**. Corps en pile système (`system-ui`), 17px, interligne 1.6, largeur de lecture max ~75ch.
- **Composants** : cards "slot" ; encadrés éditoriaux façon toast de progrès — `Astuce` (or), `Danger` (redstone), `Snapshot` (améthyste) ; badges de version accolés aux titres de section ; tableaux zébrés avec scroll horizontal mobile ; barre XP (dégradé émeraude, chiffre pixel centré) ; breadcrumb.
- **Layout desktop** : sidebar nav sticky gauche (6 pages) / contenu centre / TOC de page sticky droite avec scrollspy. **Mobile** (<720px) : burger + TOC en accordéon. Breakpoints : 720 / 1080.
- **Icônes d'items** : générer au départ des **placeholders pixel-art originaux en SVG/CSS** (carrés 32px avec initiale + couleur de rareté). Ne PAS télécharger ni embarquer de textures Mojang. Prévoir la sprite sheet (`background-position`) pour un remplacement ultérieur par l'utilisateur.
- **Motion** : une seule animation orchestrée (remplissage des barres XP à l'entrée dans le viewport) ; hover discrets ; rien d'autre.

## 7. Schémas de données (`data/`)

```jsonc
// versions.json — source de vérité des drops (alimente badges + changelog)
[
  {
    "id": "26.3-snapshot",
    "label": "26.3 (snapshot)",
    "status": "snapshot",
    "date": null,
    "summary": "Forêt tachetée, bois de peuplier, camps abandonnés, escaliers/dalles de laine, coussins, lit de paille.",
    "entries": [
      { "date": "2026-06-23", "title": "Snapshot 1", "notes": ["Forêt tachetée + set peuplier", "Camps abandonnés", "Escaliers et dalles de laine"] },
      { "date": "2026-07-07", "title": "Snapshot 3", "notes": ["Coussins (16 couleurs)", "Lit de paille", "Recettes de potions personnalisables (data packs)"] }
    ],
    "links": ["pages/exploration.html#foret-tachetee", "pages/technique.html#confort-build"]
  }
]

// checklists.json — { "fondations": [ { "id": "f01", "label": "Craft d'un établi", "phase": "Jour 1" }, ... ] }

// recipes.json — { "coussin": { "name": "Coussin", "grid": [null,null,null, "dalle_laine","dalle_laine","dalle_laine", null,null,null], "output": 1, "version": "26.3-snapshot" }, ... }
// grid = 9 cases (établi 3×3), valeurs = ids d'items ou null.

// ores.json — { "diamant": { "name": "Diamant", "yMin": -64, "yMax": 16, "yBest": -59, "note": "...", "distribution": [[-64,8],[-59,10],[-48,6],[0,1]] }, ... }
// distribution = paires [y, poids relatif] pour le mini-graphe.

// mobs.json — { "creaking": { "name": "Creaking", "hp": null, "biome": "Jardin pâle", "danger": 3, "strategy": "...", "drops": ["résine"], "version": "1.21.4" }, ... }

// search-index.json — [ { "page": "pages/combat.html", "anchor": "#la-lance", "title": "La Lance", "keywords": ["lance","spear","élan","estoc"] }, ... ]
```

Remplir les JSON avec les données du §12 et des plans de page (§8). Ne pas inventer de valeurs chiffrées absentes du §12 : mettre `null` + `"à vérifier en jeu"` dans `note`.

## 8. Plan de contenu page par page

Rédiger un vrai contenu en français (pas de lorem ipsum), concis et actionnable, en respectant strictement les faits du §12. Chaque page : breadcrumb, h1, intro 2–3 phrases, TOC auto, sections h2/h3 ci-dessous, checklist en fin de page (sauf accueil/changelog).

### `index.html`
- Hero : titre, sous-titre "À jour : Java 26.2 · Snapshots 26.3", CTA vers Fondations.
- **Sommaire interactif** : 6 cards (icône, résumé 1 ligne, barre XP de progression alimentée par `gs_checklist_*`).
- **Frise de progression** : Jour 1 → Fer/Cuivre → Enchantement → Nether → Netherite → Chambres d'épreuves → Cité ancienne → End → Post-game ; chaque étape ancre vers la section concernée.
- Bloc "Quoi de neuf" : 3 dernières entrées de `versions.json`.
- Barre de recherche globale.

### `pages/fondations.html`
- **La première nuit, minute par minute** (timeline 0–10 min : bois → établi → outils pierre → abri ; options d'abri).
- **Dormir** : lit classique (spawn) vs **lit de paille** *(26.3-snapshot)* : 3 bottes de paille → 4 lits, usage unique, ne définit pas le spawn, inutilisable Nether/End. Cas d'usage : expéditions longues.
- **Faim & saturation** : mécanique, tableau aliments par phase de jeu, pièges.
- **Progression des outils** : bois → pierre → **cuivre** (1.21.9) → fer → diamant → netherite ; tableau comparatif.
- **Bundles (sacs)** : craft, capacité (1 stack en mélange), interactions, cas d'usage.
- **QoL 26.1** : étiquette craftable (1 papier + 1 pépite) ; pissenlit doré (8 pépites d'or + 1 pissenlit) fige la croissance d'un bébé animal.
- **Premier loot : camps abandonnés** *(26.3-snapshot)* : variantes par biome ; coffres communs (armes/armures cuivre, seaux, boussoles, cartes, fusées) vs coffres secrets (fer, diamants, or, potions) ; tonneaux (commun, parfois toile d'araignée).
- Checklist "Jour 1 → Jour 7".

### `pages/combat.html`
- **Panorama des armes** : tableau comparatif (dégâts/vitesse/portée/enchants exclusifs) : épée, hache, arc, arbalète, trident, Masse, Lance.
- **La Masse** (1.21) : craft (heavy core + breeze rod), dégâts par chute, combo charges de vent, enchants Densité/Brèche/Rafale de vent, limites.
- **La Lance** (1.21.11) : estoc (rapide, recul, multi-cibles, distance minimale) vs attaque chargée (dégâts selon matériau/angle/vitesse) ; synergie élytra ; enchant exclusif Élan ; combat monté ; progrès "Une belle brochette" ; obtention (craft tous matériaux, mobs porteurs, bastions/villages/ruines océaniques/cités de l'End).
- **Bestiaire récent** (fiches : comportement / contre-stratégie / drops) : Brise, Creaking (cœur grinçant, résine), Embourbé, Desséché (flèches de faiblesse, insensible au soleil), cavaliers morts-vivants (cheval zombie + zombie lancier — désarçonner pour capturer la monture ; dromadaire momifié, jusqu'à 2 cavaliers), **cube de soufre** (passif ; absorbe un bloc → 12 archétypes de comportement ; + TNT = explosif amorçable redstone/feu ~6 s ; variante chaude dangereuse).
- **Boss** : Warden (évitement/sonique), Wither (arène, tactique Masse), Ender Dragon (renvoi page Dimensions), Elder Guardian.
- **Armures** : cuivre (early) → netherite ; ornements ; renvoi armure de cheval netherite.
- Checklist "Prêt pour le combat" + tableau compatibilité d'enchantements.

### `pages/exploration.html`
- **Cartographie & navigation** : cartes, barre de localisation (1.21.6), F3, conventions de repérage, fusées + élytra.
- **Chambres d'épreuves** : spawners d'épreuve, clés/vaults, épreuves sinistres, loot cible (heavy core, gabarits), équipement conseillé.
- **Cités anciennes** : furtivité (shriekers/capteurs sculk), Swift Sneak, laine/dalles de laine anti-vibration, loot.
- **Camps abandonnés** *(26.3-snapshot)* : repérage (tente en escaliers/dalles de laine), variantes de biomes, coffres communs vs secrets.
- **Biomes récents** : Jardin pâle (Creaking, résine, eyeblossom) ; **Forêt tachetée** *(26.3-snapshot)* : peupliers rouges/orange/jaunes, arbustes rouges, polypores (2 tailles, poudre d'os, rebondissant), peupliers renversés fréquents, variantes froides des animaux ; **Cavernes de soufre** (26.2) : gaz toxique → Nausée, geysers propulseurs, geysers de surface = indice de biome en dessous, récolte soufre/cinabre/soufre concentré, préparation (lait, gestion Nausée).
- **Montures & logistique** : happy ghast (air), nautile (océan, apprivoisement poisson-globe), dromadaire, cheval ; quel transport pour quelle distance.
- Checklist "Kit d'expédition".

### `pages/dimensions.html`
- **Nether — préparation** : portail (techniques sans pioche diamant), anti-feu, ratio 1:8 + renvoi calculateur.
- **Biomes du Nether**, **bastions** (échange piglin, lance dans le loot), **forteresses**.
- **Netherite** : débris antiques Y8–22 (pic Y15), techniques (TNT/lits), gabarit.
- **Cavalerie** : armure de cheval en netherite = armure diamant + gabarit + lingot à la table de forge ; 19 pts d'armure, résistance au recul ; montures qui ne coulent plus / ne paniquent plus (1.21.11) → voyage monté viable en dimension hostile, combo lance chargée.
- **End** : triangulation stronghold, préparation dragon (cristaux, lits, arcs), phases du combat.
- **Post-dragon** : gateway, cités de l'End (élytra, shulkers, lances), retour sécurisé.
- Checklists "Prêt pour le Nether" / "Prêt pour l'End".

### `pages/technique.html`
- **Couches de minage** : tableau + widget (`ores.json`) : diamant Y-59, fer (double pic), cuivre Y48, débris Y15, etc. ; techniques (branch mining, strip 1×2).
- **Fermes essentielles par phase** : mobs, fer, cultures, XP ; enclos d'élevage (pissenlit doré pour figer les bébés d'exposition).
- **Redstone fondamentaux** : signal, comparateurs, observateurs, circuits types.
- **Golem de cuivre & stockage** (1.21.9) : tri automatique coffres de cuivre ↔ coffres, design de salle de stockage ; **étagères** (affichage + échange rapide de barre d'action).
- **Ingénierie du soufre** (26.2) : cube + TNT amorçable (redstone/feu, ~6 s) ; geysers constructibles à 4 niveaux de puissance → ascenseurs à entités / lanceurs d'items ; soufre concentré + bloc de magma = geyser.
- **Confort & build** *(26.3-snapshot)* : coussins (16 couleurs, 3 dalles de laine, s'asseoir, canapés/fauteuils) ; escaliers/dalles de laine (atténuation sonore → camouflage de fermes redstone, anti-sculk) ; palettes peuplier / soufre / cinabre, motif chevrons.
- **Performances client** : Vulkan expérimental (activation, repli OpenGL auto), 26.1 : Java 25 requis, 4 Go par défaut.
- Checklist "Base autonome".

### `pages/changelog.html`
- Rendu **entièrement généré côté client** depuis `versions.json` : timeline verticale des drops (1.21 → 26.3), résumé, entrées de snapshots, liens vers les sections du guide.
- Encadré permanent : "Le contenu 26.3 est en snapshot et peut changer."
- Fallback `<noscript>` : lien vers le JSON brut.

## 9. Widgets JS — spécifications

| Priorité | Widget | Comportement | Critères d'acceptation |
|---|---|---|---|
| P0 | `checklist.js` | Rend les items de `checklists.json` pour la page courante ; coche persistée dans `gs_checklist_<page>` ; barre XP de page ; bouton reset (avec confirmation) ; export/import JSON (textarea) | Rechargement = état conservé ; l'accueil agrège les % de toutes les pages |
| P0 | `nether-calc.js` | 2 champs X/Z + sens Overworld↔Nether ; ÷8 / ×8, arrondi vers zéro ; note sur la zone de liaison des portails | Valeurs négatives et décimales gérées ; résultat annoncé en `aria-live` |
| P0 | `mining-calc.js` | Select minerai → Y optimal, plage, mini-graphe de distribution en barres CSS depuis `ores.json` | Aucune valeur codée en dur dans le JS ; tout vient du JSON |
| P1 | `craft-viewer.js` | `[data-widget="craft" data-recipe="coussin"]` → grille 3×3 façon établi + slot résultat, tooltips par case | Recette inconnue = message d'erreur propre, pas de crash |
| P1 | `stack-calc.js` | Quantité → stacks (64), coffres (27/54 slots), shulkers, bundles | Arrondis supérieurs corrects |
| P1 | `search.js` | Input global (header) ; filtre `search-index.json`, insensible à la casse et aux accents ; résultats groupés par page ; navigation clavier ↑↓/Entrée | ≤ 50 ms sur l'index complet ; Échap ferme |
| P1 | `version-badge.js` | Injecte le badge depuis `data-version` + `versions.json` ; toggle global "Masquer le contenu snapshot" persisté `gs_hide_snapshot` | Le toggle masque tous les blocs `*-snapshot` sur toutes les pages |
| P2 | `tooltip.js` | Hover/focus sur `.item[data-item]` → carte flottante (nom, version, usage court) ; positionnement anti-débordement | Fonctionne au clavier (focus) |
| P2 | Horloge MC (dans `main.js` ou module dédié) | Cycle 20 min simulé, indicateur "temps avant la nuit" sur Fondations | Purement illustratif, pause via `prefers-reduced-motion` |
| P2 | Thème | Toggle sombre/clair, `data-theme` sur `<html>`, persisté `gs_theme` | Pas de flash au chargement (script inline dans `head.html`) |

## 10. Phases d'implémentation (ordre strict)

1. **Phase 1 — Squelette & build** : arborescence complète, `build.mjs` + `--watch`, partials, 7 pages avec structure vide (h1 + sections h2 placeholders), `package.json`, `.gitignore`, `README.md`. ✅ DoD : `npm run build` produit un `docs/` navigable en `file://`, nav fonctionnelle entre toutes les pages.
2. **Phase 2 — Design system** : les 5 fichiers CSS, tokens, cards "slot", badges, encadrés, barre XP, layout 3 colonnes + responsive, thème clair/sombre. ✅ DoD : une page de démonstration temporaire (`src/pages/_kitchen-sink.html`, supprimée en Phase 6) montre tous les composants.
3. **Phase 3 — Données & contenu** : remplir les 6 JSON depuis §12 ; rédiger le contenu réel des 6 pages + changelog selon §8, avec balisage `data-version` et `.item`. ✅ DoD : zéro lorem ipsum ; chaque fait de jeu est traçable au §12 ou marqué "à vérifier en jeu".
4. **Phase 4 — Widgets P0** : checklists, calculateur Nether, calculateur de minage. ✅ DoD : critères du tableau §9 ; test manuel `file://` et serveur local.
5. **Phase 5 — Widgets P1 puis P2**. ✅ DoD : idem §9 ; recherche opérationnelle depuis le header sur toutes les pages.
6. **Phase 6 — Polish** : passe accessibilité (focus, contrastes, aria-live), passe perf (lazy images, poids page < 300 Ko hors screenshots), suppression de la kitchen-sink, README finalisé (procédure de mise à jour snapshot : éditer `versions.json` → `npm run build`).

À la fin de chaque phase : commit dédié avec message conventionnel (`feat(build): ...`, `feat(content): ...`).

## 11. Interdits

- Aucun framework, librairie, CDN, Google Fonts distant, tracker, analytics.
- Aucune dépendance npm. `node_modules/` ne doit jamais exister.
- Ne pas éditer `docs/` à la main ; ne pas commiter de `docs/` désynchronisé de `src/`.
- Ne pas télécharger/embarquer de textures ou sons extraits du jeu (assets Mojang) : placeholders originaux uniquement.
- Ne pas inventer de valeurs de jeu (dégâts, coordonnées, recettes) absentes du §12 : utiliser `null` + mention "à vérifier en jeu".
- Pas de border-radius, pas de dégradés décoratifs hors barre XP, pas d'animations non listées au §6.

## 12. Faits de jeu vérifiés (source de vérité du contenu)

Ne pas contredire ces faits. Tout ce qui n'y figure pas et n'est pas de la connaissance stable du jeu doit être marqué "à vérifier en jeu".

**1.21 → 1.21.9 (rappels)** : Masse (heavy core + breeze rod, dégâts de chute, enchants Densité/Brèche/Rafale de vent) ; Chambres d'épreuves, Brise, Embourbé ; Jardin pâle + Creaking + cœur grinçant + résine (1.21.4) ; happy ghast + barre de localisation (1.21.6) ; Copper Age (1.21.9) : outils et armure en cuivre, golem de cuivre (tri vers coffres de cuivre), coffres de cuivre, étagères.

**1.21.11 "Mounts of Mayhem" (09/12/2025)** : Lance — estoc rapide (faibles dégâts, recul, multi-cibles, distance minimale) + attaque chargée (dégâts selon matériau, angle, vitesse) ; enchant exclusif Élan ; progrès "Une belle brochette" (5 cibles en une charge) ; craftable en tous matériaux, portée par zombies/piglins, trouvable en ruines océaniques, villages, trésors enfouis, vestiges de bastion, cités de l'End. Armure de cheval en netherite : armure diamant + gabarit d'amélioration + lingot à la table de forge ; 19 points d'armure, robustesse accrue, résistance au recul. Nouveaux mobs : nautile (monture aquatique, apprivoisement au poisson-globe) + nautile-zombie, dromadaire momifié (jusqu'à 2 cavaliers hostiles), desséché (squelette du désert, flèches de faiblesse, ne brûle pas au soleil), chevaux zombies à apparition naturelle montés par des zombies lanciers. Les montures ne coulent plus sous un joueur et ne paniquent plus.

**26.1 "Tiny Takeover" (24/03/2026)** : nouveau versioning année.drop.hotfix ; refonte visuelle/sonore de 30+ bébés mobs ; pissenlit doré (8 pépites d'or + 1 pissenlit, fige/relance la croissance, inopérant sur bébés morts-vivants/piglins/villageois) ; étiquette craftable (1 papier + 1 pépite, retirée du loot cités anciennes/manoirs et du commerce bibliothécaire, vendue par le marchand ambulant 1 émeraude) ; son de trompette du bloc musical sur cuivre (timbre selon oxydation) ; Java 25 requis, 4 Go par défaut ; découpe directe de la deepslate au tailleur de pierre.

**26.2 "Chaos Cubed" (16/06/2026)** : cavernes de soufre (biome souterrain ; gaz toxique → Nausée ; geysers ; geysers de surface = indice du biome en dessous) ; cube de soufre (passif, type slime, absorbe un bloc présenté → comportement selon le bloc, 12 archétypes ; bois = rebond, glace = glisse, métal = lourd, laine = léger ; + TNT = explosion amorçable redstone/feu après ~6 s ; se scinde en petits cubes ; les petits grandissent, accélérables à la boule de slime, attirables au pissenlit doré ; capturable au seau) ; blocs : soufre (jaune) et cinabre (rouge) en sets complets (poli, briques, ciselé, escaliers, dalles, murets), soufre concentré (9 soufre ; sous l'eau émet bulles + gaz ; sur bloc de magma = geyser), pics de soufre ; geysers constructibles à 4 niveaux de puissance, propulsent entités et items ; disque "Bounce" (coffres de wagonnets de mines abandonnées des cavernes de soufre, signal comparateur 8) ; liste d'amis intégrée ; moteur Vulkan expérimental (OpenGL par défaut, repli auto) ; commande /unpublish ; refonte des attributs physiques des entités ; les lits propulsent à 75 % de la vitesse d'impact ; araignées des cavernes à apparition naturelle.

**26.3 (SNAPSHOTS — sujet à changement)** : Snapshot 1 (23/06/2026) : forêt tachetée (biome automnal proche des biomes froids ; peupliers à feuillage rouge/orange/jaune permanent ; particules de feuilles assorties ; peupliers renversés fréquents ; variantes froides des animaux, lapins, renards) ; set de bois peuplier complet (bûches, planches, escaliers, dalles, porte, trappe, barrière, portillon, bouton, plaque, pancartes, étagère, bateaux dont bateau de stockage ; teinte gris cendré) ; arbustes rouges (poudre d'os = propagation, compostables) ; polypores/champignons d'étagère (sur troncs, 2 tailles, poudre d'os = croissance, grand cassé = 2 exemplaires, légèrement rebondissant, cuisinable en soupe, vendu par le marchand ambulant) ; camps abandonnés (tentes en escaliers/dalles de laine, variantes par biome, tonneaux communs avec parfois toile d'araignée, coffres communs : armes/armures cuivre, seaux, boussoles, cartes, fusées ; coffres secrets : fer, diamants, or, potions) ; escaliers et dalles de laine (16 couleurs, atténuent le son comme la laine) ; soupes avec 2 champignons de n'importe quel type. Snapshot 3 (07/07/2026) : coussins (16 couleurs, 3 dalles de laine, posables sur surface plane, on s'assoit dessus, canapés/fauteuils, générés dans les camps abandonnés) ; lit de paille (3 bottes de paille → 4 ; dormir sans définir le spawn ; usage unique ; interdit Nether/End) ; recettes de potions personnalisables et effets de post-process (data packs, hors périmètre survie).

**Rappels stables** : diamant optimal ~Y-59, débris antiques Y8–22 (pic Y15), cuivre ~Y48, ratio Nether 1:8, stack = 64, coffre simple = 27 slots, double = 54.
