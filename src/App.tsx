import { useEffect, useState } from "react";
import CertificateDetails from "./components/CertificateDetails";
import CertificateUploader from "./components/CertificateUploader";
import "./styles.css";

// Define types
type CertificateType = "certificate" | "privateKey" | "caBundle";

interface CertificateDetails {
  subject: { name: string; value: string }[];
  issuer: { name: string; value: string }[];
  validFrom: string;
  validTo: string;
  serialNumber: string;
  keyUsage?: string[];
  extendedKeyUsage?: string[];
  error?: string;
}

interface CertificateFile {
  file: File;
  type: CertificateType;
}

interface ValidationResult {
  valid: boolean;
  message: string;
}

interface CompatibilityResult {
  compatible: boolean;
  message: string;
  details?: string[];
}

interface CertificateCollection {
  certificate?: CertificateFile;
  privateKey?: CertificateFile;
  caBundle?: CertificateFile;
}

function App() {
  // Theme state
  const [theme, setTheme] = useState<"dark" | "light">("dark");

  // Toggle theme function
  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("light-theme");
  };

  // Initialize theme from localStorage on component mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      if (savedTheme === "light") {
        document.documentElement.classList.add("light-theme");
      }
    }
  }, []);

  // State for single certificate validation
  const [certificate, setCertificate] = useState<File | null>(null);
  const [validationResult, setValidationResult] =
    useState<ValidationResult | null>(null);
  const [certDetails, setCertDetails] = useState<CertificateDetails | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // State for certificate compatibility checking
  const [certificates, setCertificates] = useState<CertificateCollection>({});
  const [compatibilityLoading, setCompatibilityLoading] =
    useState<boolean>(false);
  const [compatibilityResult, setCompatibilityResult] =
    useState<CompatibilityResult | null>(null);
  const [compatibilityError, setCompatibilityError] = useState<string | null>(
    null
  );

  const handleCertificateUpload = (cert: File) => {
    setCertificate(cert);
    setValidationResult(null);
    setCertDetails(null);
    setError(null);
  };

  const handleRemoveSingleCertificate = () => {
    setCertificate(null);
    setValidationResult(null);
    setCertDetails(null);
    setError(null);
  };

  const handleMultiCertificateUpload = (certFile: CertificateFile) => {
    setCertificates((prev) => ({
      ...prev,
      [certFile.type]: certFile,
    }));

    // Reset compatibility results when a new certificate is uploaded
    setCompatibilityResult(null);
    setCompatibilityError(null);
  };

  const handleRemoveCertificate = (type: CertificateType) => {
    setCertificates((prev) => ({
      ...prev,
      [type]: null,
    }));

    // Reset compatibility results when a certificate is removed
    setCompatibilityResult(null);
    setCompatibilityError(null);
  };

  const handleValidation = async () => {
    if (!certificate) return;

    setLoading(true);
    setError(null);
    setValidationResult(null);
    setCertDetails(null);

    try {
      const formData = new FormData();
      formData.append("certificate", certificate);

      const response = await fetch("/api/validate", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setValidationResult({
          valid: data.valid,
          message:
            data.message ||
            (data.valid ? "Certificate is valid" : "Certificate is invalid"),
        });
        setCertDetails(data.details);
      } else {
        setError(data.error || "Error validating certificate");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCompatibilityCheck = async () => {
    if (!certificates.certificate || !certificates.privateKey) return;

    setCompatibilityLoading(true);
    setError(null);
    setCompatibilityResult(null);

    try {
      const formData = new FormData();
      formData.append("certificate", certificates.certificate.file);
      formData.append("privateKey", certificates.privateKey.file);

      if (certificates.caBundle) {
        formData.append("caBundle", certificates.caBundle.file);
      }

      const response = await fetch("/api/check-compatibility", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCompatibilityResult(data);
      } else {
        setError(data.error || "Error checking compatibility");
      }
    } catch (err) {
      setError("Error connecting to server");
      console.error(err);
    } finally {
      setCompatibilityLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="header">
        <h1>Certificate Validator</h1>
        <p>Validate SSL/TLS certificates and check compatibility</p>
        <div className="theme-toggle">
          <label className="theme-toggle-switch">
            <input
              type="checkbox"
              checked={theme === "light"}
              onChange={toggleTheme}
            />
            <span className="theme-toggle-slider"></span>
            <div className="theme-toggle-icons">
              <span>🌙</span>
              <span>☀️</span>
            </div>
          </label>
        </div>
      </div>

      <div className="card">
        <h2>Single Certificate Validation</h2>
        <CertificateUploader
          onFileUpload={(file) => {
            setCertificate(file);
            setValidationResult(null);
            setCertDetails(null);
            setError(null);
          }}
          label="Upload Certificate"
          currentFile={certificate}
          onRemove={handleRemoveSingleCertificate}
        />
        {certificate && (
          <div
            className="validation-button-container"
            style={{ marginTop: "1.5rem", marginBottom: "1.5rem" }}
          >
            <button
              className="btn"
              onClick={handleValidation}
              disabled={!certificate || loading}
            >
              {loading ? "Validating..." : "Validate Certificate"}
            </button>
          </div>
        )}
        {error && <div className="result result-invalid">{error}</div>}
        {validationResult && (
          <div
            className={`result ${
              validationResult.valid ? "result-valid" : "result-invalid"
            }`}
          >
            <h3>
              {validationResult.valid
                ? "Valid Certificate"
                : "Invalid Certificate"}
            </h3>
            <p>{validationResult.message}</p>
          </div>
        )}
        {certDetails && <CertificateDetails details={certDetails} />}
      </div>

      <div className="card">
        <h2>Certificate Compatibility Check</h2>
        <div className="upload-group">
          <div className="form-group">
            <label>Certificate</label>
            <CertificateUploader
              onFileUpload={(file) => {
                setCertificates({
                  ...certificates,
                  certificate: { file, type: "certificate" },
                });
                setCompatibilityResult(null);
                setError(null);
              }}
              label="Certificate"
              currentFile={certificates.certificate?.file || null}
              onRemove={() => handleRemoveCertificate("certificate")}
            />
          </div>
          <div className="form-group">
            <label>Private Key</label>
            <CertificateUploader
              onFileUpload={(file) => {
                setCertificates({
                  ...certificates,
                  privateKey: { file, type: "privateKey" },
                });
                setCompatibilityResult(null);
                setError(null);
              }}
              label="Private Key"
              accept=".key,.pem"
              currentFile={certificates.privateKey?.file || null}
              onRemove={() => handleRemoveCertificate("privateKey")}
            />
          </div>
          <div className="form-group">
            <label>CA Bundle (Optional)</label>
            <CertificateUploader
              onFileUpload={(file) => {
                setCertificates({
                  ...certificates,
                  caBundle: { file, type: "caBundle" },
                });
                setCompatibilityResult(null);
                setError(null);
              }}
              label="CA Bundle"
              currentFile={certificates.caBundle?.file || null}
              onRemove={() => handleRemoveCertificate("caBundle")}
            />
          </div>
        </div>
        <div className="action-buttons">
          <button
            className="btn"
            onClick={handleCompatibilityCheck}
            disabled={
              !certificates.certificate ||
              !certificates.privateKey ||
              compatibilityLoading
            }
          >
            {compatibilityLoading ? "Checking..." : "Check Compatibility"}
          </button>
          <p className="help-text">
            Upload a certificate and its private key to check if they are
            compatible. CA Bundle is optional.
          </p>
        </div>
        {compatibilityResult && (
          <div
            className={`compatibility-result ${
              compatibilityResult.compatible
                ? "compatibility-success"
                : "compatibility-error"
            }`}
          >
            <h3>
              {compatibilityResult.compatible
                ? "Certificate and Private Key are compatible"
                : "Certificate and Private Key are not compatible"}
            </h3>
            <p>{compatibilityResult.message}</p>
            {compatibilityResult.details && (
              <ul className="compatibility-details">
                {compatibilityResult.details.map((detail, index) => (
                  <li key={index}>{detail}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
