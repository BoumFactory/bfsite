# Site de Ressources Pédagogiques

Ce projet est un site web destiné aux enseignants de mathématiques pour partager des ressources.

## Installation

1. Clonez ce dépôt :
   
   git clone https://github.com/BoumFactory/bfsite.git
   
2. Accédez au dossier :
   
   cd bfsite
   
3. Installez les dépendances :
   
   npm install
   
4. Démarrez le projet en local :
   
   npm run dev

Le site sera accessible à [http://localhost:3000](http://localhost:3000)

## Pour les devs

# Script permettant d'afficher la structure du projet (dans bfsite) : 
.\dev_tools\listing_activities.ps1

# Script permettant d'afficher la liste de TODOS (dans bfsite) : 
python dev_tools/find_todos.py

# Script permettant d'indexer les fichiers de public/files et de générer le json qui contientra ses tags : 
python dev_tools/indexing_public_files.py

cela générera l'indexation dans le fichier de sortie : pages\files_index.json