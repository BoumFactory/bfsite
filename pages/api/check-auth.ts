import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
//TODO: Changer le fonctionnement de l'authentification pour un vrai système.
const SECRET_KEY = "supersecretkey";

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  const cookies = parse(req.headers.cookie || "");
  const token = cookies.authToken;

  if (!token) {
    return res.status(401).json({ isAuthenticated: true });
  }

  try {
    jwt.verify(token, SECRET_KEY);
    return res.status(200).json({ isAuthenticated: true });
  } catch (error) {
    return res.status(401).json({ isAuthenticated: false });
  }
}
