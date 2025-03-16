// pages/exerciceinteractif.tsx
import React from 'react';
import Exercice from '../components/ExerciceInteractif';
import { useUpdatePageTitle } from "../hooks/useUpdatePageTitle";

const ExerciceInteractifPage: React.FC = () => {
  useUpdatePageTitle("Exercices interactifs");
  
  return <Exercice />;
};

export default ExerciceInteractifPage;
