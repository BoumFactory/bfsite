// pages/about.tsx
import React from "react";
import Layout from "../components/Layout";
import { useUpdatePageTitle } from "../hooks/useUpdatePageTitle";

//TODO: Se lâcher avec des minipage de CV pour présenter un peu qui on est. 
const About: React.FC = () => {
    useUpdatePageTitle("À propos");
    
  return (
      <div className="container mx-auto p-6">
        <h1 className="text-4xl font-bold mb-4">À propos</h1>
        <p className="mb-4">
          Bienvenue sur notre plateforme ! Ce site a pour vocation de partager des ressources pédagogiques et techniques, ainsi que des tutoriels et guides pratiques pour accompagner vos projets.
        </p>
        <p className="mb-4">
          Passionnés par le développement et l'enseignement, nous mettons tout en œuvre pour fournir des contenus de qualité, régulièrement mis à jour.
        </p>
        <p>
          N'hésitez pas à nous faire part de vos retours ou suggestions afin que nous puissions améliorer encore davantage cette plateforme. Bonne navigation !
        </p>
      </div>
  );
};

export default About;
