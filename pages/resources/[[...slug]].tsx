import React, { useEffect, useState } from "react";
import { GetStaticPaths, GetStaticProps } from "next";
import fs from "fs";
import path from "path";
import Link from "next/link";
import ResourceCard from "../../components/ResourceCard";
import { useUpdatePageTitle } from "../../hooks/useUpdatePageTitle";

interface ResourceItem {
  name: string;
  isDirectory: boolean;
}

interface ResourcesPageProps {
  slug: string[];
  items: ResourceItem[];
}

const ResourcesPage: React.FC<ResourcesPageProps> = ({ slug, items }) => {
  useUpdatePageTitle("Ressources");
  
  const breadcrumbs = slug.map((folder, index) => {
    const href = `/resources/${slug.slice(0, index + 1).join("/")}`;
    return { name: folder, href };
  });

  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Vérifier l'authentification au chargement
    const checkAuth = async () => {
      const res = await fetch("/api/check-auth");
      const data = await res.json();
      setIsAuthenticated(data.isAuthenticated);
    };
    checkAuth();
  }, []);

  const handleDownload = async () => {
    const folderPath = slug.join("/");
    const response = await fetch(`/api/download?path=${encodeURIComponent(folderPath)}`);

    if (!response.ok) {
      alert("Erreur lors du téléchargement.");
      return;
    }
    const blob = await response.blob();
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${slug[slug.length - 1] || "ressources"}.zip`; // Nom du fichier ZIP basé sur le dernier dossier
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Fil d’Ariane cliquable */}
      <nav className="mb-4 text-sm text-gray-600">
        <Link href="/resources" className="hover:underline">Files</Link>
        {breadcrumbs.map((crumb, index) => (
          <span key={index}>
            {" > "}
            <Link href={crumb.href} className="hover:underline">{crumb.name}</Link>
          </span>
        ))}
      </nav>

      {/* Bouton de téléchargement (uniquement si l'utilisateur est connecté) */}
      {isAuthenticated && (
        <button 
          onClick={handleDownload} 
          className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition mb-4"
        >
          📥 Télécharger ce dossier
        </button>
      )}

      {/* Liste des fichiers et dossiers */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items
          .filter(item => 
            !/^bfpoints/i.test(item.name) &&
            !/\.(comp|voc|aux|log|out|synctex\.gz|toc|fdb_latexmk|fls|pdfsync|bbl|blg|lof|lot|nav|snm|vrb|dvi|ilg|ind|idx|synctex|synctex\.busy)$/i.test(item.name)
          )
          .map((item) =>
            item.isDirectory ? (
              <div key={item.name} className="bg-gray-100 p-4 rounded hover:bg-gray-200 transition">
                <ResourceCard
                  key={item.name}
                  fileName={item.name}
                  description="Aucune description disponible"
                  categories={slug}
                  link={`/resources/${[...slug, item.name].join("/")}`}
                />
              </div>
            ) : (
              <ResourceCard
                key={item.name}
                fileName={item.name}
                description="Aucune description disponible"
                categories={slug}
                link={`/files/${[...slug, item.name].join("/")}`}
              />
            )
        )}
      </div>
    </div>
  );
};

export const getStaticPaths: GetStaticPaths = async () => {
  return {
    paths: [],
    fallback: "blocking",
  };
};

export const getStaticProps: GetStaticProps<ResourcesPageProps> = async ({ params }) => {
  const slug = (params?.slug as string[]) || [];
  const directoryPath = path.join(process.cwd(), "public", "files", ...slug);

  let items: ResourceItem[] = [];
  try {
    const files = fs.readdirSync(directoryPath);
    items = files.map((name) => {
      const fullPath = path.join(directoryPath, name);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      return { name, isDirectory };
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du dossier :", error);
    return { notFound: true };
  }

  return {
    props: {
      slug,
      items,
    },
  };
};

export default ResourcesPage;
