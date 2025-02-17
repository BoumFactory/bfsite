// pages/exercice.tsx
import Head from 'next/head'
import Script from 'next/script'
import Layout from '../components/Layout'
import { useEffect, useState } from 'react';
import 'algebrite'
//import '../components/script.js'; // ou le chemin approprié
import dynamic from 'next/dynamic';
import { SimpleTreeView } from '@mui/x-tree-view/SimpleTreeView';
import CustomTreeItem from '../components/CustomTreeItem';
import Link from 'next/link';

const ExpandMoreIcon = dynamic(
  () => import('@mui/icons-material/ExpandMore'),
  { ssr: false }
);
const ChevronRightIcon = dynamic(
  () => import('@mui/icons-material/ChevronRight'),
  { ssr: false }
);


const ScriptComponent = dynamic(() => import('../components/ScriptComponent'), { ssr: false });

// Fonction utilitaire pour récupérer tous les nodeIds à développer
const getAllNodeIds = (nodes: any[]): string[] => {
    let ids: string[] = [];
    nodes.forEach(node => {
      ids.push(node.path);
      if (node.children) {
        ids = ids.concat(getAllNodeIds(node.children));
      }
    });
    return ids;
  };
  
export default function Exercice() {
    const [treeData, setTreeData] = useState<any[]>([]);
    const [selectedFile, setSelectedFile] = useState<string>('');
  
    useEffect(() => {
      // Récupération de la structure d'arborescence via l'API
      fetch('/api/list-json')
        .then(res => res.json())
        .then((data: any[]) => {
          setTreeData(data);
          // Optionnel : sélectionner par défaut le premier fichier trouvé
          const findFirstFile = (nodes: any[]): string | null => {
            for (const node of nodes) {
              if (node.type === 'file') return node.path;
              if (node.children) {
                const found = findFirstFile(node.children);
                if (found) return found;
              }
            }
            return null;
          };
          const firstFile = findFirstFile(data);
          if (firstFile) setSelectedFile(firstFile);
        })
        .catch(error => console.error('Erreur lors de la récupération de la liste:', error));
    }, []);
  
      // Lors du double-clic, mettre à jour le fichier sélectionné
        const handleFileDoubleClick = (node: any) => {
            if (node.type === 'file') {
            setSelectedFile(node.path);
            }
        };
  

  return (
    <div>
      <Head>
        <meta charSet="UTF-8" />
        <title>Exercice Interactif - Modes d'affichage</title>
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link
          rel="stylesheet"
          href="https://unpkg.com/carbon-components@10.49.0/css/carbon-components.min.css"
        />
        <link
          rel="stylesheet"
          href="https://unpkg.com/mathlive/dist/mathlive-fonts.css"
        />
        <link rel="stylesheet" href="/style.css" />
      </Head>

      <main>
        {/* Liens vers d'autres pages, à adapter si nécessaire */}
        <Link href="/exercice-editor">
            Accéder à l'éditeur d'exercices
        </Link>
        <a href="/pages/aperçu.html">Voir l'aperçu</a>
        <div className="bx--col">
              {/* Affichage du SimpleTreeView */}
              <label htmlFor="SimpleTreeView">Explorer les exercices :</label>
              <SimpleTreeView>
                    {treeData.map((node) => (
                        <CustomTreeItem key={node.path} node={node} onDoubleClick={handleFileDoubleClick} />
                    ))}
                </SimpleTreeView>
              <p>Fichier sélectionné : {selectedFile}</p>
              <p>(Double-cliquez sur un fichier pour le charger)</p>
            </div>
        <div className="bx--grid">
          {/* En-tête : Titre et consignes */}
          <div className="bx--row">
            <div className="bx--col">
              <h1 id="exercise-title" className="bx--type-heading-01"></h1>
              <p id="exercise-instructions" className="bx--type-body"></p>
            </div>
            <div className="bx--col">
              <label htmlFor="exercise-selector">Sélectionnez un exercice : </label>
              <select id="exercise-selector"></select>
              <button id="load-exercise-button">Charger</button>
            </div>
          </div>

          {/* Contrôles de vue et de correction */}
          <div className="bx--row" id="view-controls" style={{ marginTop: '20px' }}>
            <div className="bx--col">
              <button id="toggleCorrection" className="bx--btn bx--btn--secondary">
                Afficher la correction
              </button>
            </div>
            <div className="bx--col">
              <button id="corriger" className="bx--btn bx--btn--tertiary">
                Corriger
              </button>
            </div>
          </div>

          {/* Contrôles de navigation */}
          <div
            id="navigation-controls"
            className="bx--row"
            style={{ marginTop: '20px', display: 'none' }}
          >
            <div className="bx--col">
              <button id="prevQuestion" className="bx--btn bx--btn--ghost">
                Précédent
              </button>
            </div>
            <div className="bx--col" style={{ textAlign: 'center' }}>
              <span id="progressIndicator" className="bx--type-body">
                Question 1/4
              </span>
            </div>
            <div className="bx--col" style={{ textAlign: 'right' }}>
              <button id="nextQuestion" className="bx--btn bx--btn--ghost">
                Suivant
              </button>
            </div>
          </div>
        </div>

        {/* Zone d'affichage des questions */}
        <div id="exercise-content" className="bx--row" style={{ marginTop: '20px' }}>
          {/* Le contenu sera injecté par le script */}
        </div>

        {/* Chargement du script principal */}
        {/*<Script type="module" src="/script.js" strategy="afterInteractive" />*/}
        {selectedFile && <ScriptComponent key={selectedFile} file={selectedFile} />}

        {/* Chargement de MathJax */}
        <Script
          id="MathJax-script"
          src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"
          strategy="afterInteractive"
        />

        {/* Chargement de GeoGebra et du polyfill */}
        <Script src="https://www.geogebra.org/apps/deployggb.js" strategy="afterInteractive" />
        {/*<Script src="https://polyfill.io/v3/polyfill.min.js?features=es6" strategy="afterInteractive" />*/}
      </main>

      <footer className="bx--grid">
        <div className="bx--row footer-content">
          <div className="bx--col-lg-4 bx--col-md-4 bx--col-sm-4">
            <h4>À propos</h4>
            <p>
              Ce site interactif propose des exercices dynamiques et adaptés pour faciliter votre apprentissage.
            </p>
          </div>
          <div className="bx--col-lg-4 bx--col-md-4 bx--col-sm-4">
            <h4>Liens utiles</h4>
            <ul>
              <li><a href="#">Accueil</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Mentions légales</a></li>
            </ul>
          </div>
          <div className="bx--col-lg-4 bx--col-md-4 bx--col-sm-4">
            <h4>Réseaux sociaux</h4>
            <ul>
              <li><a href="#">Twitter</a></li>
              <li><a href="#">LinkedIn</a></li>
              <li><a href="#">GitHub</a></li>
            </ul>
          </div>
        </div>
        <div className="bx--row footer-bottom">
          <div className="bx--col" style={{ textAlign: 'center' }}>
            <small className="license-info">
              Cette œuvre est mise à disposition sous licence{' '}
              <a href="LICENSE.txt" target="_blank" rel="noopener noreferrer">
                Creative Commons Attribution 4.0 International
              </a>
              .
            </small>
          </div>
        </div>
      </footer>
    </div>
  );
}
