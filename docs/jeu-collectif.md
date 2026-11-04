# Animer la soirée Beaujolais

## Les deux accès

- Élèves : `site/jeu.html`, sans navigation vers les autres parties de la présentation, sans corrigé et sans résultat collectif.
- Animateur : `site/animateur.html`, protégé par une clé vérifiée par le serveur Cloudflare. La page est publique, les commandes et résultats exigent l’autorisation serveur.

Le QR code de l’accueil mène uniquement au jeu. Dès qu’une séance est créée dans la console, le QR de l’accueil, ouvert dans le même navigateur, inclut automatiquement son code. La console affiche aussi le QR de la séance. Le QR générique permet de saisir le code projeté.

La présentation générale reste un site public : le QR du jeu ne la présente pas aux élèves, mais ce dispositif ne rend pas secret le dépôt GitHub ou les URL du portail.

## Déroulement

1. Ouvrir l’accès animateur et saisir la clé d’animation, ou utiliser le fichier d’accès privé préparé localement.
2. Créer une nouvelle séance avant l’arrivée des élèves. Une séance vide évite de mélanger les essais aux réponses de la classe.
3. Revenir à l’accueil pour les remerciements et le QR, ou projeter le QR de la console. Garder accueil et console dans le même navigateur.
4. Ouvrir la première question. Les téléphones suivent l’étape décidée par l’animateur.
5. Suivre le nombre de réponses reçues, puis **Clore le vote et afficher les résultats**. Les graphiques montrent les nombres et les pourcentages parmi les réponses reçues. Le nombre de participants sans réponse reste affiché.
6. Discuter du résultat avant d’afficher les points de débrief, puis ouvrir la question suivante.
7. Après la troisième question, afficher le bilan. Relier ensuite les décisions au cadre de confiance et à l’Agentic Enterprise.

Les élèves peuvent modifier leur réponse tant que le vote reste ouvert. Un navigateur conserve son identifiant et remplace son propre vote, sans ajouter une réponse. Ce mécanisme ne vérifie pas l’identité : un autre navigateur peut rejoindre comme un nouveau participant.

## Données et réseau

Pas de nom ni d’e-mail demandé. Un identifiant aléatoire par navigateur et par séance relie les trois choix. Les données de séance sont supprimées du serveur après 48 heures. Le navigateur conserve localement son identifiant pour permettre une reconnexion ; cet identifiant ne donne plus accès à une séance expirée.

Résultats actualisés toutes les cinq secondes environ. Une réponse n’est annoncée comme enregistrée qu’après confirmation serveur. Une coupure affiche un message de reconnexion. La séance exige Internet sur les téléphones et sur le poste animateur ; le Mac peut être éteint sans arrêter le backend hébergé.

## Installation du service Cloudflare

Le compte doit conserver le forfait Workers Free. Le service utilise un Worker et un Durable Object SQLite, sans domaine à acheter. Les quotas gratuits s’appliquent ; aucune bascule payante n’est prévue par le code.

Avec Node.js 24 et `npm ci` :

```sh
npx wrangler login --scopes account:read user:read workers_scripts:write
npx wrangler secret put ADMIN_KEY
npm run deploy:live
```

`ADMIN_KEY` est une clé aléatoire longue, réservée à l’animateur. Elle ne doit pas être committée, intégrée à `live-config.json` ni ajoutée aux QR codes. Après déploiement, renseigner l’origine HTTPS retournée dans `site/live-config.json`, sous la clé `api`, puis publier les fichiers statiques sur GitHub Pages.

Le worker autorise l’origine `https://cyrillea.github.io`. Le backend ne sert pas les fichiers du portail. Les séances sont isolées par un code aléatoire et expirent indépendamment.

## Vérification

`npm test` contrôle le portail. `npm run test:live` compile le Worker puis teste le véritable moteur local Cloudflare : 30 participants simultanés, comptage, remplacement d’un vote, clôture, progression, séparation des séances et refus des commandes animateur sans clé. Les tests utilisent un secret fictif et ne publient aucune réponse de test.

Documentation officielle :

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/durable-objects/get-started/
- https://developers.cloudflare.com/durable-objects/api/alarms/
