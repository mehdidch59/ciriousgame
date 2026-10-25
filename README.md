# Cirious — Global Defense

Jeu de stratégie solo : coordonnez une réponse mondiale à une épidémie fictive.

## Démarrage

```sh
npm install
npm run dev
```

L’accès à `/game` exige une session Firebase authentifiée. Un visiteur est redirigé vers `/login`, puis revient au jeu après connexion ou inscription. La route attend la restauration de session Firebase avant de rendre le moteur de jeu ; une erreur de vérification maintient l’accès bloqué. Les pages de connexion et d’inscription utilisent la configuration Firebase existante.

## Mécaniques

- Choisir le foyer initial parmi 106 pays et une difficulté.
- Éliminer tous les cas actifs avant le jour 365 ; la confiance publique doit rester positive et les décès sous 10 % de la population.
- Financer sept protocoles permanents avec un budget quotidien dépendant de la difficulté et de la confiance.
- Déployer une équipe médicale (30 PC, 10 jours) ou une quarantaine (20 PC, 14 jours, −3 confiance).
- Rechercher un vaccin puis investir dans sa distribution. Les patients guéris et les personnes vaccinées deviennent immunisés.
- Mettre en pause, agir pendant la pause, accélérer à 2× ou 4× et recommencer sans recharger la page.

La simulation distingue personnes vulnérables, cas actifs, personnes immunisées et décès. La somme est conservée dans chaque pays. La transmission suit les frontières décrites dans les données du projet ; le modèle est fictif, déterministe et ne constitue pas un modèle médical.

La partie est sauvegardée automatiquement dans ce navigateur, sans synchronisation entre appareils. Elle reprend en pause au rechargement ; les sauvegardes invalides sont ignorées. Si le stockage est indisponible, un message le signale dans le jeu. La simulation se met aussi en pause lorsque l’onglet passe en arrière-plan.

## Vérifications

```sh
npm test
npm run lint
npm run build
```

Les tests couvrent les budgets, prérequis, interventions temporaires, états de jeu et invariants de population sur des simulations prolongées.

## Sources

Inspiration de conception : [Plague Inc: The Cure](https://plagueinc.com/cure), pour l’équilibre entre prévention, soins, recherche et confiance publique.

Carte : [Natural Earth, Admin 0, 1:110m](https://www.naturalearthdata.com/downloads/110m-cultural-vectors/), données du domaine public. Source locale dans `public/world.geojson`, tracés pré-calculés dans `public/world-map.json`. Régénération : `npm run prepare-map`. Les pays absents des données du jeu restent visibles mais non simulés ; les petits pays restent accessibles dans la liste.

## Interface et contrôles

L’accueil est un menu de jeu. La simulation utilise une carte dominante, un HUD supérieur compact, un dossier régional, des panneaux de recherche/pays/journal et une barre de temps fixe. Les foyers sont matérialisés sur la carte à partir des données réelles de la simulation ; zoom et recentrage restent accessibles. Les conseils dépendent de la progression, les revenus et les raisons des protocoles indisponibles sont explicités. Les noms des pays sont en français.

La liste utilise `content-visibility` pour limiter le rendu hors écran et des labels explicites pour les technologies d’assistance. La carte utilise un index par identifiant et un chargement mutualisé. Les polices Barlow et Barlow Condensed sont hébergées localement sous licence SIL OFL. La direction visuelle et les sources des assets sont documentées dans `docs/design/`.

Clavier : Espace pour mettre en pause ou reprendre ; 1, 2 et 4 pour la vitesse ; M/R/P/J pour carte/recherche/pays/journal ; Échap pour revenir ou ouvrir le menu de pause. Les champs de saisie conservent leurs raccourcis natifs. Les écrans secondaires utilisent une pile de navigation. Les dialogues gardent le focus et la confirmation de redémarrage sélectionne d’abord « Continuer la partie ». Options : taille des textes jusqu’à 200 % et réduction des mouvements.

Connexion et inscription partagent un formulaire accessible avec validation, erreurs contextuelles et état de requête. Aucun compte de test n’est créé pendant les vérifications locales.
