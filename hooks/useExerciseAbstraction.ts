import { useState } from 'react';
import { ExerciseJSON } from '../types/Exercise';

interface UseExerciseAbstractionReturn {
  abstractExercise: (content: string, instruct: string, fileType: string, model?: string, taskType?: string,) => Promise<ExerciseJSON>;
  isLoading: boolean;
  error: string | null;
}

export const useExerciseAbstraction = (): UseExerciseAbstractionReturn => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const abstractExercise = async (
    userContent: string, 
    instruct: string,
    fileType: string, 
    model: string = 'auto',
    taskType : string= 'abstract'
  ): Promise<ExerciseJSON> => {
    setIsLoading(true);
    setError(null);
    const content = '**Contenu : \n'+ userContent + '\n **Instruction supplémentaire utilisateur : \n' + instruct

    try {
      const response = await fetch('/api/abstract-exercise', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content, fileType, model,taskType}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Erreur HTTP: ${response.status}`);
      }

      const data = await response.json();
      return data as ExerciseJSON;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Une erreur inconnue est survenue');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    abstractExercise,
    isLoading,
    error,
  };
};