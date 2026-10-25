# Direction visuelle — Cirious

Cible générée et inspectée : `game-ui-target.png`, 1536 × 1024. La cible guide les proportions du HUD, la carte dominante, la navigation latérale, le dossier régional et les commandes temporelles. Elle ne fournit pas les données du jeu : les foyers et la date illustratifs du visuel sont remplacés par l’état réel de la simulation. Pas de revendication de correspondance pixel par pixel : la carte reste le fond géographique Natural Earth du projet.

Le jeu est une simulation de réponse à une épidémie. Le joueur choisit un foyer, surveille les frontières, finance des protocoles et intervient dans les pays touchés. La carte est son espace de jeu. Les statistiques deviennent des instruments du HUD, pas des cartes de suivi commercial.

Palette : océan #101c29, surfaces #172535, terres #334558, texte #e9e4d9, sélection #d7b575, infections #dc775e. Typographie : Barlow pour les commandes et les données, Barlow Condensed pour le titre et les en-têtes. Polices locales sous SIL OFL, licence dans public/fonts.

Disposition : HUD supérieur → rail de navigation / carte / dossier régional → commandes temporelles et journal court. La carte reste visible lors de la recherche. Les écrans secondaires utilisent une pile de navigation, avec Échap pour revenir. Le menu de pause et la confirmation de redémarrage utilisent le dialogue natif.

À petite largeur : navigation horizontale, carte au-dessus du dossier, défilement interne des informations longues. Les commandes principales et le temps restent accessibles. Prévoir les encoches avec les safe-area insets.

Principes : pas de cartes KPI, pas de grille de fonctionnalités à l’accueil, pas de slogan motivationnel, pas de faux statut serveur. L’accueil est le menu du jeu. Les transitions répondent aux actions ; les valeurs utiles ne bougent pas pour décorer. L’authentification Firebase et les mécaniques existantes sont conservées.

## Validation de la refonte

La cible 1536 × 1024 a été inspectée puis comparée visuellement au rendu des composants au même format. Les proportions du HUD, du rail, du dossier et de la barre de temps suivent cette cible. Écarts assumés : contours Natural Earth plus simples que le relief illustré ; pas de faux foyers dans le briefing, pas de date illustrative, ni de drapeau raster. Tous les textes et contrôles restent natifs et fonctionnels ; l’image cible ne sert pas de fond d’interface.

Vues effectivement inspectées : 1536 × 1024, 1280 × 720 et 390 × 844. Le jeu a été exercé dans un montage local temporaire des composants avec le vrai reducer et des états de simulation de test. Ce montage ne crée pas de route invitée dans l’application ; il est retiré après vérification. Sur la version de production, Jouer redirige vers Connexion sans session Firebase ; aucune interface de jeu ne s’affiche avant authentification.

Parcours vérifiés : briefing/lancement, pause/reprise, financement vaccinal, activation d’équipe et quarantaine, recherche de pays sans accents, sélection/zoom/recentrage, menu de pause, annulation de redémarrage, retour Échap et agrandissement à 200 %. Les règles et les sauvegardes sont inchangées. Pas de vérification sur appareil physique ni de contrôle à la manette revendiqué.

Le contrôle Lighthouse d’accessibilité du montage de composants renvoie 100/100 après correction du nom accessible du logo, sans échec binaire restant. Ce contrôle ne constitue ni une nouvelle mesure de performance de production ni une validation exhaustive par lecteur d’écran. Les 22 tests et le lint restent valides ; les scores de performance précédents ne sont pas réutilisés pour cette refonte.

Skills appliqués : game-ui-ux pour la structure et le parcours, game-feel pour les retours proportionnés, frontend-design et ui-taste pour la direction et la critique, create-game-assets pour les assets vectoriels et la provenance, avec les règles de web-design-guidelines, emil-design-eng, apple-design et animation-performance pour les détails. Les workflows de prototype, d’iOS natif, d’audio et d’autres moteurs ne sont pas forcés sur ce jeu React.

## Atlas vivant — seconde passe

Cible de raffinement : `atlas-v2-target.png` (1536 × 1024), générée et inspectée avant l’implémentation. La cible conserve l’identité précédente ; ses changements retenus sont la progression de mission, la priorité aux interventions et le retour d’ordre près du pays. Les chiffres, photographies, démographie fictive et effets médicaux inventés dans l’image ne sont pas repris. Le HUD et la barre de temps du produit restent en place : pas de revendication de correspondance pixel par pixel avec cette nouvelle cible.

Implémentation : états de risque calculés à partir des cas réels ; marqueurs médicaux et quarantaines visibles en surimpression ; signalement bref des nouveaux foyers ; confirmation d’ordre issue des transitions acceptées du reducer, avec coût et durée. Les mouvements sont courts, interruptibles, et supprimés par le réglage de réduction des mouvements. Le dossier affiche situation et actions avant les statistiques dépliables. Le programme vaccinal, les laboratoires et la distribution forment une chaîne ; les protocoles de soutien restent indépendants. Le journal distingue rapports, interventions, recherche et mission, avec un filtre des décisions et jalons.

Sur mobile, quatre commandes directes remplacent le rail horizontal : Carte, Pays, Recherche et Menu. Le dossier sélectionné s’ouvre sur toute la surface disponible et se replie vers la carte. Le menu donne accès au journal, aux options et à l’aide. Les commandes temporelles restent fixes.

Accueil : libellés fondés sur l’observation Firebase et la restauration validée de la sauvegarde. Une mission terminée ouvre son bilan. Un globe géographique Three.js / React Three Fiber est chargé séparément à partir de 900 px ; boutons et glisser permettent de l’orienter. Le rendu est à la demande, sans boucle permanente, avec densité de pixels plafonnée à 1,5. Les petits écrans conservent l’atlas SVG. Le fond SVG reste disponible si le globe ne se charge pas. Géographie Natural Earth existante, sans texture ni service externe supplémentaire.

Références consultées : react-three-fiber pour le globe ; MotionSites et motionin.design pour les retours et la continuité ; getdesign.md pour la cohérence documentée ; Modulify, Wedoflow (surface publique uniquement) et Landing pour la composition. Aucun modèle privé ou payant n’a été copié.

Validation : 31 tests automatisés, contrôles lint/build et inspection navigateur des composants réels avec le reducer dans un banc isolé. Parcours : déploiement médical, quarantaine, financement vaccinal/déverrouillage, objectifs, recherche mobile, dépliage du dossier, menu/options, texte à 200 %, rotation/recentrage du globe. Formats inspectés : 1536×1024, 390×844 et 844×390. Le banc temporaire est supprimé après contrôle. Aucun compte réel créé ni accès authentifié distant exercé. Le build signale la taille du module 3D différé (environ 244 ko gzip), qui n’est pas nécessaire au jeu ni chargé sur petit écran. Un avertissement de dépréciation THREE.Clock provient de l’intégration Fiber, sans erreur d’exécution observée. Aucune nouvelle mesure Lighthouse revendiquée.

## Dernière passe : objectifs, bilan et mesures

Les étapes narratives sont remplacées par des jalons vérifiables et indépendants : programme financé, vaccin validé, distribution active, foyers éliminés. Une victoire sans vaccin ne coche pas les jalons vaccinaux. L’objectif ouvre soit la recherche, soit la liste des pays préfiltrée sur les foyers actifs. Les libellés d’accueil attendent l’observation de session et, pour une session connectée, la lecture validée de la sauvegarde.

Sur la carte, le nom du pays et les commandes sont regroupés dans une légende de sélection fixe. Les confirmations restent dans la notification accessible ; leur texte ne se superpose plus aux noms sur le SVG. Les marqueurs et le réticule compensent le zoom pour conserver leur taille relative à l’écran. Une recherche donne accès aux pays simulés difficiles à viser ; aucune extension du jeu à des territoires absents des données n’est revendiquée.

Le bilan explique la cause de fin, présente les cas restants, les pays touchés, les décès, la confiance, la courbe et son maximum observé, les jalons et les événements récents disponibles. L’historique des nouvelles parties est conservé jusqu’à 366 points ; les anciennes sauvegardes conservent leur couverture disponible, explicitement indiquée. Les événements restent limités aux 30 entrées existantes. Le focus initial se place sur le titre ; nouvelle mission et retour au menu restent accessibles par défilement et au clavier.

Contrôles : 34 tests, lint et build. Parcours navigateur vérifiés à 1536×1024 et 390×844 : objectif d’éradication vers les foyers filtrés, zoom, recherche et sélection de la Jamaïque, défaite, victoire sans vaccin, ouverture des décisions du bilan et focus mobile au titre. Le banc de composants isolé est retiré après validation. Aucun compte ni mot de passe créé pour les essais.

Mesures Lighthouse 13.5.0, accueil de production local sur Chrome headless : desktop 98/100 ; mobile 94/100 ; accessibilité 100/100 dans les deux profils. Mobile avant suppression des dépendances Firebase inutiles : 92/100, LCP 3,02 s ; après : 94/100, LCP 2,87 s. Desktop final : LCP 1,02 s. TBT : 0 ms dans les deux profils. Les variations ne constituent pas une garantie de performance sur appareil physique, réseau distant ni une certification d’accessibilité du jeu. Les chiffres et les dates sont dans `performance-results.json` ; les rapports complets sont conservés dans le dossier de visualisations de la conversation.

L’audit de dépendances a montré que Firestore était initialisé sans aucun consommateur. Son initialisation et son import sont retirés. Auth est initialisé sans le resolver popup/redirect, inutilisé par la connexion par mot de passe ; l’ordre de persistance reste IndexedDB, localStorage, sessionStorage. Cette personnalisation suit la documentation officielle : https://firebase.google.com/docs/auth/web/custom-dependencies. Le build réduit les modules Firebase d’environ 51 ko gzip et évite le chargement de l’iframe popup. La protection `/game` et l’observation Firebase restent obligatoires. Le service distant de connexion réelle n’a pas été exercé.

## Découverte et conséquences observées

Un guide facultatif est proposé au briefing et dans l’aide. Il accompagne la sélection/lancement, l’intervention locale puis le financement d’un protocole. Sa progression dépend des actions effectivement acceptées par le moteur. Il peut être quitté à tout moment, ne bloque pas les commandes et ne relance jamais automatiquement le temps ; l’ouverture du guide met une partie active en pause. Son état est local à l’écran, relançable depuis l’aide. Le focus initial se place sur le guide et les changements d’étape sont annoncés.

Chaque pays conserve au maximum huit points de cas actifs, soit sept jours de variation. Le détail du dernier jour sépare nouvelles contaminations, guérisons, décès et vaccinations. Les mesures indiquées sont celles qui étaient actives pendant le jour écoulé, même si leur durée vient d’expirer. Le texte distingue corrélation et causalité : une baisse de cas n’est pas attribuée automatiquement à une intervention, et les décès réduisent aussi le nombre de cas actifs. Le moteur conserve ses calculs ; il expose leurs résultats intermédiaires pour cette lecture.

Ces observations sont sauvegardées avec la mission, validées et restaurées en pause. Les sauvegardes anciennes restent compatibles : le panneau invite à simuler un jour avant de montrer des tendances, sans inventer d’historique. Des observations corrompues sont écartées sans effacer une population et une mission valides.

Une commande de déconnexion est ajoutée au menu de pause. Elle met la simulation en pause, attend Firebase puis revient à la connexion ; une erreur est affichée si la déconnexion ne peut pas être confirmée. L’accès au jeu continue de dépendre de l’observateur Firebase. Les six tests de l’observateur couvrent notamment la restauration asynchrone, l’absence de session, la notification de déconnexion, les erreurs et le nettoyage. Ils utilisent un SDK simulé et ne sont pas des tests de connexion réelle avec un compte.

Validation de cette passe : parcours navigateur avec le vrai reducer, du choix du pays jusqu’au financement d’un protocole et à la fin du guide ; lecture des observations, rechargement en pause et conservation des sept jours ; redémarrage d’une mission ; mobile 390×844 et clavier à 200 %. Une capture Lighthouse avec WebGL désactivé montre le menu fonctionnel en atlas 2D, sans commandes de globe inutilisables. Une mesure complémentaire de l’accueil mobile donne 94/100 en performance, 100/100 en accessibilité, LCP 2,87 s et TBT 0 ms. Les rapports et captures sont conservés dans les visualisations de cette conversation ; ce ne sont pas des mesures sur téléphone physique. La petite commande de déconnexion ajoutée ensuite n’est pas chargée sur l’accueil.

Le banc de test utilise uniquement une sauvegarde de session isolée sur le port 5174 et ne crée aucune route invitée dans le produit. Il est retiré après contrôle. Les essais sur téléphone physique, la connexion/reprise/expiration/déconnexion avec un vrai compte Firebase et l’observation de joueurs humains restent à effectuer. Aucun compte ni mot de passe n’a été créé.

Contrôles finaux après la dernière correction : 39 tests réussis, lint, build et diff --check valides.
