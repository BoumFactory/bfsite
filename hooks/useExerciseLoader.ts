function useExerciseLoader(filePath: string) {
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>(null);
    
    useEffect(() => {
      async function loadExercises() {
        setLoading(true);
        try {
          const response = await fetch(filePath);
          const data = await response.json();
          
          let exerciseList: Exercise[] = [];
          if (Array.isArray(data)) {
            exerciseList = data;
          } else if (data.exercises) {
            exerciseList = data.exercises;
          } else if (data.title) {
            exerciseList = [data];
          } else {
            throw new Error("Format JSON non reconnu");
          }
          
          setExercises(exerciseList);
        } catch (err) {
          setError(err instanceof Error ? err : new Error(String(err)));
        } finally {
          setLoading(false);
        }
      }
      
      loadExercises();
    }, [filePath]);
    
    return { exercises, loading, error };
  }