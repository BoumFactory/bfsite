import React, { useState, useRef } from 'react';
import FileExplorer from './FileExplorer';

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (data: any) => void;
}

const ImportModal: React.FC<ImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [selectedFile, setSelectedFile] = useState<string>('');
  const [filePath, setFilePath] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [jsonList, setJsonList] = useState<any[]>([]);
  const [selectedJsonIndex, setSelectedJsonIndex] = useState<number>(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Gérer la sélection d'un fichier dans l'explorateur
  const handleSelectFile = (path: string) => {
    setSelectedFile(path);
    setFilePath(path);
    setJsonList([]);
  };

  // Gérer le changement du chemin manuellement
  const handlePathChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilePath(e.target.value);
    setSelectedFile('');
  };

  // Ouvrir la fenêtre de sélection de fichier
  const handleBrowse = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Gérer l'importation de fichier via le bouton parcourir
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      handleFile(file);
    }
  };

  // Gérer le glisser-déposer
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.add('bg-gray-100');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('bg-gray-100');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (dropZoneRef.current) {
      dropZoneRef.current.classList.remove('bg-gray-100');
    }

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        handleFile(file);
      } else {
        setError('Seuls les fichiers JSON sont acceptés');
      }
    }
  };

  // Fonction commune pour traiter un fichier
  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        if (e.target && typeof e.target.result === 'string') {
          const data = JSON.parse(e.target.result);
          if (Array.isArray(data)) {
            setJsonList(data);
            setSelectedJsonIndex(0);
          } else {
            setJsonList([]);
            onImport(data);
            onClose();
          }
        }
      } catch (err) {
        setError('Erreur de lecture du fichier JSON');
      }
    };
    reader.readAsText(file);
    setFilePath(file.name);
  };

  // Importer le fichier sélectionné
  const handleImport = async () => {
    if (!filePath) {
      setError('Veuillez sélectionner un fichier');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Si c'est une URL (sélection via l'explorateur)
      if (filePath.startsWith('/files/')) {
        const response = await fetch(filePath);
        if (!response.ok) {
          throw new Error('Erreur lors de la récupération du fichier');
        }
        const data = await response.json();
        
        if (Array.isArray(data)) {
          setJsonList(data);
          setSelectedJsonIndex(0);
        } else {
          setJsonList([]);
          onImport(data);
          onClose();
        }
      } else {
        // Pour les fichiers locaux, rien à faire car déjà traités par handleFile
        setError('Veuillez sélectionner un fichier valide');
      }
    } catch (err) {
      setError('Erreur lors de l\'importation du fichier');
    } finally {
      setIsLoading(false);
    }
  };

  // Importer l'élément sélectionné dans la liste
  const handleImportFromList = () => {
    if (jsonList.length > 0) {
      onImport(jsonList[selectedJsonIndex]);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">Importer un exercice</h2>
        
        {/* Zone de glisser-déposer */}
        <div 
          ref={dropZoneRef}
          className="border-2 border-dashed border-gray-300 p-6 mb-4 text-center"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <p>Glissez et déposez un fichier JSON ici</p>
          <p className="text-sm text-gray-500">ou</p>
          <button 
            className="bg-blue-500 text-white px-4 py-2 rounded mt-2"
            onClick={handleBrowse}
          >
            Parcourir
          </button>
          <input 
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".json"
            onChange={handleFileInput}
          />
        </div>

        {/* Affichage de l'explorateur de fichiers */}
        <FileExplorer onSelectFile={handleSelectFile} selectedFile={selectedFile} />
        
        {/* Chemin du fichier et bouton d'importation */}
        <div className="mt-4">
          <label className="block font-semibold">Chemin du fichier :</label>
          <div className="flex mt-2">
            <input
              type="text"
              value={filePath}
              onChange={handlePathChange}
              className="border p-2 flex-grow"
              placeholder="Chemin du fichier JSON"
            />
            <button 
              className="bg-green-500 text-white px-4 py-2 ml-2 rounded"
              onClick={handleImport}
              disabled={isLoading}
            >
              {isLoading ? 'Importation...' : 'Importer'}
            </button>
          </div>
        </div>

        {/* Affichage des erreurs */}
        {error && (
          <div className="mt-4 text-red-500">
            {error}
          </div>
        )}

        {/* Sélection si liste de JSONs */}
        {jsonList.length > 0 && (
          <div className="mt-4">
            <label className="block font-semibold">Sélectionnez l'exercice à importer :</label>
            <select
              className="border p-2 w-full mt-2"
              value={selectedJsonIndex}
              onChange={(e) => setSelectedJsonIndex(parseInt(e.target.value))}
            >
              {jsonList.map((item, index) => (
                <option key={index} value={index}>
                  {item.title || `Exercice ${index + 1}`}
                </option>
              ))}
            </select>
            <button 
              className="bg-green-500 text-white px-4 py-2 mt-2 rounded"
              onClick={handleImportFromList}
            >
              Importer l'exercice sélectionné
            </button>
          </div>
        )}

        {/* Boutons */}
        <div className="mt-6 flex justify-end">
          <button 
            className="bg-gray-500 text-white px-4 py-2 rounded"
            onClick={onClose}
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
};

export default ImportModal;