function QuestionRenderer({ 
    question, 
    questionIndex, 
    exerciseIndex 
  }: QuestionRendererProps) {
    const { userAnswers, correctionMode, updateUserAnswer } = useContext(ExerciseContext);
    
    // Traiter les variables du problème
    const processedVariables = useMemo(() => {
      if (!question.variables) return {};
      return processVariables(question.variables);
    }, [question.variables]);
    
    // Fonction pour rendre les lignes LaTeX
    const renderLatexLine = useCallback((line: string, fieldOffset: number) => {
      const processedLine = manageExoVars(line, processedVariables);
      return <LatexLineRenderer 
        line={processedLine} 
        questionIndex={questionIndex}
        exerciseIndex={exerciseIndex}
        fieldOffset={fieldOffset}
        userAnswers={userAnswers[exerciseIndex]?.[questionIndex] || []}
        onAnswerChange={(fieldIndex, value) => 
          updateUserAnswer(exerciseIndex, questionIndex, fieldIndex, value)
        }
      />;
    }, [questionIndex, exerciseIndex, processedVariables, userAnswers, updateUserAnswer]);
    
    // Rendre les différentes lignes de la question
    return (
      <div className="question" data-index={questionIndex}>
        <p className="bx--type-body">
          <strong>Question {questionIndex + 1} : </strong>
          {question.instructions || ""}
          <span className="points">
            <strong> ({question.correction.length} {question.correction.length > 1 ? "points" : "point"})</strong>
          </span>
        </p>
        
        {question.latex && Array.isArray(question.latex) && 
          question.latex.map((line, index) => (
            <React.Fragment key={index}>
              {renderLatexLine(line, index * 10)}
            </React.Fragment>
          ))
        }
        
        {correctionMode && (
          <CorrectionRenderer 
            question={question} 
            questionIndex={questionIndex}
            variables={processedVariables}
          />
        )}
      </div>
    );
  }