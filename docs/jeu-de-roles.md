# Contraintes visibles et budget global

Les moyens de chaque équipe sont visibles sur son écran principal et au-dessus de son formulaire de réponse. Les fournisseurs voient le stock libre, la fabrication libre, la cadence, le maximum supplémentaire et les réservations existantes. Une révision rappelle les quantités déjà réservées pour cet engagement. Les Opérations voient les composants confirmés, les emballages et la capacité de préparation ; le choix de transport affiche directement capacité, durée et prix.

Transport normal : 100 coffrets, 60 minutes, 120 €. Express : 80 coffrets, 30 minutes, 280 €. Ce sont des capacités totales pour le plan du jeu, pas une simulation de trajets multiples. Les capacités, durées et coûts des deux options sont modifiables par l’animateur. Les anciennes séances structurées bénéficient des mêmes valeurs par défaut, sans supprimer les engagements. Un événement peut ramener le transport normal à 60 coffrets ; changer de mode ou réviser la promesse devient alors nécessaire. Un retard routier ajoute 90 minutes aux deux options.

Le budget maximal couvre composants, préparation et transport. Avant que le plan soit finalisé, la préparation est provisionnée au prix minimum de l’équipe Opérations ; le transport est estimé à l’option la moins chère pouvant couvrir la quantité. Un engagement Opérations confirmé ou un plan précise ensuite les valeurs retenues. Les offres fournisseurs et commandes sont contrôlées sur ce coût global prévu, et non sur les seuls produits. Côté Achats, seul le budget disponible est affiché, sans ventilation de la provision. L’animateur dispose du détail achats / préparation / transport pour le débrief. Une estimation n’est pas une garantie que toutes les offres futures, notamment leurs marges, tiendront le budget.

La Planification voit un diagramme Demande / Approvisionnements confirmés, la quantité restant à couvrir, les engagements à revalider et l’avancement préparation-livraison / promesse client. Il suit les engagements, pas des réceptions ou livraisons physiques. Les stocks privés des fournisseurs ne sont pas révélés aux autres équipes.

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


## Deux phases : traitement humain, puis préparation IA

Créer une nouvelle séance de jeu de rôles pour disposer d’un chronométrage dès le démarrage.

1. **Phase humaine** : les équipes consultent leurs contraintes, traitent les demandes et préparent leurs réponses. L’ancienne aide IA facultative est supprimée de ce parcours, y compris côté serveur.
2. **Passage animateur** : « Sauvegarder le bilan humain et rejouer avec IA ». Le bilan et les échanges du premier passage sont archivés dans la séance (48 h). Le scénario de départ est restauré : ressources, demande, budget et promesse capturés au démarrage humain. Les équipes, capitaines et QR code restent identiques. Les demandes et engagements du second passage repartent à zéro. Les imprévus injectés ensuite ne sont pas rejoués automatiquement : l’animateur peut réinjecter les mêmes contraintes.
3. **Phase IA** : à chaque nouvelle demande ou modification pertinente, le serveur prépare automatiquement une proposition pour l’équipe concernée. GPT-5 nano choisit une option et indique un critère de choix parmi les options réalisables calculées par le moteur métier. Le contrôle déterministe conserve la responsabilité des quantités, du budget, des stocks et des capacités. Les explications visibles sont construites à partir des chiffres validés pour éviter de présenter une demande comme un engagement déjà obtenu. Ce jeu illustre donc une IA associée à un moteur de contraintes, sans prétendre que le modèle résout seul une optimisation exhaustive.
4. **Validation humaine** : le capitaine clique « Valider et envoyer », accepte une offre entrante ou choisit « Modifier / gérer une exception ». Aucun envoi, commande, réservation ni promesse n’est confirmé automatiquement. Les propositions périmées sont refusées et recalculées ; chaque validation est revérifiée avec les ressources actuelles.
5. **Bilan** : temps écoulé (pauses incluses), première promesse acceptée, délai moyen demande→offre, durée API moyenne séparée, quantité couverte, coût, arrivée et faisabilité. Les gains ne sont jamais présumés ni simulés. L’apprentissage lors du second passage et des événements différents limitent l’interprétation causale.

La phase IA a un plafond de **6 préparations par équipe**, soit 36 appels au maximum par séance ; un appel en échec consomme aussi ce quota afin d’éviter les boucles. Pas de relance payante automatique pour un contexte inchangé, ni d’appel en phase humaine. Le crédit API OpenAI doit être disponible. Un échec explicite laisse le jeu utilisable en traitement manuel, sans fausse réponse IA.

Le contexte transmis ne contient que la demande, les documents visibles, les contraintes fictives du rôle et les options réalisables, sans identifiant élève, jeton ni données confidentielles des autres équipes. `store:false` est utilisé. Les textes reçus sont traités comme des données non fiables.


## Objectifs économiques par équipe

Hypothèses pédagogiques modifiables dans la console, rubrique « Objectifs économiques et rentabilité des équipes » :

| Équipe | Objectif initial | Base de calcul |
| --- | --- | --- |
| Client | 25 % de marge | Recettes de la soirée moins achats, préparation et transport engagés |
| Planification | 30 % de marge | Même résultat global que le Client, avec un objectif plus exigeant |
| Achats | 15 % d’économies | Coût de référence des quantités commandées moins commandes acceptées, rapporté à ce coût de référence |
| Fournisseur A | 20 % de marge | Ventes acceptées moins coûts des composants en stock et à fabriquer |
| Fournisseur B | 20 % de marge | Même méthode, avec des coûts propres différents |
| Opérations / livraison | 15 % de marge | Préparation et transport facturés moins coûts de préparation et de transport |

La recette simulée est de 35 € par coffret ; le prix de référence achats est de 16 € par composant. Coûts économiques A : 8 € en stock, 9 € à fabriquer ; B : 10 € en stock, 11 € à fabriquer ; préparation : 4 € par coffret. Ces coûts restent distincts du prix plancher autorisé. Le stock est consommé avant la fabrication. Le transport est refacturé à son coût, inclus au dénominateur de la marge Opérations : il peut donc réduire le taux de marge sans réduire sa valeur en euros.

Les marges sont rapportées aux recettes (et non aux coûts), calculées avant frais fixes et taxes ; ce ne sont pas des bénéfices comptables réalisés. Les Achats, centre de coût, affichent des économies et non un chiffre d’affaires fictif. Client et Planification partagent le résultat global : ne pas additionner ces indicateurs, ni les marges fournisseurs à la marge globale.

Chaque mobile présente l’objectif, le résultat engagé, le résultat prévu et le détail du calcul. Une seule offre en cours est prise en compte dans la prévision de l’équipe ; des offres alternatives ne sont jamais cumulées. Un aperçu indique l’impact avant l’envoi d’une proposition ou l’acceptation d’une offre. Les achats manquants sont provisionnés au prix de référence dans la prévision globale, pour éviter d’afficher une marge artificiellement élevée avant les commandes.

L’engagement des achats entraîne des coûts avant toute confirmation au Client : la contribution engagée Client/Planification peut donc être négative à cette étape. Les recettes engagées de la soirée apparaissent seulement lors de l’acceptation de la promesse par le Client. L’objectif global n’est atteint que si la quantité demandée est couverte et les engagements ne sont pas à risque. Chaque calcul reste simulé ; l’atteinte d’un objectif financier ne remplace pas le contrôle de délai et de faisabilité de la mission.

L’animateur peut modifier les objectifs et coûts pendant la phase. Chaque modification et chaque action conserve un instantané (160 derniers) des indicateurs. L’élève ne reçoit que ses données, ses hypothèses et les huit derniers relevés de son équipe. Les coûts privés des autres équipes ne sont pas diffusés. Les deux bilans humain/IA incluent les indicateurs économiques ; le rejeu IA restaure les hypothèses économiques du démarrage humain. Pour comparer, conserver des contraintes et hypothèses équivalentes entre phases.

L’IA reçoit uniquement l’objectif et les coûts propres de l’équipe ; elle dispose d’options de prix visant sa marge cible, plus d’options de compromis compatibles avec les contraintes métier. La cible n’est pas une interdiction : un humain peut accepter une marge moindre pour sauver la promesse client. Les contrôles de budget, stock et transport restent impératifs.


## Consignes, rythme et heure de fin

Chaque rôle a une fiche directement sur son téléphone : mission, première action et quatre étapes. La fiche Planification est ouverte par défaut : cette équipe donne le rythme, sollicite les Achats, accepte les approvisionnements, sollicite la Livraison, confirme le plan et fait accepter la promesse par le Client. En attente d’une équipe, son capitaine peut cliquer « Relancer l’équipe attendue » ; c’est un commentaire, sans création d’engagement. En phase IA, les consignes rappellent qu’une proposition prête doit être validée : l’IA ne décide pas de l’envoi à la place du capitaine.

Dans la console, « Heure de fin de la partie » permet de choisir une date et une heure réelle de Paris. Le compte à rebours est affiché chez l’animateur et les joueurs. Cette fin est distincte des horaires fictifs de livraison. Les pauses ne la repoussent pas, et le passage humain → IA la conserve. Elle peut être ajustée ou retirée par l’animateur. À échéance, le serveur termine la séance, fige le temps du bilan à l’heure choisie et interdit les nouveaux engagements et les nouvelles inscriptions. Le bilan reste consultable jusqu’à l’expiration normale de 48 h. Un appel IA déjà en cours peut se terminer, mais son résultat n’est pas publié après la clôture ; aucun nouvel appel n’est lancé après l’échéance.

En phase IA, une solution de référence complète apparaît immédiatement dans la console, calculée par le moteur de contraintes local. Il explore les répartitions fournisseurs, stocks, fabrication, transport, budget et objectifs économiques, en respectant les quantités et les prix déjà engagés. Les nouvelles offres doivent encore être obtenues et acceptées ; le calcul ne crée aucun engagement. Si aucun plan complet n’est trouvé dans ces hypothèses, l’animateur voit une exception, sans fausse promesse. Ce calcul local est clairement distingué de l’IA OpenAI : aucun coût privé d’une autre équipe n’est transmis à son modèle. Le temps en millisecondes du moteur ne doit pas être confondu avec le temps API ou la durée de résolution collective.

La préparation OpenAI des équipes indépendantes est lancée en parallèle. Les pages actualisent plus vite lorsqu’une proposition est en cours de préparation, puis ralentissent quand une autre équipe doit agir. Le modèle économique gpt-5-nano est conservé, avec sorties courtes et un délai d’attente limité. La rapidité globale dépend encore des validations humaines ; le bilan mesure ces durées réelles.


## Relier les équipes aux outils Oracle

Chaque fiche de rôle contient « Du jeu à Oracle SCM » : noms des applications, activité couverte, explication de leur complémentarité, enchaînement visuel et détails avec un exemple des 80 coffrets et un lien officiel. La console animateur rassemble les six correspondances dans « Les outils Oracle de chaque équipe ».

- Planification : Supply Planning pour construire le plan, Global Order Promising pour calculer une date de promesse et Supply Chain Orchestration pour déclencher et suivre les approvisionnements.
- Achats : Sourcing pour consulter/comparer, Purchasing pour créer et gérer les commandes, Supplier Portal pour les échanges avec les fournisseurs. Ces fonctions appartiennent à l’environnement Procurement.
- Fournisseurs A et B : Supplier Portal pour interagir avec l’acheteur ; Inventory Management, Manufacturing et Supply Chain Cost Management comme exemples d’outils dans leur propre entreprise. Les mêmes familles d’outils répondent à des contraintes de stock, de fabrication et de coût différentes. Le portail de l’acheteur n’impose pas au fournisseur d’équiper son propre ERP d’Oracle.
- Opérations/livraison : Warehouse Management pour réception/prélèvement/emballage/expédition, Transportation Management pour les expéditions, tarifs, équipements et capacités ; Inventory Management pour les quantités et mouvements. Manufacturing peut compléter le dispositif lorsqu’il s’agit de fabrication industrielle.
- Client : Order Management et Global Order Promising sont présentés du côté de l’entreprise qui sert le client ; le client externe reçoit la promesse et le suivi via le canal choisi, sans supposer qu’il accède aux écrans internes.

Les liens de chaque fiche renvoient aux pages Oracle et à la documentation produit vérifiées le 4 novembre 2026. Il s’agit d’une correspondance pédagogique, sans connexion du jeu à une instance Oracle. La couche IA est présentée comme une aide à la préparation et à la coordination, distincte des applications qui portent les transactions.


## Profil test : répondre avec les six rôles sur un seul ordinateur

Depuis l’accès animateur, ouvrir « Profil test · choisir les rôles et répondre ». Le profil utilise la connexion animateur existante : aucun compte supplémentaire et aucun mot de passe à créer. Une partie privée indépendante est créée avec six capitaines simulés. Elle n’ajoute aucun joueur et n’écrit aucune réponse dans la partie des élèves.

Cliquer « Démarrer le test », puis choisir l’équipe qui doit répondre dans la barre persistante. Chaque bouton indique si l’équipe doit agir, attend une réponse ou a terminé son étape. « Jouer : [équipe] » propose un prochain rôle actif ; le choix manuel des six rôles reste possible. Le profil affiche les mêmes consignes, ressources, outils Oracle, objectifs économiques et formulaires que les mobiles élèves. Les offres et engagements restent soumis aux contrôles métier normaux. Changer de rôle n’envoie pas automatiquement de réponse.

Le volet « Commandes animateur » permet d’injecter des événements, de modifier les contraintes et les objectifs, de fixer l’heure de fin et de consulter le bilan. « Rejouer le test avec IA » prépare les propositions avec le modèle et les quotas habituels ; l’animateur les valide en changeant de rôle. Les appels API consomment le crédit OpenAI uniquement en phase IA. « Nouvelle partie test » crée une nouvelle séance privée et conserve les anciens bilans accessibles par leur adresse jusqu’à l’expiration.

Les six rôles sont contrôlés par des routes serveur réservées à une session animateur valide. Aucun jeton joueur ni mot de passe n’est placé dans l’URL. Les accès élèves et le QR code ne donnent pas accès au profil ; l’inscription publique et la lecture publique de la partie test sont bloquées. Le profil ne permet pas de prendre le contrôle des rôles d’une partie normale.
