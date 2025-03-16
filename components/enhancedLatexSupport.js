import { editor } from '@monaco-editor/react';

// Fonction pour configurer le support LaTeX avancé dans Monaco
export function setupAdvancedLatexSupport(monaco) {
  if (!monaco) return;
  
  // Enregistrer le langage LaTeX s'il n'est pas déjà enregistré
  if (!monaco.languages.getLanguages().some(lang => lang.id === 'latex')) {
    monaco.languages.register({ id: 'latex' });
  }
  
  // Tokenizer amélioré pour une meilleure coloration syntaxique
  monaco.languages.setMonarchTokensProvider('latex', {
    defaultToken: 'text',
    tokenPostfix: '.tex',
    
    // Caractères d'échappement
    control: /[\\\\{}$\\[\\]]/,
    escapes: /\\\\(?:[abfnrtv\\\\"']|x[0-9A-Fa-f]{1,4}|u[0-9A-Fa-f]{4}|U[0-9A-Fa-f]{8})/,
    
    tokenizer: {
      root: [
        // Commandes
        [/\\\\([a-zA-Z]+)/, 'keyword.latex'],
        [/\\\\[@#$%^&*_{}~\`'"<>]/, 'keyword.latex'],
        
        // Environnements mathématiques
        [/\\$\\$/, { token: 'string.latex', next: '@mathblock' }],
        [/\\$/, { token: 'string.latex', next: '@mathline' }],
        
        // Environnements LaTeX
        [/\\\\begin\\s*{([^}]*)}/, { 
          token: 'keyword.latex',
          next: '@environment.$1'
        }],
        
        // Commentaires
        [/%.*$/, 'comment.latex'],
        
        // Accolades et crochets
        [/[{}]/, 'delimiter.bracket.latex'],
        [/[\\[\\]]/, 'delimiter.array.latex'],
        [/[()]/, 'delimiter.parenthesis.latex'],
        
        // Autres caractères spéciaux
        [/[<>&]/, 'operator.latex'],
      ],
      
      // État pour les blocs mathématiques
      mathblock: [
        [/\\$\\$/, { token: 'string.latex', next: '@pop' }],
        [/./, 'string.math.latex']
      ],
      
      // État pour les expressions mathématiques en ligne
      mathline: [
        [/\\$/, { token: 'string.latex', next: '@pop' }],
        [/./, 'string.math.latex']
      ],
      
      // État pour les environnements - s'ajuste en fonction du nom de l'environnement
      environment: [
        [/\\\\end\\s*{([^}]*)}/, {
          cases: {
            '$1==$S2': { token: 'keyword.latex', next: '@pop' },
            '@default': 'keyword.latex'
          }
        }],
        [/[{}]/, 'delimiter.bracket.latex'],
        [/[\\[\\]]/, 'delimiter.array.latex'],
        [/[()]/, 'delimiter.parenthesis.latex'],
        [/\\\\([a-zA-Z]+)/, 'keyword.latex'],
        [/\\\\[@#$%^&*_{}~\`'"<>]/, 'keyword.latex'],
        [/%.*$/, 'comment.latex'],
        [/./, 'text']
      ]
    }
  });
  
  // Configurer la gestion des accolades et l'auto-complétion pour LaTeX
  monaco.languages.setLanguageConfiguration('latex', {
    // Paires d'accolades à compléter automatiquement
    autoClosingPairs: [
      { open: '{', close: '}' },
      { open: '[', close: ']' },
      { open: '(', close: ')' },
      { open: '\\\\begin{', close: '}', notIn: ['string', 'comment'] },
      { open: '$', close: '$', notIn: ['string', 'comment'] },
      { open: '$$', close: '$$', notIn: ['string', 'comment'] },
    ],
    
    // Paires d'accolades pour la navigation
    brackets: [
      ['{', '}'],
      ['[', ']'],
      ['(', ')'],
      ['\\\\begin{', '\\\\end{'],
      ['$', '$'],
      ['$$', '$$'],
    ],
    
    // Règles d'indentation
    indentationRules: {
      // Augmenter l'indentation si la ligne correspond à ce modèle
      increaseIndentPattern: /\\\\begin{(?!document)([^}]*)}|\\{[^}]*$/,
      // Diminuer l'indentation si la ligne correspond à ce modèle
      decreaseIndentPattern: /^\\s*\\\\end{(?!document)([^}]*)}/,
    },
    
    // Modèle pour les mots LaTeX
    wordPattern: /\\\\[a-zA-Z]+|[^\\\\\\s{}\\[\\]$]+/,
    
    // Commentaires en LaTeX
    comments: {
      lineComment: '%',
    },
    
    // Support des caractères électriques pour l'indentation
    __electricCharacterSupport: {
      brackets: [
        { tokenType: 'delimiter.bracket.latex', open: '{', close: '}', isElectric: true },
        { tokenType: 'delimiter.array.latex', open: '[', close: ']', isElectric: true },
        { tokenType: 'delimiter.parenthesis.latex', open: '(', close: ')', isElectric: true },
      ]
    },
    
    // Règles spéciales pour les environnements
    onEnterRules: [
      {
        beforeText: /\\\\begin{([^}]*)}.*$/,
        afterText: /^\\s*$/,
        action: {
          indentAction: monaco.languages.IndentAction.Indent
        }
      },
      {
        beforeText: /^\\s*\\\\end{([^}]*)}.*$/,
        action: {
          indentAction: monaco.languages.IndentAction.Outdent
        }
      }
    ]
  });
  
  console.log('Support LaTeX avancé configuré avec succès pour Monaco Editor');
}

// Exporter la fonction de configuration
export function setupEnhancedLatexSupport() {
  if (typeof window === 'undefined' || !window.monaco) return;
  
  setupAdvancedLatexSupport(window.monaco);
}