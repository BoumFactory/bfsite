interface ExerciseContextType {
    exerciseData: Exercise | null;
    currentExerciseIndex: number;
    currentQuestionIndex: number;
    userAnswers: UserAnswers;
    correctionMode: boolean;
    setCurrentQuestionIndex: (index: number) => void;
    setCurrentExerciseIndex: (index: number) => void;
    updateUserAnswer: (exoIndex: number, qIndex: number, fieldIndex: number, value: any) => void;
    toggleCorrectionMode: () => void;
    checkAnswers: () => void;
  }