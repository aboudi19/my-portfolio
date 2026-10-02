# Configuration Supabase — IA Lab

Les fichiers sont prêts ; aucun projet distant n’a été créé ou déployé sans vos identifiants. Le site fonctionne déjà avec `npm start` en mode pédagogique local.

## 1. Créer un projet

Créer un projet dans [Supabase](https://supabase.com/dashboard). Conserver le mot de passe de base de données dans votre gestionnaire de mots de passe.

Dans **Authentication → Sign In / Providers**, activer **Anonymous Sign-Ins**. La fonction `demo-login` vérifie le code scolaire côté serveur avant de créer une session anonyme. Les comptes anonymes possèdent un JWT et le rôle `authenticated` ; la clé anon seule n’est pas une session utilisateur.

Pour une exposition locale supervisée, l’exemple utilise la connexion anonyme sans CAPTCHA. Un projet où la protection CAPTCHA est activée doit ajouter la collecte d’un token CAPTCHA et sa transmission à Auth, ou employer une authentification permanente. L’intégration CAPTCHA n’est pas incluse.

## 2. Exécuter le SQL

Dans **SQL Editor**, exécuter entièrement `supabase-setup.sql` en tant qu’administrateur du projet.

Il crée :

- `public.profiles`, `public.ai_conversations`, `public.ai_messages`.
- Les politiques RLS : chaque utilisateur ne lit que son profil et ses conversations/messages. Il peut modifier son nom et supprimer ses conversations.
- `private.demo_access`, qui matérialise l’accès scolaire pour 12 heures.
- `private.request_events`, pour des limites persistantes et atomiques.
- Les RPC `register_demo_user`, `consume_demo_login`, `consume_ai_quota` et `save_chat_turn`.

Les fonctions de connexion et d’autorisation scolaire sont réservées à la service-role côté serveur. Créer directement un compte anonyme ne donne pas accès à l’API IA : `consume_ai_quota` exige l’autorisation délivrée par `demo-login`. Le RPC de sauvegarde vérifie le propriétaire et insère les deux messages dans une transaction.

## 3. Récupérer URL + clé publique

Dans les paramètres du projet, copier l’URL et la **clé publique anon JWT**. Ne pas copier la service-role dans le frontend. Cet exemple utilise les variables intégrées `SUPABASE_ANON_KEY` et `SUPABASE_SERVICE_ROLE_KEY` des Edge Functions ; une clé anon legacy est le choix compatible avec cette configuration.

## 4. Configurer les variables

Pour utiliser le serveur Node local :

```bash
cp .env.example .env
```

Renseigner `SUPABASE_URL` et `SUPABASE_ANON_KEY`. Ne les activer qu’après le déploiement des deux fonctions.

Pour un site statique : modifier `js/config.js`, en remplaçant les chaînes vides par l’URL Supabase et la clé publique anon. `teamName` reste une donnée publique. **Ne jamais ajouter `AI_API_KEY`, `DEMO_PASSWORD` ni `SUPABASE_SERVICE_ROLE_KEY` dans ce fichier.**

## 5. Déployer les Edge Functions

Utiliser la CLI Supabase via npx depuis la racine Myportfolio :

```bash
npx supabase login
npx supabase link --project-ref VOTRE_PROJECT_REF
npx supabase functions deploy demo-login
npx supabase functions deploy ai-chat
```

`supabase/config.toml` désactive la vérification JWT au niveau du proxy pour les deux fonctions. `demo-login` est publique, mais soumise au code et aux limites. **`ai-chat` vérifie explicitement le Bearer JWT avec Supabase Auth avant de lire les données, de consommer le quota ou de contacter le fournisseur.** Ne retirer cette validation ni la vérification d’accès dans le SQL.

## 6. Ajouter les secrets

Dans **Edge Functions → Secrets**, ajouter :

| Secret | Exemple / usage |
|---|---|
| `DEMO_PASSWORD` | `project ai`, pour la démonstration |
| `AI_PROVIDER` | `openai`, `anthropic` ou `gemini` |
| `AI_MODEL` | Nom exact d’un modèle autorisé dans votre compte |
| `AI_API_KEY` | Clé secrète du fournisseur |
| `ALLOWED_ORIGINS` | `http://localhost:4174,http://127.0.0.1:4174,https://votre-site.example` |

Utiliser le formulaire des secrets pour éviter de laisser une clé réelle dans l’historique du terminal. Supabase fournit automatiquement l’URL, la clé anon et la service-role aux Edge Functions. Aucune service-role n’est nécessaire dans votre `.env` local.

Les origines doivent être exactes, sans slash final. Si vous changez le port, ajouter cette origine à la liste. Les appels provenant d’une origine non autorisée sont rejetés ; les appels sans en-tête Origin restent possibles pour des tests serveur et sont soumis à l’authentification et aux quotas.

## 7. Tester

Redémarrer `npm start`, puis ouvrir `http://localhost:4174/login.html`.

1. Tester un code incorrect, puis `project ai` avec un nom.
2. Vérifier l’accueil personnalisé et poser une question au chat.
3. Dans **Table Editor**, vérifier la présence du profil, de la conversation et des deux messages.
4. Ouvrir une deuxième session dans un autre navigateur : elle ne doit pas lire les données de la première.
5. Vérifier que l’absence de JWT donne `401`, qu’un utilisateur anonyme sans accès scolaire ne peut pas utiliser l’IA, et qu’un identifiant de conversation d’un autre utilisateur donne `404`.
6. Vérifier que les fichiers publics et l’onglet Réseau ne contiennent aucune clé fournisseur ni service-role.

En cas d’erreur : consulter les logs des Edge Functions et vérifier Auth anonyme, SQL, secrets, origine, fournisseur et modèle. Les erreurs brutes du fournisseur ne sont pas renvoyées au navigateur.

## Limites et maintenance

Connexion : 10 tentatives par empreinte réseau en 10 minutes et 200 tentatives globales par heure. IA : 10 requêtes par utilisateur par minute, 100 par jour et 1 000 globales par heure. Les quotas sont conservés dans la base et utilisent des verrous transactionnels. Une demande qui échoue après réservation du quota reste comptabilisée.

Le code scolaire est partagé : ce n’est pas une sécurité de compte personnelle. Les tokens restent dans `sessionStorage` pour la durée de l’onglet et sont rafraîchis ; l’accès scolaire expire après 12 heures. Revenir à la connexion crée une nouvelle session anonyme. Les comptes et anciennes conversations restent en base jusqu’à leur suppression administrative ; prévoir une politique de conservation pour votre établissement.

Les conversations ne sont pas rechargées dans une liste d’historique après fermeture de l’onglet. Elles sont bien sauvegardées dans Supabase ; l’interface présente la conversation en cours. Sans connexion de votre projet, les politiques SQL et l’appel réel au fournisseur ne peuvent pas être validés de bout en bout.

Documentation : [Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous), [RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Edge Function Auth](https://supabase.com/docs/guides/functions/auth).
