# Hébergement gratuit

Vérifications effectuées le 4 novembre 2026.

## Solution retenue : GitHub Pages

GitHub Pages est disponible gratuitement pour un dépôt public. Il convient au portail actuel, qui contient HTML, CSS, JavaScript, images et calculs exécutés dans le navigateur.

- Une URL HTTPS partageable, sans nom de domaine à acheter.
- Un accès depuis le navigateur des téléphones, avec leur connexion Internet.
- Aucun compte GitHub nécessaire pour consulter le site public.
- Une publication automatique après envoi des modifications sur `main`.
- Le code, les notes et les corrigés sont publics.

Documentation officielle :

- https://docs.github.com/en/pages/getting-started-with-github-pages/what-is-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages
- https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits

## Votes collectifs

Les fichiers statiques restent sur GitHub Pages. Le jeu `jeu.html` et la console protégée `animateur.html` utilisent un Worker Cloudflare et un Durable Object SQLite pour centraliser les réponses. Le paramètre `api` de `site/live-config.json` doit contenir l’origine HTTPS effectivement déployée ; une valeur vide laisse le jeu en attente d’activation.

Le service est prévu pour un compte Workers Free, dans les quotas gratuits. Environ 30 téléphones pendant une matinée, avec une interrogation toutes les cinq secondes puis arrêt après le jeu, reste sous le quota de 100 000 requêtes par jour. L’usage total du compte et les limites de stockage et de calcul s’appliquent aussi. Le code ne souscrit aucun forfait payant.

Voir [le guide du jeu collectif](jeu-collectif.md). Documentation officielle :

- https://developers.cloudflare.com/workers/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
