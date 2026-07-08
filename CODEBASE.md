# CODEBASE.md — Guide Suprême du Survivant

Rapport d'état du projet, à l'usage de quiconque (humain ou agent) reprend ce dépôt.

## En une phrase

Site statique HTML/CSS/JS vanilla (zéro framework, zéro dépendance npm) qui sert de guide de survie exhaustif pour Minecraft Java 26.2, avec du contenu snapshot 26.3 masquable, généré depuis `src/` vers `docs/` par un unique script Node (`scripts/build.mjs`) et destiné à s'ouvrir aussi bien en `file://` que sur GitHub Pages.

Spécifié par `plan.md` (à la racine — document de référence complet : contraintes, arborescence cible, design system, schémas de données, plan de contenu, priorités des widgets). Ce fichier-ci (`CODEBASE.md`) documente l'état **réel** du code après implémentation, y compris les écarts pris par rapport au plan et pourquoi.

## Statut

Les 6 phases du plan sont complètes et committées (voir `git log`) :

1. `5d0e132` — squelette + générateur
2. `943b854` — design system
3. `afcd063` — données réelles + contenu des 5 pages de guide
4. `e5e7876` — widgets P0 (checklist, calculateur Nether, calculateur de minage)
5. `a57cc2a` — widgets P1/P2 (craft-viewer, stack-calc, recherche, badges de version, TOC/scrollspy, tooltips, horloge, changelog)
6. `a21e1a6` — polish (contrastes AA, nettoyage build, suppression de la page de démo)

Rien n'a été poussé vers un remote ; le dépôt est local, une seule branche (`main`).

## Décision d'architecture la plus importante : pas d'ES modules, pas de `fetch()`

Le plan demandait à la fois :
- des JS en modules ES (`type="module"`) qui vont chercher leurs données en `fetch()` du JSON,
- un site qui fonctionne ouvert directement en `file://` dans Chrome/Firefox/Edge.

Ces deux exigences sont incompatibles dans Chrome : **`fetch()`, `import()` dynamique et `<script type="module">` sont tous les trois bloqués par la politique CORS de Chrome sous `file://`** (chaque fichier local est traité comme une origine distincte). Vérifié empiriquement en Phase 4 avant d'écrire le premier widget.

Solution retenue (contrainte non-négociable §2 du plan > convention §5) :
- **Tous les scripts sont classiques** (`<script src="...">`, pas de `type="module"`), chacun encapsulé dans une IIFE pour ne pas polluer le scope global.
- Un seul espace de nom partagé, `window.GS`, défini dans `js/main.js`, expose `GS.getData(name)`.
- `scripts/build.mjs` lit chaque fichier de `data/*.json` au moment du build et les injecte directement dans le HTML sous forme de `<script type="application/json" id="data-<nom>">` (fonction `buildDataScripts()`, marqueur `<!-- @data -->` placé dans `src/partials/footer.html`, donc présent sur chaque page juste avant les balises `<script>` de fin de body).
- Les widgets lisent ces blocs via `GS.getData('versions')`, `GS.getData('ores')`, etc. au lieu d'un fetch réseau.

Conséquence pratique : **`data/*.json` reste la seule source de vérité éditable** ; l'injection HTML est entièrement régénérée à chaque `npm run build`. Éditer le JSON, jamais le HTML généré.

Cette décision et sa justification sont aussi documentées dans `README.md` (section Conventions).

## Arborescence

```
src/                    SOURCE — pages HTML éditables + partials
  index.html
  pages/{fondations,combat,exploration,dimensions,technique,changelog}.html
  partials/{head,header,footer}.html

docs/                   SORTIE GÉNÉRÉE — ne jamais éditer à la main, régénérée par npm run build

css/                    variables.css (tokens), base.css (reset+police), layout.css (grid/sidebar/TOC/responsive),
                        components.css (cards/badges/callouts/XP bar/tableaux), tools.css (styles des widgets)

js/
  main.js               bootstrap commun : thème, burger, nav active, window.GS.getData()
  components/           search, version-badge, toc, tooltip, clock, changelog, home (glue page d'accueil)
  tools/                checklist, nether-calc, mining-calc, craft-viewer, stack-calc

data/                   versions.json, checklists.json, recipes.json, ores.json, mobs.json, search-index.json
                        (source de vérité — voir décision d'architecture ci-dessus)

assets/
  fonts/monocraft.woff2 police Monocraft (SIL OFL), + LICENSE-monocraft.txt à côté
  img/icons/, img/screenshots/   vides pour l'instant (voir README § Assets)

scripts/build.mjs       générateur unique (includes, variables {{title}}/{{depth}}, injection JSON, sync assets, --watch)
```

Échelle approximative (hors `docs/`, hors `plan.md`) : ~780 lignes de HTML source, ~1070 lignes de CSS, ~1140 lignes de JS, ~420 lignes de JSON. `docs/` généré pèse environ 450 Ko au total ; la page la plus lourde (`combat.html` + ses assets propres) pèse environ 105 Ko, sous le budget de 300 Ko fixé par le plan.

## Le générateur (`scripts/build.mjs`)

Aucune dépendance npm (`package.json` ne déclare que les scripts `build`/`watch`). Logique :

1. `cleanOutput()` — supprime et recrée `docs/` entièrement à chaque build (évite les fichiers orphelins si une page source est supprimée).
2. `buildPages()` — parcourt `src/**/*.html` (hors `src/partials/`), pour chaque page :
   - lit le front-matter `<!-- @page title="..." depth="..." -->` en tête de fichier,
   - résout les `<!-- @include:nom -->` en injectant `src/partials/nom.html` (erreur + exit code 1 si le partial référencé n'existe pas),
   - remplace les variables `{{title}}` / `{{depth}}` partout (y compris dans le corps de page, pas seulement les partials),
   - remplace le marqueur `<!-- @data -->` par les blocs JSON inline (voir plus haut),
   - écrit le résultat dans `docs/` en conservant l'arborescence relative.
3. `syncAssets()` — copie `css/`, `js/`, `data/`, `assets/` tels quels dans `docs/`.
4. `writeNoJekyll()` — crée `docs/.nojekyll`.
5. Flag `--watch` : rebuild complet sur toute modification de `src/`, `css/`, `js/`, `data/`, `assets/` (via `fs.watch` récursif, pas de librairie, debounce 100 ms).

## Système de widgets

Chaque widget s'auto-initialise via `document.querySelectorAll('[data-widget="..."]')` et n'est chargé **que** sur les pages qui l'utilisent réellement (balises `<script>` explicites en fin de `<body>`, pas de chargement global sauf pour les composants présents sur toutes les pages : `main.js`, `search.js`, `version-badge.js`).

| Widget | Fichier | Où il est chargé |
|---|---|---|
| Thème, burger, nav active | `js/main.js` | Toutes les pages |
| Recherche globale | `js/components/search.js` | Toutes les pages (header) |
| Badges de version + toggle snapshot | `js/components/version-badge.js` | Toutes les pages (header + `data-version`) |
| TOC + scrollspy | `js/components/toc.js` | Les 5 pages de guide |
| Tooltip d'item | `js/components/tooltip.js` | Pages contenant des `.item[data-item]` |
| Horloge MC simulée | `js/components/clock.js` | `fondations.html` |
| Timeline changelog | `js/components/changelog.js` | `changelog.html` |
| Sommaire/frise/quoi de neuf accueil | `js/components/home.js` | `index.html` |
| Checklist + XP bar | `js/tools/checklist.js` | Les 5 pages de guide |
| Calculateur Nether | `js/tools/nether-calc.js` | `dimensions.html` |
| Calculateur de minage | `js/tools/mining-calc.js` | `technique.html` |
| Craft-viewer | `js/tools/craft-viewer.js` | `technique.html` (recette coussin) |
| Calculateur de stacks | `js/tools/stack-calc.js` | `fondations.html` |

Tous persistent leur état dans `localStorage` sous des clés préfixées `gs_` (`gs_theme`, `gs_hide_snapshot`, `gs_checklist_<page>`).

## Design system

Direction « terminal de survie » : lisibilité de doc technique + clins d'œil Minecraft précis (bordures bevel façon slot d'inventaire, barres XP), zéro `border-radius` sur tout le site, zéro `!important`. Tokens dans `css/variables.css` : thèmes clair/sombre via `:root[data-theme="dark|light"]`, police pixel Monocraft réservée aux titres/badges/chiffres, corps en `system-ui`.

**Contrastes AA** : les valeurs d'accent du plan ont été légèrement retouchées en Phase 6 après calcul de ratio WCAG sur les paires réellement utilisées (texte de badge sur fond `--surface-2`, notamment) : `--accent-emerald`/`--accent-gold` assombris en thème clair, `--accent-redstone`/`--accent-amethyst` éclaircis en thème sombre. Toutes les combinaisons texte/fond utilisées passent ≥ 4.5:1.

**Layout** : `body` en CSS Grid (`header` / `nav` / `main` / `footer` en zones nommées). Sidebar de nav sticky à gauche + TOC sticky à droite dès 1080px ; nav horizontale dès 720px ; burger + overlay plein écran en dessous de 720px.

## Contenu

Rédigé en français, sans lorem ipsum, à partir des faits listés au §12 du plan. Toute valeur de jeu non fournie par le plan est marquée littéralement « à vérifier en jeu » plutôt qu'inventée (ex. plage exacte du cuivre, dégâts précis des armes, distribution du fer). Le contenu lié à un drop porte `data-version="<id>"` ; les sections/titres liés à 26.3 portent en plus le badge visuel injecté par `version-badge.js`.

## Ce qui reste ouvert / pistes pour la suite

- `assets/img/icons/` et `assets/img/screenshots/` sont vides : les icônes utilisent des placeholders CSS (`.item-icon`, carré + initiale + couleur de rareté) en attendant une vraie sprite sheet ; convention documentée dans le README pour l'ajout futur de captures (WebP + `loading="lazy"`).
- Le calculateur de minage n'a de vraies données de distribution que pour le diamant (fourni explicitement par le plan) ; fer et cuivre affichent « à vérifier en jeu » faute de valeurs sourcées.
- Aucun test automatisé (pas demandé par le plan) — la vérification s'est faite par audit manuel + Playwright headless (navigation, absence d'erreurs console sous `file://`, contrôle clavier de la recherche, persistance localStorage).
