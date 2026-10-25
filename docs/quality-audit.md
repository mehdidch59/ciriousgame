# Vérification de qualité — 25 octobre 2026

## Correction ultérieure : accès authentifié

`/game` est maintenant protégé par la session Firebase. Le moteur de jeu ne se monte qu’après confirmation de la connexion par `onAuthStateChanged`. Un visiteur non connecté est redirigé vers `/login` ; une erreur de vérification laisse l’accès bloqué. Les mentions et le lien « sans compte » ont été retirés, et la route privée a été retirée du sitemap.

Vérification navigateur : accès direct à `/game` sans session → `/login`, aucun tableau de bord affiché et aucune erreur JavaScript constatée. Après connexion ou inscription, le retour vise la route de jeu demandée. Le parcours réellement authentifié auprès de Firebase reste à tester avec un compte.

`npm test` : **22 tests réussis**, dont six tests du suivi de session (attente initiale, utilisateur anonyme, connexion/déconnexion, erreurs et nettoyage des observateurs). Lint et compilation réussis.

Les mesures Lighthouse ci-dessous précèdent cette correction. Un audit anonyme de `/game` mesure désormais la page de connexion après redirection, et non le tableau de bord privé.

## Résultats

Compilation de production (`npm run build`) servie par Vite Preview sur `127.0.0.1:4173`. Lighthouse 13.5.0, profil mobile, catégories performance, accessibilité, bonnes pratiques et SEO. Une mesure finale par page ; les scores peuvent varier selon la machine et les conditions de mesure.

| Page | Performance | Accessibilité | Bonnes pratiques | SEO | LCP | TBT | CLS |
| --- | ---: | ---: | ---: | ---: | --- | --- | ---: |
| Accueil | 99 | 100 | 100 | 100 | 1,8 s | 0 ms | 0 |
| Jeu | 99 | 100 | 100 | 100 | 2,0 s | 0 ms | 0 |
| Connexion | 99 | 100 | 100 | 100 | 1,8 s | 0 ms | 0 |
| Inscription | 99 | 100 | 100 | 100 | 1,8 s | 0 ms | 0 |

Les rapports HTML et JSON sont conservés parmi les artefacts locaux de la conversation. Le score d’accessibilité couvre les contrôles automatiques des états audités ; il ne remplace pas une validation avec un lecteur d’écran ou sur un appareil physique.

## Corrections

- Formulaire partagé : imports résolus, labels associés, champs requis, saisie des mots de passe, messages français, état de requête et prévention des doubles soumissions.
- Firebase chargé à la soumission : environ 6,5 Ko de code propre au formulaire avant soumission au lieu de 287 Ko, hors code partagé.
- Règles ESLint `react/jsx-no-undef` et `react/jsx-uses-vars` pour détecter les références JSX manquantes.
- `robots.txt`, sitemap, thème sombre natif, lien d’accès au contenu, focus et icônes décoratives masquées aux technologies d’assistance.
- Animation des formulaires supprimée ; transitions CSS explicites, mouvements réduits respectés et effets de survol réservés aux pointeurs compatibles.
- Tracés de carte pré-calculés, chargement mutualisé, index des pays et rendu hors écran limité avec `content-visibility` et labels explicites.
- Noms français, recherche sans accents, objectifs guidés, conseils contextuels, revenus affichés et raisons des actions indisponibles.
- Sauvegarde locale validée, reprise en pause, pause en arrière-plan et raccourcis clavier.
- Distribution vaccinale sans effet anticipé sur les soins ; défaite immédiate si une quarantaine épuise la confiance.

## Vérifications exécutées

- `npm test` : 16 tests réussis, dont conservation des populations, budgets, prérequis, sauvegardes corrompues, reprise, échéance, effets vaccinaux et conditions terminales.
- `npm run lint` : réussi.
- `npm run build` : réussi.
- Navigateur : affichage des quatre pages, formulaires requis et labels, bouton de visibilité du mot de passe, achats, budget, protocoles, interventions, sauvegarde/rechargement, confirmation et annulation du redémarrage, raccourcis et recherche.
- Vue mobile à 390 pixels : pas de débordement horizontal constaté sur le jeu et les formulaires.
- Aucune erreur JavaScript constatée dans les parcours parcourus.

## Limites

L’authentification auprès du service Firebase et la création réelle de comptes n’ont pas été exercées. Aucun compte ni mot de passe de test n’a été créé. La sauvegarde est propre au navigateur, sans synchronisation distante. Les mesures sont locales et ne valident pas le réseau ni les en-têtes du serveur de production. Aucun déploiement effectué.

## Skills utilisés

Les recommandations pertinentes de `web-design-guidelines`, `emil-design-eng`, `apple-design` et `animation-performance` ont guidé les corrections. Aucun skill dédié au game design n’a été trouvé dans le dossier demandé. Le workflow de `huashu-design` ne s’applique pas aux applications de production, selon son périmètre déclaré.

## Refonte visuelle du jeu

L’interface a ensuite été remaniée en écran de stratégie cartographique. Le compte rendu et les captures sont décrits dans `docs/design/DESIGN.md`. Le HUD, le menu principal, les panneaux et les polices ont changé : les scores Lighthouse de performance consignés plus haut sont historiques. La protection Firebase de `/game` est conservée.

## Corrections de l’audit UX — 25 octobre 2026

Les huit points du dernier audit sont traités : alerte de sauvegarde indépendante du pied de page, légende et symboles partagés entre carte et interventions, navigation spatiale avec un seul arrêt Tab et accès direct au dossier, historique commun aux commandes souris/clavier, préférences persistantes et agrandissement du HUD, disposition adaptée aux écrans courts, cibles principales de 44 px et styles séparés avec palette, typographie et espacements centralisés.

Le HUD indique aussi la variation quotidienne des cas ; le dossier estime le délai de recherche, et une alerte explique la réduction du financement quand la confiance est faible.

Validation : 27 tests automatisés réussis, lint et build réussis. Vérification visuelle des composants réels avec le reducer dans un banc temporaire isolé : 1536×1024, 390×844 et 844×390, texte à 100 et 200 %, persistance après rechargement, alerte de stockage simulée, navigation aux flèches/Tab, historique souris/clavier et déploiement médical dans la couche interventions. Le banc temporaire a été retiré. Sur la build de production locale, `/game` sans session redirige vers `/login`. Aucun accès authentifié réel ni nouvelle mesure Lighthouse ne sont revendiqués pour cette passe.

Les skills pertinents incluent également `ui-ux-pro-max`, `ui-styling`, `design-system`, `game-ui-ux`, `game-feel`, `frontend-design` et `ui-taste`, consultés pour la refonte et sa revue. La mention précédente sur l’absence de skill game design est donc historique et remplacée par ce constat.

## Implémentation « atlas vivant »

La seconde passe décrite dans `design/DESIGN.md` est implémentée : progression et objectifs, retours d’ordres acceptés, détection des nouveaux foyers, dossier centré sur les interventions, chaîne vaccinale, catégories et filtre du journal, navigation mobile et menu contextuel à la session. Le globe du menu est séparé du jeu et utilise un rendu à la demande. Contrôles finaux : 31 tests, lint et build réussis ; parcours navigateur sur composants réels et formats 1536×1024, 390×844, 844×390. Les nouveaux foyers ont été observés pendant une simulation à 4× ; les déploiements et financements ont été exercés. Les limites d’accès Firebase réel et de mesure de performance sont détaillées dans le document de design.

## Objectifs, bilan et performance — vérification finale

Dernière passe documentée dans `design/DESIGN.md` : jalons factuels, destinations des objectifs, état de session en attente, légende fixe de sélection, marqueurs compensant le zoom et bilan détaillé avec couverture historique explicite. 34 tests, lint et build ; validation navigateur des objectifs et bilans sur desktop/mobile. Accueil Lighthouse : performance 98 desktop / 94 mobile, accessibilité 100 sur les deux profils ; mesure locale avec throttling simulé, sans validation physique ni connexion réelle. Détails et chiffres dans `design/performance-results.json`.

## Guide et conséquences : dernière validation

39 tests réussis, lint et build valides. Guide facultatif testé du choix au financement ; tendances sur sept jours sauvegardées et restaurées en pause ; résultats du dernier jour réconciliés avec les populations, y compris l’expiration d’une mesure. Vérification mobile 390×844 et clavier à 200 %. Un contrôle de l’accueil avec WebGL désactivé montre l’atlas 2D fonctionnel. Mesure mobile complémentaire : 94/100 performance, 100/100 accessibilité (accueil uniquement, environnement simulé). Une déconnexion avec gestion d’erreur est proposée au menu ; connexion/déconnexion avec un compte réel et appareil physique restent non exercées. Le SDK est simulé dans les tests de session. Les captures et limites figurent dans `design/DESIGN.md`.

## Blocage d’inscription en réseau local

Cause confirmée le 25 octobre 2026 : `API_KEY_HTTP_REFERRER_BLOCKED` sur les origines locales (HTTP 403), dont `http://192.168.1.14:4174`. L’origine publique franchit la restriction de référent. Le diagnostic utilise une requête de connexion sans identifiant ni mot de passe ; aucun compte créé, aucune connexion tentée avec des identifiants réels. Le formulaire distingue désormais ce blocage d’une panne réseau. 42 tests, lint et build réussis. Le script `npm run check-auth -- <origine>` et les étapes d’administration sont décrits dans `firebase-local-setup.md`. La correction distante reste à appliquer par un administrateur Google Cloud : aucune session administrateur n’était disponible dans la console ouverte ici. La restriction n’a pas été contournée ni désactivée.

## Pilotage et sauvegardes portables

Le panneau Pays propose trois tris : cas actifs, part de la population touchée et variation absolue sur sept jours. Les historiques trop courts sont explicitement signalés et placés après les tendances connues. Les interventions expirées dans un pays encore touché produisent une alerte ouvrant son dossier. Une préférence locale permet de suspendre automatiquement la simulation à cette échéance ; elle est désactivée par défaut et les issues terminales gardent la priorité.

Options permet d’exporter et d’importer une sauvegarde JSON (2 Mio maximum). L’import valide le contenu, présente le jour, la difficulté et les décisions, puis exige une confirmation de remplacement. Une mission active est restaurée en pause. Les identifiants de compte et préférences d’interface ne font pas partie du fichier. Un fichier invalide conserve la partie ouverte. Les anciennes sauvegardes restent compatibles.

Le Journal et le bilan utilisent désormais un registre durable des décisions, distinct des 30 événements récents. Une ancienne sauvegarde ne permet de récupérer que les événements encore présents : cette couverture incomplète est annoncée sans inventer les décisions manquantes.

Validation : 52 tests automatisés, lint et build réussis. Parcours navigateur sur les composants et le hook réels dans un banc isolé : pause au jour exact de l’échéance, tris, export, rejet d’un fichier invalide, annulation et confirmation d’import, reprise après rechargement, retour visuel d’import en pause. À 390×844, contrôle de l’absence de débordement et affichage progressif de 50 puis 75 décisions au moyen d’une sauvegarde synthétique de revue. Le banc est retiré après validation. Aucun nouveau score Lighthouse, test sur iPhone physique ou déploiement n’est revendiqué pour cette passe.
