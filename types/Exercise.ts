export interface ExerciseQuestion {
    instructions: string;
    variables: Record<string, string>;
    options: Record<string, any>;
    script: Record<string, any>;
    latex: string[];
    points: number;
    correction: string[];
  }
  
  export interface ExerciseJSON {
    theme: string;
    niveau: string;
    title: string;
    code: string;
    competence: string;
    tags: string[];
    difficulte: number;
    instructions: string;
    questions: ExerciseQuestion[];
  }