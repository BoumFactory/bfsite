// hooks/useUpdatePageTitle.ts
import { useEffect } from "react";
import { usePageTitle } from "../components/PageTitleContext"; // ajustez le chemin si nécessaire

export const useUpdatePageTitle = (title: string) => {
  const { setPageTitle } = usePageTitle();
  useEffect(() => {
    setPageTitle(title);
  }, [title, setPageTitle]);
};
