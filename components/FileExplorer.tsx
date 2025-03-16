import React, { useState, useEffect } from 'react';

interface FileNode {
  type: 'file' | 'directory';
  name: string;
  path: string;
  children?: FileNode[];
}

interface FileExplorerProps {
  onSelectFile: (path: string) => void;
  selectedFile: string;
}

const FileExplorer: React.FC<FileExplorerProps> = ({ onSelectFile, selectedFile }) => {
  const [tree, setTree] = useState<FileNode[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFileTree = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/list-json');
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération des fichiers');
        }
        const data = await response.json();
        setTree(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchFileTree();
  }, []);

  // Fonction récursive pour rendre l'arborescence
  const renderTree = (nodes: FileNode[]) => {
    return nodes.map((node) => {
      if (node.type === 'directory') {
        return (
          <div key={node.path} className="pl-4">
            <div className="font-bold">{node.name}</div>
            {node.children && renderTree(node.children)}
          </div>
        );
      } else {
        return (
          <div 
            key={node.path} 
            className={`pl-6 py-1 cursor-pointer hover:bg-gray-100 ${selectedFile === node.path ? 'bg-blue-100' : ''}`}
            onClick={() => onSelectFile(node.path)}
          >
            {node.name}
          </div>
        );
      }
    });
  };

  if (loading) return <div>Chargement de l'arborescence des fichiers...</div>;
  if (error) return <div className="text-red-500">Erreur: {error}</div>;

  return (
    <div className="max-h-96 overflow-y-auto border rounded p-2">
      <h3 className="font-bold mb-2">Sélectionnez un fichier</h3>
      {tree.length > 0 ? renderTree(tree) : <div>Aucun fichier trouvé</div>}
    </div>
  );
};

export default FileExplorer;