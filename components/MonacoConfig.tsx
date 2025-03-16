import { useEffect, useRef } from 'react';
import { editor } from 'monaco-editor';
import { setupAdvancedLatexSupport } from './enhancedLatexSupport';
// Configuration initiale pour Monaco Editor
export function initializeMonacoEditor() {
  if (typeof window === 'undefined') return;

  // Si Monaco n'est pas disponible, on sort
  if (!window.monaco) return;

  try {
    // Définir un thème personnalisé
    window.monaco.editor.defineTheme('custom-theme', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        // LaTeX syntax
        { token: 'keyword.latex', foreground: '#569CD6' },
        { token: 'string.latex', foreground: '#CE9178' },
        { token: 'string.math.latex', foreground: '#DCDCAA' }, // Couleur spéciale pour le contenu mathématique
        { token: 'comment.latex', foreground: '#6A9955' },
        { token: 'delimiter.bracket.latex', foreground: '#FFFF00' },
        { token: 'delimiter.array.latex', foreground: '#FFA500' },
        { token: 'delimiter.parenthesis.latex', foreground: '#FF69B4' },
        { token: 'operator.latex', foreground: '#D4D4D4' },
      ],
      colors: {
        'editor.background': '#1E1E1E',
        'editor.foreground': '#D4D4D4',
        'editorCursor.foreground': '#FFFFFF',
        'editor.lineHighlightBackground': '#2A2A2A',
        'editorLineNumber.foreground': '#858585',
      }
    });

    // Appliquer le support LaTeX amélioré
    setupAdvancedLatexSupport();

    console.log('Monaco Editor initialisé avec succès avec le support LaTeX amélioré');
    return window.monaco;
  } catch (error) {
    console.error('Échec de l\'initialisation de Monaco Editor:', error);
  }
}

// Hook pour appliquer les configurations Monaco à un éditeur
export default function useMonacoConfig(editorRef: React.RefObject<any>) {
  const initialized = useRef(false);
  
  useEffect(() => {
    if (typeof window === 'undefined' || initialized.current) return;
    
    const setupEditor = () => {
      const editorInstance = editorRef.current;
      if (!editorInstance || !window.monaco) return false;
      
      try {
        // Configurer le zoom avec Ctrl+molette
        const handleWheel = (e: WheelEvent) => {
          if (e.ctrlKey) {
            e.preventDefault();
            const delta = e.deltaY > 0 ? -1 : 1;
            const fontSize = editorInstance.getOption(window.monaco.editor.EditorOption.fontSize);
            const newFontSize = Math.max(8, Math.min(30, fontSize + delta));
            editorInstance.updateOptions({ fontSize: newFontSize });
          }
        };

        // Ajouter l'écouteur d'événements
        const editorDomNode = editorInstance.getDomNode();
        if (editorDomNode) {
          editorDomNode.addEventListener('wheel', handleWheel, { passive: false });
          
          // Raccourcis clavier pour le zoom
          editorInstance.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Equal, () => {
            const fontSize = editorInstance.getOption(window.monaco.editor.EditorOption.fontSize);
            editorInstance.updateOptions({ fontSize: Math.min(30, fontSize + 1) });
          });
          
          editorInstance.addCommand(window.monaco.KeyMod.CtrlCmd | window.monaco.KeyCode.Minus, () => {
            const fontSize = editorInstance.getOption(window.monaco.editor.EditorOption.fontSize);
            editorInstance.updateOptions({ fontSize: Math.max(8, fontSize - 1) });
          });
          
          initialized.current = true;
          return () => {
            editorDomNode.removeEventListener('wheel', handleWheel);
          };
        }
      } catch (error) {
        console.error('Error configuring Monaco editor:', error);
      }
      
      return false;
    };
    
    const cleanup = setupEditor();
    if (cleanup === false) {
      // Si l'éditeur n'est pas prêt, on réessaie après un délai
      const timerId = setTimeout(() => {
        const delayedCleanup = setupEditor();
        if (typeof delayedCleanup === 'function') {
          delayedCleanup();
        }
      }, 1000);
      
      return () => clearTimeout(timerId);
    }
    
    return cleanup;
  }, [editorRef]);
}