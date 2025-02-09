import React from "react";
import type { AppProps } from "next/app";
import { PageTitleProvider } from "../components/PageTitleContext";
import Layout from "../components/Layout";
import "../styles/globals.css";

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <PageTitleProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </PageTitleProvider>
  );
};

export default MyApp;
