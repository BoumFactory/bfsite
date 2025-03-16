// Types de tokens identifiés dans le LaTeX
enum TokenType {
    TCFILLCREP,
    LISTE,
    ACC,
    HFILL,
    FPEVAL,
    ENV_TABULAR,
    ENV_MINIPAGE,
    ENV_MULTICOLS,
    ENV_CENTER,
    ENV_ENUMERATE,
    ENV_ITEMIZE,
    ENV_BOITE,
    ENV_TIKZPICTURE,
    ENV_COMMANDE,
    TEXT
  }
  
  interface Token {
    type: TokenType;
    content: string;
    options?: string;
    match?: RegExpMatchArray;
  }
  
  // Fonction pour tokenizer le LaTeX
  function tokenizeLatex(input: string): Token[] {
    const tokens: Token[] = [];
    const tokenPatterns = [
      { type: TokenType.TCFILLCREP, pattern: /\\tcfillcrep\{\}/ },
      { type: TokenType.LISTE, pattern: /\\liste\{[^}]+\}/ },
      // ... autres patterns
    ];
    
    let lastIndex = 0;
    
    // Recherche tous les tokens spéciaux
    while (lastIndex < input.length) {
      let foundMatch = false;
      
      for (const { type, pattern } of tokenPatterns) {
        pattern.lastIndex = lastIndex;
        const match = pattern.exec(input);
        
        if (match && match.index === lastIndex) {
          tokens.push({
            type,
            content: match[0],
            match
          });
          lastIndex = pattern.lastIndex;
          foundMatch = true;
          break;
        }
      }
      
      if (!foundMatch) {
        // Trouver le prochain token spécial
        let nextSpecialIndex = input.length;
        
        for (const { pattern } of tokenPatterns) {
          pattern.lastIndex = lastIndex;
          const match = pattern.exec(input);
          if (match && match.index < nextSpecialIndex) {
            nextSpecialIndex = match.index;
          }
        }
        
        // Ajouter le texte entre maintenant et le prochain token
        if (nextSpecialIndex > lastIndex) {
          tokens.push({
            type: TokenType.TEXT,
            content: input.substring(lastIndex, nextSpecialIndex)
          });
          lastIndex = nextSpecialIndex;
        }
      }
    }
    
    return tokens;
  }