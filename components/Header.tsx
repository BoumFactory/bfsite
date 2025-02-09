// components/Header.tsx
import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePageTitle } from "./PageTitleContext";

interface HeaderProps {
  toggleSidebar: () => void;
}

interface SearchResult {
  fileName: string;
  categories: string[];
  relevance: number;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { pageTitle } = usePageTitle();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
      setShowResults(true);
    } catch (error) {
      console.error("Erreur lors de la recherche", error);
    }
    setIsSearching(false);
  };

  // Fermer le bandeau de résultats lorsqu'on clique en dehors du header
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (headerRef.current && !headerRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    console.log("Titre mis à jour :", pageTitle);
    // Vous pouvez aussi mettre à jour document.title ici si besoin
  }, [pageTitle]);

  return (
    <div ref={headerRef}>
      <header className="bg-black shadow-md">
        <nav className="flex items-center p-4 space-x-8">
          <button onClick={toggleSidebar} className="p-2 rounded hover:bg-gray-700">
            {/* Icône hamburger */}
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg font-bold text-white">{pageTitle}</h1>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Rechercher..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleSearch();
                }
              }}
              className="px-2 py-1 rounded text-black"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-1 bg-blue-600 rounded hover:bg-blue-700"
            >
              Rechercher
            </button>
          </div>
        </nav>
        {showResults && (
          <div
            className="absolute left-0 right-0 max-w-lg mx-auto bg-white text-black p-4 mt-2 shadow-lg max-h-80 overflow-auto z-50 space-y-4"
          >
            {isSearching ? (
              <p>Recherche en cours...</p>
            ) : results.length === 0 ? (
              <p>Aucun résultat trouvé pour "{query}"</p>
            ) : (
              <>
                <h2 className="font-bold mb-2">Résultats de recherche :</h2>
                {results.map((result, idx) => (
                  <div key={idx} className="mb-2 p-2 border-b">
                    <p className="font-bold">{result.fileName}</p>
                    <p className="text-sm text-gray-600">
                      {result.categories.join(" > ")} - Pertinence: {result.relevance}
                    </p>
                    <Link
                      href={
                        result.categories.length > 0
                          ? `/files/${result.categories.join("/")}/${result.fileName}`
                          : `/files/${result.fileName}`
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Voir le document
                    </Link>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </header>
    </div>
  );
};

export default Header;
