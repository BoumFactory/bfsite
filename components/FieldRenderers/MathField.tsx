// Exemple pour MathField
function MathField({
    value,
    onChange,
    questionIndex,
    exerciseIndex,
    fieldIndex
  }: MathFieldProps) {
    const fieldRef = useRef<MathfieldElement>(null);
    
    useEffect(() => {
      if (fieldRef.current) {
        // Configuration du champ
        fieldRef.current.setAttribute("virtual-keyboard-mode", "manual");
        fieldRef.current.setAttribute("smart-mode", "true");
        
        // Définir la valeur initiale
        if (value) {
          fieldRef.current.value = value;
        }
        
        // Ajouter l'écouteur d'événements
        const handleInput = () => {
          if (fieldRef.current) {
            onChange(fieldRef.current.value);
          }
        };
        
        fieldRef.current.addEventListener("input", handleInput);
        
        return () => {
          if (fieldRef.current) {
            fieldRef.current.removeEventListener("input", handleInput);
          }
        };
      }
    }, [onChange]);
    
    return (
      <math-field
        ref={fieldRef}
        className="math-field"
        style={{
          minWidth: "10cm",
          fontSize: "1.2em",
          border: "2px solid black",
          borderRadius: "4px",
          padding: "0.2em"
        }}
      />
    );
  }