# Oracle AI World et SCM — ASSAS

Portail pédagogique pour animer la matinée du 5 novembre 2026. Il présente une frise depuis le lancement de ChatGPT, l’Agentic Enterprise, les annonces Fusion, les domaines SCM, un jeu de rôles et une conclusion « Et vous, demain ? » sur les métiers possibles de l’Agentic Enterprise.

## Accéder au portail

**Site : https://cyrillea.github.io/oracle-ai-world-assas/**

Hébergement gratuit avec GitHub Pages. Une copie du site est également disponible sur https://assas-beaujolais-votes.oracle-ai-world-assas.workers.dev/ pour assurer l’accès lorsque GitHub Pages rencontre un incident. Les étudiants scannent le QR code généré dans la console lors de la création de leur séance, avec leur connexion Internet, sans compte GitHub.



Le fichier `site/index.html` fonctionne aussi directement dans un navigateur. Son contenu, ses schémas et ses calculs sont embarqués. Les vidéos et les sources externes demandent une connexion Internet.

## Animer la séance

- **F** : mode projection, avec le menu de navigation visible.
- **N** : notes de l’animateur.
- **Flèches gauche/droite** : changer d’espace.
- **Échap** : fermer une fenêtre ou les notes.
- Les schémas d’Agentic Enterprise s’agrandissent au clic.
- « Et vous, demain ? » présente les cinq rôles cités dans Agentic Enterprise (p. 8), avec leurs compétences et des exemples reliés au jeu des 80 coffrets.

Les notes, scénarios et corrigés de la présentation font partie du site public. Le QR code mène à une page de jeu distincte (`jeu.html`), sans navigation vers la présentation. La console (`animateur.html`) crée une séance et projette les résultats après clôture du vote. Ses commandes et agrégats sont protégés par un mot de passe et une session vérifiés sur le serveur Cloudflare.

Voir [le guide du jeu collectif](docs/jeu-collectif.md) pour le déroulement, la configuration et la portée de cette séparation. Le scénario consultable dans le portail reste une prévisualisation individuelle.

## Mettre à jour et publier

1. Modifier `site/index.html`.
2. Lancer `npm ci`, `npm test` et `npm run test:live` avec Node.js 24.
3. Envoyer le commit sur la branche `main`.
4. Vérifier le workflow **Publier le portail** dans l’onglet **Actions**.

Le workflow vérifie le portail avant publication et ne publie que le dossier `site/`.

## Organisation

```text
site/index.html                 Portail autonome
site/qr-code-site.png           QR code vers l’adresse publiée
.github/workflows/pages.yml    Vérification et publication GitHub Pages
tests/portal-smoke.mjs          Contrôles de contenu et de logique
docs/hebergement.md            Hébergement gratuit et évolution vers les jeux en direct
```

## Sources et portée

Les liens vers les annonces publiques OpenAI et Oracle figurent dans le portail. Les schémas Agentic Enterprise présentent un cadre conceptuel inspiré du document fourni par Cyrille Ancelot. Les scénarios du jeu sont fictifs. Les missions associées aux cinq métiers sont des adaptations pédagogiques des pistes prospectives du document ; elles ne constituent pas une annonce de postes. Le portail n’est pas une interface Oracle connectée.

Les PDF sources et les fichiers de travail locaux ne font pas partie de ce dépôt. Les visuels et contenus tiers restent soumis aux droits de leurs auteurs. Aucune licence de réutilisation générale n’est accordée par ce dépôt.


## Jeu de rôles Supply Chain

La rubrique 7 ouvre une partie multijoueur à six équipes sur mobile, avec négociation, engagements, contraintes animateur et aide IA facultative. Voir [le guide complet](docs/jeu-de-roles.md) pour les rôles, les calculs et la configuration du secret OpenAI. Le mode sans IA reste utilisable sans clé.
