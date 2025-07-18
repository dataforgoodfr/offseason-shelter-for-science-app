# Shelter for Science - Desktop Client

## À propos du projet

Shelter for Science App est un projet de TeamForChange qui vise à créer un client décentralisé permettant aux bénévoles de partager des données environnementales via le protocole torrent. L'application transforme les ordinateurs individuels en nœuds de stockage autonomes dans un réseau peer-to-peer.

## Architecture du repository

Ce repository se compose de deux parties principales :

### 1. Application Client Electron
- **Stack technique** : Electron + Vite + React + TypeScript + Tailwind CSS
- **Boilerplate** : Initialisé avec le boiler-plate [electron-app](https://github.com/daltonmenezes/electron-app)
- **Fonction** : Interface utilisateur cross-platform (Windows, macOS, Linux) pour gérer le stockage et les transferts P2P

### 2. Mock Dispatcher
- **Dossier** : `mock-dispatcher/`
- **Stack technique** : NestJS
- **Fonction** : Serveur de test qui remplace le dispatcher principal pour le développement local

## Installation et démarrage

### Application Electron

```bash
# Configuration
cp .env.example .env  # Port API par défaut : 3000

# Installation des dépendances
pnpm install

# Démarrage en mode développement
pnpm run dev
```

### Serveur mock-dispatcher

```bash
# Dans le dossier mock-dispatcher/
cd mock-dispatcher/

# Installation des dépendances
pnpm install

# Démarrage du serveur de développement
pnpm run start:dev
```

## Configuration

Le fichier .env contient les variables d'environnement nécessaires, notamment :
- Port de l'API dispatcher (par défaut : 3000)


