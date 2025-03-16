// components/SimpleModalToAbstract.tsx
import React, { useState, useRef } from 'react';
import { ExerciseJSON } from '../types/Exercise';
import { useExerciseAbstraction } from '../hooks/useExerciseAbstraction';

interface SimpleModalToModifProps {
  contentToModif: string;
  isOpen: boolean;
  closeModal: () => void;
  onExerciseImported: (exercise: ExerciseJSON) => void;
  taskType: string;
}

const SimpleModalToModif: React.FC<SimpleModalToModifProps> = ({
  contentToModif,
  isOpen,
  closeModal,
  onExerciseImported,
  taskType
}) => {
  // États pour gérer les données et l'interface
  const [content, setContent] = useState<string>('');
  const [instruct, setInstruct] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fileName, setFileName] = useState<string>('');
  const [fileType, setFileType] = useState<string>('text');
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [showResult, setShowResult] = useState<boolean>(false);
  const [result, setResult] = useState<ExerciseJSON | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<string>('auto');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { abstractExercise } = useExerciseAbstraction();

  
  // Liste simplifiée des modèles disponibles
  const availableModels = [
    { id: 'auto', name: 'Automatique' },
    { id: "o3-mini", name: "o3-mini" },
    { id: 'gpt-4o-mini', name: 'GPT-4 Vision' },
  ];

  // Gestionnaire pour le contenu texte
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setFileType('text');
    setFileName('');
  };
    // Gestionnaire pour le contenu texte
    const handleInstructChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setInstruct(e.target.value);
    };

  // Gestionnaire pour le changement de modèle
  const handleModelChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedModelId(e.target.value);
  };

  // Gestionnaire pour le glisser-déposer
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      processFile(file);
    }
  };

  // Gestionnaire pour le sélecteur de fichier
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      processFile(file);
    }
  };

  // Détermine le type de fichier et lit son contenu
  const processFile = (file: File) => {
    setFileName(file.name);
    setError('');
    setShowResult(false);

    // Déterminer le type de fichier pour l'API appropriée
    let detectedFileType = 'text';
    
    if (file.type.startsWith('image/')) {
      detectedFileType = 'image';
    } else if (file.type === 'application/pdf') {
      detectedFileType = 'pdf';
    } else if (file.name.endsWith('.tex')) {
      detectedFileType = 'latex';
    } else if (file.type === 'application/msword' || 
               file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      detectedFileType = 'doc';
    }
    
    setFileType(detectedFileType);

    const reader = new FileReader();

    reader.onload = (e) => {
      if (e.target && e.target.result) {
        if (detectedFileType === 'image' || detectedFileType === 'pdf' || detectedFileType === 'doc') {
          // Pour les fichiers binaires, on les lit en base64
          setContent(e.target.result.toString());
        } else {
          // Pour les fichiers texte
          setContent(e.target.result.toString());
        }
      }
    };

    reader.onerror = () => {
      setError('Erreur lors de la lecture du fichier');
    };

    if (detectedFileType === 'image' || detectedFileType === 'pdf' || detectedFileType === 'doc') {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }
  };

  // Soumettre le contenu pour abstraction
  const handleSubmit = async () => {
    
    if (!content.trim()) {
      setError('Veuillez entrer du contenu ou sélectionner un fichier');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Déterminer le type de fichier à envoyer
      const apiFileType = 
        fileType === 'image' || fileType === 'pdf' || fileType === 'doc' ? 'image' : 'text';
      
      // Utiliser le modèle sélectionné
      const modelToUse = selectedModelId;
      
      console.log(contentToModif,instruct, apiFileType, modelToUse, taskType)
      const abstractionResult = await abstractExercise(contentToModif,instruct, apiFileType, modelToUse, taskType);
      
      onExerciseImported(abstractionResult);
      closeModal();
    } catch (err: any) {
      setError(`Erreur: ${err.message || 'Une erreur est survenue'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const openFileSelector = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Si le modal n'est pas ouvert, ne rien rendre
  if (!isOpen) return null;

  
  // Rendu simplifié sans utiliser HeadlessUI
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Overlay de fond */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={closeModal}></div>
      
      {/* Contenu du modal */}
      <div className="relative p-4 flex justify-center items-center min-h-screen">
        <div className="relative w-full max-w-2xl bg-white p-6 rounded-lg shadow-xl">
          {/* En-tête */}
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Modifier l'exercice.</h3>
            <button 
              className="text-gray-400 hover:text-gray-600"
              onClick={closeModal}
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Contenu du formulaire */}
          <div className="mt-4">
            {/* Instructions supplémentaire pour l'IA*/}
            <div className="mb-4">
              <label htmlFor="exercise-content" className="block text-sm font-medium text-gray-700 mb-1">
                Instructions supplémentaires pour l'IA
              </label>
              <textarea
                id="exercise-content"
                value={instruct}
                onChange={handleInstructChange}
                placeholder="Vos instructions supplémentaires ici..."
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            {/* Entrée du contenu texte */}
            <div className="mb-4">
              <label htmlFor="exercise-content" className="block text-sm font-medium text-gray-700 mb-1">
                Contenu de l'exercice
              </label>
              <textarea
                id="exercise-content"
                value={contentToModif}
                onChange={handleContentChange}
                //placeholder="Collez votre contenu LaTeX ici..."
                rows={6}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>

            {/* Sélection du modèle */}
            <div className="mb-4">
              <label htmlFor="model-select" className="block text-sm font-medium text-gray-700 mb-1">
                Modèle d'IA
              </label>
              <select
                id="model-select"
                value={selectedModelId}
                onChange={handleModelChange}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
              >
                {availableModels.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message d'erreur */}
            {error && (
              <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div className="mt-6 flex justify-end space-x-3">
              <button
                type="button"
                onClick={closeModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none"
              >
                Annuler
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isProcessing || !content.trim()}
                className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none ${
                  isProcessing || !content.trim() ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Traitement en cours...
                  </>
                ) : (
                  'Modifier l\'exercice'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleModalToModif;