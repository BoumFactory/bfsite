function useExerciseNavigation(exerciseCount: number, questionCount: number) {
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    
    const goToNextQuestion = useCallback(() => {
      if (currentQuestionIndex < questionCount - 1) {
        setCurrentQuestionIndex(prev => prev + 1);
      }
    }, [currentQuestionIndex, questionCount]);
    
    const goToPrevQuestion = useCallback(() => {
      if (currentQuestionIndex > 0) {
        setCurrentQuestionIndex(prev => prev - 1);
      }
    }, [currentQuestionIndex]);
    
    return {
      currentExerciseIndex,
      currentQuestionIndex,
      setCurrentExerciseIndex, 
      setCurrentQuestionIndex,
      goToNextQuestion,
      goToPrevQuestion
    };
  }