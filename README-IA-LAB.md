> The educational experience is preserved at **ai-lab.html**. The public **index.html** is now the personal portfolio. Login continues to work and redirects to the lab.

# IA — Comprendre. Explorer. Expérimenter.

Le dossier **Myportfolio** contient désormais une exposition pédagogique en français sur l’intelligence artificielle. HTML, CSS et JavaScript ES modules, sans framework ni dépendance de production. Le serveur local utilise les modules natifs de Node.js.

## Démarrer

Prérequis : Node.js 20 ou supérieur. Aucune installation npm n’est nécessaire.

```bash
cd "/Users/abderrahmenehamza/Documents/projects/Myportfolio"
npm start
```

Ouvrir **http://localhost:4174/login.html**. Saisir un nom et le code scolaire **`project ai`**. La validation est réalisée côté serveur. Le code partagé est une démonstration, pas un système d’authentification pour un service public.

Si le port est déjà utilisé : `PORT=4175 npm start`. Pour le rechargement du serveur après modification : `npm run dev`. Ne pas ouvrir les fichiers avec `file://` ; les modules ES et les API ont besoin d’un serveur HTTP.

## Ce qui fonctionne immédiatement

- Connexion, validation, affichage du prénom et déconnexion.
- Hero avec sphère de particules projetée en profondeur et réponse au pointeur.
- Parcours pédagogique, pipeline sélectionnable, glossaire dépliant.
- Réseau neuronal interactif, réglage du signal et propagation animée.
- Séquence d’apprentissage, numéro d’étape lié au scroll, timeline horizontale.
- Onglets GPT / Claude / Gemini accessibles au clavier, modalités interactives.
- Chat avec suggestions, indicateur de préparation, apparition progressive, annulation, erreurs et nouvelle conversation.
- Navigation mobile, focus visible, liens d’évitement, annonces accessibles et réduction des mouvements.
- Logos provisoires locaux, aucune police ou bibliothèque chargée depuis un CDN.

**Sans clé API, le chat est explicitement en mode pédagogique : les réponses sont rédigées à l’avance.** Ce mode n’est pas une IA générative. Les sessions et conversations locales sont gardées en mémoire, pendant 12 heures au maximum, et disparaissent au redémarrage du serveur.

## Activer un fournisseur IA local

```bash
cp .env.example .env
```

Dans `.env`, définir `AI_PROVIDER`, `AI_MODEL` et `AI_API_KEY`, puis redémarrer le serveur. Choisir un identifiant de modèle disponible dans votre compte. Il n’y a pas de version « dernière » codée en dur.

| Variable            | Valeur / usage                                                                |
| ------------------- | ----------------------------------------------------------------------------- |
| `AI_PROVIDER`       | `openai`, `anthropic` ou `gemini`                                             |
| `AI_MODEL`          | Identifiant exact d’un modèle de votre fournisseur                            |
| `AI_API_KEY`        | Clé du fournisseur, uniquement côté serveur                                   |
| `DEMO_PASSWORD`     | Code de démonstration ; défaut local `project ai`                             |
| `TEAM_NAME`         | Nom de l’équipe dans la conclusion                                            |
| `PORT`              | Défaut `4174`                                                                 |
| `HOST`              | Défaut `127.0.0.1`                                                            |
| `SUPABASE_URL`      | URL du projet, facultative pour le mode local                                 |
| `SUPABASE_ANON_KEY` | Clé publique anon, jamais la service-role                                     |
| `ALLOWED_ORIGINS`   | Origines exactes autorisées par les Edge Functions, séparées par des virgules |
| `APP_ORIGIN`        | Origine HTTPS autorisée si le serveur Node est hébergé                        |
| `COOKIE_SECURE`     | `true` pour un serveur Node servi en HTTPS                                    |

Le navigateur appelle `/api/ai-chat`. Le serveur utilise OpenAI Responses, Anthropic Messages ou Gemini generateContent. Il transmet au maximum les douze derniers messages et la question courante. Les erreurs du fournisseur sont remplacées par des messages sans secret. Limite de question : 1 500 caractères ; sortie affichée : 5 000 caractères ; requête fournisseur : 45 secondes maximum.

## Supabase

Le mode Supabase ajoute des sessions Auth et une sauvegarde durable des profils, conversations et messages. Suivre **SUPABASE_SETUP.md** avant de renseigner les deux variables Supabase. Quand URL et clé publique sont configurées, le frontend utilise les Edge Functions déployées.

Pour un hébergement statique, configurer seulement les données publiques dans `js/config.js` : `supabaseUrl`, `supabaseAnonKey`, `teamName`. Les secrets restent dans Supabase. Publier `index.html`, `ai-lab.html`, `login.html`, `sources.html`, `css/`, `js/` et `assets/` uniquement. Ne jamais publier `.env`, le serveur, les tests ou des secrets de déploiement.

## Personnalisation

Remplacer `assets/logos/school-logo.png` et `assets/logos/team-logo.png` par des PNG transparents. Les images présentes sont des repères graphiques provisoires. Le nom de l’équipe se configure avec `TEAM_NAME` (local) ou `teamName` dans `js/config.js` (statique).

Les descriptions des modèles et la chronologie sont dans **js/data.js**. Chaque repère historique cite une source ; `sources.html` regroupe la documentation. Toute nouvelle caractéristique de version doit être vérifiée avec une source officielle. Aucun produit nommé « GPT-6 Astra » n’est présenté ici ; si vous ajoutez un concept non vérifié, indiquez explicitement « Concept / modèle futuriste présenté dans le cadre du projet ».

## Architecture finale

```text
Myportfolio/
├── index.html
├── login.html
├── sources.html
├── css/
│   ├── style.css
│   └── login.css
├── js/
│   ├── app.js
│   ├── animations.js
│   ├── ai.js
│   ├── auth.js
│   ├── supabase.js
│   ├── login.js
│   ├── config.js
│   └── data.js
├── assets/
│   ├── logos/       school-logo.png, team-logo.png, favicon.svg
│   └── images/      Images WebP du portfolio et captures du laboratoire
├── supabase/
│   ├── config.toml
│   └── functions/
│       ├── _shared/ ai.mjs, http.ts
│       ├── demo-login/index.ts
│       └── ai-chat/index.ts
├── server.mjs
├── supabase-setup.sql
├── .env.example
├── .gitignore
├── package.json
├── README.md
├── SUPABASE_SETUP.md
├── tests/          ai.test.mjs, server.test.mjs
└── tools/check.mjs
```

Les anciennes photographies JPEG sont conservées dans les archives externes. Le portfolio utilise leurs versions WebP optimisées. Les trois anciens fichiers HTML/CSS/JS ont été sauvegardés avant remplacement.

## Vérifier

```bash
npm test
npm run check
```

Les tests couvrent les validateurs, les adaptateurs des trois fournisseurs avec transports simulés, la confidentialité des erreurs, les cookies de session, les chemins statiques, les origines, les limites et l’isolation des conversations locales. La vérification contrôle la syntaxe JavaScript, les liens locaux, les identifiants HTML et l’absence de clé/code de connexion dans les fichiers frontend. Les anciens rapports de validation sont conservés dans les archives externes au projet.

## Ce que vous devez fournir

1. Les vrais logos et le nom de l’équipe.
2. Une clé API et un modèle accessible chez le fournisseur choisi pour la génération réelle.
3. Un projet Supabase si vous souhaitez la sauvegarde durable et l’hébergement statique.

Les scènes Canvas sont des illustrations, sans entraînement réel. Elles n’utilisent pas WebGL et fonctionnent donc sans GPU compatible WebGL. Le nombre de particules et leur résolution sont réduits sur mobile ; les animations s’arrêtent hors écran et quand la page est masquée. Les performances exactes dépendent de l’appareil. Le code d’accès partagé et les comptes anonymes conviennent à une exposition scolaire supervisée ; un déploiement public avec comptes permanents demande une authentification appropriée.
