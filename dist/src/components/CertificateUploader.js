import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
const CertificateUploader = ({ onFileUpload, accept = ".pem,.crt,.cer,.key", label = "Upload Certificate", currentFile = null, }) => {
    const [isDragActive, setIsDragActive] = useState(false);
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles.length > 0) {
            onFileUpload(acceptedFiles[0]);
        }
    }, [onFileUpload]);
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
    return (_jsxs("div", Object.assign({}, getRootProps(), { className: `file-drop-area ${isDragActive ? "active" : ""} ${currentFile ? "has-file" : ""}`, children: [_jsx("input", Object.assign({}, getInputProps())), _jsx("div", { className: "file-info", children: currentFile ? (_jsxs(_Fragment, { children: [_jsxs("div", { className: "file-name", children: [_jsx("span", { className: "file-icon", children: "\uD83D\uDCC4" }), _jsx("span", { className: "file-text", children: currentFile.name })] }), _jsx("p", { className: "file-replace-hint", children: "Drop a new file or click to replace" })] })) : (_jsxs(_Fragment, { children: [_jsxs("svg", { width: "48", height: "48", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round", className: "upload-icon", children: [_jsx("path", { d: "M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" }), _jsx("polyline", { points: "17 8 12 3 7 8" }), _jsx("line", { x1: "12", y1: "3", x2: "12", y2: "15" })] }), _jsx("p", { children: _jsx("strong", { children: label }) }), _jsx("p", { children: "Drag & drop a file here, or click to select" }), _jsxs("p", { className: "file-formats", children: ["Supported formats: ", accept.replace(/\./g, " ")] })] })) })] })));
};
export default CertificateUploader;
