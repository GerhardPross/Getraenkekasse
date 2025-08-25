import Card from "react-bootstrap/Card";
import Link from "next/link";
import { useState, useEffect } from 'react';
import Button from 'react-bootstrap/Button';
import Modal from 'react-bootstrap/Modal';
import Form from 'react-bootstrap/Form';
import { FaEdit, FaTrash } from 'react-icons/fa';
import QRCode from 'qrcode';
import dotenv from 'dotenv';
import { useRouter } from 'next/router';


dotenv.config();

export default function GetraenkeListe() {
    const [selectedFile, setSelectedFile] = useState(null);
    const [aendernModel, setAendernModel] = useState(false);
    const [getraenke, setGetraenke] = useState([]);
    const [lgShow, setLgShow] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [admin, setAdmin] = useState(false);
    const [formValues, setFormValues] = useState({
        name: "",
        preis: "",
        bild: "",
    });

    function PrintableQRCode({ data, site_url }) {
        const [qrData, setQrData] = useState('');

        useEffect(() => {
            const qrUrl = `http://${process.env.NEXT_PUBLIC_SITE_URL}/?${data}`;
            console.log("qrUrl", qrUrl);
            QRCode.toDataURL(qrUrl)
                .then((url) => setQrData(url))
                .catch((err) => console.error(err));
        }, [data]);

        return qrData ? (
            <img src={qrData} alt="QR Code" style={{ width: '140px' }} />
        ) : null;
    }

    useEffect(() => {
        const fetchAdmin = async () => {
            const token = localStorage.getItem('userHash');
            const response = await fetch(`/api/controllLocalStorage?token=${token}`, {
                method: 'GET',
            });
            const data = await response.json();
            setAdmin(data.admin);
        };
        fetchAdmin();
    }, []);

    const handleFileChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleDelete = async (id) => {
        setError(null);
        setSuccess(false);
        try {
            const response = await fetch(`/api/getraenke?id=${id}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    id: id,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Löschen des Getränks');
            }

            fetchGetraenke();

        } catch (err) {
        }
    }

    const handleEdit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);
    
        if (!selectedFile) {
            try {
                const response = await fetch(`/api/getraenke?id=${formValues.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id: formValues.id,
                        name: formValues.name,
                        preis: formValues.preis,
                        bild: formValues.bild,
                    }),
                });
    
                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Fehler beim Bearbeiten des Getränks');
                }
    
                setSuccess(true);
                setAendernModel(false);
                setFormValues({ name: "", preis: "", bild: "", id: null });
                fetchGetraenke();
            } catch (err) {
                setError(err.message);
            }
            return;
        }
    
        try {
            const formData = new FormData();
            const imageFiletype = selectedFile.type.split("/")[1];
            
            formData.append("file", selectedFile);
            formData.append("imageName", formValues.id + "." + imageFiletype);
    
            const uploadResponse = await fetch("/api/uploadBild", {
                method: "POST",
                body: formData,
            });
    
            if (!uploadResponse.ok) {
                throw new Error("Fehler beim Hochladen des Bildes.");
            }
    
            const uploadData = await uploadResponse.json();
            const bildUrl = uploadData.filePath;
    
            const response = await fetch(`/api/getraenke?id=${formValues.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    id: formValues.id,
                    name: formValues.name,
                    preis: formValues.preis,
                    bild: bildUrl,
                }),
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Fehler beim Bearbeiten des Getränks');
            }
    
            setSuccess(true);
            setAendernModel(false);
            setFormValues({ name: "", preis: "", bild: "", id: null });
            setSelectedFile(null);
            fetchGetraenke();
        } catch (err) {
            setError(err.message);
        }
    };
    


    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!selectedFile) {
            alert("Bitte wähle eine Datei aus!");
            return;
        }

        try {
            const formData = new FormData();
            const imageFiletype = selectedFile.type.split("/")[1];
            console.log("image filetype", imageFiletype);

            // Getränk speichern
            const response = await fetch("/api/getraenke", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    name: formValues.name,
                    preis: formValues.preis,
                    bild: imageFiletype,
                }),
            });

            const responseData = await response.json();

            formData.append("file", selectedFile); 

            formData.append("imageName", responseData.id + "." + imageFiletype);

            const uploadResponse = await fetch("/api/uploadBild", {
                method: "POST", 
                body: formData,
            });

            if (!uploadResponse.ok) {
                throw new Error("Fehler beim Hochladen des Bildes.");
            }

            const uploadData = await uploadResponse.json();
            const bildUrl = uploadData.filePath;

            console.log("Hochgeladenes Bild:", bildUrl);


            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Fehler beim Speichern des Getränks.");
            }

            setSuccess(true);
            setLgShow(false);
            setFormValues({
                name: "",
                preis: "",
                bild: "",
            });
            setSelectedFile(null);

            fetchGetraenke();
        } catch (err) {
            console.error(err.message);
            setError(err.message);
        }
    };



    const fetchGetraenke = async () => {
        setError(null);
        try {
            const response = await fetch('/api/getraenke');
            if (!response.ok) {
                throw new Error('Fehler beim Laden der Getränke');
            }
            const data = await response.json();
            setGetraenke(data);
        } catch (err) {
            setError(err.message);
            setGetraenke([]);
        }
    };

    useEffect(() => {
        fetchGetraenke();
    }, []);

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormValues(prev => ({
            ...prev,
            [id]: value
        }));
    };

    return (
        <div className="container">
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success" role="alert">
                    Getränk wurde erfolgreich gespeichert!
                </div>
            )}

            <div className="row row-cols-3 row-cols-md-4 row-cols-lg-5">
                {getraenke.map((getraenk) => (
                    <div className="col d-flex justify-content-center mt-3" key={getraenk.id}>
                        <Card style={{ width: "20vw", height: "30vw" }} className="card-hover-container">
                            {admin && (
                            <div className="card-hover-icons">
                                <FaEdit style={{ cursor: "pointer", color: "blue" }} title="Bearbeiten" type="submit"
                                    onClick={() => {

                                        setAendernModel(true);
                                        setFormValues({
                                            name: getraenk.name,
                                            preis: getraenk.preis,
                                            bild: getraenk.bild,
                                        });
                                        setFormValues((prev) => ({
                                            ...prev,
                                            id: getraenk.id, 
                                        }));
                                    }}
                                />
                                <FaTrash style={{ cursor: "pointer", color: "red" }} title="Löschen" type="submit" onClick={() => handleDelete(getraenk.id)} />
                            </div >
                            )}
                            <div className="card-img-container justify-content-center align-items-center d-flex w-100 h-60">
                                <Link href={`/?${getraenk.id}`} passHref onClick={() => window.location.reload()}>
                                    <Card.Img className="w-100 h-100" style={{  objectFit: 'contain' }} variant="top" src={getraenk.bild} alt={getraenk.name} />
                                </Link>
                            </div>
                            <Card.Body>
                                        <Card.Title className="text-center " style={{ fontSize: "2vw", fontWeight: "bold", marginTop: "-10px"}}>
                                            <div> {getraenk.name} </div>
                                            <div> {getraenk.preis.toFixed(2)} € </div>
                                        </Card.Title>
                            </Card.Body>
                        </Card>
                    </div>
                ))}
                <div id="printableArea" className="print-only" style={{backgroundImage: `url('/bilder/hintergrundDruck.jpg')`, backgroundSize: 'contain', width: '210mm', height: '297mm', backgroundRepeat: 'no-repeat', backgroundPosition: 'bottom', marginTop: '-160px',paddingTop: '-160px'}}>
                    <div className="row row-cols-1 d-flex justify-content-center align-items-center" style={{paddingTop: '340px'}}>
                        <div className="text-center justify-content-center align-items-center" style={{fontSize: '1vw', fontWeight: 'bold'}}>
                            <p>Hier scannen um ihr Getränk zu bezahlen</p>
                        </div>
                    {getraenke.map((getraenk) => (
                        <div className="d-flex justify-content-between align-items-center" key={getraenk.id} style={{transform: 'scale(0.75)'}}>
                            <div className="drink-image justify-content-center align-items-center d-flex" style={{marginLeft: '-15px'}}>
                                <img src={getraenk.bild} alt={getraenk.name} />
                            </div>
                            <div className="text-center justify-content-center align-items-center">
                            <div className="drink-name" style={{fontSize: '2vw'}}>
                                {getraenk.name}
                            </div>
                            <div className="drink-price justify-content-center align-items-center" style={{fontSize: '1.5vw'}}>
                                {getraenk.preis.toFixed(2)} €
                            </div>
                            </div>
                            <div className="drink-qr justify-content-end align-items-center d-flex" style={{marginRight: '0px'}}>
                                <PrintableQRCode data={getraenk.id.toString()} site_url={process.env.NEXT_PUBLIC_SITE_URL} />
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            </div>

            <br />
            {admin && (
            <div className="row row-cols-3">
                <div className="mt-3 col">
                    <Card className="card-hover-container" style={{ width: "20vw", height: "30vw" }}>
                        <Button className="btn btn-light rounded-0 mx-0 my-0 px-0 py-0 " onClick={() => setLgShow(true)}>
                            <Card.Img className="rounded-0 rounded-top" variant="top" src='/bilder/Plus.webp' alt="Plus" />
                        </Button>
                        <Card.Body>
                            <Card.Title className="text-center">
                                Neues Getränk
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </div>
                <div className="mt-3 col">
                    <Card className="card-hover-container" style={{ width: "20vw", height: "30vw" }}>
                        <Button className="btn btn-light rounded-0 mx-0 my-0 px-0 py-0 " onClick={() => window.print()}>
                            <Card.Img className="rounded-0 rounded-top" variant="top" src='/bilder/PDF.webp' alt="PDF" />
                        </Button>
                        <Card.Body>
                            <Card.Title className="text-center">
                                Download
                            </Card.Title>
                        </Card.Body>
                    </Card>
                </div>
            </div>
            )}
            <br /><br />
            <Modal
                size="lg"
                show={lgShow}
                onHide={() => setLgShow(false)}
                aria-labelledby="example-modal-sizes-title-lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-lg">
                        Getränk erstellen
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleSubmit}>
                        <div className="row row-cols-2">
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    value={formValues.name}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="preis" className="form-label">Preis</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="preis"
                                    value={formValues.preis}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="bild" className="form-label">Bild</label>
                            <input
                                type="file"
                                className="form-control"
                                name="file"
                                id="bild"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />

                        </div>
                        <div className="mb-3 text-center justify-content-center align-items-center d-flex">
                            <button type="submit" className="btn btn-primary">
                                Speichern
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>

            <Modal
                size="lg"
                show={aendernModel}
                onHide={() => setAendernModel(false, null)}
                aria-labelledby="example-modal-sizes-title-lg"
            >
                <Modal.Header closeButton>
                    <Modal.Title id="example-modal-sizes-title-lg">
                        Getränk ändern
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <form onSubmit={handleEdit}>
                        <div className="row row-cols-2">
                            <div className="mb-3">
                                <label htmlFor="name" className="form-label">Name</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    id="name"
                                    value={formValues.name || ""}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="preis" className="form-label">Preis</label>
                                <input
                                    type="number"
                                    className="form-control"
                                    id="preis"
                                    value={formValues.preis || ""}
                                    onChange={handleInputChange}
                                    step="0.01"
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-3">
                            <label htmlFor="bild" className="form-label">Bild</label>
                            <input
                                type="file"
                                className="form-control"
                                name="file"
                                id="bild"
                                accept=".jpg,.jpeg,.png"
                                onChange={handleFileChange}
                            />
                        </div>
                        <div className="mb-3 text-center justify-content-center align-items-center d-flex">
                            <button type="submit" className="btn btn-primary">
                                Speichern
                            </button>
                        </div>
                    </form>
                </Modal.Body>
            </Modal>
        </div>
    )
}
