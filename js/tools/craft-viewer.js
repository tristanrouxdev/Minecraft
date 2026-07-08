// Widget craft-viewer : [data-widget="craft"][data-recipe="..."]
// Grille 3×3 façon établi + slot résultat. Recette inconnue ou sans grille = message d'erreur propre.

(function () {
  function initials(id) {
    return id
      .split('_')
      .map(function (part) {
        return part.charAt(0).toUpperCase();
      })
      .join('')
      .slice(0, 2);
  }

  function initCraftViewer(container) {
    var recipeId = container.getAttribute('data-recipe');
    var recipes = GS.getData('recipes') || {};
    var recipe = recipes[recipeId];

    if (!recipe || !recipe.grid) {
      var error = document.createElement('p');
      error.className = 'craft-viewer__error';
      error.textContent = recipe
        ? 'Grille de fabrication non détaillée pour « ' + recipe.name + ' » (' + (recipe.note || 'à vérifier en jeu') + ').'
        : 'Recette inconnue : « ' + recipeId + ' ».';
      container.appendChild(error);
      return;
    }

    container.classList.add('craft-viewer');

    var grid = document.createElement('div');
    grid.className = 'craft-viewer__grid';
    recipe.grid.forEach(function (cellId) {
      var slot = document.createElement('div');
      slot.className = 'craft-viewer__slot slot';
      if (cellId) {
        slot.textContent = initials(cellId);
        slot.title = cellId.replace(/_/g, ' ');
      }
      grid.appendChild(slot);
    });

    var arrow = document.createElement('span');
    arrow.className = 'craft-viewer__arrow';
    arrow.setAttribute('aria-hidden', 'true');
    arrow.textContent = '→';

    var output = document.createElement('div');
    output.className = 'craft-viewer__output slot';
    output.textContent = initials(recipeId);
    output.title = recipe.name + (recipe.output > 1 ? ' ×' + recipe.output : '');

    container.appendChild(grid);
    container.appendChild(arrow);
    container.appendChild(output);
  }

  document.querySelectorAll('[data-widget="craft"]').forEach(initCraftViewer);
})();
