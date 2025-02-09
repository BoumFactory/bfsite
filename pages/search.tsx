// pages/search.tsx
import React, { useState } from 'react';
import ResourceCard from '../components/ResourceCard';
import Layout from '../components/Layout';

interface SearchResult {
  fileName: string;
  categories: string[];
  relevance: number;
}

const SearchPage: React.FC = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data.results);
    } catch (error) {
      console.error('Erreur lors de la recherche', error);
    }
    setLoading(false);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    handleSearch();
  };

  return (
    <Layout>
      <div className="container mx-auto p-6">
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            placeholder="Rechercher des ressources..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-gray-800 text-white px-4 py-2 rounded-md"
          />
        </form>
        {loading && <p>Recherche en cours...</p>}
        {!loading && query && results.length === 0 && (
          <p>Aucun résultat trouvé pour "{query}"</p>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {results.map(result => (
            <ResourceCard
              key={`${result.categories.join('-')}-${result.fileName}`}
              fileName={result.fileName}
              description={`Pertinence : ${result.relevance}`}
              categories={result.categories}
            />
          ))}
        </div>
      </div>
    </Layout>
  );
};

export default SearchPage;
