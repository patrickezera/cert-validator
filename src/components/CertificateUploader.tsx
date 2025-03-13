import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";

interface CertificateUploaderProps {
  onFileUpload: (file: File) => void;
  accept?: string;
  label?: string;
  currentFile: File | null;
}

const CertificateUploader: React.FC<CertificateUploaderProps> = ({
  onFileUpload,
  accept = ".pem,.crt,.cer,.key",
  label = "Upload Certificate",
  currentFile = null,
}) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length > 0) {
        onFileUpload(acceptedFiles[0]);
      }
    },
    [onFileUpload]
  );

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: {
      "application/x-x509-ca-cert": [".pem", ".crt", ".cer"],
      "application/pkcs8": [".key"],
      "application/x-pem-file": [".pem"],
    },
    multiple: false,
    onDragEnter: () => setIsDragActive(true),
    onDragLeave: () => setIsDragActive(false),
    onDropAccepted: () => setIsDragActive(false),
    onDropRejected: () => setIsDragActive(false),
  });

  return (
    <div
      {...getRootProps()}
      className={`file-drop-area ${isDragActive ? "active" : ""} ${
        currentFile ? "has-file" : ""
      }`}
    >
      <input {...getInputProps()} />
      <div className="file-info">
        {currentFile ? (
          <>
            <div className="file-name">
              <span className="file-icon">📄</span>
              <span className="file-text">{currentFile.name}</span>
            </div>
            <p className="file-replace-hint">
              Drop a new file or click to replace
            </p>
          </>
        ) : (
          <>
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="upload-icon"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="17 8 12 3 7 8"></polyline>
              <line x1="12" y1="3" x2="12" y2="15"></line>
            </svg>
            <p>
              <strong>{label}</strong>
            </p>
            <p>Drag & drop a file here, or click to select</p>
            <p className="file-formats">
              Supported formats: {accept.replace(/\./g, " ")}
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default CertificateUploader;
