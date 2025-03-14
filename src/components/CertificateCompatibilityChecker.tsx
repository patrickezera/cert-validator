import { useState } from "react";

// Define the type locally
type CertificateType = "certificate" | "privateKey" | "caBundle";

interface CertificateFile {
  file: File;
  type: CertificateType;
}

interface CertificateCompatibilityCheckerProps {
  certificates: Record<CertificateType, CertificateFile | null>;
  onCheckCompatibility: (options: {
    allowNameMatchOverride: boolean;
    debugMode: boolean;
    forceGoDaddyOverride: boolean;
  }) => void;
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
  const [debugMode, setDebugMode] = useState(false);
  const [forceGoDaddyOverride, setForceGoDaddyOverride] = useState(false);
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
        <>
          <div className="advanced-options-toggle">
            <button
              className="btn-advanced"
              onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            >
              {showAdvancedOptions ? "Hide" : "Show"} Advanced Options
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                style={{
                  transform: showAdvancedOptions
                    ? "rotate(180deg)"
                    : "rotate(0deg)",
                  transition: "transform 0.3s ease",
                }}
              >
                <path
                  d="M8 12L2 6L3.4 4.6L8 9.2L12.6 4.6L14 6L8 12Z"
                  fill="currentColor"
                />
              </svg>
            </button>
          </div>

          {showAdvancedOptions && (
            <div className="advanced-options">
              <h4 style={{ margin: "0 0 15px 0" }}>Advanced Options</h4>

              <label
                className="checkbox-container"
                style={{ fontWeight: "bold", color: "var(--primary)" }}
              >
                <input
                  type="checkbox"
                  checked={allowNameMatchOverride}
                  onChange={(e) => setAllowNameMatchOverride(e.target.checked)}
                />
                <span className="checkbox-text">
                  Allow name match override (Recommended for GoDaddy
                  certificates)
                </span>
              </label>
              <div className="help-text">
                <small>
                  This option will consider certificates compatible if the CA
                  subject matches the certificate issuer, even if signature
                  verification fails. This is often necessary for GoDaddy
                  certificates.
                </small>
              </div>

              <label
                className="checkbox-container"
                style={{ marginTop: "15px" }}
              >
                <input
                  type="checkbox"
                  checked={debugMode}
                  onChange={(e) => setDebugMode(e.target.checked)}
                />
                <span className="checkbox-text">Enable Debug Mode</span>
              </label>
              <div className="help-text">
                <small>
                  Enables detailed logging in the server console for
                  troubleshooting certificate issues.
                </small>
              </div>

              <label
                className="checkbox-container"
                style={{ marginTop: "15px" }}
              >
                <input
                  type="checkbox"
                  checked={forceGoDaddyOverride}
                  onChange={(e) => setForceGoDaddyOverride(e.target.checked)}
                />
                <span className="checkbox-text">Force GoDaddy Override</span>
              </label>
              <div className="help-text">
                <small>
                  Forces compatibility for GoDaddy certificates, bypassing all
                  verification checks. Use only for testing.
                </small>
              </div>
            </div>
          )}
        </>
      )}

      <div className="action-buttons">
        <button
          className="btn"
          onClick={() =>
            onCheckCompatibility({
              allowNameMatchOverride,
              debugMode,
              forceGoDaddyOverride,
            })
          }
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
