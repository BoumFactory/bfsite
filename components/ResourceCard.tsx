// components/ResourceCard.tsx
import React from "react";
import Link from "next/link";

interface ResourceCardProps {
  fileName: string;
  description: string;
  /** Tableau des répertoires (catégories) menant au fichier. Par exemple : ["college", "math"] */
  categories?: string[];
  link?: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ fileName, description, categories = [], link=""}) => {
  // Détermine l'icône en fonction de l'extension du fichier
  const extension = fileName.split(".").pop()?.toLowerCase();
  const isFile = fileName.endsWith(".pdf") || fileName.endsWith(".tex");

  let icon;
  if (extension === "pdf") {
    icon = "📄"; // Vous pouvez remplacer par un SVG ou une icône customisée
  } else if (extension === "tex") {
    icon = "📝";
  } else {
    icon = "📁";
  }

  // Construit le chemin complet vers le fichier en tenant compte des catégories
  const fullPath =
    categories.length > 0
      ? `/files/${categories.join("/")}/${fileName}`
      : `/files/${fileName}`;

  return (
    <div className="bg-white shadow-md p-4 rounded-lg hover:shadow-xl transition duration-300">
      <div className="flex items-center mb-2">
        <span className="text-3xl mr-2">{icon}</span>
        <h2 className="text-xl font-bold break-words truncate w-full">
          {fileName}
        </h2>
      </div>
      {categories.length > 0 && (
        <div className="text-sm text-gray-500 mb-2">
          {/* Affichage sous forme de fil d'Ariane */}
          {categories.join(" > ")}
        </div>
      )}
      <p className="text-gray-600 mb-4">{description}</p>
      <Link
        href={link}
        target={isFile ? "_blank" : undefined}
        rel={isFile ? "noopener noreferrer" : undefined}
        className="text-blue-600 hover:underline"
      >
        Voir {isFile ? "le document" : "le dossier"}
      </Link>
    </div>
  );
};

export default ResourceCard;
