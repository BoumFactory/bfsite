/***************************************************
 * Variables globales et sélection des éléments DOM
 ***************************************************/

    let exerciseData = null;
    let currentQuestionIndex = 0;
    let userAnswers = {}; // userAnswers[questionIndex] = tableau des réponses pour chaque math-field
    let correctionMode = false; // mode "afficher correction" activé/désactivé
    const exoPath = document.getElementById("exoFileInput")
    const exerciseTitle = document.getElementById("exercise-title");
    const exerciseInstructions = document.getElementById("exercise-instructions");
    const exerciseContent = document.getElementById("exercise-content");
    const progressIndicator = document.getElementById("progressIndicator");
    const prevQuestionBtn = document.getElementById("prevQuestion");
    const nextQuestionBtn = document.getElementById("nextQuestion");
    const toggleCorrectionBtn = document.getElementById("toggleCorrection");
    const corrigerBtn = document.getElementById("corriger");
    const loadButton = document.getElementById("load-exercise-button");
    const selector = document.getElementById("exercise-selector");
    document.getElementById("navigation-controls").style.display = "flex";

/**
imoprtation pour les outils mathalea

import algebrite from '../node_modules/algebrite/dist/algebrite.js';
import Decimal from '../node_modules/decimal.js/decimal.d.ts';
import { equal, evaluate, format, Fraction, gcd, isArray, isInteger, isPrime, matrix, parse, round } from '../node_modules/mathjs/lib/browser/math.js';
 */
window.notify = function(arg) {
  console.log(arg);
};

import 'mathjs';

/*
import algebrite from 'algebrite';
import Decimal from 'decimal.js';
//

import { texteParPosition } from './modules/2d.js'
import { context } from './modules/context.js'
import FractionX from './modules/FractionEtendue.js'
import { fraction } from './modules/fractions.js'
import { setReponse } from './modules/gestionInteractif.js'
import { getVueFromUrl } from './modules/gestionUrl.js'
import { loadScratchblocks } from './modules/loaders.js'
export const tropDeChiffres = 'Trop de chiffres'
export const epsilon = 0.000001
const math = {format, evaluate}
*/


/**
 * Crée un combobox (élément <select>) à partir d'un tableau de chaînes.
 */
function buildComboBox(list,qIndex,currentFieldIndex,exoIndex) {
  console.log("Liste :", list)
  
  const select = document.createElement("select");
  
  const mliste = list.split("{")[1].split("}")[0].split(";")
  mliste.forEach(item => {
    const option = document.createElement("option");
    option.value = item;
    option.textContent = item;
    select.appendChild(option);
  });

  // Initialisation de l'objet userAnswers si nécessaire
  if (!userAnswers[exoIndex]) {
    userAnswers[exoIndex] = [];
  }
  if (!userAnswers[exoIndex][qIndex]) {
    userAnswers[exoIndex][qIndex] = [];
  }

  // Restauration de la saisie utilisateur si elle existe
  if (userAnswers[exoIndex][qIndex][currentFieldIndex] !== undefined) {
    select.value = userAnswers[exoIndex][qIndex][currentFieldIndex];
  } else {
    // Enregistre la valeur initiale si aucune réponse n'existe
    userAnswers[exoIndex][qIndex][currentFieldIndex] = select.value;
  }

  // Ajout d'un écouteur pour sauvegarder la valeur choisie lors du changement
  select.addEventListener("change", function () {
    userAnswers[exoIndex][qIndex][currentFieldIndex] = select.value;
  });
  return select;
}
/**
 * Handler pour la commande \tcfillcrep{}.
 * On s'appuie sur la fonction buildLatexLine qui découpe la chaîne et
 * insère un champ de saisie entre les segments.
 */
function handleTcfillcrep(qIndex,currentFieldIndex,exoIndex) {
  // On utilise des valeurs par défaut pour qIndex et exoIndex
  //const currentFieldIndex = fieldIndexCallback();

  const container = createMathField(qIndex, currentFieldIndex, exoIndex);
  return container
}

/***************************************************
 * Chargement de l'exercice depuis le fichier JSON
 ***************************************************/

// Nouvelle fonction loadExercises qui récupère le JSON contenant plusieurs exercices
export function loadExercises(filePath) {
    fetch(filePath)
      .then((response) => response.json())
      .then((data) => {
        let exercises = [];
        if (Array.isArray(data)) {
          exercises = data;
        } else if (data.exercises) {
          exercises = data.exercises;
        } else if (data.title) {
          exercises = [data];
        } else {
          console.error("Format JSON non reconnu.");
          return;
        }
        window.loadedExercises = exercises;
        const selector = document.getElementById("exercise-selector");
        selector.innerHTML = "";
        exercises.forEach((exo, index) => {
          const option = document.createElement("option");
          option.value = index;
          option.textContent = exo.title || `Exercice ${index + 1}`;
          selector.appendChild(option);
          userAnswers[index]={}
        });
        
        // Charger automatiquement le premier exercice par défaut
        if (exercises.length > 0) {
          loadExercise(exercises[0],0);
        }
      })
      .catch((err) =>
        console.error("Erreur lors du chargement du JSON :", err)
      );
  }
  
  export function loadExercise(exoPath, exoIndex) {
    // Si exoPath est un objet (déjà chargé), on l'utilise directement
    if (typeof exoPath === "object") {
      exerciseData = exoPath;
      exerciseTitle.textContent = exoPath.title;
      exerciseInstructions.textContent = exoPath.instructions;
      
      /*
      const totalPoints = exerciseData.questions.reduce(
        (sum, q) => sum + (q.points || 0),
        0
      );
      */
      const totalPoints = exerciseData.questions.reduce(
        (sum, q) => sum + (q.correction.length || 0),
        0
      );
      let totalPointsElem = document.getElementById("exercise-total-points");
      if (!totalPointsElem) {
        totalPointsElem = document.createElement("p");
        totalPointsElem.id = "exercise-total-points";
        exerciseTitle.insertAdjacentElement("afterend", totalPointsElem);
      }
      totalPointsElem.textContent = "Total des points : " + totalPoints;
    
      renderQuestion(exoIndex,currentQuestionIndex);
      loadMathLiveAdvanced();
      MathJax.typesetPromise();
    } else {
    // Cas existant : si exoPath est une URL
    fetch(exoPath)
        .then((response) => response.json())
        .then((data) => {
        exerciseData = data;
        exerciseTitle.textContent = data.title;
        exerciseInstructions.textContent = data.instructions;
        const totalPoints = exerciseData.questions.reduce(
            (sum, q) => sum + (q.points || 0),
            0
        );
        let totalPointsElem = document.getElementById("exercise-total-points");
        if (!totalPointsElem) {
            totalPointsElem = document.createElement("p");
            totalPointsElem.id = "exercise-total-points";
            exerciseTitle.insertAdjacentElement("afterend", totalPointsElem);
        }
        totalPointsElem.textContent = "Total des points : " + totalPoints;

        renderQuestion(0, currentQuestionIndex);
        loadMathLiveAdvanced();
        MathJax.typesetPromise();
        })
        .catch((err) =>
        console.error("Erreur lors du chargement du JSON :", err)
        );
    }
}

window.loadExercise = loadExercise;


/***************************************************
 * Chargement et configuration de MathLive (mode Advanced)
 ***************************************************/
function loadMathLiveAdvanced(callback) {
  if (typeof MathLive !== "undefined") {
    configureMathLiveAdvanced();
    if (callback) callback();
    return;
  }
  const script = document.createElement("script");
  // Chargement de la version Advanced (avec matrices, etc.)
  script.src = "https://unpkg.com/mathlive";
  script.onload = function () {
    configureMathLiveAdvanced();
    if (callback) callback();
  };
  document.head.appendChild(script);
}

function configureMathLiveAdvanced() {
  document.querySelectorAll("math-field").forEach((field) => {
    field.setAttribute("virtual-keyboard-mode", "manual");
    field.setAttribute("smart-mode", "true");
    field.inlineShortcuts = {
      cdot: "\\times",
      "*": "\\times",
      sqrt: "\\sqrt",
      matrix: "\\matrix",
    };
  });
}

/***************************************************
 * Création d'un math-field pour une réponse
 ***************************************************/
function createMathField(qIndex, fieldIndex, exoIndex) {
const mf = document.createElement("math-field");
mf.setAttribute("virtual-keyboard-mode", "manual");
mf.setAttribute("smart-mode", "true");
mf.style.minWidth = "10cm";
mf.style.fontSize = "1.2em";
// Restauration de la saisie utilisateur si elle existe
if (userAnswers[exoIndex][qIndex] && userAnswers[exoIndex][qIndex][fieldIndex] !== undefined) {
    mf.value = userAnswers[exoIndex][qIndex][fieldIndex];
}
// Sauvegarde automatique lors de la saisie et correction de "cdot"
mf.addEventListener("input", function () {
    let currentValue = mf.value;
    // Sauvegarder la position du curseur si la méthode est disponible
    let caretPos = mf.getCaretPosition ? mf.getCaretPosition() : null;
    // Remplacer toutes les occurrences "cdot" par "times"
    let newValue = currentValue.replace(/cdot/g, "times");
    if (currentValue !== newValue) {
    // Calculer l'offset : pour chaque occurrence avant la position du curseur, ajuster la différence de longueur
    let diff = 0;
    let regex = /cdot/g;
    let match;
    while ((match = regex.exec(currentValue)) !== null) {
        if (match.index < (caretPos || 0)) {
        diff += "times".length - "cdot".length;
        }
    }
    mf.value = newValue;
    if (caretPos !== null && mf.setCaretPosition) {
        mf.setCaretPosition(caretPos + diff);
    }
    }
    if (!userAnswers[exoIndex][qIndex]) {
    userAnswers[exoIndex][qIndex] = [];
    }
    userAnswers[exoIndex][qIndex][fieldIndex] = mf.value;
});
return mf;
}

// Dictionnaire des commandes (pour une extension future)
// Ici, on se base sur des fonctions déjà définies pour chaque commande.
const commandHandlers = {
  "tcfillcrep": handleTcfillcrep,
  "liste": handleListe,
  "tabular": handleTabular,
};

/**
 * Fonction principale qui parse l'input.
 * Si l'input est une chaîne, elle recherche les commandes via regex et
 * les remplace par les éléments générés par leur handler.
 * Si l'input est une liste, elle retourne un combobox.
 */
function parseInput(input,qIndex,exoIndex, FieldIndex, fieldIndexCallback) {
  //console.log("User Answers : ", userAnswers)
  
  if (typeof input === "string") {
    // Crée un conteneur DOM pour le résultat
    const container = document.createElement("div");
    // Regex qui capture les commandes suivantes : \tcfillcrep{}, \liste{...} et \begin{tabular} ... \end{tabular}
    const regex = /(\\tcfillcrep\{\}|\\begin{commande}[\s\S]+?\\end{commande}|\\acc\{[^}]+\}|\\hfill(?:\{[^}]+\})?|\\liste\{[^}]+\}|\\begin\{tabular\}[\s\S]+?\\end\{tabular\}|\\begin\{tcbtab\}[\s\S]+?\\end\{tcbtab\}|\\begin\{minipage\}[\s\S]+?\\end\{minipage\}|\\begin\{multicols\}\{\s*\d+\s*\}[\s\S]+?\\end\{multicols\}|\\begin\{center\}[\s\S]+?\\end\{center\}|\\begin\{enumerate\}[\s\S]+?\\end\{enumerate\}|\\begin\{itemize\}[\s\S]+?\\end\{itemize\}|\\begin{boite}[\s\S]+?\\end{boite}|\\begin\{tikzpicture\}[\s\S]+?\\end\{tikzpicture\})/g;
    let lastIndex = 0;
    let currentFieldIndex = fieldIndexCallback();
    //console.log("My input : ",currentFieldIndex, input)
    let match;
    // Parcours de la chaîne pour détecter chaque commande
    while ((match = regex.exec(input)) !== null) {
      //console.log("currentFieldIndex :", currentFieldIndex)
      // Ajoute le texte qui précède la commande
      if (match.index > lastIndex) {
        const textPart = input.substring(lastIndex, match.index);
        container.appendChild(document.createTextNode(textPart));
      }
      const token = match[0];
      // Identification de la commande et appel de la fonction associée
      if (token.startsWith("\\tcfillcrep")) {
        let fieldIndex = fieldIndexCallback();
        const element = handleTcfillcrep(qIndex,fieldIndex,exoIndex);
        //let currentFieldIndex = fieldIndexCallback();
        container.appendChild(element);
      } else if (token.startsWith("\\liste")) {
        let fieldIndex = fieldIndexCallback();
        const element = buildComboBox(token,qIndex,fieldIndex,exoIndex)
        //let currentFieldIndex = fieldIndexCallback();
        container.appendChild(element);
      } else if (token.startsWith("\\acc")) {
        // Commande d'accentuation à traiter avec un style CSS "accentued"
        const element = handleAcc(token, qIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\hfill")) {
        // Traitement de hfill (exemple, à ajuster selon vos besoins)
        const element = handleHfill(token, qIndex, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{tabular}") || token.startsWith("\\begin{tcbtab}")) {
        const element = handleTabular(token,qIndex,currentFieldIndex, fieldIndexCallback,exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{minipage}")) {
        // Traitement spécifique pour minipage
        const element = handleMinipage(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{multicols}")) {
        // Traitement spécifique pour multicols
        const element = handleMulticols(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{center}")) {
        const element = handleCenter(token, qIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{enumerate}")) {
        const element = handleEnumerate(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{itemize}")) {
        const element = handleItemize(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      } else if (token.startsWith("\\begin{tikzpicture}")) {

        //let fieldIndex = fieldIndexCallback();

        // Squelette pour tikzpicture (à compléter ultérieurement)
        const element = handleTIKZPicture(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(element);
      }  else if (token.startsWith("\\begin{boite}")) {
        // Pour l'environnement boite, on traite la totalité de l'environnement
        const remaining = input.substring(match.index);
        const boiteObj = handleBoite(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
        container.appendChild(boiteObj.element);
        // On avance l'index de lecture jusqu'à la fin de l'environnement boite
        lastIndex = match.index + boiteObj.endIndex;
        regex.lastIndex = lastIndex;
        continue; // On passe à l'itération suivante
      } else if (token.startsWith('\\begin{commande}')) {
        handleMathaleaTool(token)
        .then(result => {
          // Si result n'est pas un Node, on le convertit dans une balise <div>
          if (!(result instanceof Node)) {
            const node = document.createElement('div');
            node.textContent = result; // ou node.innerHTML = result; selon vos besoins
            container.appendChild(node);
          } else {
            container.appendChild(result);
          }
        })
        .catch(error => {
          console.error("Erreur lors de l'exécution de l'outil :", error);
        });
      } else {
        // Commande inconnue, on l'ajoute en texte brut
        container.appendChild(document.createTextNode(token));
      }
      lastIndex = regex.lastIndex;
    }
    // Ajoute le texte restant après la dernière commande
    if (lastIndex < input.length) {
      container.appendChild(document.createTextNode(input.substring(lastIndex)));
    }
    return container;
  } else {//if (Array.isArray(input)) {
    // Dans le cas d'une liste, on propose directement un combobox
    console.log("Input array bizarre : ", input);
  }
}


/**
 * Fonction qui construit une ligne LaTeX en découpant sur \tcfillcrep{} et
 * en insérant un champ de saisie (par exemple, un input) entre chaque segment.
 */
/**
 * Fonction qui construit une ligne LaTeX en découpant sur \tcfillcrep{} et
 * en insérant un champ de saisie (par exemple, un input) entre chaque segment.
 * Pour chaque segment obtenu, parseInput est appelé pour détecter et traiter
 * d'autres commandes LaTeX éventuelles.
 */
function buildLatexLine(latexStr, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback) {
  const container = document.createElement("span");
  // Découpe la chaîne sur la commande \tcfillcrep{}
  //const currentFieldIndex = fieldIndexCallback();
  
  const parsedPart = parseInput(latexStr,qIndex,exoIndex, currentFieldIndex, fieldIndexCallback);
  container.appendChild(parsedPart);
  /*
  parts.forEach((part, index) => {
    // Appel de parseInput pour traiter le segment (possiblement contenant d'autres commandes)
    const parsedPart = parseInput(part);
    container.appendChild(parsedPart);
    // Insère un champ de saisie pour chaque découpe (sauf après le dernier segment)
    if (index < parts.length - 1) {
      const currentFieldIndex = fieldIndexCallback();
      const mf = createMathField(qIndex, currentFieldIndex, exoIndex);
      container.appendChild(mf);
    }
  });
  */
  return container;
}


/**
 * Handler pour la commande \liste{...}.
 * Extrait les options séparées par des points-virgules et crée un combobox.
 */
function handleListe(latexStr) {
  const regex = /\\liste\{([^}]+)\}/;
  const match = regex.exec(latexStr);
  if (match) {
    const options = match[1].split(";").map(opt => opt.trim());
    const select = document.createElement("select");
    options.forEach(option => {
      const opt = document.createElement("option");
      opt.value = option;
      opt.textContent = option;
      select.appendChild(opt);
    });
    return select;
  }
  return document.createTextNode(latexStr);
}

function handleAcc(token, qIndex, fieldIndexCallback, exoIndex) {
  // Extraction du contenu entre accolades pour \acc{...}
  const match = token.match(/\\acc\{([^}]+)\}/);
  const content = match ? match[1] : token;
  const span = document.createElement("span");
  span.className = "accentued"; // La classe CSS à définir pour le style d'accentuation
  span.textContent = content;
  return span;
}
// --- Commande \hfill adaptée ---
function handleHfill(token, qIndex, exoIndex) {
  // On vérifie la forme \hfill{quelqueChose} ou juste \hfill
  const regex = /^\\hfill(?:\{([^}]+)\})?$/;
  const match = token.match(regex);
  if (match) {
    // Contenu éventuellement mis entre accolades
    const content = match[1] || "";
    const span = document.createElement("span");
    // On choisit "inline-block" pour que la largeur fixe soit respectée
    span.style.display = "inline-block";
    span.style.width = "2cm";
    // Éventuellement, on affiche le texte s'il y en a un
    if (content) {
      span.textContent = content;
    }
    return span;
  } else {
    return document.createTextNode(token);
  }
}
function handleTIKZPicture(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex) {
  // Extraction du contenu entre \begin{tikzpicture} et \end{tikzpicture}
  const match = token.match(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/);
  const resource = match ? match[1].trim() : "";
  
  // Détermination du type de ressource :
  // Si le contenu commence par "data/", c'est un chemin local (filename), sinon c'est un material_id.
  let resourceParamStr = "";
  if (resource) {
    if (resource.startsWith("data/")) {
      console.log(resource.replace("data/","./"))
      resourceParamStr = `, filename: "${resource.replace("data/","./")}"`;
    } else {
      resourceParamStr = `, material_id: "${resource}"`;
    }
  } else {
    resourceParamStr = `, material_id: "RHYH3UQ8"`;
  }
  
  // Création du container principal de l'applet GeoGebra
  const container = document.createElement("div");
  container.className = "ggb-container";
  container.style.width = "1200px";
  container.style.height = "300px";
  container.style.position = "relative";
  container.style.border = "1px solid #ccc";
  
  // Création du div qui recevra l'applet (il occupera 100% du container)
  const randomId = "ggb-element-" + Math.floor(Math.random() * 1000000);
  const ggbDiv = document.createElement("div");
  ggbDiv.id = randomId;
  ggbDiv.style.width = "100%";
  ggbDiv.style.height = "100%";
  container.appendChild(ggbDiv);
  
  // Injection de l'applet GeoGebra avec sauvegarde/restauration de l'état
  const scriptEl = document.createElement("script");
  scriptEl.textContent = `
    (function() {
      var params = {
        appName: "geometry",
        width: ${parseInt(container.style.width, 10)},
        height: ${parseInt(container.style.height, 10)},
        showToolBar: true,
        showAlgebraInput: true,
        showMenuBar: true,
        language: "fr",
        errorDialogsActive: false,
        enableUndo: false,
        borderColor: "#cccccc",
        backgroundColor: "#ffffff",
        allowStyleBar: true,
        allowRescaling: true,
        showResetIcon: true,
        showToolBarHelp: true,
        customToolbar: "",
        isPreloader: false,
        useBrowserForJS: true
        ${resourceParamStr}
      };
      window.myGgbApplet = new GGBApplet(params, true);
      setTimeout(function() {
        window.myGgbApplet.inject("${randomId}");
        // Restauration de l'état sauvegardé (si existant)
        if (window.userAnswers && 
            window.userAnswers[${exoIndex}] && 
            window.userAnswers[${exoIndex}][${qIndex}] && 
            window.userAnswers[${exoIndex}][${qIndex}][${currentFieldIndex}]) {
          window.myGgbApplet.setXML(window.userAnswers[${exoIndex}][${qIndex}][${currentFieldIndex}]);
        }
        // Enregistrement automatique des mises à jour de l'applet
        if (window.myGgbApplet && typeof window.myGgbApplet.registerClientListener === "function") {
        window.myGgbApplet.registerClientListener(function(event) {
          // Cet événement est appelé lorsque la construction est mise à jour.
          // Vous pouvez ensuite récupérer le XML et le sauvegarder.
          if (!window.userAnswers) { window.userAnswers = []; }
          if (!window.userAnswers[exoIndex]) { window.userAnswers[exoIndex] = []; }
          if (!window.userAnswers[exoIndex][qIndex]) { window.userAnswers[exoIndex][qIndex] = []; }
          window.userAnswers[exoIndex][qIndex][currentFieldIndex] = window.myGgbApplet.getXML();
          console.log("XML :", window.myGgbApplet.getXML())
        });
      };
      }, 0);
    })();
  `;
  container.appendChild(scriptEl);
  
  // Création d'un handle de redimensionnement en coin inférieur droit
  const resizer = document.createElement("div");
  resizer.className = "resizer";
  container.appendChild(resizer);
  
  // Gestion du redimensionnement par glisser-déposer
  let startX, startY, startWidth, startHeight;
  function initDrag(e) {
    startX = e.clientX;
    startY = e.clientY;
    startWidth = parseInt(window.getComputedStyle(container).width, 10);
    startHeight = parseInt(window.getComputedStyle(container).height, 10);
    document.documentElement.addEventListener("mousemove", doDrag, false);
    document.documentElement.addEventListener("mouseup", stopDrag, false);
    e.preventDefault();
  }
  function doDrag(e) {
    const newWidth = startWidth + e.clientX - startX;
    const newHeight = startHeight + e.clientY - startY;
    container.style.width = newWidth + "px";
    container.style.height = newHeight + "px";
    ggbDiv.style.width = "100%";
    ggbDiv.style.height = "100%";
    const iframe = container.querySelector("iframe");
    if (iframe) {
      iframe.style.width = "100%";
      iframe.style.height = "100%";
    }
    e.preventDefault();
  }
  function stopDrag(e) {
    document.documentElement.removeEventListener("mousemove", doDrag, false);
    document.documentElement.removeEventListener("mouseup", stopDrag, false);
    e.preventDefault();
  }
  resizer.addEventListener("mousedown", initDrag, false);
  
  return container;
}



/**
 * Extrait le contenu d'un argument entre accolades en tenant compte des accolades imbriquées.
 * @param {string} str La chaîne à parser.
 * @param {number} startIndex L'indice où se trouve une accolade ouvrante '{'.
 * @returns {object} { argument: contenu, endIndex: indice après la fermeture }.
 * @throws Si aucune accolade fermante correspondante n'est trouvée.
 */
/**
 * Extrait le contenu d'un argument entre accolades en tenant compte des accolades imbriquées.
 * Si aucune accolade fermante n'est trouvée, retourne le contenu extrait jusqu'à la fin.
 * @param {string} str La chaîne à parser.
 * @param {number} startIndex L'indice où se trouve une accolade ouvrante '{'.
 * @returns {object} { argument: contenu, endIndex: indice après la fermeture (ou fin de chaîne), incomplete: true|false }.
 */
function extractArgument(str, startIndex) {
  if (str[startIndex] !== '{') {
    throw new Error("Expected '{' at index " + startIndex);
  }
  let depth = 0;
  let argument = "";
  let i = startIndex;
  for (; i < str.length; i++) {
    const char = str[i];
    if (char === '{') {
      depth++;
      if (depth > 1) {
        argument += char;
      }
    } else if (char === '}') {
      depth--;
      if (depth === 0) {
        return { argument, endIndex: i + 1, incomplete: false };
      } else {
        argument += char;
      }
    } else {
      argument += char;
    }
  }
  // Si on arrive ici, la fermeture est manquante
  return { argument, endIndex: i, incomplete: true };
}

/**
 * Gère l'environnement boite.
 * La syntaxe attendue est :
 *   \begin{boite}[titre éventuel]
 *   contenu
 *   \end{boite}
 *
 * @param {string} token La chaîne commençant par "\begin{boite}"
 * @param {*} qIndex
 * @param {*} fieldIndexCallback
 * @param {*} exoIndex
 * @returns {object} { element: HTMLElement, endIndex: number } 
 *                   endIndex indique la position dans token juste après "\end{boite}"
 */
function handleBoite(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex) {
  // On attend que token commence par "\begin{boite}"
  // On extrait l'optionnel [titre]
  const pattern = /^\\begin\{boite\}\s*(\[[^\]]*\])?\s*/;
  const m = token.match(pattern);
  if (!m) {
    const errorDiv = document.createElement("div");
    errorDiv.textContent = "Erreur dans \\begin{boite}";
    return { element: errorDiv, endIndex: token.length };
  }
  let title = "";
  let mtitle = ""
  let color = ""

  if (m[1]) {
    // m[1] contient par exemple "[Mon titre]"
    mtitle = m[1].slice(1, -1).trim();
    title=mtitle.split(",")[0]
    color=mtitle.split(",")[1].trim()
  }
  const startContentIndex = m[0].length;
  // On cherche la position de "\end{boite}" à partir de startContentIndex
  const endEnvIndex = token.indexOf("\\end{boite}", startContentIndex);
  if (endEnvIndex === -1) {
    const errorDiv = document.createElement("div");
    errorDiv.style.border = "1px solid red";
    errorDiv.style.padding = "0.5em";
    errorDiv.textContent = "Erreur : \\end{boite} manquant";
    return { element: errorDiv, endIndex: token.length };
  }
  // Extraction du contenu de l'environnement
  const contenu = token.substring(startContentIndex, endEnvIndex);
  
  // Création de la structure HTML de la boîte
  const boite = document.createElement("div");

  // Si un titre est fourni, on le crée
  if (title) {
    const boiteTitre = document.createElement("div");
    boiteTitre.className = "boite-titre";
    boiteTitre.textContent = title;
    boite.appendChild(boiteTitre);
  }
  
  const boiteContenu = document.createElement("div");
  boiteContenu.className = "boite-contenu";
  // On traite récursivement le contenu
  const innerContent = parseInput(contenu, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
  boiteContenu.appendChild(innerContent);
  boite.appendChild(boiteContenu);
  
  // Retourne l'élément et la position juste après "\end{boite}"
  return { element: boite, endIndex: endEnvIndex + "\\end{boite}".length };
}
function handleMinipage(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex) {
  // Regex mise à jour pour accepter des espaces éventuels autour du ratio
  const regex = /\\begin\{minipage\}\{\s*([0-9]*\.?[0-9]+)\s*\\textwidth\s*\}([\s\S]+?)\\end\{minipage\}/;
  const match = token.match(regex);
  if (match) {
    const widthRatio = parseFloat(match[1]); // ex: 0.35
    const content = match[2];
    const div = document.createElement("div");
    // On utilise inline-block pour une répartition latérale
    div.style.display = "inline-block";
    div.style.verticalAlign = "top";
    div.style.width = (widthRatio * 100) + "%"; // par exemple "35%"
    // On parse récursivement le contenu interne
    const innerContent = parseInput(content, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
    div.appendChild(innerContent);
    return div;
  } else {
    const div = document.createElement("div");
    div.textContent = "Unknown environment 'minipage'";
    return div;
  }
}
function handleMulticols(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex) {
  // Extraction du nombre de colonnes et du contenu
  const regex = /\\begin\{multicols\}\{\s*(\d+)\s*\}([\s\S]+?)\\end\{multicols\}/;
  const match = token.match(regex);
  if (match) {
    const numCols = parseInt(match[1], 10);
    let content = match[2];
    
    // Vérification de la présence de \columnbreak dans le contenu
    if (content.includes("\\columnbreak")) {
      // Découpage sur \columnbreak pour forcer la séparation
      const columnsContent = content.split(/\\columnbreak/);
      const container = document.createElement("div");
      container.style.display = "flex";
      container.style.gap = "1em"; // espace entre colonnes
      columnsContent.forEach(piece => {
        const colDiv = document.createElement("div");
        // Chaque colonne occupe une part égale de l'espace
        colDiv.style.flex = "1";
        const innerContent = parseInput(
          piece,
          qIndex,
          exoIndex,
          currentFieldIndex,
          fieldIndexCallback
        );
        colDiv.appendChild(innerContent);
        container.appendChild(colDiv);
      });
      return container;
    } else {
      // Pas de \columnbreak : utilisation de CSS columns
      const div = document.createElement("div");
      div.style.columnCount = numCols;
      div.style.columnGap = "1em"; // espace entre colonnes
      const innerContent = parseInput(
        content,
        qIndex,
        exoIndex,
        currentFieldIndex,
        fieldIndexCallback
      );
      div.appendChild(innerContent);
      return div;
    }
  } else {
    const div = document.createElement("div");
    div.textContent = "Unknown environment 'multicols'";
    return div;
  }
}
function handleEnumerate(token, qIndex,currentFieldIndex , fieldIndexCallback, exoIndex) {
  const regex = /\\begin\{enumerate\}([\s\S]+?)\\end\{enumerate\}/;
  const match = token.match(regex);
  if (match) {
    const content = match[1];
    const ol = document.createElement("ol");
    // Ajout de la classe pour le style de liste énumérée
    ol.classList.add("latex-enumerate");
    // Découpage sur \item (le premier élément peut être vide)
    const items = content.split(/\\item/);
    items.forEach(itemText => {
      const trimmed = itemText.trim();
      if (trimmed) {
        const li = document.createElement("li");
        li.classList.add("latex-list-item");
        const innerContent = parseInput(
          trimmed,
          qIndex,
          exoIndex,
          currentFieldIndex,
          fieldIndexCallback
        );
        li.appendChild(innerContent);
        ol.appendChild(li);
      }
    });
    return ol;
  } else {
    const div = document.createElement("div");
    div.textContent = "Unknown environment 'enumerate'";
    return div;
  }
}

function handleItemize(token, qIndex,currentFieldIndex, fieldIndexCallback, exoIndex) {
  const regex = /\\begin\{itemize\}([\s\S]+?)\\end\{itemize\}/;
  const match = token.match(regex);
  if (match) {
    const content = match[1];
    const ul = document.createElement("ul");
    // Ajout de la classe pour le style de liste non ordonnée
    ul.classList.add("latex-itemize");
    const items = content.split(/\\item/);
    items.forEach(itemText => {
      const trimmed = itemText.trim();
      if (trimmed) {
        const li = document.createElement("li");
        li.classList.add("latex-list-item");
        const innerContent = parseInput(
          trimmed,
          qIndex,
          exoIndex,
          currentFieldIndex,
          fieldIndexCallback
        );
        li.appendChild(innerContent);
        ul.appendChild(li);
      }
    });
    return ul;
  } else {
    const div = document.createElement("div");
    div.textContent = "Unknown environment 'itemize'";
    return div;
  }
}

function handleCenter(token, qIndex, fieldIndexCallback, exoIndex) {
  const regex = /\\begin\{center\}([\s\S]+?)\\end\{center\}/;
  const match = token.match(regex);
  if (match) {
    const content = match[1];
    const div = document.createElement("div");
    div.style.textAlign = "center";
    const innerContent = parseInput(content, qIndex, exoIndex, fieldIndexCallback(), fieldIndexCallback);
    div.appendChild(innerContent);
    return div;
  } else {
    const div = document.createElement("div");
    div.textContent = "Unknown environment 'center'";
    return div;
  }
}

/**
 * Handler pour l'environnement tabulaire LaTeX (\begin{tabular}...\end{tabular}).
 * Parse le contenu, le transforme en tableau HTML et traite récursivement le contenu
 * de chaque cellule via parseInput pour permettre l'insertion de commandes imbriquées.
 */
function handleTabular(latexStr,qIndex, currentFieldIndex,fieldIndexCallback,exoIndex) {
  // Regex pour extraire les options éventuelles, la "forme" et le contenu du tableau
  const regex = /\\begin\{tabular\}(?:\[(.*?)\])?\{(.*?)\}([\s\S]*?)\\end\{tabular\}/;
  const match = regex.exec(latexStr);
  if (!match) return document.createTextNode(latexStr);
  const [ , options, form, content ] = match;
  
  // Création de l'élément table et affectation d'une classe pour le style
  const table = document.createElement("table");
  table.classList.add("tabular-table");
  
  // Ici, selon "options" ou "form" on pourrait définir des attributs ou styles inline
  // (exemple : alignement des colonnes, largeur, etc.)
  
  // On suppose que chaque ligne du tableau est séparée par "\\"
  // On retire les lignes vides et on traite d'éventuels "\hline"
  const rows = content.trim().split(/\\\\/).filter(row => row.trim() !== "");
  
  rows.forEach((row, rowIndex) => {
    const tr = document.createElement("tr");
    tr.classList.add("tabular-row");
    
    // Nettoyer la ligne : retirer les \hline s'il y a lieu
    const cleanedRow = row.replace(/\\hline/g, "").trim();
    
    // Chaque cellule est séparée par "&"
    const cells = cleanedRow.split("&");
    cells.forEach((cell, cellIndex) => {
      const td = document.createElement("td");
      td.classList.add("tabular-cell");
      
      // Appliquer parseInput sur le contenu de la cellule pour traiter d'autres commandes éventuelles
      const cellContent = parseInput(cell.trim(),qIndex,exoIndex,currentFieldIndex, fieldIndexCallback);
      td.appendChild(cellContent);
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });
  
  return table;
}
async function handleMathaleaTool(token) {
  console.log("THIS IS COMMANDE JS !!!!!!!!!!!!!!!!!!!!!!!!!!!!", token);
  
  // Expression régulière pour extraire toolName et params
  // Exemple de token : "\begin{commande}{ExerciceDecomposerEnFacteursPremiers4e} 4 + 5, 2 \end{commande}"
  const commandeRegex = /\\begin\{commande\}\{([^}]+)\}(?:\s*([\s\S]+?))?\s*\\end\{commande\}/;
  const match = commandeRegex.exec(token);
  
  if (!match) {
    throw new Error("La commande n'a pas été reconnue.");
  }
  
  // Extraction et nettoyage du nom de l'outil
  const toolName = match[1].trim();
  
  // Extraction et parsing des paramètres (ici, attendus sous forme d'un tableau JSON)
  let params = [];
  if (match[2]) {
    try {
      params = match[2].split(',');

    } catch (error) {
      console.error("Erreur lors du parsing des paramètres :", error);
    }
  }
  /*
  console.log("toolname :", toolName," | params :", params)
  // Importation dynamique du module 'outils.js' uniquement quand c'est nécessaire
  const outilsModule = await import('./modules/outils.js');

  // Récupération de l'outil souhaité dans le module
  const tool = outilsModule[toolName];
  if (typeof tool !== 'function') {
    throw new Error(`L'outil ${toolName} n'existe pas ou n'est pas une fonction.`);
  }
  
  // Appel de l'outil en passant les paramètres
  return tool(...params);
  */
  function arrondi (nombre, precision = 2) {
    if (isNaN(nombre)) {
      window.notify('Le nombre à arrondir n\'en est pas un, ça retourne NaN', {nombre, precision})
      return NaN
    } else {
      return round(nombre, precision)
    }
  }
  function calcul (x, arrondir = 6) {
    const sansPrecision = (arrondir === undefined)
    // if (sansPrecision) arrondir = 6
    if (typeof x === 'string') {
      window.notify('Calcul : Reçoit une chaine de caractère et pas un nombre', {x})
      x = parseFloat(evaluate(x))
    }
    if (sansPrecision && !egal(x, arrondi(x, arrondir), 10 ** (-arrondir - 1))) {
      window.notify('calcul : arrondir semble avoir tronqué des décimales sans avoir eu de paramètre de précision', {
        x,
        arrondir
      })
    }
    return parseFloat(x.toFixed(arrondir))
  }
  return calcul(...params)
}

function manageExoVars(input, vars) {
  // Pour chaque clé dans l'objet des variables
  for (const key in vars) {
    // Créer une regex pour rechercher la variable sous forme \clé
    const regex = new RegExp('\\\\' + key, 'g');
    // Remplacer toutes les occurrences par la valeur correspondante
    input = input.replace(regex, vars[key]);
    input = processFpeval(input)
  }
  return input;
}

function processFpeval(input) {
  const regex = /\\fpeval\{([^}]+)\}/g;
  return input.replace(regex, (match, expr) => {
    try {
      const result = expr;
      console.log(expr)
      return result;
    } catch (error) {
      console.error("Erreur lors de l'évaluation de l'expression :", expr, error);
      return match;
    }
  });
}



/***************************************************
 * Rendu d'une question (mode "question par question")
 ***************************************************/
function renderQuestion(exoIndex,qIndex) {
  // Vider la zone d'affichage et désactiver le mode correction
  try {exerciseContent.innerHTML = "";} catch {}
  correctionMode = false;
  toggleCorrectionBtn.textContent = "Afficher la correction";
  exerciseContent.style.width = "75%";  // largeur 65 % en mode single
  exerciseContent.style.margin = "0 auto";
  const question = exerciseData.questions[qIndex];
  if (!question) {
    console.error("La question d'indice", qIndex, "n'existe pas !");
    return;
  }

  // Création du conteneur de la question
  const questionDiv = document.createElement("div");
  questionDiv.classList.add("question");
  questionDiv.setAttribute("data-index", qIndex);
  // Stocker la correction attendue dans le dataset (pour usage ultérieur)
  if (Array.isArray(question.correction)) {
    questionDiv.dataset.correction = JSON.stringify(question.correction);
  } else {
    questionDiv.dataset.correction = question.correction.trim();
  }

  // Création du label de la question (ex. "Question A : ..." + points)
  const labelP = document.createElement("p");
  labelP.classList.add("bx--type-body");
  let instruc = ""
  if (question.instructions) {
    instruc = question.instructions
  } else {
    instruc = exerciseData.instructions
  }
  labelP.innerHTML = `<strong>Question ${qIndex+1} : </strong>${instruc}`;
  if (question.points !== undefined) {
    //labelP.innerHTML += ` <span class="points"><strong> (${question.points} ${question.points > 1 ? "points" : "point"})</strong></span>`;
    const points = question.correction.length
    labelP.innerHTML += ` <span class="points"><strong> (${points} ${points > 1 ? "points" : "point"})</strong></span>`;
  } else if (question.points === undefined) {
    const points = question.correction.length
    labelP.innerHTML += ` <span class="points"><strong> (${points} ${points > 1 ? "points" : "point"})</strong></span>`;
  }
  questionDiv.appendChild(labelP);

  // Construction du contenu à partir du tableau "latex"
  let localFieldIndex = 0;
  if (question.variables) {
    Object.keys(question.variables).forEach(key => {
      let value = question.variables[key];
      if (typeof value === 'string') {
        // Pour chaque autre variable, remplacer "\<otherKey>" par sa valeur
        Object.keys(question.variables).forEach(otherKey => {
          // Crée une regex pour rechercher toutes les occurrences de "\otherKey"
          const regex = new RegExp('\\\\' + otherKey, 'g');
          value = value.replace(regex, question.variables[otherKey]);
        });
        // Met à jour la variable avec la valeur remplacée
        question.variables[key] = value;
      }
    });
  }  
  if (question.latex && Array.isArray(question.latex)) {
    question.latex.forEach((line) => {
      //Pour la gestion des variables dans la question.
      const questionVars = question.variables ? question.variables : {};
      line = manageExoVars(line, questionVars);
      const lineElem = buildLatexLine(line, qIndex, exoIndex, localFieldIndex, function () {
        if (!localFieldIndex) {
          console.log("pas de field index")
        }
        return localFieldIndex++;
      });
      questionDiv.appendChild(lineElem);
    });
  } else {
    console.warn("La question", qIndex, "n'a pas de propriété 'latex'.");
  }

  // Insertion de la question dans la zone d'affichage
  exerciseContent.appendChild(questionDiv);
  // Mise à jour de l'indicateur de progression
  progressIndicator.textContent = `Question ${qIndex + 1} / ${exerciseData.questions.length}`;
  // Reconfiguration de MathLive sur les nouveaux éléments
  configureMathLiveAdvanced();
  if (window.MathJax) MathJax.typesetPromise();
}

/***************************************************
 * Affichage / Masquage du bandeau de correction
 * La correction est affichée dans un conteneur stylisé (bandeau bleu)
 * qui vient en dessous de la question, sans écraser la saisie utilisateur.
 ***************************************************/
function toggleCorrection() {
    correctionMode = !correctionMode;
    toggleCorrectionBtn.textContent = correctionMode
        ? "Masquer la correction"
        : "Afficher la correction";

    const questionDiv = exerciseContent.querySelector(".question[data-index='" + currentQuestionIndex + "']");
    if (!questionDiv) return;

    // Rechercher un conteneur de correction déjà présent
    let correctionContainer = questionDiv.querySelector(".correction");

    if (correctionMode) {
        if (!correctionContainer) {
        correctionContainer = document.createElement("div");
        correctionContainer.classList.add("correction");
        // Style du bandeau de correction (adaptable via CSS)
        correctionContainer.style.padding = "10px";
        correctionContainer.style.marginTop = "10px";
        correctionContainer.style.borderRadius = "4px";
        correctionContainer.innerHTML = "<strong>Correction :</strong>";
        // Insertion des lignes corrigées
        const question = exerciseData.questions[currentQuestionIndex];
        console.log("CORRECTION!!!!!",question.correction.length, question.correction)
        let correctionCounter = 0;
        let totalMatch = 0
        if (question.latex && Array.isArray(question.latex)) {
            question.latex.forEach((line) => {
            line = manageExoVars(line,question.variables)
            const correctedLine = line.replace(/(\\tcfillcrep\{\})|(\\liste\{([^}]*)\})/g, (match, p1, p2, p3) => {
              if (p1) {
                // Cas de \tcfillcrep{}
                console.log("Remplacement n°", correctionCounter, "par", question.correction[correctionCounter]);
                return question.correction[correctionCounter++];
              } else if (p2) {
                console.log("Remplacement n°", correctionCounter, "par", question.correction[correctionCounter]);
                
                // Vous pouvez décider de joindre les remplacements avec un espace, ou d'utiliser un autre séparateur
                return question.correction[correctionCounter++];
              }
            }).replace('|',' ou ');
            
            /*
            let p = document.createElement("p");
            p.classList.add("equation", "math");
            p.innerHTML = correctedLine;
            correctionContainer.appendChild(p);
            */
           console.log(correctedLine);
            let p = buildLatexLine(correctedLine, currentQuestionIndex, 0, 0, function () {
            });
            correctionContainer.appendChild(p);
            });
        }
        console.log(totalMatch)
        questionDiv.appendChild(correctionContainer);
        }
    } else {
        // Masquer la correction en retirant le conteneur
        if (correctionContainer) {
        correctionContainer.remove();
        }
    }
    if (window.MathJax) MathJax.typesetPromise();
    }

/***************************************************
 * Bouton "Corriger" : évaluation interactive
 * Compare la saisie utilisateur aux corrections attendues et
 * ajoute un feedback visuel (bordure colorée et icône).
 ***************************************************/
function corrigerAnswers() {
  const question = exerciseData.questions[currentQuestionIndex];
  console.log("User Answers : ", userAnswers)
  //const fields = exerciseContent.querySelectorAll("math-field");
  const fields = exerciseContent.querySelectorAll("math-field, select");
  fields.forEach((field, index) => {
    const userVal = normalizeLatex(field.value);
    let expectedVal = "";
    if (question.correction && index < question.correction.length) {
      expectedVal = normalizeLatex(question.correction[index]);
    }
    console.log("Réponse utilisateur :", userVal)
    console.log("Valeur attendue :", expectedVal)
    // On découpe la chaîne de correction sur "|" pour obtenir toutes les réponses possibles
    const expectedAnswers = expectedVal.split("|").map(answer => answer.trim());

    // Si la réponse de l'utilisateur correspond à l'une des réponses attendues
    if (expectedAnswers.some(answer => answer === userVal)) {
      field.classList.add("answer-correct");
      field.classList.remove("answer-incorrect");
      ajouterFeedback(field, "😊");
    } else {
      field.classList.add("answer-incorrect");
      field.classList.remove("answer-correct");
      ajouterFeedback(field, "☹️");
    }
  });
}
/***************************************************
 * Normalisation d'une expression LaTeX pour comparaison
 ***************************************************/
function normalizeLatex(input) {
  if (!input) return "";
  return input
    .replace(/\\dfrac/g, "\\frac")
    .replace(/\\cdot/g, "\\times")
    .replace(/\\times/g, "×")
    .replace(/{,}/g,".")
    .replace(/,/g,".")
    .replace(/{/g,"")
    .replace(/}/g,"")
    .replace(/\\[()]/g, "")
    .replace(/\s+/g, "")
    .trim();
}

/***************************************************
 * Ajout d'un feedback (icône) après un champ de réponse
 ***************************************************/
function ajouterFeedback(field, icon) {
  let feedback = field.nextElementSibling;
  if (!feedback || !feedback.classList.contains("feedback-icon")) {
    feedback = document.createElement("span");
    feedback.classList.add("feedback-icon");
    field.parentNode.insertBefore(feedback, field.nextSibling);
  }
  feedback.textContent = icon;
}

/***************************************************
 * Navigation entre les questions
 ***************************************************/
prevQuestionBtn.addEventListener("click", function () {
    const selector = document.getElementById("exercise-selector");
    const selectedIndex = parseInt(selector.value, 10);
    if (currentQuestionIndex > 0) {
    currentQuestionIndex--;
    renderQuestion(selectedIndex,currentQuestionIndex);
    }
});

nextQuestionBtn.addEventListener("click", function () {
    const selector = document.getElementById("exercise-selector");
    const selectedIndex = parseInt(selector.value, 10);
    if (currentQuestionIndex < exerciseData.questions.length - 1) {
    currentQuestionIndex++;
    renderQuestion(selectedIndex,currentQuestionIndex);
    }
});

/***************************************************
     * Chargement et configuration de l'exercice 
     ***************************************************/
    // Ajout d'un écouteur pour le bouton "Charger"
    // Ce code se déclenche une fois la page chargée, et lorsqu'on clique sur le bouton,
    // il récupère l'indice sélectionné dans le sélecteur HTML et charge l'exercice correspondant.
    document.addEventListener("DOMContentLoaded", function() {
      // Récupération des éléments
      const loadButton = document.getElementById("load-exercise-button");
      const selector = document.getElementById("exercise-selector");
      //console.log(document.getElementById("load-exercise-button"));
      //console.log(document.getElementById("exercise-selector"));
  
      // Ajout d'un écouteur pour le bouton "Charger"
      loadButton.addEventListener("click", function() {
          // Toggle de la classe 'clicked' pour indiquer visuellement le clic
          loadButton.classList.toggle("clicked");
          
          const selectedIndex = parseInt(selector.value, 10);
          console.log("Loading :", selector.value, "Index :", selectedIndex);
          
          if (window.loadedExercises && window.loadedExercises[selectedIndex]) {
          console.log(window.loadedExercises[selectedIndex]);
          loadExercise(window.loadedExercises[selectedIndex],selectedIndex);
          } else {
          console.error("Aucun exercice correspondant trouvé.");
          }
      });
});
document.addEventListener("DOMContentLoaded", function () {
    
    toggleCorrectionBtn.addEventListener("click", toggleCorrection);
    corrigerBtn.addEventListener("click", corrigerAnswers);
  
    /***************************************************
     * Initialisation
     ***************************************************/
    
    loadExercises("/public/files/college/4eme/Exercices/enonce_TOOLS_results.json")//
    //loadExercise("data/exercice_new.json");
  });
  loadExercises("/files/college/4eme/Exercices/theme_test/exo_test/enonce_TOOLS_results.json")
  