import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

// Définir les types pour la réponse
type ResponseData = {
  [key: string]: any;  // Les données JSON chargées
} | {
  error: string;  // Message d'erreur
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ResponseData>
) {
  // Vérifier la méthode HTTP
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Récupérer le chemin du fichier depuis la requête
  const { path: filePath } = req.body;
  
  if (!filePath) {
    return res.status(400).json({ error: 'Chemin du fichier non spécifié' });
  }

  try {
    // Construire le chemin complet vers le répertoire des exercices
    // Adaptez le chemin selon la structure de votre projet
    const exercisesDir = path.join(process.cwd(), 'public', 'files', 'exercices');
    const fullPath = path.join(exercisesDir, filePath);

    // Vérifier que le chemin est sécurisé (pour éviter path traversal attacks)
    const relativePath = path.relative(exercisesDir, fullPath);
    if (relativePath.startsWith('..') || path.isAbsolute(relativePath)) {
      return res.status(403).json({ error: 'Accès au fichier non autorisé' });
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Fichier non trouvé' });
    }

    // Lire et parser le contenu du fichier
    const fileContent = fs.readFileSync(fullPath, 'utf8');
    const jsonData = JSON.parse(fileContent);

    // Renvoyer les données
    return res.status(200).json(jsonData);
  } catch (error) {
    console.error('Erreur lors du chargement du fichier:', error);
    return res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Erreur interne du serveur' 
    });
  }
}