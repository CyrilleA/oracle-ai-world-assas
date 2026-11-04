# Mission Supply Chain : tenir la promesse client

La rubrique 7 ouvre la console animateur avec « Mission Supply Chain · Jeu de rôles ». Créer une séance affiche le QR du jeu mobile indépendant `supply.html#r=CODE`. Les autres jeux et leurs séances restent séparés.

## Animer 30 minutes

1. Répartir 30 élèves en 6 équipes de 5 : Client, Planification, Achats, Fournisseur A, Fournisseur B, Opérations / livraison. Ils scannent le QR, choisissent leur équipe et reçoivent leurs informations. Le premier membre est capitaine. L’animateur peut nommer un autre capitaine, identifié P1, P2… sans nom réel.
2. Démarrer le tour 1 (8 minutes). Le client demande 80 coffrets avant 19 h, budget 2 000 €. Les achats consultent les fournisseurs. Les opérations chiffrent la préparation. La planification relie les engagements et fait confirmer une promesse au client.
3. Passer au tour 2 (8 minutes). Injecter une contrainte. Elle modifie les calculs et apparaît uniquement sur les téléphones de l’équipe concernée. Les élèves doivent communiquer l’information utile aux autres. Mettre en pause pour discuter si nécessaire.
4. Tour 3 (8 minutes) : réviser ou renégocier, puis terminer. Le bilan conserve les messages, le journal, les aides IA et le résultat calculé du plan. Discuter : qui savait quoi et quand ? Où la coordination a-t-elle bloqué ?

Les membres peuvent soumettre des propositions internes. Seul le capitaine confirme un message, accepte une offre ou engage un plan. La réponse et la contre-proposition restent modifiables avant envoi. Les prix, quantités et délais des offres sont des champs structurés, contrôlés par le serveur. Une offre ne réserve la capacité qu’après acceptation par le destinataire. Une offre en attente expire au changement de tour ; les engagements acceptés restent. L’animateur peut libérer un engagement pour le renégocier.

## Règles de calcul (simplification pédagogique)

- Chaque coffret nécessite 1 composant fournisseur. A : capacité 60, prix plancher 10 €, livraison au plus tôt 14 h. B : capacité 60, plancher 13 €, livraison au plus tôt 15 h. Ces conditions sont privées à chaque fournisseur.
- Opérations : capacité 100 coffrets, 40 coffrets/h, préparation au prix plancher de 5 €/coffret. La préparation commence après la dernière arrivée fournisseur. Le transport normal coûte 120 € et dure 60 min ; l’express coûte 280 € et gagne 30 min.
- Les achats acceptés consomment le budget même si tous les composants ne sont pas utilisés. Coût du plan = achats engagés + préparation de la quantité du plan + transport choisi. L’arrivée retenue respecte aussi l’heure annoncée par les opérations.
- La quantité disponible tient compte des capacités réelles et des pertes qualité. Les engagements, budget et délai sont revérifiés à chaque changement. Le client peut accepter une quantité ou une heure révisées ; la demande initiale reste visible pour le débrief.
- Un plan de référence viable : acheter 60 composants à A (10 €) et 20 à B (13 €), accepter 80 préparations à 5 €, transport normal. Coût 1 380 €, arrivée 18 h, promesse 80 avant 19 h. Ce n’est pas une réponse unique.
- Les contraintes prédéfinies changent vraiment les ressources. Le message personnalisé est une information uniquement et le formulaire le précise. Aucun achat, contrat ni transport réel n’est exécuté.

## Aide IA et clé OpenAI

L’utilisateur a explicitement autorisé l’envoi à OpenAI du brouillon saisi, des demandes reçues et du contexte fictif de l’équipe qui clique « Avec IA ». Les autres secrets d’équipe et les identifiants élève sont exclus. Le serveur construit ce périmètre ; le navigateur ne choisit pas les informations des autres équipes.

Dans Cloudflare → Worker `assas-beaujolais-votes` → Settings → Variables and Secrets, ajouter un **secret** `OPENAI_API_KEY`. Saisir sa valeur directement dans Cloudflare puis déployer. Le navigateur, GitHub et les journaux ne reçoivent jamais cette clé. Le modèle par défaut est `gpt-5-nano`, configurable avec la variable `OPENAI_MODEL`.

L’IA est désactivée au départ. L’animateur choisit quand l’activer et fixe un quota total de 0 à 10 demandes par équipe, pour toute la partie (3 par défaut). Une demande en échec consomme aussi une tentative ; la console comptabilise les demandes, pas les gains de performance. Une seule nouvelle demande par équipe toutes les 15 secondes ; 60 demandes maximum par séance. Les appels utilisent le crédit API du compte.

Le brouillon est renvoyé dans le formulaire, sans envoyer ni accepter de message. L’équipe vérifie les chiffres, coche la confirmation, puis le capitaine envoie. La sortie IA est du texte non fiable : les contraintes chiffrées restent vérifiées indépendamment côté serveur. En cas d’indisponibilité IA, le mode manuel continue de fonctionner.

L’appel utilise Responses API, `store:false`, un contexte borné aux 6 derniers messages adressés à l’équipe et 500 tokens de sortie maximum. Les durées d’analyse ou gains de qualité ne sont pas inventés ; le journal permet un débrief qualitatif. Les données du jeu sont supprimées de Cloudflare après 48 h ; `store:false` n’est pas une promesse d’absence de toute conservation opérationnelle par le fournisseur API.

Le modèle économique retenu le 4 novembre 2026 est GPT-5 nano : 0,05 $ / million de tokens d’entrée et 0,40 $ / million de tokens de sortie au tarif standard. Il est déprécié avec arrêt annoncé au 11 décembre 2026. Avant de réutiliser le jeu après cette date, choisir explicitement un modèle disponible dans OPENAI_MODEL. Aucun basculement automatique vers un modèle plus cher n’est effectué. Références : https://developers.openai.com/api/docs/models/gpt-5-nano et https://developers.openai.com/api/docs/deprecations .
