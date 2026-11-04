export const OPTIONS = ['Laisser agir', 'Demander une validation', 'Reprendre la main'];
export const QUESTIONS = [
  {
    title: 'Comparer les offres',
    context: 'Vous organisez la soirée Beaujolais pour 30 personnes, avec un budget maximal de 900 €. L’IA recherche une salle, compare les devis et propose un menu et des boissons adaptés aux participants. Rien n’est encore réservé.',
    question: 'L’autorisez-vous à contacter les prestataires et comparer leurs offres ?',
    discussion: 'Quelles informations doit-elle recevoir ? Quelles sources vérifier ? Peut-elle déjà engager une dépense ?',
    debrief: 'Rechercher et comparer peut faire partie d’un premier mandat, avec des sources et des informations à partager clairement définies. Ce mandat n’autorise pas encore une réservation.'
  },
  {
    title: 'Confirmer les réservations',
    context: 'Salle : 180 €. Traiteur : 420 €. Boissons : 120 €. Matériel : 60 €. Total : 780 €, sous le plafond de 900 €. Les disponibilités et les besoins des participants sont confirmés.',
    question: 'Autorisez-vous les agents à confirmer les réservations ?',
    discussion: 'Respecter le budget suffit-il ? Qui a le pouvoir d’engager l’association ? Quelles preuves conserver ?',
    debrief: 'La réservation est possible si un responsable a préalablement donné ce pouvoir aux agents et si toutes les conditions du mandat sont respectées. Un budget conforme ne constitue pas, à lui seul, une autorisation.'
  },
  {
    title: 'Réagir à l’imprévu',
    context: 'Le traiteur annule. Un remplaçant est disponible, mais coûte 180 € de plus. Le total passe de 780 € à 960 €, soit 60 € au-dessus du plafond de 900 €. L’agent Achats demande une réservation immédiate.',
    question: 'Laissez-vous les agents engager cette dépense supplémentaire ?',
    discussion: 'Acceptez-vous le dépassement, réduisez-vous une autre dépense ou changez-vous le programme ? Qui décide ?',
    debrief: 'Avec un plafond impératif de 900 €, les agents peuvent rechercher des alternatives et proposer un nouveau plan. Ils demandent une nouvelle autorisation avant d’engager 960 €.'
  }
];

// Cas pédagogique fictif : les choix révèlent les fonctions SCM après le vote.
export const SCM_QUESTIONS = [
 {
  title: 'Que met-on dans le coffret ?',
  context: 'Pour la soirée Beaujolais, vous devez préparer 80 coffrets. Deux versions sont prévues : avec ou sans alcool. La composition, les allergènes et les emballages doivent être connus avant les achats.',
  question: 'Quelle est votre première action ?',
  options: ['Commander les produits les moins chers', 'Définir la composition et les contraintes de chaque version', 'Choisir le transporteur'],
  correct: 1, domain: 'Concevoir', product: 'Oracle Fusion Cloud Product Lifecycle Management',
  discussion: 'Que risque-t-on si chacun travaille avec une composition différente du coffret ?',
  debrief: 'Définir les versions et leurs composants crée une référence commune pour les achats et la préparation. PLM permet de gérer les données produit, les structures et les changements.',
  ai: 'Une aide IA peut faciliter la lecture et la synthèse des informations produit. La composition et les contraintes restent à valider par un responsable.',
  source: 'https://www.oracle.com/scm/product-lifecycle-management/'
 },
 {
  title: 'Avez-vous de quoi préparer les 80 coffrets ?',
  context: 'Chaque coffret contient un pot de tartinade. Il faut donc 80 pots. Vous en avez 20 utilisables en stock et 30 supplémentaires seront livrés à temps. Aucun autre besoin ne consomme ce stock.',
  question: 'Combien de pots faut-il encore approvisionner ?',
  options: ['30 pots', '60 pots', '80 pots'],
  correct: 0, domain: 'Planifier', product: 'Oracle Fusion Cloud Supply Chain Planning',
  discussion: 'Et si les 30 pots attendus arrivaient après la soirée ? Quelle donnée changerait votre plan ?',
  debrief: '80 − 20 − 30 = 30 pots manquants. Le plan rapproche la demande, les stocks disponibles et les approvisionnements attendus à la bonne date. Si la livraison est tardive, le besoin passe à 60 pots.',
  ai: 'L’IA peut aider à signaler un risque et à analyser des scénarios. Les dates et les quantités fiables restent indispensables.',
  source: 'https://www.oracle.com/scm/supply-chain-planning/'
 },
 {
  title: 'Quel fournisseur choisissez-vous ?',
  context: 'Il manque 30 pots. Le fournisseur A propose 90 €, avec une livraison le lendemain de la soirée. B propose 105 €, livrés la veille, avec la qualité attendue. Les deux offres respectent le budget restant de 110 €.',
  question: 'Quelle offre répond au besoin ?',
  options: ['A, parce qu’il est moins cher', 'Les deux offres sont équivalentes', 'B, parce que le délai et les exigences sont respectés'],
  correct: 2, domain: 'Acheter', product: 'Oracle Fusion Cloud Procurement',
  discussion: 'Au-delà du prix, quelles conditions faut-il vérifier avant de passer commande ?',
  debrief: 'B satisfait les contraintes de délai, de qualité et de budget. Procurement accompagne la consultation, la sélection des fournisseurs, la commande et les approbations.',
  ai: 'Une aide IA peut faciliter la comparaison et la synthèse des offres. L’autorisation d’achat suit les règles de l’organisation.',
  source: 'https://www.oracle.com/erp/procurement/'
 },
 {
  title: 'Comment préparez-vous les coffrets ?',
  context: 'Les composants sont arrivés. Vous devez assembler 60 coffrets avec alcool et 20 sans alcool, contrôler leur contenu et identifier les lots utilisés pour pouvoir retrouver les coffrets concernés en cas de problème.',
  question: 'Quelle organisation vous donne une préparation fiable ?',
  options: ['Assembler au hasard et vérifier à la fin', 'Suivre une fiche par version, enregistrer les lots et contrôler les coffrets', 'Compter uniquement les cartons fermés'],
  correct: 1, domain: 'Produire', product: 'Oracle Fusion Cloud Manufacturing, Inventory Management et Quality Management',
  discussion: 'Si un lot est non conforme, comment retrouver les coffrets concernés ?',
  debrief: 'Une préparation structurée relie composants, lots, opérations et contrôles. Ce petit assemblage illustre les enjeux de la production, des stocks et de la qualité dans une entreprise.',
  ai: 'Une aide IA peut assister la recherche d’informations et l’analyse d’une anomalie. Les contrôles et la traçabilité fournissent les preuves.',
  source: 'https://www.oracle.com/scm/manufacturing/'
 },
 {
  title: 'Pouvez-vous accepter une demande supplémentaire ?',
  context: 'Les 80 coffrets sont déjà affectés aux participants inscrits. Une autre association vous demande 10 coffrets pour la même heure. Vous n’avez pas encore vérifié les composants ni le temps de préparation supplémentaire.',
  question: 'Que faites-vous avant de confirmer ?',
  options: ['Vérifier la disponibilité et la capacité, puis proposer une quantité et une date réalisables', 'Promettre les 10 coffrets immédiatement', 'Annuler 10 inscriptions existantes'],
  correct: 0, domain: 'Promettre', product: 'Oracle Fusion Cloud Order Management et Global Order Promising',
  discussion: 'Quelle différence faites-vous entre recevoir une demande et promettre une livraison ?',
  debrief: 'Une promesse doit tenir compte des stocks, des approvisionnements, des capacités et des engagements existants. Order Management orchestre les commandes ; Global Order Promising aide à déterminer une promesse réalisable.',
  ai: 'Une aide IA peut faciliter l’analyse et l’explication des options. La confirmation doit respecter les engagements et les règles de priorité.',
  source: 'https://www.oracle.com/scm/order-management/'
 },
 {
  title: 'Comment faites-vous arriver les coffrets à l’heure ?',
  context: 'Les 80 coffrets sont prêts. Ils doivent arriver sur le lieu de la soirée avant 19 h. Un incident bloque l’itinéraire prévu. Le conducteur attend une consigne et le lieu de réception doit être prévenu.',
  question: 'Quelle réaction protège le mieux la livraison ?',
  options: ['Attendre sans informer le destinataire', 'Expédier sans vérifier l’heure d’arrivée', 'Recalculer le transport, vérifier l’arrivée et informer le lieu de réception'],
  correct: 2, domain: 'Livrer', product: 'Oracle Fusion Cloud Logistics — Transportation Management et Warehouse Management',
  discussion: 'Qui doit connaître la nouvelle heure d’arrivée ? Quelles décisions nécessitent une validation ?',
  debrief: 'La logistique relie préparation, expédition, transport et réception. Adapter le plan implique de partager une nouvelle heure d’arrivée et de valider les éventuels surcoûts.',
  ai: 'Une aide IA peut faciliter l’analyse d’un incident et la coordination. Toute action reste soumise aux droits et aux limites de coût définis.',
  source: 'https://www.oracle.com/scm/logistics/'
 }
];
export function quizFor(game) {
 return game === 'scm'
  ? {id:'scm', title:'Mission : 80 coffrets', questions:SCM_QUESTIONS}
  : {id:'beaujolais', title:'La soirée Beaujolais', questions:QUESTIONS};
}
