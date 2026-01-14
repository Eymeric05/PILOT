# Planning Dépenses

Application web PWA de gestion de budget mensuel partagé pour deux personnes.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Langage**: TypeScript
- **Styles**: Tailwind CSS + shadcn/ui
- **Icônes**: Lucide React
- **Base de données**: PostgreSQL avec Drizzle ORM
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

3. Générer les migrations de base de données :
```bash
npm run db:generate
npm run db:migrate
```

4. Lancer le serveur de développement :
```bash
npm run dev
```

## Structure du Projet

- `/app` - Pages et routes Next.js (App Router)
- `/components` - Composants React réutilisables
- `/db` - Schéma et configuration Drizzle ORM
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
