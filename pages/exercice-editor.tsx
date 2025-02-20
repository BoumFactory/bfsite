// pages/exercice-editor.tsx
import { useState, useRef } from 'react';
import Head from 'next/head';
import Layout from '../components/Layout';
import Script from 'next/script';
import dynamic from 'next/dynamic';
import { MonacoLatexEditor, MonacoJsonEditor } from '../components/monaco-editor';

// Pour forcer le rechargement du composant d'exercice, vous pouvez utiliser next/dynamic
const ScriptComponent = dynamic(() => import('../components/ScriptComponent'), { ssr: false });

export default function ExerciceEditor() {

  /*TODO: Les espace pour écrire sont liés pour une raison que j'ignore.. 
   Il faudrait faire en sorte qu'on puisse écrire du code sans que ça modifie les autres onglets... 
   j'ai essayé de mettre des identifiants différents mais ça ne semble pas  fonctionner...
  */
  // États pour l'onglet général
  const [title, setTitle] = useState('Titre');
  const [theme, setTheme] = useState('Thème');
  const [niveau, setNiveau] = useState('Niveau');
  const [code, setCode] = useState('Code ( ex : 4C22 ).');
  const [competence, setCompetence] = useState('Compétences de l\'exercice.');
  const [tags, setTags] = useState('tag1, tag2');
  const [difficulte, setDifficulte] = useState(1);
  const [instructions, setInstructions] = useState('Instructions globales de l\'exercice.');
  const [latex, setLatex] = useState('Contenu de la question.');
  const [instructionsS, setInstructionsS] = useState('Instructions de la question.');

  // État pour la liste des questions
  const [questions, setQuestions] = useState<any[]>([]);
  // JSON généré
  const [jsonOutput, setJsonOutput] = useState('');
  // Onglet actif
  const [activeTab, setActiveTab] = useState<'general' | 'questions' | 'preview'>('general');
  // Pour la prévisualisation
  const previewRef = useRef<HTMLPreElement>(null);
  // Pour le chargement de l'exercice existant (ScriptComponent)
  const [selectedFile, setSelectedFile] = useState<string>('');

  const handleTabChange = (tab: 'general' | 'questions' | 'preview') => {
    setActiveTab(tab);
  };

  // Ajoute une nouvelle question vide
  const addQuestion = (defaultData?: any) => {
    setQuestions(prev => [
      ...prev,
      {
        instructions: defaultData?.instructions || '',
        variables: defaultData?.variables || [],
        options: defaultData?.options || '',
        script: defaultData?.script || '',
        latex: defaultData?.latex || [],
        correction: defaultData?.correction || [],
        points: defaultData?.points || 0,
      }
    ]);
  };

  // Mise à jour d'une question par index
  const updateQuestionField = (qIndex: number, field: string, value: any) => {
    setQuestions(prev => {
      const copy = [...prev];
      copy[qIndex] = { ...copy[qIndex], [field]: value };
      return copy;
    });
  };

  // Génération du JSON final
  const generateJSON = () => {
    const data = {
      title,
      code,
      competence,
      tags: tags.split(',').map(s => s.trim()),
      difficulte,
      instructions,
      questions,
    };
    setJsonOutput(JSON.stringify(data, null, 2));
  };

  // Exportation via API (voir l'API d'export dans pages/api/export-exercise.ts)
  const exportExercise = async () => {
    if (!jsonOutput) {
      alert("Générez d'abord le JSON.");
      return;
    }
    console.log("college/"+niveau+"/"+theme+"/"+title.replace(/\s+/g, '_') + '.json')
    try {
      const res = await fetch('/api/export-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: jsonOutput, filename: niveau+"/"+theme+"/"+title.replace(/\s+/g, '_') + '.json' }),
      });
      const data = await res.json();
      if (res.ok) {
        alert(`Exercice exporté dans ${data.path}`);
      } else {
        alert(`Erreur lors de l'export: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de l'exportation.");
    }
  };

  // Prévisualisation : export dans preview.json puis chargement
  const previewExercise = async () => {
    if (!jsonOutput) {
      alert("Générez d'abord le JSON.");
      return;
    }
    try {
      const res = await fetch('/api/export-exercise', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: jsonOutput, filename: 'preview.json' }),
      });
      const data = await res.json();
      if (res.ok) {
        const previewRes = await fetch(data.path);
        const previewData = await previewRes.json();
        if (previewRef.current) {
          previewRef.current.textContent = JSON.stringify(previewData, null, 2);
        }
      } else {
        alert(`Erreur lors de la prévisualisation: ${data.error}`);
      }
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la prévisualisation.");
    }
  };
  const addVariableToQuestion = (qIndex: number) => {
    setQuestions(prev => {
      const copy = [...prev];
      if (!copy[qIndex].variables) copy[qIndex].variables = [];
      copy[qIndex].variables.push({ key: '', defaultValue: '', constructor: 'ExoNumber' });
      return copy;
    });
  };

  const updateVariableOfQuestion = (qIndex: number, varIndex: number, field: keyof Variable, value: string) => {
    setQuestions(prev => {
      const copy = [...prev];
      const vars = [...copy[qIndex].variables];
      vars[varIndex] = { ...vars[varIndex], [field]: value };
      copy[qIndex].variables = vars;
      return copy;
    });
  };
  function removeQuestion(index) {
    // Supprime la question d'index `index`
    setQuestions((prevQuestions) => prevQuestions.filter((_, i) => i !== index));
  }

  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <title>Éditeur d'Exercices - Générateur JSON</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <main className="p-4">
      <div className="mt-4 space-x-4">
          <button className="bg-purple-500 text-white p-2 rounded" onClick={generateJSON}>
            Générer JSON
          </button>
          <button className="bg-red-500 text-white p-2 rounded" onClick={exportExercise}>
            Exporter l'exercice
          </button>
          <button className="bg-indigo-500 text-white p-2 rounded" onClick={previewExercise}>
            Prévisualiser l'exercice (export preview)
          </button>
        </div>

        {/* Onglets */}
        <div className="flex border-b border-gray-300 mb-4">
          <button
            className={activeTab === 'general' ? 'flex-1 p-2 bg-gray-300 font-bold' : 'flex-1 p-2 bg-gray-200'}
            onClick={() => handleTabChange('general')}
          >
            Général
          </button>
          <button
            className={activeTab === 'questions' ? 'flex-1 p-2 bg-gray-300 font-bold' : 'flex-1 p-2 bg-gray-200'}
            onClick={() => handleTabChange('questions')}
          >
            Questions
          </button>
          <button
            className={activeTab === 'preview' ? 'flex-1 p-2 bg-gray-300 font-bold' : 'flex-1 p-2 bg-gray-200'}
            onClick={() => handleTabChange('preview')}
          >
            Prévisualiser Exercice
          </button>
        </div>

        {/* Contenu des onglets */}
        {activeTab === 'general' && (
          <div id="generalTab" className="space-y-4">
            <h2 className="text-xl font-bold">Données Générales</h2>
            <div>
              <label className="block font-semibold">Niveau :</label>
              <input
                type="text"
                value={niveau}
                placeholder="4ème"
                onChange={e => setNiveau(e.target.value)}
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Thème :</label>
              <input
                type="text"
                value={theme}
                placeholder="Fractions"

                onChange={e => setTheme(e.target.value)}
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Titre :</label>
              <input
                type="text"
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="Titre de l'exercice"
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Code :</label>
              <input
                type="text"
                value={code}
                onChange={e => setCode(e.target.value)}
                placeholder="Code de l'exercice"
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Compétence :</label>
              <input
                type="text"
                value={competence}
                onChange={e => setCompetence(e.target.value)}
                placeholder="Compétence"
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Tags (séparés par des virgules) :</label>
              <input
                type="text"
                value={tags}
                onChange={e => setTags(e.target.value)}
                placeholder="tag1, tag2, ..."
                className="border p-2 w-full"
              />
            </div>
            <div>
              <label className="block font-semibold">Difficulté :</label>
              <input
                type="number"
                value={difficulte}
                onChange={e => setDifficulte(parseInt(e.target.value))}
                min="1"
                max="5"
                className="border p-2 w-20"
              />
            </div>
            <div>
              <label className="block font-semibold">Instructions :</label>
              <MonacoLatexEditor
                id="latex-editor-instruct-g-1"
                value={instructions}
                height="200px"
                onChange={(v) => setInstructions(v || '')}
              />
            </div>
            
          </div>
        )}

        {activeTab === 'questions' && (
          <div id="questionsTab" className="space-y-4">
            <h2 className="text-xl font-bold">Questions</h2>
            <div id="questionsContainer" className="space-y-4">
              {questions.map((q, idx) => (
                <div key={idx} className="question-block border p-4 rounded">
                  {/* Bouton X pour supprimer la question */}
                  <div className= "flex">
                  <button
                    className="bg-red-500 text-white px-2 rounded"
                    onClick={() => removeQuestion(idx)}
                  >
                    X
                  </button>
                  <h3 className="font-bold">Question {idx + 1}</h3>
                  </div>
                  <div>
                    <label className="block">Instructions :</label>
                    <MonacoLatexEditor
                      id={`latex-editor-instruct-q-${idx}`}
                      value={instructionsS}
                      height="200px"
                      onChange={(v) => setInstructionsS(v || '')}
                    />
                  </div>
                  {/* Ici vous ajouterez la gestion des variables, options, script, latex et correction */}
                  <div className="mt-2">
                    <label className="block mt-2">Options (JSON) :</label>
                      <MonacoJsonEditor
                        id={`latex-editor-options-q-${idx}`}
                        value={q.options}
                        height="100px"
                        onChange={(v) => updateQuestionField(idx, 'options', v || '')}
                    />
                    <label className="block mt-2">Script (JSON) :</label>
                      <MonacoJsonEditor
                        id={`latex-editor-script-q-${idx}`}
                        value={q.script}
                        height="100px"
                        onChange={(v) => updateQuestionField(idx, 'script', v || '')}
                    />
                    <h3 className="font-semibold">Variables</h3>


                    {q.variables.map((v, i) => (
                      <div key={i} className="flex space-x-2 mb-2">
                        <input
                          type="text"
                          value={v.key}
                          placeholder="Nom"
                          onChange={e => updateVariableOfQuestion(idx, i, 'key', e.target.value)}
                          className="border p-1 w-1/3"
                        />
                        <input
                          type="text"
                          value={v.defaultValue}
                          placeholder="Valeur par défaut"
                          onChange={e => updateVariableOfQuestion(idx, i, 'defaultValue', e.target.value)}
                          className="border p-1 w-1/3"
                        />
                        <select
                          value={v.constructor}
                          onChange={e => updateVariableOfQuestion(idx, i, 'constructor', e.target.value)}
                          className="border p-1 w-1/3"
                        >
                          <option value="ExoNumber">ExoNumber</option>
                          <option value="ArithmeticNumber">ArithmeticNumber</option>
                        </select>
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => removeVariableOfQuestion(idx, i)}
                        >
                          X
                        </button>
                      </div>
                    ))}
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
                      onClick={() => addVariableToQuestion(idx)}
                    >
                      Ajouter variable
                    </button>
                    <label className="block font-semibold">Latex</label>
                    {q.latex.map((line: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2">
                        <MonacoLatexEditor
                          id={`latex-editor-latex-q-${idx}-l-${i}`}
                          value={latex}
                          height="200px"
                          onChange={(v) => setLatex(v || '')}
                        />
                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => {
                            const newLatex = q.latex.filter((_: string, j: number) => j !== i);
                            updateQuestionField(idx, 'latex', newLatex);
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
                      onClick={() => updateQuestionField(idx, 'latex', [...q.latex, ""])}
                    >
                      Ajouter ligne Latex
                    </button>
                  </div>
                  <div className="mt-2">
                    <label className="block font-semibold">Correction</label>
                    {q.correction.map((line: string, i: number) => (
                      <div key={i} className="flex items-center space-x-2">
                        <MonacoJsonEditor
                          id={`latex-editor-correction-q-${idx}-l-${i}`}
                          value={q.options}
                          height="150px"
                          onChange={(v) => updateQuestionField(idx, 'options', v || '')}
                        />

                        <button
                          className="bg-red-500 text-white px-2 py-1 rounded"
                          onClick={() => {
                            const newCorr = q.correction.filter((_: string, j: number) => j !== i);
                            updateQuestionField(idx, 'correction', newCorr);
                          }}
                        >
                          Supprimer
                        </button>
                      </div>
                    ))}
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded mt-2"
                      onClick={() => updateQuestionField(idx, 'correction', [...q.correction, ""])}
                    >
                      Ajouter ligne Correction
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              className="bg-green-500 text-white p-2 rounded"
              onClick={() =>
                setQuestions(prev => [
                  ...prev,
                  { instructions: '', variables: [], options: '', script: '', latex: [], correction: [], points: 0 }
                ])
              }
            >
              Ajouter une question
            </button>
          </div>
        )}

        {activeTab === 'preview' && (
          <div id="loadTab" className="space-y-2">
            <h2 className="text-xl font-bold">Prévisualiser un exercice depuis JSON</h2>
            <select id="exercise-selector" className="border p-2 w-full">
              <option value="/files/college/4eme/Exercices/theme_test/exo_test/enonce_TOOLS_results.json">
                enonce_TOOLS_results.json
              </option>
            </select>
            <button
              className="bg-green-500 text-white p-2 rounded"
              onClick={async () => {
                const sel = document.getElementById('exercise-selector') as HTMLSelectElement;
                const res = await fetch(sel.value);
                const data = await res.json();
                if (previewRef.current) {
                  previewRef.current.textContent = JSON.stringify(data, null, 2);
                }
              }}
            >
              Prévisualiser l'exercice sélectionné
            </button>
            <pre id="exercisePreview" ref={previewRef} className="bg-gray-100 p-2"></pre>
          </div>
        )}

        
        {/* Zone d'affichage de l'exercice chargé via ScriptComponent */}
        <div id="exercise-content" className="mt-8">
          {/* Le contenu de l'exercice sera injecté par ScriptComponent */}
        </div>

        {/* On charge le ScriptComponent dynamiquement selon le fichier sélectionné */}
        {selectedFile && (
          <div>
            <h2 className="text-xl font-bold mt-4">Exercice chargé depuis : {selectedFile}</h2>
            <ScriptComponent file={selectedFile} key={selectedFile} />
          </div>
        )}

        <Script
          id="MathJax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="afterInteractive"
        />
        <Script
          src="https://www.geogebra.org/apps/deployggb.js"
          strategy="afterInteractive"
        />

      <pre id="jsonOutput" className="bg-gray-100 p-4 mt-4 whitespace-pre-wrap">{jsonOutput}</pre>

      </main>

      <footer className="mt-8 p-4 text-center text-gray-600">
        <p>© 2025 Mon Projet d'Exercices</p>
      </footer>
    </div>
  );
}
