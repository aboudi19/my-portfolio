// Stable, sourced family descriptions. Keep version-specific claims here if added later.
export const MODELS = {
  gpt: {
    company: 'OPENAI / FAMILLE GPT',
    name: 'GPT',
    description:
      'Des modèles conçus pour traiter le langage et, selon la version, d’autres modalités. Ils alimentent des applications de conversation, d’analyse et de création.',
    details: {
      Type: 'Modèles de langage et modèles multimodaux',
      Capacités: 'Rédaction, explication, analyse, assistance au code',
      Modalités: 'Selon le modèle : texte, image et autres modalités',
      Usages: 'Apprentissage, création, programmation',
    },
    source: 'https://developers.openai.com/api/docs/models',
  },
  claude: {
    company: 'ANTHROPIC / FAMILLE CLAUDE',
    name: 'Claude',
    description:
      'Une famille de modèles conversationnels utilisée pour travailler sur du texte, des documents et du code. Certaines versions peuvent aussi analyser des images.',
    details: {
      Type: 'Modèles de langage avec capacités visuelles selon la version',
      Capacités: 'Synthèse, explication, analyse de documents, code',
      Modalités: 'Texte et images selon le modèle ; consulter la documentation',
      Usages: 'Étude, rédaction, analyse, développement',
    },
    source: 'https://platform.claude.com/docs/en/about-claude/models/overview',
  },
  gemini: {
    company: 'GOOGLE / FAMILLE GEMINI',
    name: 'Gemini',
    description:
      'Une famille de modèles multimodaux conçue pour mettre en relation plusieurs types d’information. Les entrées et sorties disponibles dépendent du modèle choisi.',
    details: {
      Type: 'Modèles multimodaux',
      Capacités: 'Analyse de contenu, rédaction, assistance au code',
      Modalités: 'Texte, image, audio ou vidéo selon le modèle',
      Usages: 'Compréhension de médias, apprentissage, création',
    },
    source: 'https://ai.google.dev/gemini-api/docs/models',
  },
};
export const TIMELINE = [
  {
    year: '1950',
    title: 'La question de Turing',
    text: 'Alan Turing publie « Computing Machinery and Intelligence » et propose le jeu de l’imitation.',
    source: 'https://doi.org/10.1093/mind/LIX.236.433',
  },
  {
    year: '1956',
    title: 'Un domaine prend un nom',
    text: 'L’atelier de Dartmouth contribue à établir l’intelligence artificielle comme domaine de recherche. Le terme apparaît dans la proposition de 1955.',
    source: 'https://ai.dartmouth.edu/our-story',
  },
  {
    year: '1997',
    title: 'L’échiquier bascule',
    text: 'Deep Blue, conçu par IBM, remporte un match contre le champion du monde Garry Kasparov.',
    source: 'https://www.ibm.com/history/deep-blue',
  },
  {
    year: '2012',
    title: 'Le tournant du deep learning',
    text: 'AlexNet montre l’efficacité des réseaux profonds pour la reconnaissance d’images à grande échelle.',
    source: 'https://www.cs.toronto.edu/~hinton/absps/imagenet.pdf',
  },
  {
    year: '2017',
    title: 'L’attention change l’architecture',
    text: '« Attention Is All You Need » introduit le Transformer, une architecture devenue centrale pour les modèles de langage.',
    source: 'https://arxiv.org/abs/1706.03762',
  },
  {
    year: '2022',
    title: 'L’IA entre dans la conversation',
    text: 'La présentation publique de ChatGPT contribue à populariser l’interaction avec l’IA générative.',
    source: 'https://openai.com/index/chatgpt/',
  },
  {
    year: '2023–26',
    title: 'Vers plusieurs modalités',
    text: 'Des modèles combinent texte et autres médias. Les systèmes à outils et agents ouvrent des usages qui nécessitent une supervision.',
    source: 'https://ai.google.dev/gemini-api/docs',
  },
];
export const STAGES = [
  'Tout commence par des exemples : textes, images, sons ou mesures. Leur qualité influence le résultat.',
  'Le modèle traite les exemples et ajuste ses paramètres pour réduire une erreur ou atteindre un objectif.',
  'Les paramètres appris forment un modèle : une fonction qui transforme de nouvelles entrées.',
  'Le modèle prédit une catégorie, une valeur ou génère un contenu. Son résultat doit être évalué.',
];
export const MODALITIES = {
  texte: 'Texte : résumer un document, reformuler une idée ou expliquer un concept.',
  image:
    'Image : décrire une scène ou identifier des éléments visibles. Une interprétation peut être erronée.',
  audio: 'Audio : transcrire la parole ou analyser un son, selon les capacités du modèle.',
  video: 'Vidéo : analyser des images successives et parfois leur bande sonore pour décrire une séquence.',
  code: 'Code : expliquer un programme, proposer une correction ou générer une fonction. Le résultat doit être testé.',
};
