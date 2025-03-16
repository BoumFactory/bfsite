import { useEffect, useState } from 'react';
import { evaluate, round, parse } from 'mathjs';
import { MathfieldElement } from 'mathlive';

export default function ScriptComponent({ file }: { file: string }) {
    useEffect(() => {
    if (typeof document === 'undefined') return;

    (function () {
      /***************************************************
       * Variables globales et sélection des éléments DOM
       ***************************************************/
      let exerciseData: any = null;
      let currentQuestionIndex = 0;
      let userAnswers: { [key: number]: any } = {}; // userAnswers[exoIndex][qIndex] = réponses
      
      let correctionMode = false;

      const exoPath = document.getElementById("exoFileInput");
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
      const navControls = document.getElementById("navigation-controls");
      if (navControls) navControls.style.display = "flex";

      (window as any).notify = function (arg: any) {
        console.log(arg);
      };

      /***************************************************
       * Fonctions utilitaires à définir AVANT leur utilisation
       ***************************************************/

      function manageExoVars(input: string, vars: any) {
        for (const key in vars) {
          const regex = new RegExp('\\\\' + key, 'g');
          input = input.replace(regex, vars[key]);
          input = processFpeval(input);
        }
        return input;
      }

      function processFpeval(input: string) {
        const regex = /\\fpeval\{([^}]+)\}/g;
        return input.replace(regex, (match, expr) => {
          try {
            expr = expr.split(',')
            // Vous pouvez remplacer cette ligne par une évaluation réelle de l'expression
            const result = calcul(...expr);
            return result;
          } catch (error) {
            console.error("Erreur lors de l'évaluation de l'expression :", expr, error);
            return match;
          }
        });
      }

      /***************************************************
       * Fonctions principales (votre code d'origine)
       ***************************************************/

      function buildComboBox(list: string, qIndex: number, currentFieldIndex: number, exoIndex: number) {
        const select = document.createElement("select");
        const mliste = list.split("{")[1].split("}")[0].split(";");
        mliste.forEach(item => {
          const option = document.createElement("option");
          option.value = item;
          option.textContent = item;
          select.appendChild(option);
        });
        if (!userAnswers[exoIndex]) userAnswers[exoIndex] = [];
        if (!userAnswers[exoIndex][qIndex]) userAnswers[exoIndex][qIndex] = [];
        if (userAnswers[exoIndex][qIndex][currentFieldIndex] !== undefined) {
          select.value = userAnswers[exoIndex][qIndex][currentFieldIndex];
        } else {
          userAnswers[exoIndex][qIndex][currentFieldIndex] = select.value;
        }
        select.addEventListener("change", function () {
          userAnswers[exoIndex][qIndex][currentFieldIndex] = select.value;
        });
        return select;
      }

      function handleTcfillcrep(qIndex: number, currentFieldIndex: number, exoIndex: number) {
        return createMathField(qIndex, currentFieldIndex, exoIndex);
      }

      function loadExercises(filePath: string) {
        exerciseData = null;
        currentQuestionIndex = 0;
        userAnswers = {}; // userAnswers[exoIndex][qIndex] = réponses

        /* 
        TODO: Problème de récupération des données quand on charge différents exercices : ça charge aussi les données d'autres exercices...
        */

        fetch(filePath)
          .then(response => response.json())
          .then(data => {
            let exercises: any[] = [];
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
            (window as any).loadedExercises = exercises;
            if (selector) {
              selector.innerHTML = "";
              exercises.forEach((exo, index) => {
                const option = document.createElement("option");
                option.value = index.toString();
                option.textContent = exo.title || `Exercice ${index + 1}`;
                selector.appendChild(option);
                userAnswers[index] = {};
              });
            }
            if (exercises.length > 0) {
              currentQuestionIndex = 0;
              loadExercise(exercises[0], 0);
            }
          })
          .catch(err => console.error("Erreur lors du chargement du JSON :", err));
      }

      function loadExercise(exoPath: any, exoIndex: number) {
        currentQuestionIndex = 0;
        if (typeof exoPath === "object") {
          exerciseData = exoPath;
          if (exerciseTitle) exerciseTitle.textContent = exoPath.title;
          if (exerciseInstructions) exerciseInstructions.textContent = exoPath.instructions;
          const totalPoints = exerciseData.questions.reduce(
            (sum: number, q: any) => sum + (q.correction.length || 0),
            0
          );
          let totalPointsElem = document.getElementById("exercise-total-points");
          if (!totalPointsElem && exerciseTitle) {
            totalPointsElem = document.createElement("p");
            totalPointsElem.id = "exercise-total-points";
            exerciseTitle.insertAdjacentElement("afterend", totalPointsElem);
          }
          if (totalPointsElem) totalPointsElem.textContent = "Total des points : " + totalPoints;
          renderQuestion(exoIndex, currentQuestionIndex);
          loadMathLiveAdvanced();
          if ((window as any).MathJax) (window as any).MathJax.typesetPromise();
        } else {
          fetch(exoPath)
            .then(response => response.json())
            .then(data => {
              exerciseData = data;
              if (exerciseTitle) exerciseTitle.textContent = data.title;
              if (exerciseInstructions) exerciseInstructions.textContent = data.instructions;
              const totalPoints = exerciseData.questions.reduce(
                (sum: number, q: any) => sum + (q.points || 0),
                0
              );
              let totalPointsElem = document.getElementById("exercise-total-points");
              if (!totalPointsElem && exerciseTitle) {
                totalPointsElem = document.createElement("p");
                totalPointsElem.id = "exercise-total-points";
                exerciseTitle.insertAdjacentElement("afterend", totalPointsElem);
              }
              if (totalPointsElem) totalPointsElem.textContent = "Total des points : " + totalPoints;
              renderQuestion(0, currentQuestionIndex);
              loadMathLiveAdvanced();
              if ((window as any).MathJax) (window as any).MathJax.typesetPromise();
            })
            .catch(err => console.error("Erreur lors du chargement du JSON :", err));
        }
      }
      (window as any).loadExercise = loadExercise;

      function loadMathLiveAdvanced(callback?: () => void) {
        if (typeof (window as any).MathLive !== "undefined") {
          configureMathLiveAdvanced();
          if (callback) callback();
          return;
        }
        const script = document.createElement("script");
        script.src = "https://unpkg.com/mathlive";
        script.onload = function () {
          configureMathLiveAdvanced();
          if (callback) callback();
        };
        document.head.appendChild(script);
      }

      function configureMathLiveAdvanced() {
        document.querySelectorAll("math-field").forEach(field => {
          field.setAttribute("virtual-keyboard-mode", "manual");
          field.setAttribute("smart-mode", "true");
          (field as any).inlineShortcuts = {
            cdot: "\\times",
            "*": "\\times",
            sqrt: "\\sqrt",
            matrix: "\\matrix"
          };
        });
      }

      function createMathField(qIndex: number, fieldIndex: number, exoIndex: number) {
        const mf = document.createElement("math-field");
        mf.setAttribute("virtual-keyboard-mode", "manual");
        mf.setAttribute("smart-mode", "true");
        // Nouveaux styles pour que le champ s'adapte correctement
        mf.style.width = "50%";          // Utilise toute la largeur disponible
        mf.style.minHeight = "2em";
        mf.style.minWidth = "2em";       // Taille minimale plus grande
        mf.style.fontSize = "1.2em";
        // Nouvelle bordure noire plus marquée :
        mf.style.border = "2px solid black";
        mf.style.borderRadius = "4px";
        mf.style.padding = "0.2em";
        mf.style.display = "inline-block"; // Meilleur comportement de layout
        mf.style.boxSizing = "border-box"; // Pour que padding soit inclus dans width
        if (userAnswers[exoIndex][qIndex] && userAnswers[exoIndex][qIndex][fieldIndex] !== undefined) {
          mf.value = userAnswers[exoIndex][qIndex][fieldIndex];
        }
        mf.addEventListener("input", function () {
          let currentValue = mf.value;
          let caretPos = mf.getCaretPosition ? mf.getCaretPosition() : null;
          let newValue = currentValue.replace(/cdot/g, "times");
          if (currentValue !== newValue) {
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
          if (!userAnswers[exoIndex][qIndex]) userAnswers[exoIndex][qIndex] = [];
          userAnswers[exoIndex][qIndex][fieldIndex] = mf.value;
        });
        return mf;
      }

      function parseInput(input: string, qIndex: number, exoIndex: number, fieldIndex: number, fieldIndexCallback: () => number) {
        const container = document.createElement("div");
        const regex = /(\\tcfillcrep\{\}|\\begin{commande}[\s\S]+?\\end{commande}|\\acc\{[^}]+\}|\\hfill(?:\{[^}]+\})?|\\liste\{[^}]+\}|\\fpeval\{[^}]+\}|\\begin{tabular\}[\s\S]+?\\end{tabular}|\\begin{tcbtab\}[\s\S]+?\\end{tcbtab}|\\begin{minipage\}[\s\S]+?\\end{minipage}|\\begin{multicols\}\{\s*\d+\s*\}[\s\S]+?\\end{multicols}|\\begin{center\}[\s\S]+?\\end{center}|\\begin{enumerate\}[\s\S]+?\\end{enumerate}|\\begin{itemize\}[\s\S]+?\\end{itemize}|\\begin{boite\}[\s\S]+?\\end{boite}|\\begin{tikzpicture\}[\s\S]+?\\end{tikzpicture\})/g;
        let lastIndex = 0;
        let currentFieldIndex = fieldIndexCallback();
        let match;
        while ((match = regex.exec(input)) !== null) {
          if (match.index > lastIndex) {
            const textPart = input.substring(lastIndex, match.index);
            container.appendChild(document.createTextNode(textPart));
          }
          const token = match[0];
          if (token.startsWith("\\tcfillcrep")) {
            let fieldIdx = fieldIndexCallback();
            const element = handleTcfillcrep(qIndex, fieldIdx, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\liste")) {
            let fieldIdx = fieldIndexCallback();
            const element = buildComboBox(token, qIndex, fieldIdx, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\fpeval")) {
            const element = processFpeval(token);
            container.appendChild(document.createTextNode(element));
          } else if (token.startsWith("\\acc")) {
            const element = handleAcc(token, qIndex, fieldIndexCallback, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\hfill")) {
            const element = handleHfill(token, qIndex, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\begin{tabular}") || token.startsWith("\\begin{tcbtab}")) {
            const element = handleTabular(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\begin{minipage}")) {
            const element = handleMinipage(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\begin{multicols}")) {
            const element = handleMulticols(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
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
            const element = handleTIKZPicture(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
            container.appendChild(element);
          } else if (token.startsWith("\\begin{boite}")) {
            const boiteObj = handleBoite(token, qIndex, currentFieldIndex, fieldIndexCallback, exoIndex);
            container.appendChild(boiteObj.element);
            lastIndex = match.index + boiteObj.endIndex;
            regex.lastIndex = lastIndex;
            continue;
          } else if (token.startsWith("\\begin{commande}")) {
            handleMathaleaTool(token)
              .then(result => {
                if (!(result instanceof Node)) {
                  const node = document.createElement("div");
                  node.textContent = result;
                  container.appendChild(node);
                } else {
                  container.appendChild(result);
                }
              })
              .catch(error => console.error("Erreur lors de l'exécution de l'outil :", error));
          } else {
            container.appendChild(document.createTextNode(token));
          }
          lastIndex = regex.lastIndex;
        }
        if (lastIndex < input.length) {
          container.appendChild(document.createTextNode(input.substring(lastIndex)));
        }
        return container;
      }

      function buildLatexLine(latexStr: string, qIndex: number, exoIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number) {
        const container = document.createElement("span");
        const parsedPart = parseInput(latexStr, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
        container.appendChild(parsedPart);
        return container;
      }

      function handleListe(latexStr: string) {
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

      function handleAcc(token: string, qIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const match = token.match(/\\acc\{([^}]+)\}/);
        const content = match ? match[1] : token;
        const span = document.createElement("span");
        span.className = "accentued";
        span.textContent = content;
        return span;
      }

      function handleHfill(token: string, qIndex: number, exoIndex: number) {
        const regex = /^\\hfill(?:\{([^}]+)\})?$/;
        const match = token.match(regex);
        if (match) {
          const content = match[1] || "";
          const span = document.createElement("span");
          span.style.display = "inline-block";
          span.style.width = "2cm";
          if (content) span.textContent = content;
          return span;
        } else {
          return document.createTextNode(token);
        }
      }

      function handleTIKZPicture(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const match = token.match(/\\begin\{tikzpicture\}([\s\S]*?)\\end\{tikzpicture\}/);
        const resource = match ? match[1].trim() : "";
        let resourceParamStr = "";
        if (resource) {
          if (resource.startsWith("data/")) {
            resourceParamStr = `, filename: "${resource.replace("data/", "./")}"`;
          } else {
            resourceParamStr = `, material_id: "${resource}"`;
          }
        } else {
          resourceParamStr = `, material_id: "RHYH3UQ8"`;
        }
        const container = document.createElement("div");
        container.className = "ggb-container";
        container.style.width = "1200px";
        container.style.height = "300px";
        container.style.position = "relative";
        container.style.border = "1px solid #ccc";
        const randomId = "ggb-element-" + Math.floor(Math.random() * 1000000);
        const ggbDiv = document.createElement("div");
        ggbDiv.id = randomId;
        ggbDiv.style.width = "100%";
        ggbDiv.style.height = "100%";
        container.appendChild(ggbDiv);
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
              if (window.userAnswers && 
                  window.userAnswers[${exoIndex}] && 
                  window.userAnswers[${exoIndex}][${qIndex}] && 
                  window.userAnswers[${exoIndex}][${qIndex}][${currentFieldIndex}]) {
                window.myGgbApplet.setXML(window.userAnswers[${exoIndex}][${qIndex}][${currentFieldIndex}]);
              }
              if (window.myGgbApplet && typeof window.myGgbApplet.registerClientListener === "function") {
                window.myGgbApplet.registerClientListener(function(event) {
                  if (!window.userAnswers) { window.userAnswers = []; }
                  if (!window.userAnswers[${exoIndex}]) { window.userAnswers[${exoIndex}] = []; }
                  if (!window.userAnswers[${exoIndex}][${qIndex}]) { window.userAnswers[${exoIndex}][${qIndex}] = []; }
                  window.userAnswers[${exoIndex}][${qIndex}][${currentFieldIndex}] = window.myGgbApplet.getXML();
                  console.log("XML :", window.myGgbApplet.getXML())
                });
              }
            }, 0);
          })();
        `;
        container.appendChild(scriptEl);
        const resizer = document.createElement("div");
        resizer.className = "resizer";
        container.appendChild(resizer);
        let startX: number, startY: number, startWidth: number, startHeight: number;
        function initDrag(e: MouseEvent) {
          startX = e.clientX;
          startY = e.clientY;
          startWidth = parseInt(window.getComputedStyle(container).width, 10);
          startHeight = parseInt(window.getComputedStyle(container).height, 10);
          document.documentElement.addEventListener("mousemove", doDrag, false);
          document.documentElement.addEventListener("mouseup", stopDrag, false);
          e.preventDefault();
        }
        function doDrag(e: MouseEvent) {
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
        function stopDrag(e: MouseEvent) {
          document.documentElement.removeEventListener("mousemove", doDrag, false);
          document.documentElement.removeEventListener("mouseup", stopDrag, false);
          e.preventDefault();
        }
        resizer.addEventListener("mousedown", initDrag, false);
        return container;
      }

      function handleBoite(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const pattern = /^\\begin\{boite\}\s*(\[[^\]]*\])?\s*/;
        const m = token.match(pattern);
        if (!m) {
          const errorDiv = document.createElement("div");
          errorDiv.textContent = "Erreur dans \\begin{boite}";
          return { element: errorDiv, endIndex: token.length };
        }
        let title = "";
        let mtitle = "";
        let color = "";
        if (m[1]) {
          mtitle = m[1].slice(1, -1).trim();
          title = mtitle.split(",")[0];
          color = mtitle.split(",")[1]?.trim() || "";
        }
        const startContentIndex = m[0].length;
        const endEnvIndex = token.indexOf("\\end{boite}", startContentIndex);
        if (endEnvIndex === -1) {
          const errorDiv = document.createElement("div");
          errorDiv.style.border = "1px solid red";
          errorDiv.style.padding = "0.5em";
          errorDiv.textContent = "Erreur : \\end{boite} manquant";
          return { element: errorDiv, endIndex: token.length };
        }
        const contenu = token.substring(startContentIndex, endEnvIndex);
        const boite = document.createElement("div");
        if (title) {
          const boiteTitre = document.createElement("div");
          boiteTitre.className = "boite-titre";
          boiteTitre.textContent = title;
          boite.appendChild(boiteTitre);
        }
        const boiteContenu = document.createElement("div");
        boiteContenu.className = "boite-contenu";
        const innerContent = parseInput(contenu, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
        boiteContenu.appendChild(innerContent);
        boite.appendChild(boiteContenu);
        return { element: boite, endIndex: endEnvIndex + "\\end{boite}".length };
      }

      function handleMinipage(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{minipage\}\{\s*([0-9]*\.?[0-9]+)\s*\\textwidth\s*\}([\s\S]+?)\\end\{minipage\}/;
        const match = token.match(regex);
        if (match) {
          const widthRatio = parseFloat(match[1]);
          const content = match[2];
          const div = document.createElement("div");
          div.style.display = "inline-block";
          div.style.verticalAlign = "top";
          div.style.width = (widthRatio * 100) + "%";
          const innerContent = parseInput(content, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
          div.appendChild(innerContent);
          return div;
        } else {
          const div = document.createElement("div");
          div.textContent = "Unknown environment 'minipage'";
          return div;
        }
      }

      function handleMulticols(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{multicols\}\{\s*(\d+)\s*\}([\s\S]+?)\\end\{multicols\}/;
        const match = token.match(regex);
        if (match) {
          const numCols = parseInt(match[1], 10);
          let content = match[2];
          if (content.includes("\\columnbreak")) {
            const columnsContent = content.split(/\\columnbreak/);
            const container = document.createElement("div");
            container.style.display = "flex";
            container.style.gap = "1em";
            columnsContent.forEach(piece => {
              const colDiv = document.createElement("div");
              colDiv.style.flex = "1";
              const innerContent = parseInput(piece, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
              colDiv.appendChild(innerContent);
              container.appendChild(colDiv);
            });
            return container;
          } else {
            const div = document.createElement("div");
            div.style.columnCount = numCols.toString();
            div.style.columnGap = "1em";
            const innerContent = parseInput(content, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
            div.appendChild(innerContent);
            return div;
          }
        } else {
          const div = document.createElement("div");
          div.textContent = "Unknown environment 'multicols'";
          return div;
        }
      }

      function handleEnumerate(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{enumerate\}([\s\S]+?)\\end{enumerate\}/;
        const match = token.match(regex);
        if (match) {
          const content = match[1];
          const ol = document.createElement("ol");
          ol.classList.add("latex-enumerate");
          const items = content.split(/\\item/);
          items.forEach(itemText => {
            const trimmed = itemText.trim();
            if (trimmed) {
              const li = document.createElement("li");
              li.classList.add("latex-list-item");
              const innerContent = parseInput(trimmed, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
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

      function handleItemize(token: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{itemize\}([\s\S]+?)\\end{itemize\}/;
        const match = token.match(regex);
        if (match) {
          const content = match[1];
          const ul = document.createElement("ul");
          ul.classList.add("latex-itemize");
          const items = content.split(/\\item/);
          items.forEach(itemText => {
            const trimmed = itemText.trim();
            if (trimmed) {
              const li = document.createElement("li");
              li.classList.add("latex-list-item");
              const innerContent = parseInput(trimmed, qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
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

      function handleCenter(token: string, qIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{center\}([\s\S]+?)\\end{center\}/;
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

      function handleTabular(latexStr: string, qIndex: number, currentFieldIndex: number, fieldIndexCallback: () => number, exoIndex: number) {
        const regex = /\\begin\{tabular\}(?:\[(.*?)\])?\{(.*?)\}([\s\S]*?)\\end\{tabular\}/;
        const match = regex.exec(latexStr);
        if (!match) return document.createTextNode(latexStr);
        const [ , options, form, content ] = match;
        const table = document.createElement("table");
        table.classList.add("tabular-table");
        const rows = content.trim().split(/\\\\/).filter(row => row.trim() !== "");
        rows.forEach(row => {
          const tr = document.createElement("tr");
          tr.classList.add("tabular-row");
          const cleanedRow = row.replace(/\\hline/g, "").trim();
          const cells = cleanedRow.split("&");
          cells.forEach(cell => {
            const td = document.createElement("td");
            td.classList.add("tabular-cell");
            const cellContent = parseInput(cell.trim(), qIndex, exoIndex, currentFieldIndex, fieldIndexCallback);
            td.appendChild(cellContent);
            tr.appendChild(td);
          });
          table.appendChild(tr);
        });
        return table;
      }

      async function handleMathaleaTool(token: string) {
        const commandeRegex = /\\begin\{commande\}\{([^}]+)\}(?:\s*([\s\S]+?))?\s*\\end\{commande\}/;
        const match = commandeRegex.exec(token);
        if (!match) {
          throw new Error("La commande n'a pas été reconnue.");
        }
        const toolName = match[1].trim();
        let params: string[] = [];
        if (match[2]) {
          try {
            params = match[2].split(',');
          } catch (error) {
            console.error("Erreur lors du parsing des paramètres :", error);
          }
        }
        return calcul(...params);
      }

      function arrondi(nombre: number, precision: number = 2) {
        if (isNaN(nombre)) {
          (window as any).notify('Le nombre à arrondir n\'en est pas un, ça retourne NaN');
          return NaN;
        } else {
          return round(nombre, precision);
        }
      }

      function calcul(x: any, arrondirParam: number = 6) {
        if (typeof x === 'string') {
          (window as any).notify('Calcul : Reçoit une chaine et pas un nombre');
          x = parseFloat(evaluate(x));
        }
        return parseFloat(x.toFixed(arrondirParam));
      }

      /***************************************************
       * Fonctions de rendu de question et de correction
       ***************************************************/
      function renderQuestion(exoIndex: number, qIndex: number) {
        if (exerciseContent) exerciseContent.innerHTML = "";
        correctionMode = false;
        if (toggleCorrectionBtn) toggleCorrectionBtn.textContent = "Afficher la correction";
        if (exerciseContent) {
          exerciseContent.style.width = "75%";
          exerciseContent.style.margin = "0 auto";
        }
        const question = exerciseData.questions[qIndex];
        if (!question) {
          console.error("La question d'indice", qIndex, "n'existe pas !");
          return;
        }
        const questionDiv = document.createElement("div");
        questionDiv.classList.add("question");
        questionDiv.setAttribute("data-index", qIndex.toString());
        if (Array.isArray(question.correction)) {
          questionDiv.dataset.correction = JSON.stringify(question.correction);
        } else {
          questionDiv.dataset.correction = question.correction.trim();
        }
        const labelP = document.createElement("p");
        labelP.classList.add("bx--type-body");
        let instruc = question.instructions || exerciseData.instructions || "";
        labelP.innerHTML = `<strong>Question ${qIndex + 1} : </strong>${instruc}`;
        const points = question.correction.length;
        labelP.innerHTML += ` <span class="points"><strong> (${points} ${points > 1 ? "points" : "point"})</strong></span>`;
        questionDiv.appendChild(labelP);
        let localFieldIndex = 0;
        if (question.variables) {
          Object.keys(question.variables).forEach(key => {
            let value = question.variables[key];
            if (typeof value === 'string') {
              Object.keys(question.variables).forEach(otherKey => {
                const regex = new RegExp('\\\\' + otherKey, 'g');
                value = value.replace(regex, question.variables[otherKey]);
              });
              question.variables[key] = value;
            }
          });
        }
        if (question.latex && Array.isArray(question.latex)) {
          question.latex.forEach((line: string) => {
            const questionVars = question.variables || {};
            line = manageExoVars(line, questionVars);
            const lineElem = buildLatexLine(line, qIndex, exoIndex, localFieldIndex, () => localFieldIndex++);
            questionDiv.appendChild(lineElem);
          });
        } else {
          console.warn("La question", qIndex, "n'a pas de propriété 'latex'.");
        }
        if (exerciseContent) exerciseContent.appendChild(questionDiv);
        if (progressIndicator) {
          progressIndicator.textContent = `Question ${qIndex + 1} / ${exerciseData.questions.length}`;
        }
        configureMathLiveAdvanced();
        if ((window as any).MathJax) (window as any).MathJax.typesetPromise();
      }

      function toggleCorrection() {
        correctionMode = !correctionMode;
        if (toggleCorrectionBtn) {
          toggleCorrectionBtn.textContent = correctionMode ? "Masquer la correction" : "Afficher la correction";
        }
        const questionDiv = exerciseContent ? exerciseContent.querySelector(".question[data-index='" + currentQuestionIndex + "']") : null;
        if (!questionDiv) return;
        let correctionContainer = questionDiv.querySelector(".correction");
        if (correctionMode) {
          if (!correctionContainer) {
            correctionContainer = document.createElement("div");
            correctionContainer.classList.add("correction");
            correctionContainer.style.padding = "10px";
            correctionContainer.style.marginTop = "10px";
            correctionContainer.style.borderRadius = "4px";
            correctionContainer.innerHTML = "<strong>Correction :</strong>";
            const question = exerciseData.questions[currentQuestionIndex];
            let correctionCounter = 0;
            if (question.latex && Array.isArray(question.latex)) {
              question.latex.forEach((line: string) => {
                line = manageExoVars(line, question.variables);
                const correctedLine = line.replace(/(\\tcfillcrep\{\})|(\\liste\{([^}]*)\})/g, (match, p1, p2, p3) => {
                  if (p1) return question.correction[correctionCounter++];
                  else if (p2) return question.correction[correctionCounter++];
                  else return "";
                }).replace('|', ' ou ');
                const p = buildLatexLine(correctedLine, currentQuestionIndex, 0, 0, () => 0);
                correctionContainer.appendChild(p);
              });
            }
            questionDiv.appendChild(correctionContainer);
          }
        } else {
          if (correctionContainer) correctionContainer.remove();
        }
        if ((window as any).MathJax) (window as any).MathJax.typesetPromise();
      }

      function corrigerAnswers() {
        const question = exerciseData.questions[currentQuestionIndex];
        const fields = exerciseContent ? exerciseContent.querySelectorAll("math-field, select") : [];
        fields.forEach((field: any, index: number) => {
          const userVal = normalizeLatex(field.value);
          let expectedVal = "";
          if (question.correction && index < question.correction.length) {
            expectedVal = normalizeLatex(question.correction[index]);
          }
          const expectedAnswers = expectedVal.split("|").map((answer: string) => answer.trim());
          if (expectedAnswers.some((answer: string) => answer === userVal)) {
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

      function normalizeLatex(input: string) {
        if (!input) return "";
        return input
          .replace(/\\dfrac/g, "\\frac")
          .replace(/\\cdot/g, "\\times")
          .replace(/\\times/g, "×")
          .replace(/{,}/g, ".")
          .replace(/,/g, ".")
          .replace(/{/g, "")
          .replace(/}/g, "")
          .replace(/\\[()]/g, "")
          .replace(/\s+/g, "")
          .trim();
      }

      function ajouterFeedback(field: any, icon: string) {
        let feedback = field.nextElementSibling;
        if (!feedback || !feedback.classList.contains("feedback-icon")) {
          feedback = document.createElement("span");
          feedback.classList.add("feedback-icon");
          field.parentNode.insertBefore(feedback, field.nextSibling);
        }
        feedback.textContent = icon;
      }

      /***************************************************
       * Écouteurs d'événements pour la navigation et le chargement
       ***************************************************/
      if (prevQuestionBtn) {
        prevQuestionBtn.addEventListener("click", function () {
          const sel = document.getElementById("exercise-selector");
          const selectedIndex = sel ? parseInt(sel.value, 10) : 0;
          if (currentQuestionIndex > 0) {
            currentQuestionIndex--;
            renderQuestion(selectedIndex, currentQuestionIndex);
          }
        });
      }
      if (nextQuestionBtn) {
        nextQuestionBtn.addEventListener("click", function () {
          const sel = document.getElementById("exercise-selector");
          const selectedIndex = sel ? parseInt(sel.value, 10) : 0;
          if (exerciseData && currentQuestionIndex < exerciseData.questions.length - 1) {
            currentQuestionIndex++;
            renderQuestion(selectedIndex, currentQuestionIndex);
          }
        });
      }
      if (loadButton && selector) {
        selector.addEventListener("change", function () {
            loadButton.classList.toggle("clicked");
            const selectedIndex = parseInt(selector.value, 10);
            currentQuestionIndex = 0;
            if ((window as any).loadedExercises && (window as any).loadedExercises[selectedIndex]) {
              loadExercise((window as any).loadedExercises[selectedIndex], selectedIndex);
            } else {
              console.error("Aucun exercice correspondant trouvé.");
            }
          });
        loadButton.addEventListener("click", function () {
          loadButton.classList.toggle("clicked");
          const selectedIndex = parseInt(selector.value, 10);
          currentQuestionIndex = 0;
          if ((window as any).loadedExercises && (window as any).loadedExercises[selectedIndex]) {
            loadExercise((window as any).loadedExercises[selectedIndex], selectedIndex);
          } else {
            console.error("Aucun exercice correspondant trouvé.");
          }
        });
      }
      if (toggleCorrectionBtn) {
        toggleCorrectionBtn.addEventListener("click", toggleCorrection);
      }
      if (corrigerBtn) {
        corrigerBtn.addEventListener("click", corrigerAnswers);
      }
      // Chargement initial
      //loadExercises("/files/college/4eme/Exercices/enonce_TOOLS_results.json");
      loadExercises(file);//"/files/college/4eme/Exercices/theme_test/exo_test/enonce_TOOLS_results.json");
      console.log('Exercice chargé:', file);
    })(); // Fin de l'IIFE
  }, [file]);

  return null;
}
