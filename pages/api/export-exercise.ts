import { promises as fs } from 'fs';
import path from 'path';
import { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Méthode non autorisée' });
    return;
  }
  const { json, filename } = req.body;
  if (!json || !filename) {
    res.status(400).json({ error: 'JSON et filename sont requis' });
    return;
  }
  try {
    // Définir le chemin de destination (par exemple dans public/files/exercices)
    const destDir = path.join(process.cwd(), 'public', 'files', 'exercices');
    // Créer le dossier s'il n'existe pas
    const parentDir=path.dirname(path.join(destDir, filename))
    await fs.mkdir(parentDir, { recursive: true });
    const filePath = path.join(destDir, filename);
    
    console.log(filePath)
    await fs.writeFile(filePath, json, 'utf8');
    // Retourner le chemin relatif pour être utilisé par le client
    const relativePath = `/files/exercices/${filename}`;
    res.status(200).json({ path: relativePath });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur f lors de l\'exportation' });
  }
}
