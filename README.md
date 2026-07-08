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

- `src/` — source de vérité éditable (pages HTML + partials).
- `docs/` — sortie générée, **ne jamais éditer à la main**.
- `css/`, `js/`, `data/`, `assets/` — copiés tels quels dans `docs/` au build.
- `scripts/build.mjs` — générateur (includes de partials + variables `{{title}}`/`{{depth}}`).

## Conventions

- Tout contenu lié à une version de jeu porte un attribut `data-version` (ex. `"26.2"`, `"26.3-snapshot"`). Le toggle « Masquer le contenu snapshot » du header masque les blocs `*-snapshot`.
- Clés `localStorage` préfixées `gs_` (`gs_theme`, `gs_hide_snapshot`, `gs_checklist_<page>`).
- Un terme de jeu interactif est balisé `<span class="item" data-item="mace">Masse</span>` ; résolu par `tooltip.js` via `data/mobs.json` / `data/recipes.json`.
- CSS en BEM léger, pas de `!important`, pas de `border-radius`, pas de dégradés décoratifs hors barre XP.

## Mettre à jour le contenu snapshot (26.3 → futur drop)

1. Éditer `data/versions.json` (nouvelle entrée `entries`, ou nouveau `summary`/`status` si le snapshot devient stable).
2. Mettre à jour les sections balisées `data-version="26.3-snapshot"` dans `src/pages/*.html` si de nouveaux faits de jeu sont vérifiés.
3. `npm run build` puis vérifier `docs/` en local avant de commiter.
