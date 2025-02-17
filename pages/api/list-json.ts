// pages/api/list-json.ts
import { promises as fs } from 'fs';
import path from 'path';

async function traverse(dir: string, baseDir: string) {
  const dirents = await fs.readdir(dir, { withFileTypes: true });
  const items = await Promise.all(
    dirents.map(async (dirent) => {
      const fullPath = path.join(dir, dirent.name);
      // Pour obtenir un chemin relatif compatible avec l'URL, on remplace les séparateurs
      const relativePath = path.relative(baseDir, fullPath).split(path.sep).join('/');
      if (dirent.isDirectory()) {
        return {
          type: 'directory',
          name: dirent.name,
          path: relativePath,
          children: await traverse(fullPath, baseDir)
        };
      } else if (dirent.isFile() && dirent.name.endsWith('.json')) {
        return {
          type: 'file',
          name: dirent.name,
          path: `/files/exercices/${relativePath}`
        };
      }
      return null;
    })
  );
  return items.filter(Boolean);
}

export default async function handler(req, res) {
  try {
    const baseDir = path.join(process.cwd(), 'public', 'files', 'exercices');
    const tree = await traverse(baseDir, baseDir);
    res.status(200).json(tree);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erreur lors de la lecture du répertoire' });
  }
}
