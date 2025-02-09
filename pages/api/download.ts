import { NextApiRequest, NextApiResponse } from "next";
import archiver from "archiver";
import fs from "fs";
import path from "path";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const { path: folderPath } = req.query;

  if (!folderPath || typeof folderPath !== "string") {
    return res.status(400).json({ error: "Le chemin du dossier est requis." });
  }

  const fullPath = path.join(process.cwd(), "public", "files", folderPath);

  if (!fs.existsSync(fullPath) || !fs.statSync(fullPath).isDirectory()) {
    return res.status(404).json({ error: "Le dossier spécifié n'existe pas." });
  }

  res.setHeader("Content-Disposition", `attachment; filename="${folderPath.split("/").pop()}.zip"`);
  res.setHeader("Content-Type", "application/zip");

  const archive = archiver("zip", { zlib: { level: 9 } });
  archive.directory(fullPath, false);
  archive.pipe(res);

  archive.finalize();
}
