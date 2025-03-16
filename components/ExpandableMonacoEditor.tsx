import { useState, useRef, useCallback, useEffect} from 'react';
import dynamic from 'next/dynamic';
import * as monaco from 'monaco-editor';
import useMonacoConfig from '../components/MonacoConfig';
import { initializeMonacoEditor } from '../components/MonacoConfig';
// Composants dynamiques pour éviter les erreurs SSR
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), { ssr: false });
const MonacoEditorModal = dynamic(() => import('./MonacoEditorModal'), { ssr: false });

// Initialisation de Monaco avec la configuration personnalisée
//dynamic(() => import('./components/MonacoConfig').then(mod => mod.default()), { ssr: false });
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
  const editorRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Appliquer la configuration Monaco (y compris Ctrl+molette)
  //useMonacoConfig(editorRef);
  
  // Mettre à jour tempValue quand value change (par exemple, quand le parent met à jour la valeur)
  // seulement si le modal n'est pas ouvert
  useEffect(() => {
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

  const handleEditorDidMount = (editor: any, monaco: any) => {
    editorRef.current = editor;

    // Configuration du thème et des options de l'éditeur
    //monaco.editor.setTheme('custom-theme');
    
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
    initializeMonacoEditor()
    console.log(`Monaco Editor mounted for ${language} with custom configuration`);
  };

  return (
    <div 
      onDoubleClick={handleDoubleClick}
      style={{ position: 'relative' }}
    >
      <Editor
        height={height}
        defaultLanguage={language}
        path={id || `temp-\${Math.random()}`}
        theme="custom-theme"
        value={value}
        onChange={handleEditorChange}
        onMount={handleEditorDidMount}
        options={{ 
          minimap: { enabled: false }, // Désactiver la minimap pour les petits éditeurs
          scrollBeyondLastLine: false,
          fontFamily: "'Fira Code', Consolas, 'Courier New', monospace",
          fontLigatures: true,
        }}
      />
      {isModalOpen && (
        <MonacoEditorModal
          id={id ? `modal-${id}` : undefined}
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

export function ExpandableMonacoJavascriptEditor({
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
      language="js"
      height={height}
      onChange={onChange}
    />
  );
}