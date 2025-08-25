import 'bootstrap/dist/css/bootstrap.min.css';
import { useEffect } from 'react';

export default function Danke() {

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get('email');
    const getraenk = new URLSearchParams(window.location.search).get('getraenk');

    const belegErstellen = async () => {
      if (getraenk) {
        await fetch('/api/belegErstellen', {
          method: 'POST',
          headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, getraenk })
        });
      }
    };
    belegErstellen();
    console.log("email", email, "getraenk", getraenk);
  }, []);

  useEffect(() => {
    // Hier kommt die OrderID aus dem Parameter "token"
    const orderID = new URLSearchParams(window.location.search).get('token');
    const email = new URLSearchParams(window.location.search).get('email');
    console.log("orderID", orderID, "email", email);
    if (orderID) {
      captureResponse(orderID, email);
    }
  }, []);


  const captureResponse = async (orderID, email) => {
    try {
      // Aufruf der serverseitigen API-Route
      const response = await fetch('/api/capture', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ orderID, email })
      });
      const {captureData} = await response.json();
      if (captureData.status === 'COMPLETED') {
        console.log('Zahlung erfasst:', captureData);
        historyBezahlt(email);
      } else {
        console.log('Zahlung nicht erfasst:', captureData);
      }
    } catch (error) {
      console.error('Fehler bei der Zahlungserfassung:', error);
    }
  };
 
  const historyBezahlt = async (email) => {
    const historyBezahlt = await fetch('/api/history', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: email, bezahlt: 1 })
    });
    const historyBezahltData = await historyBezahlt.json();
    console.log(historyBezahltData);
  }

  return (
    <div className="justify-content-center align-items-center text-center">
      <div className="mt-5 mb-5">
        <h1><b>Danke für ihren Einkauf beim AI xpress</b></h1>
      </div>
      <div className="mb-3">
        <label>Wir wünschen einen angenehmen Tag</label>
      </div>
      <div className="p-3">
        Bis zum nächsten Einkauf
      </div>
    </div>
  );
}
