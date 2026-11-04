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
