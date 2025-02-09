import { NextApiRequest, NextApiResponse } from "next";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const publicFilesPath = path.join(process.cwd(), "public", "files");
  const categories = fs.readdirSync(publicFilesPath);

  let latestFile = null;
  let latestTime = 0;

  categories.forEach((category) => {
    const categoryPath = path.join(publicFilesPath, category);
    if (fs.lstatSync(categoryPath).isDirectory()) {
      const files = fs.readdirSync(categoryPath);
      files.forEach((file) => {
        const filePath = path.join(categoryPath, file);
        const fileStat = fs.statSync(filePath);
        if (fileStat.mtimeMs > latestTime) {
          latestTime = fileStat.mtimeMs;
          latestFile = { title: file, desc: `Nouveau fichier ajouté dans ${category}`, image: "/file.svg" };
        }
      });
    }
  });

  res.status(200).json(latestFile || { title: "Aucune mise à jour", desc: "", image: "/file.svg" });
}
