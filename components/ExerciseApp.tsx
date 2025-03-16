function ExerciseApp({ file }: { file: string }) {
    const { exercises, loading, error } = useExerciseLoader(file);
    const [userAnswers, setUserAnswers] = useState<UserAnswers>({});
    const [correctionMode, setCorrectionMode] = useState(false);
    
    // Initialiser la navigation
    const exerciseCount = exercises.length;
    const questionCount = exercises[0]?.questions.length || 0;
    
    const {
      currentExerciseIndex,
      currentQuestionIndex,
      setCurrentExerciseIndex,
      setCurrentQuestionIndex,
      goToNextQuestion,
      goToPrevQuestion
    } = useExerciseNavigation(exerciseCount, questionCount);
  
    // Handlers pour les interactions utilisateur
    const updateUserAnswer = useCallback((exoIndex: number, qIndex: number, fieldIndex: number, value: any) => {
      setUserAnswers(prev => {
        const newAnswers = { ...prev };
        if (!newAnswers[exoIndex]) newAnswers[exoIndex] = {};
        if (!newAnswers[exoIndex][qIndex]) newAnswers[exoIndex][qIndex] = [];
        newAnswers[exoIndex][qIndex][fieldIndex] = value;
        return newAnswers;
      });
    }, []);
  
    // Rendre le composant principal
    if (loading) return <div>Chargement en cours...</div>;
    if (error) return <div>Erreur: {error.message}</div>;
    if (!exercises.length) return <div>Aucun exercice trouvé</div>;
  
    const currentExercise = exercises[currentExerciseIndex];
    const currentQuestion = currentExercise?.questions[currentQuestionIndex];
  
    return (
      <ExerciseContext.Provider value={{
        exerciseData: exercises,
        currentExerciseIndex,
        currentQuestionIndex,
        userAnswers,
        correctionMode,
        setCurrentQuestionIndex,
        setCurrentExerciseIndex,
        updateUserAnswer,
        toggleCorrectionMode: () => setCorrectionMode(prev => !prev),
        checkAnswers: () => { /* Logique pour vérifier les réponses */ }
      }}>
        <div className="exercise-app">
          <h1 id="exercise-title">{currentExercise.title}</h1>
          <p id="exercise-instructions">{currentExercise.instructions}</p>
          
          <ExerciseSelector 
            exercises={exercises} 
            currentIndex={currentExerciseIndex}
            onChange={setCurrentExerciseIndex}
          />
          
          <div id="exercise-content">
            <QuestionRenderer 
              question={currentQuestion} 
              questionIndex={currentQuestionIndex}
              exerciseIndex={currentExerciseIndex}
            />
          </div>
          
          <ExerciseControls 
            onPrevious={goToPrevQuestion}
            onNext={goToNextQuestion}
            onToggleCorrection={() => setCorrectionMode(prev => !prev)}
            questionCount={questionCount}
            currentQuestion={currentQuestionIndex}
          />
        </div>
      </ExerciseContext.Provider>
    );
  }