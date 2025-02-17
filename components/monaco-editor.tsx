import dynamic from 'next/dynamic';

// Charger Editor uniquement côté client
const Editor = dynamic(() => import('@monaco-editor/react').then(mod => mod.default), { ssr: false });

interface MonacoEditorFieldProps {
  id?: string;             // <-- On ajoute un champ "id" ou "path"  
  value: string;
  language: string;
  height?: string;
  onChange: (value: string | undefined) => void;
}

export default function MonacoEditorField({
  id,
  value,
  language,
  height = '200px',
  onChange,
}: MonacoEditorFieldProps) {
  return (
    <Editor
      height={height}
      defaultLanguage={language}
      // On spécifie un path unique : si "id" n'est pas défini,
      // on peut en générer un au hasard pour être sûr qu'il soit unique.
      path={id || `temp-${Math.random()}`}
      theme="vs-dark"
      value={value}
      onChange={onChange}
    />
  );
}

// Pour du LaTeX, on peut utiliser "plaintext" ou un path plus explicite
export function MonacoLatexEditor({
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
    <MonacoEditorField
      id={id}
      value={value}
      language="plaintext"
      height={height}
      onChange={onChange}
    />
  );
}

// Pour du JSON
export function MonacoJsonEditor({
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
    <MonacoEditorField
      id={id}
      value={value}
      language="json"
      height={height}
      onChange={onChange}
    />
  );
}
