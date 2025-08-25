"use client";
import { useEffect } from "react";
import GetraenkeListe from "../komponenten/GetraenkeListe";
import db from "../utils/db";
import { useRouter } from "next/router";

  export default function Home({ getraenke }) {
  const router = useRouter();

  useEffect(() => {
    const { error } = router.query;
    if (error === 'cancelled') {
      alert('Die Bezahlung hat leider nicht geklappt. Bitte versuchen sie es erneut.');
    }
  }, [router.query]);

  
  let getraenkeID;
  if (getraenkeID === undefined || getraenkeID === null) {
    console.log('getraenkeID ist undefined oder null');
    console.log('router.query', router.query);
    for (const [key, value] of Object.entries(router.query)) {
      console.log('key:', key, 'value:', value);
      if (value == "") {
        console.log('getraenkeID gefunden', key);
        getraenkeID = key;
        console.log('getraenkeID', getraenkeID);
      }
    }
  } else {
    console.log('getraenkeID ist definiert');
    console.log('getraenkeID', getraenkeID);
  }

  useEffect(() => {
    if (typeof window !== "undefined" && getraenkeID !== undefined) {
      const userHash = localStorage.getItem("userHash");
      if (userHash) {
        handleLocalStorage(userHash, getraenkeID);
      } else {
        router.push(`/login?getraenk=${getraenkeID}`);
      }
    }
  }, []);

  const handleLocalStorage = async (hash, getraenkeID) => {
    try {
      const response = await fetch("/api/controllLocalStorage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hash, getraenkeID}),
      });
      const data = await response.json();
      if (data.valid) {
        console.log("User ist gültig.");
        handleSofortkauf(data.email, getraenkeID);
      } else {
        console.log("User ist ungültig, Weiterleitung zur Login-Seite.");
        router.push(`/login?getraenk=${getraenkeID}`);
      }
    } catch (error) {
      console.error("Fehler beim API-Aufruf:", error);
    }
  };

  const handleSofortkauf = async (email, getraenkeID) => {
    try {
      let getraenkeData;
      
      // Hole Getränkedaten nur wenn eine ID vorhanden ist
      if (getraenkeID !== "undefined" && getraenkeID !== undefined) {
        const getraenkeRes = await fetch(`/api/getraenke?id=${getraenkeID}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        });
        getraenkeData = await getraenkeRes.json();
        if (getraenkeData === false) {
          router.push(`/`);
          alert('Getränk nicht gefunden. Bitte wählen sie ein anderes Getränk.');
        }
      }
  
      // Abfrage für Sofortkauf
      const sofortkaufRes = await fetch(`/api/auth_table?email=${email}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      const sofortkaufData = await sofortkaufRes.json();
      const sofortkaufValue = sofortkaufData.sofortkauf;
  
      if (sofortkaufValue === true && getraenkeData) {
        console.log('Sofortkauf aktiviert');


        // PayPal-Weiterleitung nur starten wenn Getränkedaten vorhanden
        const paypalRes = await fetch('/api/paypal', { 
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ getraenk: getraenkeData, email: email })
        });
        const paypalData = await paypalRes.json();


        if (paypalData.approvalUrl) {
          console.log('Leite weiter zu:', paypalData.approvalUrl);
          window.location.href = paypalData.approvalUrl;
        }
        
        return;
      }
  
      // History-Eintrag nur erstellen wenn Getränkedaten vorhanden
      if (getraenkeData) {
        const historyResponse = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, getraenk: getraenkeData.id.toString() })
        });
        const historyData = await historyResponse.json();
        console.log('History Eintrag erstellt:', historyData);
        if (historyData) {
          router.push(`/danke`);
        } else {
          console.log('History Eintrag konnte nicht erstellt werden');
        }
      }
    } catch (error) {
      console.error('Fehler in handleSofortkauf:', error);
    }
  };

  const handlePaypalRechnung = async (email) => {
    try {
      const response = await fetch('/api/paypalRechnung', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await response.json();
      if (data.approvalUrl) {
        window.location.href = data.approvalUrl;
      } else {
        console.error('Fehler in handlePaypalRechnung:', data.error);
        alert(`Keine unbezahlten Bestellungen gefunden.`);
      }
    } catch (error) {
      console.error('Fehler in handlePaypalRechnung:', error);
    }
  };
  

  useEffect(() => {
    const { customer } = router.query;
    if (customer) {
      handlePaypalRechnung(customer);
    }
  }, [router.query]);
  

  return (
    <>
      <div>
        <GetraenkeListe getraenke={getraenke} />
      </div>
    </>
  );
}

export async function getServerSideProps({ query }) {
  try {
    console.log("Starte Datenbankabfrage...");
    const statement = db.prepare("SELECT * FROM getränke");
    const getraenke = statement.all();
    console.log("Abgerufene Getränke:", getraenke);
    return {
      props: { getraenke },
    };
  } catch (error) {
    console.error("Fehler in getServerSideProps:", error);
    return {
      props: { getraenke: [] },
    };
  }
}
