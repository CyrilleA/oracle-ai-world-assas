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

## Ce que le portail permet aujourd’hui

Chaque élève peut explorer les contenus et manipuler le simulateur sur son téléphone. Le professeur peut projeter sa propre version. Leurs choix ne sont pas synchronisés entre appareils.

## Ajouter des jeux synchronisés

Un quiz collectif demande un serveur supplémentaire : création de session, code d’équipe, réception des réponses, règles de score, commandes réservées à l’animateur et diffusion des résultats.

Cloudflare Workers avec un Durable Object SQLite et WebSocket Hibernation constitue une piste avec offre gratuite. Au 4 novembre 2026, le palier gratuit Durable Objects comprend notamment 100 000 requêtes par jour et 13 000 GB-s de durée par jour. Les limites des Workers et du stockage s’appliquent aussi. Un dépassement du palier gratuit provoque des erreurs. L’usage réel doit être contrôlé avant la séance.

Pour une classe de 30 élèves et quelques manches, une implémentation sobre avec connexions WebSocket et hibernation paraît compatible avec ce palier. Il s’agit d’une estimation d’architecture, pas d’une garantie de coût ni d’un serveur déjà livré.

Documentation officielle :

- https://developers.cloudflare.com/durable-objects/platform/pricing/
- https://developers.cloudflare.com/durable-objects/platform/limits/
- https://developers.cloudflare.com/durable-objects/best-practices/websockets/

GitHub Pages seul ne fournit pas de serveur applicatif ou de base de données pour ces jeux. La console animateur des jeux devra utiliser une autorisation vérifiée par le serveur ; un bouton caché côté navigateur ne suffit pas.
