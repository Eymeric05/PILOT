# Planning Dépenses

Application web PWA de gestion de budget mensuel partagé pour deux personnes.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS + shadcn/ui
- **Icônes**: Lucide React
- **Base de données**: Supabase
- **Hébergement**: Vercel

## Configuration

1. Installer les dépendances :
```bash
npm install
```

2. Configurer les variables d'environnement :
```bash
cp .env.example .env
# Éditer .env avec vos propres valeurs
```

3. Lancer le serveur de développement :
```bash
npm run dev
```

## Structure du Projet

- `/app` - Pages et routes Next.js (App Router)
- `/components` - Composants React réutilisables
- `/lib` - Utilitaires et helpers
- `/types` - Types TypeScript
- `/public` - Fichiers statiques (manifest, icons)

## Fonctionnalités

- Gestion des dépenses mensuelles
- Partage de dépenses entre deux utilisateurs
- Catégorisation des dépenses
- Récupération automatique de logos
- Interface mobile-first optimisée
- PWA (Progressive Web App) installable sur mobile

## Schéma de Base de Données

Le schéma inclut trois tables principales :

- **users** : Gestion des deux utilisateurs (user1, user2)
- **categories** : Catégories de dépenses
- **expenses** : Dépenses avec support du partage (is_shared)

## Design System

- Palette monochrome (Noir/Blanc/Gris) avec accent bleu nuit
- Police : Inter
- Touch targets minimum : 44px
- Mobile-first avec Drawers sur mobile (au lieu de modales)
- Style Swiss/Flat Design minimaliste

## Dépannage OAuth (Google)

Si vous rencontrez l'erreur "Unable to exchange external code" lors de la connexion avec Google :

### 1. Vérifier l'URL de redirection dans Supabase

1. Allez dans votre dashboard Supabase
2. Naviguez vers **Authentication** > **URL Configuration**
3. Dans **Redirect URLs**, ajoutez exactement :
   - Pour la production : `https://votre-domaine.com/auth/callback`
   - Pour le développement : `http://localhost:3000/auth/callback`
4. Assurez-vous que l'URL correspond **exactement** (sans slash final, avec le bon protocole)

### 2. Vérifier la configuration Google OAuth

1. Dans Supabase : **Authentication** > **Providers** > **Google**
2. Vérifiez que :
   - Le **Client ID** est correct
   - Le **Client Secret** est correct
   - Le provider est **activé**

### 3. Vérifier Google Cloud Console

1. Allez sur [Google Cloud Console](https://console.cloud.google.com/)
2. Sélectionnez votre projet
3. Allez dans **APIs & Services** > **Credentials**
4. Ouvrez votre OAuth 2.0 Client ID
5. Dans **Authorized redirect URIs**, ajoutez :
   - `https://[votre-projet-supabase].supabase.co/auth/v1/callback`
   - Cette URL est fournie par Supabase dans la configuration du provider

### 4. Vérifier les variables d'environnement

Assurez-vous que vos variables d'environnement sont correctement configurées :
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` (legacy) **ou** `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` (recommandé)
