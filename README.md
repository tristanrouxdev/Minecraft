# Guide Suprême du Survivant

Site statique de guide de survie pour Minecraft Java Edition (référence : 26.2 « Chaos Cubed », snapshots 26.3 balisés à part). HTML/CSS/JS vanilla, zéro dépendance, zéro build step au runtime.

## Setup

Prérequis : Node ≥ 20 (uniquement pour lancer le script de génération, aucune dépendance npm n'est installée).

```bash
npm run build   # génère docs/ à partir de src/, css/, js/, data/, assets/
npm run watch   # regénère automatiquement à chaque modification
```

Le site généré dans `docs/` fonctionne aussi bien ouvert directement dans un navigateur (`file://`) que servi par GitHub Pages (dossier `docs/` de la branche par défaut).

## Arborescence

- `src/` — source de vérité éditable (pages HTML + partials). Pages : `index.html`, `pages/fondations.html`, `pages/combat.html`, `pages/exploration.html`, `pages/dimensions.html`, `pages/technique.html`, `pages/enchantements.html`, `pages/fermes.html`, `pages/changelog.html`.
- `docs/` — sortie générée, **ne jamais éditer à la main**.
- `css/`, `js/`, `data/`, `assets/` — copiés tels quels dans `docs/` au build.
- `scripts/build.mjs` — générateur (includes de partials + variables `{{title}}`/`{{depth}}`).

## Conventions

- Tout contenu lié à une version de jeu porte un attribut `data-version` (ex. `"26.2"`, `"26.3-snapshot"`). Le toggle « Masquer le contenu snapshot » du header masque les blocs `*-snapshot`.
- Clés `localStorage` préfixées `gs_` (`gs_theme`, `gs_hide_snapshot`, `gs_checklist_<page>`).
- Un terme de jeu interactif est balisé `<span class="item" data-item="mace">Masse</span>` ; résolu par `tooltip.js` via `data/mobs.json` / `data/recipes.json`.
- CSS en BEM léger, pas de `!important`, pas de `border-radius`, pas de dégradés décoratifs hors barre XP.
- **Scripts classiques, pas de modules ES.** Chrome bloque `fetch()`, `import()` et les `<script type="module">` sous `file://` (chaque fichier local est traité comme une origine distincte, donc bloqué par CORS). Comme le site doit s'ouvrir directement en `file://`, tous les scripts sont des `<script src="...">` classiques, encapsulés en IIFE pour éviter les fuites de portée globale. Un unique espace de nom partagé `window.GS` (défini dans `main.js`) expose `GS.getData(name)`.
- **Données JSON injectées, pas fetchées.** Pour la même raison, `scripts/build.mjs` injecte le contenu de chaque `data/*.json` dans un `<script type="application/json" id="data-<nom>">` (marqueur `<!-- @data -->` dans `footer.html`). Les widgets lisent ces blocs via `GS.getData('<nom>')` au lieu d'un `fetch()`. `data/*.json` reste la source de vérité éditable ; l'injection est régénérée à chaque build.
- Un widget ne charge son script que sur les pages qui l'utilisent réellement (balises `<script>` explicites en fin de page, pas de chargement global).

## Assets

- `assets/fonts/monocraft.woff2` : police Monocraft (SIL OFL, voir `LICENSE-monocraft.txt` à côté), auto-hébergée.
- Icônes d'items : placeholders CSS (`.item-icon`, carré 32px + initiale + couleur de rareté), aucune texture Mojang. À remplacer par une vraie sprite sheet (`assets/img/icons/`) si besoin, via `background-position`.
- `assets/img/screenshots/` : vide pour l'instant. Toute capture ajoutée doit être en WebP et utiliser `<img loading="lazy">`.

## Vérification manuelle : ID de l'enchantement de la Lance (Élan)

L'entrée `elan` dans `data/enchantments.json` a son champ `id` à `null` : l'identifiant exact de l'enchantement exclusif de la Lance (1.21.11) n'a pas été confirmé. Pour le vérifier en jeu :

1. Ouvrir la console de commandes en mode créatif/triche activée.
2. Essayer `/give @s enchanted_book[minecraft:stored_enchantments={elan:1}]` en testant les variantes probables d'ID (`elan`, `momentum`, `charge`, etc.) jusqu'à obtenir un livre enchanté valide, ou consulter `/enchant` avec autocomplétion (Tab) sur une Lance en main pour lister les IDs proposés par le jeu.
3. Une fois l'ID confirmé, mettre à jour `id` (et `maxLevel`/`source` si observés) dans `data/enchantments.json`, retirer le champ `note` correspondant, puis `npm run build`.

## Mettre à jour le contenu snapshot (26.3 → futur drop)

1. Éditer `data/versions.json` (nouvelle entrée `entries`, ou nouveau `summary`/`status` si le snapshot devient stable).
2. Mettre à jour les sections balisées `data-version="26.3-snapshot"` dans `src/pages/*.html` si de nouveaux faits de jeu sont vérifiés.
3. `npm run build` puis vérifier `docs/` en local avant de commiter.
