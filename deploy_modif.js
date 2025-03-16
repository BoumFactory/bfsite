// Ce script va créer les fichiers nécessaires pour implémenter la fonctionnalité d'expansion des éditeurs Monaco
// Exécutez ce script dans votre répertoire de travail

const fs = require('fs');
const path = require('path');

// Création du composant ExpandableMonacoEditor
const expandableMonacoEditorContent = `import { useState, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';

// Composants dynamiques pour éviter les erreurs SSR
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), { ssr: false });
const MonacoEditorModal = dynamic(() => import('./MonacoEditorModal'), { ssr: false });

interface ExpandableMonacoEditorProps {
  id?: string;
  value: string;
  language: string;
  height?: string;
  onChange: (value: string | undefined) => void;
}

export default function ExpandableMonacoEditor({
  id,
  value,
  language,
  height = '200px',
  onChange,
}: ExpandableMonacoEditorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tempValue, setTempValue] = useState(value);
  const editorRef = useRef<HTMLDivElement>(null);

  // Mettre à jour tempValue quand value change (par exemple, quand le parent met à jour la valeur)
  // seulement si le modal n'est pas ouvert
  useState(() => {
    if (!isModalOpen) {
      setTempValue(value);
    }
  }, [value, isModalOpen]);

  const handleDoubleClick = () => {
    setTempValue(value); // Initialiser tempValue avec la valeur actuelle
    setIsModalOpen(true);
  };

  const handleModalSave = (newValue: string | undefined) => {
    if (newValue !== undefined) {
      onChange(newValue);
    }
    setIsModalOpen(false);
  };

  const handleModalCancel = () => {
    setIsModalOpen(false);
  };

  const handleEditorChange = useCallback((value: string | undefined) => {
    onChange(value);
  }, [onChange]);

  return (
    <div 
      ref={editorRef}
      onDoubleClick={handleDoubleClick}
      style={{ position: 'relative' }}
    >
      <Editor
        height={height}
        defaultLanguage={language}
        path={id || \`temp-\${Math.random()}\`}
        theme="vs-dark"
        value={value}
        onChange={handleEditorChange}
        options={{ 
          minimap: { enabled: false }, // Désactiver la minimap pour les petits éditeurs
          scrollBeyondLastLine: false
        }}
      />
      {isModalOpen && (
        <MonacoEditorModal
          id={id ? \`modal-\${id}\` : undefined}
          initialValue={tempValue}
          language={language}
          onSave={handleModalSave}
          onCancel={handleModalCancel}
        />
      )}
    </div>
  );
}

// Versions spécialisées pour différents langages
export function ExpandableMonacoLatexEditor({
  id,
  value,
  onChange,
  height
}: {
  id?: string;
  value: string;
  onChange: (v: string | undefined) => void;
  height?: string;
}) {
  return (
    <ExpandableMonacoEditor
      id={id}
      value={value}
      language="latex"
      height={height}
      onChange={onChange}
    />
  );
}

export function ExpandableMonacoJsonEditor({
  id,
  value,
  onChange,
  height
}: {
  id?: string;
  value: string;
  onChange: (v: string | undefined) => void;
  height?: string;
}) {
  return (
    <ExpandableMonacoEditor
      id={id}
      value={value}
      language="json"
      height={height}
      onChange={onChange}
    />
  );
}
`;

// Création du composant MonacoEditorModal
const monacoEditorModalContent = `import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';

// Charger Editor uniquement côté client
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), { ssr: false });

interface ConfirmDialogProps {
  onConfirm: () => void;
  onCancel: () => void;
  onDismiss: () => void;
}

// Composant de dialogue de confirmation
function ConfirmDialog({ onConfirm, onCancel, onDismiss }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md">
        <h3 className="text-lg font-medium mb-4">Voulez-vous enregistrer les modifications?</h3>
        <div className="flex justify-end space-x-2">
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Oui
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded hover:bg-gray-400"
          >
            Non
          </button>
          <button
            onClick={onDismiss}
            className="px-4 py-2 border border-gray-300 text-gray-800 rounded hover:bg-gray-100"
          >
            Annuler
          </button>
        </div>
      </div>
    </div>
  );
}

interface MonacoEditorModalProps {
  id?: string;
  initialValue: string;
  language: string;
  onSave: (value: string | undefined) => void;
  onCancel: () => void;
}

export default function MonacoEditorModal({
  id,
  initialValue,
  language,
  onSave,
  onCancel,
}: MonacoEditorModalProps) {
  const [value, setValue] = useState(initialValue);
  const [showConfirm, setShowConfirm] = useState(false);
  const [portalElement, setPortalElement] = useState<HTMLElement | null>(null);
  const hasChanges = useRef(false);
  
  useEffect(() => {
    // Créer un élément div pour le portail du modal
    const el = document.createElement('div');
    document.body.appendChild(el);
    setPortalElement(el);
    
    // Gestionnaire pour la touche Escape
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseAttempt();
      }
    };
    
    window.addEventListener('keydown', handleEscape);
    
    return () => {
      window.removeEventListener('keydown', handleEscape);
      document.body.removeChild(el);
    };
  }, []);

  const handleEditorChange = useCallback((newValue: string | undefined) => {
    setValue(newValue || '');
    hasChanges.current = newValue !== initialValue;
  }, [initialValue]);

  const handleSave = useCallback(() => {
    onSave(value);
  }, [value, onSave]);

  const handleCloseAttempt = useCallback(() => {
    if (hasChanges.current) {
      setShowConfirm(true);
    } else {
      onCancel();
    }
  }, [onCancel]);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleCloseAttempt();
    }
  }, [handleCloseAttempt]);

  const handleConfirmSave = useCallback(() => {
    setShowConfirm(false);
    onSave(value);
  }, [value, onSave]);

  const handleConfirmDiscard = useCallback(() => {
    setShowConfirm(false);
    onCancel();
  }, [onCancel]);

  const handleConfirmCancel = useCallback(() => {
    setShowConfirm(false);
  }, []);

  if (!portalElement) return null;

  return createPortal(
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40"
      onClick={handleOverlayClick}
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-lg p-4 w-11/12 h-5/6 max-w-6xl flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">Édition avancée</h2>
          <div className="space-x-2">
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Conserver
            </button>
            <button
              onClick={handleCloseAttempt}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
            >
              Annuler
            </button>
          </div>
        </div>
        
        <div className="flex-grow relative w-full h-full">
          <Editor
            height="100%"
            width="100%"
            defaultLanguage={language}
            path={id || \`modal-editor-\${Math.random()}\`}
            theme="vs-dark"
            value={initialValue}
            onChange={handleEditorChange}
            options={{
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              minimap: { enabled: true },
              automaticLayout: true,
            }}
          />
        </div>
        
        {showConfirm && (
          <ConfirmDialog
            onConfirm={handleConfirmSave}
            onCancel={handleConfirmDiscard}
            onDismiss={handleConfirmCancel}
          />
        )}
      </div>
    </div>,
    portalElement
  );
}
`;

// Écriture des fichiers
const componentsDir = path.join(process.cwd(), 'components');

// S'assurer que le répertoire components existe
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
}

fs.writeFileSync(
  path.join(componentsDir, 'ExpandableMonacoEditor.tsx'),
  expandableMonacoEditorContent
);

fs.writeFileSync(
  path.join(componentsDir, 'MonacoEditorModal.tsx'),
  monacoEditorModalContent
);

console.log('Fichiers créés avec succès:');
console.log('- components/ExpandableMonacoEditor.tsx');
console.log('- components/MonacoEditorModal.tsx');
console.log('\nPour utiliser ces composants:');
console.log(`
import { 
  ExpandableMonacoEditor,
  ExpandableMonacoLatexEditor,
  ExpandableMonacoJsonEditor 
} from './components/ExpandableMonacoEditor';

// Utilisation basique
<ExpandableMonacoEditor
  id="mon-editeur"
  value={monTexte}
  language="javascript"
  onChange={setMonTexte}
/>

// Pour du LaTeX
<ExpandableMonacoLatexEditor
  id="mon-editeur-latex"
  value={monTexteLatex}
  onChange={setMonTexteLatex}
/>
`);