# Attentes entre équipes

Lorsqu’aucune action n’est possible, l’écran nomme l’équipe attendue, l’information nécessaire et la prochaine étape. Après une offre envoyée, il attend la décision du destinataire ; après une demande, il attend la réponse de l’équipe sollicitée. Les attentes sont actualisées par la synchronisation automatique du jeu, sans recharger la page. Un engagement déjà confirmé affiche une étape terminée plutôt qu’une attente sans objet.

La chaîne guidée est : Client → Planification → Achats → Fournisseurs → Achats → Planification → Opérations / livraison → Planification → Client. Les Opérations ne peuvent s’engager avant confirmation des approvisionnements par les Achats et la Planification ; ce contrôle est aussi effectué par le serveur, même en cas de consultation anticipée. Les quantités partielles confirmées restent utilisables pour une contre-proposition partielle.

# Interface élèves simplifiée

L’écran principal indique l’action suivante pour l’équipe : consulter les Achats, demander un prix, répondre, commander ou confirmer la promesse. Le destinataire et le besoin lié sont choisis automatiquement ; quantité et heure sont préremplies. Les ressources, références et historiques restent disponibles sous « Mes ressources et l’historique ».

Pour une réponse, la vérification se lance automatiquement. Si la proposition est impossible, des boutons permettent de choisir une quantité partielle ou un délai réalisable. Il n’y a plus de bouton « Vérifier » ni de case à cocher avant une offre ; « Envoyer ma proposition » est disponible quand les valeurs ont été vérifiées. Le serveur conserve ses contrôles lors de l’envoi et de l’acceptation. Préparer la promesse client confirme le plan interne compatible, sans accepter de proposition à la place du client.

La première consultation Achats répartit par défaut le besoin en deux : pour 80, 40 chez A et 40 chez B. Ce sont des valeurs proposées, modifiables, sans supposer les capacités privées des fournisseurs. La Planification demande les composants avec une marge pour préparer et transporter les coffrets. L’aide IA et les messages restent accessibles dans un volet secondaire.

# Parcours structuré : demandes, devis et engagements

Les nouvelles séances du jeu de rôles utilisent ce parcours. Les séances déjà ouvertes gardent leur mode historique. Le jeu simule la planification et les engagements : un statut confirmé réserve des ressources dans la simulation, il ne représente pas une fabrication ou une livraison physique exécutée.

1. Le Client dispose du besoin initial BES-001 : 80 coffrets avant 19 h. La Planification le reçoit automatiquement.
2. La Planification crée une demande aux Achats : quantité de composants et heure souhaitée. Elle peut aussi consulter les Opérations pour la préparation et le transport.
3. Les Achats créent des consultations fournisseurs liées au besoin reçu. Chaque demande indique une quantité et une heure ; elle ne réserve rien.
4. Chaque fournisseur ouvre la consultation, vérifie la faisabilité et propose une offre. Le contrôle indique le maximum réalisable à l’heure demandée et, si la capacité le permet, l’heure possible pour la totalité. Une quantité partielle ou une livraison plus tardive peut être proposée explicitement. Les Achats choisissent de commander ; le serveur revérifie le prix, le stock libre, les matières, la cadence, le transport, les réservations et le budget avant de créer l’engagement ENG-xxx. Les offres en attente ne réservent rien.
5. Les Achats confirment leur approvisionnement à la Planification en répondant à sa demande : cette quantité doit être couverte par les commandes fournisseurs acceptées. Ce transfert interne n’ajoute aucun coût d’achat.
6. Les Opérations répondent à la demande de service. Leur offre s’appuie sur les composants commandés, leur heure d’arrivée, les emballages, la cadence, le prix de préparation et le transport choisi. La Planification accepte cet engagement.
7. La Planification confirme un plan compatible avec les engagements Achats et Opérations. Elle répond ensuite au besoin client avec une quantité et une heure réalisables. Le Client confirme cette promesse. Les contrôles sont effectués à la proposition et à l’acceptation.

Les membres peuvent préparer des demandes ou offres en propositions internes. Le capitaine les confirme ; les contrôles sont réexécutés lors de cette confirmation. Les commentaires libres et l’aide IA restent disponibles dans un espace secondaire. Un commentaire ne peut pas créer une commande ni modifier une promesse.

## Imprévus et révisions

Les contraintes administrateur restent actives. Les engagements devenus irréalisables affichent « à risque », avec leur cause. Ils ne sont jamais effacés automatiquement. Un destinataire peut demander une révision ; l’émetteur peut aussi proposer une nouvelle version. L’ancienne commande continue de réserver les ressources jusqu’à l’acceptation de la remplaçante. Cette acceptation retire atomiquement l’ancienne réservation et applique la nouvelle, sans compter deux fois le coût.

Si une commande amont est remplacée ou libérée, les engagements qui s’appuyaient sur elle demandent une reconfirmation. Les équipes doivent faire remonter les nouvelles conditions jusqu’au client. Les offres non acceptées expirent au changement de tour. Les demandes et les engagements confirmés restent.

## Exemple pour tester seul

Planification → Achats : 80 composants à 15 h. Achats → A : 60 à 14 h ; Achats → B : 20 à 15 h. A constate que seuls 20 sont réalisables à 14 h et propose 60 à 15 h pour 10 €/unité ; B propose 20 à 15 h pour 13 €/unité. Les Achats acceptent les deux, puis proposent à la Planification l’engagement de 80 à 15 h. Opérations propose 80 préparations à 5 €/unité, livraison à 18 h, transport normal. La Planification accepte, confirme le plan puis propose 80 avant 19 h au Client. Coût : 1 380 €.

Réduire ensuite la cadence A à 20/h : son engagement à 15 h devient à risque. Faire réviser A à 16 h, puis reconfirmer Achats à 16 h et Opérations à 19 h, confirmer le plan et reconfirmer la promesse client à 19 h. Le coût reste 1 380 €.

---

# Mission Supply Chain : tenir la promesse client

La rubrique 7 ouvre la console animateur avec « Mission Supply Chain · Jeu de rôles ». Créer une séance affiche le QR du jeu mobile indépendant `supply.html#r=CODE`. Les autres jeux et leurs séances restent séparés.

## Animer 30 minutes

1. Répartir 30 élèves en 6 équipes de 5 : Client, Planification, Achats, Fournisseur A, Fournisseur B, Opérations / livraison. Ils scannent le QR, choisissent leur équipe et reçoivent leurs informations. Le premier membre est capitaine. L’animateur peut nommer un autre capitaine, identifié P1, P2… sans nom réel.
2. Démarrer le tour 1 (8 minutes). Le client demande 80 coffrets avant 19 h, budget 2 000 €. Les achats consultent les fournisseurs. Les opérations chiffrent la préparation. La planification relie les engagements et fait confirmer une promesse au client.
3. Passer au tour 2 (8 minutes). Injecter une contrainte. Elle modifie les calculs et apparaît uniquement sur les téléphones de l’équipe concernée. Les élèves doivent communiquer l’information utile aux autres. Mettre en pause pour discuter si nécessaire.
4. Tour 3 (8 minutes) : réviser ou renégocier, puis terminer. Le bilan conserve les messages, le journal, les aides IA et le résultat calculé du plan. Discuter : qui savait quoi et quand ? Où la coordination a-t-elle bloqué ?

Les membres peuvent soumettre des propositions internes. Seul le capitaine confirme un message, accepte une offre ou engage un plan. La réponse et la contre-proposition restent modifiables avant envoi. Les prix, quantités et délais des offres sont des champs structurés, contrôlés par le serveur. Une offre ne réserve la capacité qu’après acceptation par le destinataire. Une offre en attente expire au changement de tour ; les engagements acceptés restent. L’animateur peut libérer un engagement pour le renégocier.

## Règles de calcul (simplification pédagogique)

- Chaque coffret nécessite 1 composant fournisseur. A : 20 composants en stock, 40 composants fabricables avec les matières disponibles, cadence 40/h à partir de 13 h, transport 1 h, prix plancher 10 €. Stock livrable dès 14 h ; 60 composants livrables à 15 h. B : 20 en stock, 40 fabricables, cadence 20/h à partir de 14 h, transport 1 h, plancher 13 €. Stock livrable dès 15 h ; 60 composants livrables à 17 h. Ces conditions sont privées à chaque fournisseur.
- Ces contraintes de stock et de fabrication sont actives dès le début des nouvelles séances. Une unité fabriquée consomme une unité de matière. Chaque fournisseur ne possède qu’une ligne ; la cadence porte sur le volume total engagé au-delà de son stock, pas sur chaque offre séparément. Les offres sont contrôlées à l’envoi et à l’acceptation. Les engagements réservent le stock et la fabrication ; une libération les rend disponibles à nouveau. Le scénario ne simule pas l’écoulement du temps réel ni la gestion de lots : la préparation attend toute la livraison fournisseur. Les anciennes séances conservent leurs règles.
- Opérations : stock initial de 80 emballages (un par coffret), capacité 100 coffrets, 40 coffrets/h, préparation au prix plancher de 5 €/coffret. La préparation commence après la dernière arrivée fournisseur. Le transport normal coûte 120 € et dure 60 min ; l’express coûte 280 € et gagne 30 min.
- Les achats acceptés consomment le budget même si tous les composants ne sont pas utilisés. Coût du plan = achats engagés + préparation de la quantité du plan + transport choisi. L’arrivée retenue respecte aussi l’heure annoncée par les opérations.
- La quantité disponible tient compte des capacités réelles et des pertes qualité. Les engagements, budget et délai sont revérifiés à chaque changement. Le client peut accepter une quantité ou une heure révisées ; la demande initiale reste visible pour le débrief.
- Un plan de référence viable : acheter 60 composants à A (10 €) et 20 à B (13 €), accepter 80 préparations à 5 €, transport normal. Coût 1 380 €, arrivée 18 h, promesse 80 avant 19 h. Ce n’est pas une réponse unique.
- Contraintes supplémentaires injectables : perte de 10 composants en stock chez A, cadence de fabrication A divisée par deux, perte de 20 emballages, réception de 20 emballages supplémentaires. Elles recalculent aussi les engagements déjà acceptés ; les élèves doivent renégocier si nécessaire. Une perte de stock peut obliger à fabriquer davantage, dans la limite des matières disponibles.
- Les contraintes prédéfinies changent vraiment les ressources. Le message personnalisé est une information uniquement et le formulaire le précise. Aucun achat, contrat ni transport réel n’est exécuté.

## Aide IA et clé OpenAI

L’utilisateur a explicitement autorisé l’envoi à OpenAI du brouillon saisi, des demandes reçues et du contexte fictif de l’équipe qui clique « Avec IA ». Les autres secrets d’équipe et les identifiants élève sont exclus. Le serveur construit ce périmètre ; le navigateur ne choisit pas les informations des autres équipes.

Dans Cloudflare → Worker `assas-beaujolais-votes` → Settings → Variables and Secrets, ajouter un **secret** `OPENAI_API_KEY`. Saisir sa valeur directement dans Cloudflare puis déployer. Le navigateur, GitHub et les journaux ne reçoivent jamais cette clé. Le modèle par défaut est `gpt-5-nano`, configurable avec la variable `OPENAI_MODEL`.

L’IA est désactivée au départ. L’animateur choisit quand l’activer et fixe un quota total de 0 à 10 demandes par équipe, pour toute la partie (3 par défaut). Une demande en échec consomme aussi une tentative ; la console comptabilise les demandes, pas les gains de performance. Une seule nouvelle demande par équipe toutes les 15 secondes ; 60 demandes maximum par séance. Les appels utilisent le crédit API du compte.

Le brouillon est renvoyé dans le formulaire, sans envoyer ni accepter de message. L’équipe vérifie les chiffres, coche la confirmation, puis le capitaine envoie. La sortie IA est du texte non fiable : les contraintes chiffrées restent vérifiées indépendamment côté serveur. En cas d’indisponibilité IA, le mode manuel continue de fonctionner.

L’appel utilise Responses API, `store:false`, un contexte borné aux 6 derniers messages adressés à l’équipe et 500 tokens de sortie maximum. Les durées d’analyse ou gains de qualité ne sont pas inventés ; le journal permet un débrief qualitatif. Les données du jeu sont supprimées de Cloudflare après 48 h ; `store:false` n’est pas une promesse d’absence de toute conservation opérationnelle par le fournisseur API.

Le modèle économique retenu le 4 novembre 2026 est GPT-5 nano : 0,05 $ / million de tokens d’entrée et 0,40 $ / million de tokens de sortie au tarif standard. Il est déprécié avec arrêt annoncé au 11 décembre 2026. Avant de réutiliser le jeu après cette date, choisir explicitement un modèle disponible dans OPENAI_MODEL. Aucun basculement automatique vers un modèle plus cher n’est effectué. Références : https://developers.openai.com/api/docs/models/gpt-5-nano et https://developers.openai.com/api/docs/deprecations .

## Console animateur : tout suivre et intervenir

Le fil « Toutes les activités » affiche les échanges et offres (statut à jour), les propositions internes soumises par les équipiers, le journal des décisions et le dernier brouillon IA enregistré par participant. Filtrer par équipe ou type ; les 50 éléments les plus récents sont visibles dans le fil, et les historiques complets des échanges et décisions restent disponibles plus bas. Les textes en cours de frappe sur un téléphone ne sont pas transmis au serveur. Les tentatives IA et leurs échecs sont comptabilisés dans le journal ; le brouillon enregistré n’est pas un historique de toutes les versions.

« Modifier une contrainte ou une limite » remplace une valeur précise, avant le début ou pendant le jeu, y compris en pause :
- Client / budget : budget maximal, quantité demandée, heure promise.
- Chaque fournisseur : stock total avant réservations, matières premières, capacité et cadence de fabrication, début de fabrication, quantité totale maximale, transport, première livraison, prix plancher.
- Opérations : stock d’emballages, capacité, cadence, durée du transport, composants bloqués, prix plancher.

La console indique la valeur actuelle et les bornes de saisie. Un motif facultatif accompagne la notification. Chaque modification est journalisée avec ancienne et nouvelle valeur. Seule l’équipe concernée reçoit la contrainte ; le budget est communiqué à tous. Demande et heure promise sont adressées au client (les valeurs partagées du plan restent visibles). Changer la demande ne vaut pas acceptation automatique d’une nouvelle promesse : les équipes doivent la renégocier. Les contraintes privées ne deviennent pas visibles aux autres équipes.

Les engagements restent enregistrés : réduire une capacité ou retarder une fabrication peut rendre le plan irréalisable. L’animateur peut libérer un engagement accepté pour permettre la renégociation. Les prix déjà acceptés restent ceux de l’offre, même si le prix plancher change. Les limites ne sont plus modifiables après la fin. Les anciennes séances dépourvues d’une propriété industrielle doivent être recréées pour utiliser cette propriété.
