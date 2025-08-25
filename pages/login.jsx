"use client";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Form from 'react-bootstrap/Form';


export default function Login() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);
  const [showMessage, setShowMessage] = useState(false);
  const [userExists, setUserExists] = useState(false);
  const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const isValidStreetAndNumber = (input) => /^[a-zA-ZäöüÄÖÜß\s-]+\s\d+[a-zA-Z]?$/.test(input);
  const isValidText = (input) => {
    return input && input.trim().length > 0;
  };
  
  const [loading, setLoading] = useState(false);
  const isValidPLZOrt = (input) => {
    const match = input.match(/^(\d{5})[ ,]+([a-zA-ZäöüÄÖÜß\s-]+)$/);
    return match !== null;
  };
  const [formValues, setFormValues] = useState({
    email: '',
    firmenname: '',
    name: '',
    strasse: '',
    ort: '',
    sofortkauf: true,
  });


  useEffect(() => {
    const fetchUserData = async () => {
      if (isValidEmail(formValues.email)) {
        setLoading(true);
        try {
          const response = await fetch(`/api/user?email=${formValues.email.toLowerCase()}`);
          if (!response.ok) throw new Error("Fehler beim Laden der Benutzerdaten");
          const data = await response.json();
          setUserExists(true);
          setFormValues((prev) => ({
            ...prev,
            sofortkauf: data.sofortkauf ?? true,
          }));


        } catch (error) {
          console.error(error);
        } finally {
          setLoading(false);
        }
      }
    };

    const delay = setTimeout(fetchUserData, 500);
    return () => clearTimeout(delay);
  }, [formValues.email]);


  const isFormValid = (
    isValidEmail(formValues.email) &&
    isValidText(formValues.firmenname) &&
    isValidText(formValues.name) &&
    isValidStreetAndNumber(formValues.strasse) &&
    isValidPLZOrt(formValues.ort)
  );

  let getraenkeID;
  if (getraenkeID === undefined || getraenkeID === null) {
    console.log('getraenkeID ist undefined oder null');
    console.log('router.query.getraenk', router.query.getraenk);
    getraenkeID = router.query.getraenk;
  } else {
    console.log('getraenkeID ist definiert');
    console.log('getraenkeID', getraenkeID);
  }

  useEffect(() => {
    const { token, getraenk } = router.query;
    if (token) {
      handleVerify(token, getraenk);
    }
  }, [router.query]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    let requestList = '';
    if (formValues.firmenname !== '' || formValues.name !== '' || formValues.strasse !== '' || formValues.ort !== '') {
      requestList = {
        email: formValues.email.toLowerCase(),
        sofortkauf: formValues.sofortkauf
      };

      if (formValues.firmenname !== '') { requestList.firmenname = formValues.firmenname; };
      if (formValues.name !== '') { requestList.name = formValues.name; };
      if (formValues.strasse !== '') { requestList.strasse = formValues.strasse; };
      if (formValues.ort !== '') { requestList.ort = formValues.ort; };
    }

    let admin_value = false;

    if (formValues.email.split('@')[1] === process.env.NEXT_PUBLIC_ADMIN_EMAIL) {
      admin_value = true;
    }

    const response = await fetch('/api/auth_table', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: formValues.email.toLowerCase(),
        getraenk: getraenkeID,
        changes: requestList,
        sofortkauf: formValues.sofortkauf,
        admin: admin_value
      }),
    });
    const data = await response.json();
    console.log('data', data);

    setShowForm(false);
    setShowMessage(true);
  };




  const handleChanges = async (email) => {
    console.log('email handleChanges', email);
    try {
      const responseChanges = await fetch(`/api/auth_table?email=${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const { changes, sofortkauf } = await responseChanges.json();

      const responseUser = await fetch(`/api/checkUserExist?email=${email}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const dataUser = await responseUser.json();
      console.log('dataUser', dataUser);
      
      if (dataUser.user === true) {
        const responseChanges = await fetch(`/api/user`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            firmenname: changes.firmenname,
            name: changes.name,
            strasse: changes.strasse,
            ort: changes.ort,
            sofortkauf: sofortkauf
          }),
        });
        await responseChanges.json();
        console.log('responseChanges', responseChanges);
      } else {
        const responseChanges = await fetch(`/api/user`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: email,
            firmenname: changes.firmenname,
            name: changes.name,
            strasse: changes.strasse,
            ort: changes.ort,
            sofortkauf: sofortkauf
          }),
        });
        await responseChanges.json();
        console.log('responseChanges', responseChanges);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Änderungen:', error);
    }
  };






  const handleVerify = async (token, getraenk) => {
    try {
      const response = await fetch(`/api/verify?token=${token}`);
      const data = await response.json();

      if (data.valid) {
        const email = data.email;
        const expirationDate = new Date();
        expirationDate.setDate(expirationDate.getDate() + 30);

        const dataToHash = email + expirationDate.toISOString();

        const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(dataToHash));
        const hashArray = Array.from(new Uint8Array(hashBuffer));
        const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
      

        localStorage.setItem('userHash', hashHex);

        const response = await fetch('/api/auth_table', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: hashHex,
            email: email
          }),
        })
        if (response.ok) {
          console.log('Token gespeichert');
        } else {
          console.error('Fehler beim Speichern des Tokens');
        }

        getraenk ? router.push(`/?${getraenk}`) : router.push(`/`);

        handleChanges(email);
      } else {
        // Token ist ungültig oder abgelaufen
        console.error('Token ungültig oder abgelaufen');
        router.push('/login');
      }
    } catch (error) {
      console.error('Fehler bei der Token-Überprüfung:', error);
      router.push('/login');
    }
  };


  return (
    <>
    {showForm && (
    <div>
      <Form className='d-flex justify-content-center align-items-center' onSubmit={handleSubmit}>
        <div className='row row-cols-1'>
          <div className='mb-3 mt-3'>
            <label>
              <b>Hier bitte ihre E-Mail Adresse eingeben</b>
            </label>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center'>
              <input type="text"
                placeholder="E-Mail"
                className="justify-content-center align-items-center text-center w-100"
                value={formValues.email}
                onChange={(e) => setFormValues({ ...formValues, email: e.target.value })}
                style={{ borderColor: isValidEmail(formValues.email) ? "green" : "red" }}
              />
            </div>
            <div className=' row row-cols-3'>
              <div className='mb-3 mt-3 d-flex justify-content-center align-items-center'>
                <label><b>Sofortkauf</b></label>
              </div>
              <div className='mb-3 mt-3 d-flex justify-content-center align-items-center'>
                <div className="d-flex align-items-center gap-2">
                  <Form.Check
                    type="switch"
                    id="custom-switch"
                    className="custom-toggle"
                    label=''
                    checked={!formValues.sofortkauf}
                    onChange={() => setFormValues({ ...formValues, sofortkauf: !formValues.sofortkauf })}
                  />
                </div>
              </div>
              <div className='mb-3 mt-3 d-flex justify-content-center align-items-center'>
                <label><b>Rechnung</b></label>
              </div>
            </div>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center'>
              {formValues.sofortkauf && (
                <button type="submit" className="btn btn-primary w-75">
                  Login
                </button>
              )}
            </div>
          </div>
        </div>
      </Form>

      {!formValues.sofortkauf && (
        <Form className='d-flex justify-content-center align-items-center text-center' onSubmit={handleSubmit}>
          <div className='row row-cols-1 d-flex justify-content-center align-items-center'>
            <label><b>Firmenname</b></label>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center w-100'>
              <input type="text"
                placeholder={userExists ? 'bereits vorhanden' : 'Firmenname'}
                className="justify-content-center align-items-center text-center"
                value={formValues.firmenname}
                onChange={(e) => setFormValues({ ...formValues, firmenname: e.target.value })}
              />
            </div>
            <label><b>Ansprechpartner</b></label>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center w-100'>
              <input type="text"
                placeholder={userExists ? 'bereits vorhanden' : 'Ansprechpartner'}
                className="justify-content-center align-items-center text-center"
                value={formValues.name}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                style={{borderColor: isValidText(formValues.name) ? "green" : "red" }}
              />
            </div>
            <label><b>Strasse & Hausnummer</b></label>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center w-100'>
              <input type="text"
                placeholder={userExists ? 'bereits vorhanden' : 'Strasse & Hausnummer'}
                className="justify-content-center align-items-center text-center"
                value={formValues.strasse}
                onChange={(e) => setFormValues({ ...formValues, strasse: e.target.value })}
                style={{ borderColor: isValidStreetAndNumber(formValues.strasse) ? "green" : "red" }}
              />
            </div>
            <label><b>PLZ & Ort</b></label>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center w-100'>
              <input type="text"
                placeholder={userExists ? 'bereits vorhanden' : 'PLZ & Ort'}
                className="justify-content-center align-items-center text-center"
                value={formValues.ort}
                onChange={(e) => setFormValues({ ...formValues, ort: e.target.value })}
                style={{ borderColor: isValidPLZOrt(formValues.ort) ? "green" : "red" }}
              />
            </div>
            <div className='mb-1 mt-3 d-flex justify-content-center align-items-center w-100 fw-bold'>
              <p> Ihre Rechnung wird Ihnen zum 1. des folgenden Monats zugestellt</p>
            </div>
            <div className='mb-3 mt-3 d-flex justify-content-center align-items-center w-100'>
              <button type="submit" className="btn btn-primary" disabled={userExists ? false : !isFormValid}>
                Login
              </button>
            </div>
          </div>
        </Form>
      )}
    </div>
  )}
      {showMessage && (
        <div className='d-flex justify-content-center align-items-center flex-column mt-5'>
          <div className='d-flex justify-content-center align-items-center'>
          <p>
            <b>Ein Link wurde an ihre E-Mail Adresse gesendet.</b>
          </p>
          </div>
          <div className='d-flex justify-content-center align-items-center'>
          <p>
            <b>Bitte klicken Sie auf den Link, um den Login zu bestätigen.</b>
          </p>
          </div>
          <div className='d-flex justify-content-center align-items-center'>
          <button className='btn btn-primary' onClick={() => {setShowMessage(false); setShowForm(true);}}>Zurück</button>
          </div>
        </div>
      )}
    </>
  );
}