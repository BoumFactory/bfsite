// components/Sidebar.tsx
import React from "react";
import Link from "next/link";

interface SidebarProps {
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen }) => {
  return (
    <aside
      className={`bg-gray-800 text-white transition-all duration-300 ${
        isOpen ? "w-64" : "w-0 overflow-hidden"
      }`}
    >
      {isOpen && (
        <>
          <div className="p-4">
            <h1 className="text-2xl font-bold">Menu</h1>
          </div>
          <nav className="mt-4">
            <ul>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/" className="block">
                  Accueil
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/about" className="block">
                  À propos
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/resources" className="block">
                  Ressources
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/activities" className="block">
                  Activités
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/tutorials" className="block">
                  Tutoriels
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/contact" className="block">
                  Contact
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
                <Link href="/ExerciceInteractif" className="block">
                  Exercices interactifs
                </Link>
              </li>
              <li className="px-4 py-2 hover:bg-gray-700">
              <Link href="/exercice-editor">
                  Editeur d'exercices
              </Link>
              </li>
              {/* D'autres liens pourront être ajoutés ici au fur et à mesure de l'avancement du projet */}
            </ul>
          </nav>
        </>
      )}
    </aside>
  );
};

export default Sidebar;
