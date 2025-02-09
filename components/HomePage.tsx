// components/HomePage.tsx
import React, { useEffect, useState } from "react";
import fs from "fs";
import path from "path";
import ResourceCard from "./CategoryCard";
import { useUpdatePageTitle } from "../hooks/useUpdatePageTitle";

const HomePage: React.FC = () => {
  // Utilise le hook pour mettre à jour le titre global dès le montage de la page
  useUpdatePageTitle("Accueil");

  const resources = [
    { title: "Collège", desc: "Ressources pour le collège", path: "college" },
    { title: "Lycée", desc: "Ressources pour le lycée", path: "lycee" },
    { title: "Enseignants", desc: "Ressources pour enseignants", path: "enseignants" },
    { title: "Logiciels", desc: "Ressources pour logiciels", path: "logiciels" },
  ];
  const [latestUpdate, setLatestUpdate] = useState<{ title: string; desc: string; image: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/latest-file")
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("Dernière actu reçue:", data);
        if (!data || !data.title) {
          setError("Aucune mise à jour disponible.");
          setLatestUpdate(null);
        } else {
          setLatestUpdate(data);
          setError(null);
        }
      })
      .catch(error => {
        console.error("Erreur lors du chargement de la dernière actu:", error);
        setError("Impossible de récupérer la dernière mise à jour.");
      });
  }, []);

  return (
    <div className="container mx-auto p-6">
      {/* Bannière d'accueil */}
      <div className="bg-blue-500 text-white p-6 rounded-lg text-center mb-6">
        <h1 className="text-3xl font-bold">Bienvenue !</h1>
        <p className="text-lg mt-2">Ce site propose diverses ressource liées à l'enseignement des mathématiques.</p>
      </div>
      
      {/* Dernière actu avec visuel */}
      {error && <div className="bg-red-100 p-4 rounded-lg shadow-md mb-6 text-red-700">{error}</div>}
      {latestUpdate && (
        <div className="bg-gray-100 p-4 rounded-lg shadow-md mb-6 flex items-center">
          <img src={latestUpdate.image} alt={latestUpdate.title} className="w-20 h-20 mr-4 rounded" />
          <div>
            <h2 className="text-2xl font-semibold mb-2">📢 Dernier ajout :</h2>
            <p className="font-bold">{latestUpdate.title}</p>
            <p>{latestUpdate.desc}</p>
          </div>
        </div>
      )}
      {/* Liste des ressources */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {resources.map((item) => (
          <ResourceCard key={item.path} {...item}/>
          /*<ResourceCard
            key={item.path}
            description="Aucune description pour l'instant"
            categories={[item.path]}
          />*/
        ))}
      </div>
    </div>
  );
};

export default HomePage;
