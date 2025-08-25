import Head from "next/head";
import Header from "./Header";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();

  // Funktion zur Generierung des dynamischen Titels
  const getPageTitle = () => {
    const path = router.pathname
      .replace("/", "") 
      .replace("-", " ") 
      .toLowerCase();
    return path ? path.charAt(0).toUpperCase() + path.slice(1) : "Startseite";
  };

  return (
    <>
      <Head>
        <title>Getränkekasse {getPageTitle()}</title>
        <meta name="description" content="Getränkekasse" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <div>
        <Header />
          <div className="container">
            {children}
          </div>
      </div>
    </>
  );
}
