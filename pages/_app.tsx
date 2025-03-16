import { useEffect } from "react";
import type { AppProps } from "next/app";
import { PageTitleProvider } from "../components/PageTitleContext";
import Layout from "../components/Layout";
import "../styles/globals.css";
import { initializeMonacoEditor } from '../components/MonacoConfig';
import Script from 'next/script'

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      initializeMonacoEditor();
    }
  }, []);
  return (
    <PageTitleProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </PageTitleProvider>
  );
};

export default MyApp;
