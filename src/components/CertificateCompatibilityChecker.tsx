import { useState } from "react";

// Define the type locally
type CertificateType = "certificate" | "privateKey" | "caBundle";

interface CertificateFile {
  file: File;
  type: CertificateType;
}

interface CertificateCompatibilityCheckerProps {
  certificates: Record<CertificateType, CertificateFile | null>;
  onCheckCompatibility: (allowNameMatchOverride: boolean) => void;
  onRemoveCertificate: (type: CertificateType) => void;
  loading: boolean;
}

function CertificateCompatibilityChecker({
  certificates,
  onCheckCompatibility,
  onRemoveCertificate,
  loading,
}: CertificateCompatibilityCheckerProps) {
  const { certificate, privateKey, caBundle } = certificates;
  const [allowNameMatchOverride, setAllowNameMatchOverride] = useState(false);

  const isDisabled = !certificate || !privateKey || loading;

  const getFileStatus = (
    file: CertificateFile | null,
    type: CertificateType
  ) => {
    if (!file) return <span className="status-missing">Missing</span>;

    return (
      <div className="file-status-container">
        <span className="status-uploaded">{file.file.name}</span>
        <button
          className="btn-remove"
          onClick={(e) => {
            e.stopPropagation();
            onRemoveCertificate(type);
          }}
          title={`Remove ${type}`}
        >
          ✕
        </button>
      </div>
    );
  };

  return (
    <div className="compatibility-checker">
      <h3>Certificate Files</h3>
      <div className="certificate-status">
        <div className="certificate-status-item">
          <strong>Certificate:</strong>{" "}
          {getFileStatus(certificate, "certificate")}
        </div>
        <div className="certificate-status-item">
          <strong>Private Key:</strong>{" "}
          {getFileStatus(privateKey, "privateKey")}
        </div>
        <div className="certificate-status-item">
          <strong>CA Bundle:</strong> {getFileStatus(caBundle, "caBundle")}{" "}
          <span className="optional">(Optional)</span>
        </div>
      </div>

      {caBundle && (
        <div className="advanced-options">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={allowNameMatchOverride}
              onChange={(e) => setAllowNameMatchOverride(e.target.checked)}
            />
            <span className="checkbox-text">
              Allow name match override (use when signature verification fails
              but names match)
            </span>
          </label>
          <div className="help-text">
            <small>
              This option will consider certificates compatible if the CA
              subject matches the certificate issuer, even if signature
              verification fails. Use with caution.
            </small>
          </div>
        </div>
      )}

      <div className="action-buttons">
        <button
          className="btn"
          onClick={() => onCheckCompatibility(allowNameMatchOverride)}
          disabled={isDisabled}
        >
          {loading ? "Checking Compatibility..." : "Check Compatibility"}
        </button>
        {isDisabled && !loading && (
          <p className="help-text">
            Please upload both a certificate and private key to check
            compatibility
          </p>
        )}
      </div>
    </div>
  );
}

export default CertificateCompatibilityChecker;
