// pages/resources/index.tsx
import React from "react";
import { GetStaticProps } from "next";
import path from "path";
import fs from "fs";
import ResourceCard from "../../components/ResourceCard";
import { useUpdatePageTitle } from "../../hooks/useUpdatePageTitle";

interface FileResource {
  fileName: string;
  description: string;
}

interface ResourcesPageProps {
  resources: FileResource[];
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ resources }) => {

  return (
    <div className="container mx-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {resources.map((resource) => (
          <ResourceCard
            key={resource.fileName}
            fileName={resource.fileName}
            description={resource.description}
          />
        ))}
      </div>
    </div>
  );
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async () => {
  // Chemin vers le dossier public/files
  const filesDirectory = path.join(process.cwd(), "public", "files");

  let fileNames: string[] = [];
  try {
    fileNames = fs.readdirSync(filesDirectory);
  } catch (error) {
    console.error("Erreur lors de la lecture du dossier files :", error);
  }

  // Construire le tableau des ressources
  const resources: FileResource[] = fileNames
    // Exclure metadata.json lui-même
    .filter((fileName) => fileName !== "metadata.json")
    .map((fileName) => ({
      fileName,
      description: "Aucune description disponible",
    }));

  return {
    props: {
      resources,
    },
  };
};

export default ResourcesPage;
