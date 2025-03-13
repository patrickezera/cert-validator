interface CertificateValidatorProps {
  onValidate: () => void;
  onRemove: () => void;
  loading: boolean;
  fileName: string;
}

function CertificateValidator({
  onValidate,
  onRemove,
  loading,
  fileName,
}: CertificateValidatorProps) {
  return (
    <div className="form-group">
      <div className="certificate-status-item">
        <div className="file-status-container">
          <span className="file-icon">📄</span>
          <span className="status-uploaded">{fileName}</span>
          <button
            className="btn-remove"
            onClick={onRemove}
            title="Remove certificate"
          >
            ✕
          </button>
        </div>
        <button
          className="btn"
          onClick={onValidate}
          disabled={loading}
          style={{ marginLeft: "auto" }}
        >
          {loading ? (
            <>
              <svg
                className="loading-spinner"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <path d="M12 6v6l4 2" />
              </svg>
              Validating...
            </>
          ) : (
            "Validate Certificate"
          )}
        </button>
      </div>
    </div>
  );
}

export default CertificateValidator;
