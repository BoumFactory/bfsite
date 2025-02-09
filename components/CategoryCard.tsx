import React from "react";
import Link from "next/link";
import { usePageTitle } from "./PageTitleContext"; // ajustez le chemin si nécessaire

interface ResourceCardProps {
  title: string;
  desc: string;
  path: string;
}

const ResourceCard: React.FC<ResourceCardProps> = ({ title, desc, path }) => {
  const { setPageTitle } = usePageTitle();

  const handleClick = () => {
    // Met à jour le titre global affiché dans le header
    setPageTitle(title);
  };

  return (
    <div className="bg-white shadow-md p-6 rounded-lg transform transition duration-300 hover:scale-105 hover:shadow-xl relative">
      <h2 className="text-xl font-semibold mb-2">{title}</h2>
      <p className="text-gray-600 mb-4">{desc}</p>
      <Link href={`/resources/${path}`} legacyBehavior>
        <a
          onClick={handleClick}
          className="text-blue-600 mt-2 block relative group transition duration-300 hover:underline"
        >
          Voir les Ressources
          <span className="pointer-events-none absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Accéder aux ressources de {title}
          </span>
        </a>
      </Link>
    </div>
  );
};

export default ResourceCard;
