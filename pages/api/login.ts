import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { serialize } from "cookie";

/*TODO:
Connecter aux pages de connection. 
Modifier pour collecter le nom mot de passe et mail. 
Faire un module qui gère l'envoie test d'un mail s'il correspond aux exigences des mails académiques. 
Implémenter la logique de la connection.
*/
const SECRET_KEY = "supersecretkey"; // 🔒 À stocker dans une variable d'environnement

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Méthode non autorisée" });
  }

  const { username, password } = req.body;

  // ✅ Vérification basique : remplacez par un système plus robuste (BDD)
  if (username === "admin" && password === "password123") {
    // Générer un JWT
    const token = jwt.sign({ username }, SECRET_KEY, { expiresIn: "1h" });

    // Stocker le token dans un cookie HTTP sécurisé
    res.setHeader("Set-Cookie", serialize("authToken", token, {
      httpOnly: true, // Empêche l'accès via JS
      secure: process.env.NODE_ENV === "production", // Activé uniquement en prod
      sameSite: "strict",
      path: "/"
    }));

    return res.status(200).json({ message: "Connexion réussie !" });
  }

  return res.status(401).json({ error: "Identifiants incorrects" });
}
