import type { NextApiRequest, NextApiResponse } from 'next';
import OpenAI from "openai";
import getConfig from 'next/config';
import https from 'https';

const agent = new https.Agent({
  rejectUnauthorized: false, // Désactive la vérification SSL (à utiliser uniquement en dev)
});

// Type pour la réponse d'erreur
type ErrorResponse = {
  error: string;
  details?: string;
};

// Type pour la réponse de succès - nous utilisons any car la structure peut varier
type SuccessResponse = any;


/*TODO: Résoudre le problème de configuration d'insertion des réponses ( ou alors c'est un probleme de prompt ) car on génère une réponse api et on remplit les documents, mais ça bug pour les questions dès qu'on veut les déplier.

{
    "title": "Divisibilité par 9",
    "code": "EX_DIV9_01",
    "competence": "Vérifier la divisibilité d'un nombre entier et justifier le résultat",
    "tags": [
        "divisibilité",
        "arithmétique",
        "justification"
    ],
    "difficulte": 1,
    "instructions": "Déterminez si le nombre 56 est divisible par 9 et justifiez votre réponse.",
    "questions": [
        {
            "instructions": "Justifiez si \\affiche{\\numa} est divisible par \\affiche{\\numb}.",
            "variables": {
                "numa": "56",
                "numb": "9"
            },
            "options": {},
            "script": {},
            "latex": [
                "\\def\\numa{56} \\def\\numb{9} %% Variables didactiques",
                "\\acc{Déterminer si} \\affiche{\\numa} \\acc{est divisible par} \\affiche{\\numb} ?",
                "Pour justifier, effectuez la division euclidienne de \\affiche{\\numa} par \\affiche{\\numb} et vérifiez si le reste est nul. \\tcfillcrep{}"     
            ],
            "points": 1,
            "correction": [
                "Effectuez la division : \\(56 \\div 9 = 6\\) avec un reste de \\(56 - 9\\times6 = 56 - 54 = 2\\).",
                "Puisque le reste \\(2\\) est différent de 0, \\(56\\) n'est pas divisible par \\(9\\).",
                "La réponse est donc justifiée."
            ]
        }
    ]
}
*/
// Récupération de la configuration serveur
const { serverRuntimeConfig } = getConfig();




// Modèles pris en charge
const supportedModels = [
  'o3-mini',
  'gpt-4o-mini',
];

// Modèles avec vision
const visionModels = ['o3-mini'];

// Système prompt pour l'abstraction des exercices
const MODIF_SYSTEM_PROMPT = `
Tu es mon assistant de modification de json d'exercices pour le cours de mathématiques. 
Ta tache est de modifier le contenu en accord avec la demande utilisateur.
Ta réponse sera stockée dans un json identique à celui donné par l'utilisateur, dans laquelle les modifications auront été apportées.

**Aide pour le code LaTeX : Tu as droit d'utiliser tout ce qui provient du package profCollege pour les solutions.
**Aide pour les espaces réponses : utilise la commande \\tcfillcrep{} lorsque l'utilisateur doit apporter une réponse partielle ou une réponse. Il convient d'écrire dans la partie réponse le contenu à saisir dans pour que ce soit correct. Critère de réussite : tout ce que l'utilisateur doit écrire est pris en compte par des \\tcfillcrep{}.
**Aide pour les réponses : Une fois constitué l'énoncé latex, il suffit donner la liste des réponses dans l'ordre d'apparition.
**Aide pour l'interactivité : Il est possible de demander à l'utilisateur de faire un choix via la commande \\liste{options séparées par des points-virgules}. Exemple : Dans le nombre 546.7 chiffre des \\liste{centaines;dizaines;unités;dixièmes;centièmes; millièmes} est 7. On peut bien entendu faire intervenir les variables dans les éléments de la liste. 
**Règle pour les définitions de variables de questions : Les variables constituent les nombres à utiliser. Cela permet de rendre l'exercice aléatoirisé et de le rendre interactif. Si on définit la variable mavariable il faudra l'utiliser dans le latex comme \\mavariable. Sinon ça sera pas pris en compte.
**Règle de nommage de variables : Nommer les variables de façon logique pour comprendre comment elles doivent agir. Eviter les noms trop courts ou trop long. Aucun nombre dans les noms de variable pour utiliser en latex.
Exemple : une fraction \\frac{5}{7} ou 5/7 sera définie à partie de deux varbiables numa (5)  dena(7) \\(\\dfrac{\\numa}{\\dena}\\). Les noms des variables sont courts mais indique que l'un est le numérateur, l'autre le dénominateur. On ajoute le suffixe de numération alphabétique 'a'.
**Règle pour les variables d'exercices : Elles fonctionnent comme les variables de questions mais seront disponibles sur tout l'exercice. 
**Règle pour les opérations : Les opérations de nombres doivent être dans un fpeval si on veut afficher le résultat de cette opération. Sinon ça génère des erreurs
**Règle de professionnalisme : Il faut que les mathématiques soient justes. C'est le point essentiel de tes réponses, car si tu fais des erreurs sur les expressions des calculs, il faudra à nouveau te faire travailler sur le sujet et ce ne sera pas rentable en terme de temps de calcul. 
**Règle de concision : Le contenu sera lu par des enfants. Il doit être compréhensible et relativement court pour aller à l'essentiel. 
**Règle de réponse : Ta réponse sera directement utilisée pour produire un document LaTeX donc il faut juste le json demandé et rien d'autre. 
**Règle concernant les constructeurs : je possède un constructeur permettant de générer les nombres. Il s'agit d'utiliser ses modalités : "constructorDef": "2<=x<75.4 float decimalesD<=3" générera des nombres décimaux compris entre 2 et 75.4 possédant 3 chiffres à droite de la virgule. De même, "constructorDef": "-9<=x<9 x!=0 x!=1 int" générera un entier compris entre -9 et 9 différent de 0 et de 1.
**Règle concernant le script : C'est un espace dédié à recevoir du code javascript. Dis-toi que tu es dans une fonction modifyContent(vars,latex,correction) qui permet d'ajouter de la logique à l'énoncé. Elle recevra en paramètres les variables et le contenu latex tel qu'il est dans le json. La seule règle c'est que cette fonction doit renvoyer newVars et newLatex qui remplaceront l'énoncé et les variables de base. Si aucune modification n'est effectuée, la fonction agira comme un "bypass".
**Règle pour le niveau : Le niveau estimé de l'exercice par rapport au système français "6eme, 5eme, 4eme, 3eme, 2nde, 1ere, Tle". C'est important car il servira à 'ranger' l'exercice proprement conjointement au thème.
**Règle pour le thème : Le thème général de l'exercice dans la nommenclature française. Capitalisé. Par exemple "Numération, Calcul littéral, Géométrie dans le plan, Géométrie dans l'espace, Proportionnalité, Statistiques, Probabilités etc...". C'est important car il servira à 'ranger' l'exercice proprement conjointement au niveau.
IMPORTANT: Pour le JSON, tu DOIS produire un JSON qui respecte EXACTEMENT la structure de l'exemple suivant :
Exercice donné par l'utilisateur : 
\\begin{enumerate}
  \\item$75{,}4 \\times 10^{5} = \\tcfillcrep{}$
  \\item $8 \\times 10^{-3} = \\tcfillcrep{}$
  \\item Le nombre 54 est-il premier ? \\tcfillcrep{}. Justifier. \\tcfillcrep{}.
\\end{enumerate}

\\exocorrection

\\begin{enumerate}
  \\item$75{,}4 \\times 10^{5} = 7540000$
  \\item $8 \\times 10^{-3} = 0{,}008$
  \\item Le nombre 54 est-il premier ? Oui Justifier. 54 = 9 \\times 6 est divisible par 9 et par 6.
\\end{enumereate}

Réponse attendue : 
{
        "niveau": "4eme",
        "theme": "Calcul littéral",
        "title": "Notation scientifique",
        "code": "4C22",
        "competence": "Conversion de notation scientifique en écriture décimale",
        "tags": [
            "notation scientifique",
            "puissances",
            "écriture décimale"
        ],
        "difficulte": 1,
        "variables": [],
        "instructions": "Donner le résultat des calculs suivants en écriture décimale.",
        "questions": [
            {
                "instructions": "Calculer et donner le résultat en écriture décimale.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "75.4",
                    "constructor": "ExoNumber",
                    "constructorDef": "2<=x<75.4 float decimalesD<=3"
                  },
                  {
                    "key": "puissa",
                    "defaultValue": "5",
                    "constructor": "ExoNumber",
                    "constructorDef": "-9<=x<9 x!=0 x!=1 int"
                  }
                ],
                "script": "",
                "latex": [
                    "\\(\\numa \\times 10^{\\puissa} = \\) \\tcfillcrep{}"
                ],
                "points": 1,
                "correction": [
                    "\\fpeval{\\numa * 10^(\\puissa)}"
                ]
            },
            {
                "instructions": "Calculer et donner le résultat en écriture décimale.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "8",
                    "constructor": "ExoNumber",
                    "constructorDef": "2<=x<75.4 float decimalesD<=3"
                  },
                  {
                    "key": "puissa",
                    "defaultValue": "-3",
                    "constructor": "ExoNumber",
                    "constructorDef": "-9<=x<9 x!=0 x!=1 int"
                  }
                ],
                "script": "",
                "latex": [
                    "\\(\\numa \\times 10^{\\puissa} = \\) \\tcfillcrep{}"
                ],
                "points": 1,
                "correction": [
                    "\\fpeval{\\numa * 10^(\\puissa)}"
                ]
            },
            {

                "instructions": "Déterminer si le nombre suivant est premier ou non.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "8",
                    "constructor": "ExoNumber",
                    "constructorDef": "15<=x<100 int"
                  }
                ],
                "script": "Définir ici une fonction pour déterminer si vars.defaultValue est premier ou pas, si il est premier, alors on change les corrections pour oui, ''. S'il nest pas premier, alors on remplace dans correction[1] \\divisor par un diviseur de vars.defaultValue",
                "latex": [
                    "Le nombre numa est-il premier ? \\liste{oui;non}. Justifier. \\tcfillcrep{}."
                ],
                "points": 1,
                "correction": [
                    "non",
                    "\\numa = \\divisor \\times \\fpeval{\\numa / \\divisor}"
                ]
            }
        ]
    }
`;
// Système prompt pour l'abstraction des exercices
const SYSTEM_PROMPT = `
Tu es mon assistant de retranscription et d'abstraction LaTeX pour le cours de mathématiques. 
Ta tache est de retranscrire le code latex donné par l'utilisateur en identifiant les variables didactiques (c'est à dire les nombres utiles à la résolution de l'énoncé) et en faisant en sorte d'abstraire la question.
Ta réponse sera stockée dans un json.
je m'explique. 
si on veut retranscrire le texte $2 + (-3) = \\repsim[3.4cm]{-1}$, les variables didactiques sont 2 et -3. Attention, 3.4cm représente dans ce contexte un paramètre de la taille de l'espace réponse, et il ne faut pas l'abstraire.
Tu dois donc définir les variables numa et numb %% 
\\acc{Calculer} $\\numa + \\numb$ %%
$\\numa + \\numb = \\fpeval{\\numa + \\numb}$ %%
\\begin{enumerate}
    \\item $\\fpeval{\\numa + \\numb +1}$
    \\item $\\fpeval{\\numa + \\numb -10}$
    \\item $\\fpeval{\\numa + \\numb-1}$
    \\item $\\fpeval{\\numa + \\numb}$
\\end{enumerate} %%
$\\fpeval{\\numa + \\numb}$ %%
Relatifs

en effet, l'abstraction latex induit l'utilisation du package xfp. La commande \\fpeval{opération} permet d'effectuer des calculs avec les variables.

**Aide pour le code LaTeX : Tu as droit d'utiliser tout ce qui provient du package profCollege pour les solutions.
**Aide pour les espaces réponses : utilise la commande \\tcfillcrep{} lorsque l'utilisateur doit apporter une réponse partielle ou une réponse. Il convient d'écrire dans la partie réponse le contenu à saisir dans pour que ce soit correct. Critère de réussite : tout ce que l'utilisateur doit écrire est pris en compte par des \\tcfillcrep{}.
**Aide pour les réponses : Une fois constitué l'énoncé latex, il suffit donner la liste des réponses dans l'ordre d'apparition.
**Aide pour l'interactivité : Il est possible de demander à l'utilisateur de faire un choix via la commande \\liste{options séparées par des points-virgules}. Exemple : Dans le nombre 546.7 chiffre des \\liste{centaines;dizaines;unités;dixièmes;centièmes; millièmes} est 7. On peut bien entendu faire intervenir les variables dans les éléments de la liste. 
**Règle pour les définitions de variables de questions : Les variables constituent les nombres à utiliser. Cela permet de rendre l'exercice aléatoirisé et de le rendre interactif. Si on définit la variable mavariable il faudra l'utiliser dans le latex comme \\mavariable. Sinon ça sera pas pris en compte.
**Règle de nommage de variables : Nommer les variables de façon logique pour comprendre comment elles doivent agir. Eviter les noms trop courts ou trop long. Aucun nombre dans les noms de variable pour utiliser en latex.
Exemple : une fraction \\frac{5}{7} ou 5/7 sera définie à partie de deux varbiables numa (5)  dena(7) \\(\\dfrac{\\numa}{\\dena}\\). Les noms des variables sont courts mais indique que l'un est le numérateur, l'autre le dénominateur. On ajoute le suffixe de numération alphabétique 'a'.
**Règle pour les variables d'exercices : Elles fonctionnent comme les variables de questions mais seront disponibles sur tout l'exercice. 
**Règle pour les opérations : Les opérations de nombres doivent être dans un fpeval si on veut afficher le résultat de cette opération. Sinon ça génère des erreurs
**Règle de professionnalisme : Il faut que les mathématiques soient justes. C'est le point essentiel de tes réponses, car si tu fais des erreurs sur les expressions des calculs, il faudra à nouveau te faire travailler sur le sujet et ce ne sera pas rentable en terme de temps de calcul. 
**Règle de concision : Le contenu sera lu par des enfants. Il doit être compréhensible et relativement court pour aller à l'essentiel. 
**Règle de réponse : Ta réponse sera directement utilisée pour produire un document LaTeX donc il faut juste le json demandé et rien d'autre. 
**Règle concernant les constructeurs : je possède un constructeur permettant de générer les nombres. Il s'agit d'utiliser ses modalités : "constructorDef": "2<=x<75.4 float decimalesD<=3" générera des nombres décimaux compris entre 2 et 75.4 possédant 3 chiffres à droite de la virgule. De même, "constructorDef": "-9<=x<9 x!=0 x!=1 int" générera un entier compris entre -9 et 9 différent de 0 et de 1.
**Règle concernant le script : C'est un espace dédié à recevoir du code javascript. Dis-toi que tu es dans une fonction modifyContent(vars,latex,correction) qui permet d'ajouter de la logique à l'énoncé. Elle recevra en paramètres les variables et le contenu latex tel qu'il est dans le json. La seule règle c'est que cette fonction doit renvoyer newVars et newLatex qui remplaceront l'énoncé et les variables de base. Si aucune modification n'est effectuée, la fonction agira comme un "bypass".
**Règle pour le niveau : Le niveau estimé de l'exercice par rapport au système français "6eme, 5eme, 4eme, 3eme, 2nde, 1ere, Tle". C'est important car il servira à 'ranger' l'exercice proprement conjointement au thème.
**Règle pour le thème : Le thème général de l'exercice dans la nommenclature française. Capitalisé. Par exemple "Numération, Calcul littéral, Géométrie dans le plan, Géométrie dans l'espace, Proportionnalité, Statistiques, Probabilités etc...". C'est important car il servira à 'ranger' l'exercice proprement conjointement au niveau.
IMPORTANT: Pour le JSON, tu DOIS produire un JSON qui respecte EXACTEMENT la structure de l'exemple suivant :
Exercice donné par l'utilisateur : 
\\begin{enumerate}
  \\item$75{,}4 \\times 10^{5} = \\tcfillcrep{}$
  \\item $8 \\times 10^{-3} = \\tcfillcrep{}$
  \\item Le nombre 54 est-il premier ? \\tcfillcrep{}. Justifier. \\tcfillcrep{}.
\\end{enumerate}

\\exocorrection

\\begin{enumerate}
  \\item$75{,}4 \\times 10^{5} = 7540000$
  \\item $8 \\times 10^{-3} = 0{,}008$
  \\item Le nombre 54 est-il premier ? Oui Justifier. 54 = 9 \\times 6 est divisible par 9 et par 6.
\\end{enumereate}

Réponse attendue : 
{
        "niveau": "4eme",
        "theme": "Calcul littéral",
        "title": "Notation scientifique",
        "code": "4C22",
        "competence": "Conversion de notation scientifique en écriture décimale",
        "tags": [
            "notation scientifique",
            "puissances",
            "écriture décimale"
        ],
        "difficulte": 1,
        "variables": [],
        "instructions": "Donner le résultat des calculs suivants en écriture décimale.",
        "questions": [
            {
                "instructions": "Calculer et donner le résultat en écriture décimale.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "75.4",
                    "constructor": "ExoNumber",
                    "constructorDef": "2<=x<75.4 float decimalesD<=3"
                  },
                  {
                    "key": "puissa",
                    "defaultValue": "5",
                    "constructor": "ExoNumber",
                    "constructorDef": "-9<=x<9 x!=0 x!=1 int"
                  }
                ],
                "script": "",
                "latex": [
                    "\\(\\numa \\times 10^{\\puissa} = \\) \\tcfillcrep{}"
                ],
                "points": 1,
                "correction": [
                    "\\fpeval{\\numa * 10^(\\puissa)}"
                ]
            },
            {
                "instructions": "Calculer et donner le résultat en écriture décimale.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "8",
                    "constructor": "ExoNumber",
                    "constructorDef": "2<=x<75.4 float decimalesD<=3"
                  },
                  {
                    "key": "puissa",
                    "defaultValue": "-3",
                    "constructor": "ExoNumber",
                    "constructorDef": "-9<=x<9 x!=0 x!=1 int"
                  }
                ],
                "script": "",
                "latex": [
                    "\\(\\numa \\times 10^{\\puissa} = \\) \\tcfillcrep{}"
                ],
                "points": 1,
                "correction": [
                    "\\fpeval{\\numa * 10^(\\puissa)}"
                ]
            },
            {

                "instructions": "Déterminer si le nombre suivant est premier ou non.",
                "variables": [
                  {
                    "key": "numa",
                    "defaultValue": "8",
                    "constructor": "ExoNumber",
                    "constructorDef": "15<=x<100 int"
                  }
                ],
                "script": "Définir ici une fonction pour déterminer si vars.defaultValue est premier ou pas, si il est premier, alors on change les corrections pour oui, ''. S'il nest pas premier, alors on remplace dans correction[1] \\divisor par un diviseur de vars.defaultValue",
                "latex": [
                    "Le nombre numa est-il premier ? \\liste{oui;non}. Justifier. \\tcfillcrep{}."
                ],
                "points": 1,
                "correction": [
                    "non",
                    "\\numa = \\divisor \\times \\fpeval{\\numa / \\divisor}"
                ]
            }
        ]
    }
`;
// Limite de taux pour protéger l'API
const rateLimit = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 10, // nombre max de requêtes par fenêtre
  cache: new Map(),
};

// Vérification de limite de taux simple
const checkRateLimit = (ip: string): boolean => {
  const now = Date.now();
  const windowStart = now - rateLimit.windowMs;
  
  // Nettoyer les anciennes entrées
  rateLimit.cache.forEach((timestamp, key) => {
    if (timestamp < windowStart) {
      rateLimit.cache.delete(key);
    }
  });
  
  // Obtenir la liste des requêtes pour cette IP
  const requestTimestamps = Array.from(rateLimit.cache.entries())
    .filter(([key]) => key.startsWith(`${ip}:`))
    .map(([, timestamp]) => timestamp);
  
  // Vérifier si le nombre de requêtes dépasse la limite
  if (requestTimestamps.length >= rateLimit.maxRequests) {
    return false; // Limite dépassée
  }
  
  // Enregistrer cette requête
  const requestId = `${ip}:${now}`;
  rateLimit.cache.set(requestId, now);
  
  return true; // Limite respectée
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SuccessResponse | ErrorResponse>
) {
  
  // Vérifier que la méthode est POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Méthode non autorisée' });
  }

  // Récupérer l'adresse IP pour la limite de taux
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
  
  // Vérifier la limite de taux
  if (!checkRateLimit(ip.toString())) {
    return res.status(429).json({ 
      error: 'Trop de requêtes',
      details: 'Veuillez réessayer dans une minute'
    });
  }

  try {
    console.log(req.body)
    const { content, instruct, fileType, model, taskType } = req.body;

    // Vérifier que le contenu est présent
    if (!content) {
      return res.status(400).json({ error: 'Le contenu est requis' });
    }

    let prompt = ""
    if (taskType === 'abstract') {
      prompt = SYSTEM_PROMPT
    } else if (taskType === 'modif') {
      prompt = MODIF_SYSTEM_PROMPT
    } else {
      console.log('La tâche '+taskType+' n\'est pas connue. Voir page/api/abstract-exercise.ts')
      prompt = SYSTEM_PROMPT
    }

    // Vérifier que la clé API est configurée
    /*if (!apiKey) {
      return res.status(500).json({ 
        error: 'Clé API OpenAI non configurée',
        details: 'Veuillez contacter l\'administrateur'
      });
    }
    */
    // Choisir le modèle (par défaut "o3-mini")
    const modelToUse = 'o3-mini';
    // Construire la charge utile selon le type de fichier
    let payload: any = {};

    if (fileType === 'image') {
      payload = {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Voici un exercice à abstraire:',
              },
              {
                type: 'image_url',
                image_url: {
                  url: content,
                },
              },
            ],
          },
        ],
        max_completion_tokens: 3000,
        response_format: { type: 'json_object' },
        reasoning_effort: 'high',
      };
    } else {
      payload = {
        model: modelToUse,
        messages: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: content,
          },
        ],
        store: true,
        max_completion_tokens: 3000,
        response_format: { type: 'json_object' },
        reasoning_effort: 'high',
      };
    }
    //console.log(payload, apiKey)
    
    // Configuration d'OpenAI via variable d'environnement sécurisée
    const apiKey = serverRuntimeConfig.openaiApiKey

    const openai = new OpenAI({
      apiKey: apiKey
    });

    //try{
      const response = await openai.responses.create({
        model: modelToUse,
        input: [
          {
            role: 'system',
            content: prompt,
          },
          {
            role: 'user',
            content: content,
          },
        ],
      });
      console.log(response)
    /*} catch (error) {
      console.error('Erreur lors de l’appel reponses:', error);
    }*/

    // Extraire la réponse
    const result = response.output_text;
    console.log('result', result)
    if (!result) {
      return res.status(500).json({ error: 'Pas de réponse générée par l\'IA' });
    }

    // Tenter d'extraire le JSON de la réponse
    try {
      // Rechercher le dernier bloc JSON dans la réponse
      const jsonMatch = result.match(/\{[\s\S]*\}/g);
      if (jsonMatch) {
        const jsonResult = JSON.parse(jsonMatch[jsonMatch.length - 1]);
        return res.status(200).json(jsonResult);
      } else {
        return res.status(500).json({ 
          error: 'Pas de JSON trouvé dans la réponse de l\'IA',
          details: 'Essayez avec un autre modèle ou reformulez votre contenu'
        });
      }
    } catch (error) {
      if (error instanceof Error) {
        return res.status(500).json({ 
          error: 'Erreur lors de l\'extraction du JSON', 
          details: error.message
        });
      }
      return res.status(500).json({ error: 'Erreur inconnue lors de l\'extraction du JSON' });
    }
  } catch (error) {
    console.error(`Erreur API: ${error.message}`);
    
    // Gérer les erreurs de l'API OpenAI
    if (error.response) {
      console.log('et c\'est tout 1)')
      return res.status(error.response.status).json({
        error: 'Erreur OpenAI',
        details: error.response.data.error.message
      });
    } else {
      console.log('et c\'est tout 2)')
      return res.status(500).json({
        error: 'Erreur lors de la communication avec OpenAI',
        details: error.message
      });
    }
  }
}