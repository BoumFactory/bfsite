import { useState, useEffect, useRef, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { createPortal } from 'react-dom';
import useMonacoConfig from '../components/MonacoConfig';
import { initializeMonacoEditor } from '../components/MonacoConfig';
// Import dynamique pour éviter les erreurs SSR
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
  const editorRef = useRef<any>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  
  // Appliquer la configuration Monaco
  useMonacoConfig(editorRef);
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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;
    monaco.editor.setTheme('custom-theme');
    editor.setValue(value);
    // Focus sur l'éditeur
    setTimeout(() => {
      editor.focus();
    }, 100);
    
    // Configuration améliorée pour l'éditeur en plein écran
    editor.updateOptions({
      fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
      fontLigatures: true,
      lineNumbers: 'on',
      scrollBeyondLastLine: true,
      minimap: { enabled: true }
    });
    // Définition des raccourcis clavier personnalisés
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Equal, () => {
      const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      editor.updateOptions({ fontSize: Math.min(30, fontSize + 1) });
    });
    
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      editor.updateOptions({ fontSize: Math.max(8, fontSize - 1) });
    });
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Minus, () => {
      const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
      editor.updateOptions({ fontSize: Math.max(8, fontSize - 1) });
    });
    
    // Configurer manuellement le zoom avec Ctrl+molette
    const handleWheel = (e: WheelEvent) => {
      if (e.ctrlKey) {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -1 : 1;
        const fontSize = editor.getOption(monaco.editor.EditorOption.fontSize);
        const newFontSize = Math.max(8, Math.min(30, fontSize + delta));
        editor.updateOptions({ fontSize: newFontSize });
      }
    };

    // Ajouter l'écouteur directement à l'élément DOM de l'éditeur
    const editorDomNode = editor.getDomNode();
    if (editorDomNode) {
      editorDomNode.addEventListener('wheel', handleWheel, { passive: false });
    }
  };
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
            path={id || `modal-editor-${Math.random()}`}
            onMount={handleEditorDidMount}
            value={value}
            onChange={handleEditorChange}
            theme="custom-theme"
            options={{
              lineNumbers: 'on',
              minimap: { enabled: true },
              scrollBeyondLastLine: true,
              fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
              fontLigatures: true
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
