// pages/api/search.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import fs from 'fs';
import path from 'path';

interface SearchResult {
  fileName: string;
  categories: string[];
  relevance: number;
}

// Fonction qui parcourt récursivement un dossier pour récupérer les fichiers recherchables
function getFilesRecursively(directory: string, relativePath: string[] = []): { fileName: string, categories: string[] }[] {
  let results: { fileName: string, categories: string[] }[] = [];
  const items = fs.readdirSync(directory);
  for (const item of items) {
    const fullPath = path.join(directory, item);
    const stats = fs.statSync(fullPath);
    if (stats.isDirectory()) {
      results = results.concat(getFilesRecursively(fullPath, [...relativePath, item]));
    } else {
      // On ne traite ici que les fichiers .pdf et .tex
      if (item.endsWith('.pdf') || item.endsWith('.tex')) {
        results.push({ fileName: item, categories: relativePath });
      }
    }
  }
  return results;
}

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { q } = req.query;
  if (!q || typeof q !== 'string') {
    return res.status(400).json({ error: 'Le paramètre "q" est requis.' });
  }

  // On découpe la requête en mots (en minuscule)
  const searchWords = q.toLowerCase().split(/\s+/).filter(word => word.trim() !== '');

  // On définit le répertoire de base
  const baseDirectory = path.join(process.cwd(), 'public', 'files');
  const allFiles = getFilesRecursively(baseDirectory);

  // Pour chaque fichier, on calcule la pertinence (nombre de correspondances dans le nom du fichier et dans les catégories)
  const results: SearchResult[] = allFiles.map(file => {
    let relevance = 0;
    const fileNameLower = file.fileName.toLowerCase();
    for (const word of searchWords) {
      if (fileNameLower.includes(word)) {
        relevance++;
      }
    }
    for (const category of file.categories) {
      const categoryLower = category.toLowerCase();
      for (const word of searchWords) {
        if (categoryLower.includes(word)) {
          relevance++;
        }
      }
    }
    return {
      fileName: file.fileName,
      categories: file.categories,
      relevance
    };
  }).filter(result => result.relevance > 0);

  // Tri par pertinence décroissante
  results.sort((a, b) => b.relevance - a.relevance);
  res.status(200).json({ results });
}
