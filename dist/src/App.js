var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useEffect, useState } from "react";
import CertificateDetails from "./components/CertificateDetails";
import CertificateUploader from "./components/CertificateUploader";
import "./styles.css";
function App() {
    var _a, _b, _c;
    // Theme state
    const [theme, setTheme] = useState("dark");
    // Toggle theme function
    const toggleTheme = () => {
        const newTheme = theme === "dark" ? "light" : "dark";
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);
        document.documentElement.classList.toggle("light-theme");
    };
    // Initialize theme from localStorage on component mount
    useEffect(() => {
        const savedTheme = localStorage.getItem("theme");
        if (savedTheme) {
            setTheme(savedTheme);
            if (savedTheme === "light") {
                document.documentElement.classList.add("light-theme");
            }
        }
    }, []);
    // State for single certificate validation
    const [certificate, setCertificate] = useState(null);
    const [validationResult, setValidationResult] = useState(null);
    const [certDetails, setCertDetails] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    // State for certificate compatibility checking
    const [certificates, setCertificates] = useState({});
    const [compatibilityLoading, setCompatibilityLoading] = useState(false);
    const [compatibilityResult, setCompatibilityResult] = useState(null);
    const [compatibilityError, setCompatibilityError] = useState(null);
    const handleCertificateUpload = (cert) => {
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
    const handleMultiCertificateUpload = (certFile) => {
        setCertificates((prev) => (Object.assign(Object.assign({}, prev), { [certFile.type]: certFile })));
        // Reset compatibility results when a new certificate is uploaded
        setCompatibilityResult(null);
        setCompatibilityError(null);
    };
    const handleRemoveCertificate = (type) => {
        setCertificates((prev) => (Object.assign(Object.assign({}, prev), { [type]: null })));
        // Reset compatibility results when a certificate is removed
        setCompatibilityResult(null);
        setCompatibilityError(null);
    };
    const handleValidation = () => __awaiter(this, void 0, void 0, function* () {
        if (!certificate)
            return;
        setLoading(true);
        setError(null);
        setValidationResult(null);
        setCertDetails(null);
        try {
            const formData = new FormData();
            formData.append("certificate", certificate);
            const response = yield fetch("/api/validate", {
                method: "POST",
                body: formData,
            });
            const data = yield response.json();
            if (response.ok) {
                setValidationResult({
                    valid: data.valid,
                    message: data.message ||
                        (data.valid ? "Certificate is valid" : "Certificate is invalid"),
                });
                setCertDetails(data.details);
            }
            else {
                setError(data.error || "Error validating certificate");
            }
        }
        catch (err) {
            setError("Error connecting to server");
            console.error(err);
        }
        finally {
            setLoading(false);
        }
    });
    const handleCompatibilityCheck = () => __awaiter(this, void 0, void 0, function* () {
        if (!certificates.certificate || !certificates.privateKey)
            return;
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
            const response = yield fetch("/api/check-compatibility", {
                method: "POST",
                body: formData,
            });
            const data = yield response.json();
            if (response.ok) {
                setCompatibilityResult(data);
            }
            else {
                setError(data.error || "Error checking compatibility");
            }
        }
        catch (err) {
            setError("Error connecting to server");
            console.error(err);
        }
        finally {
            setCompatibilityLoading(false);
        }
    });
    return (_jsxs("div", { className: "container", children: [_jsxs("div", { className: "header", children: [_jsx("h1", { children: "Certificate Validator" }), _jsx("p", { children: "Validate SSL/TLS certificates and check compatibility" }), _jsx("div", { className: "theme-toggle", children: _jsxs("label", { className: "theme-toggle-switch", children: [_jsx("input", { type: "checkbox", checked: theme === "light", onChange: toggleTheme }), _jsx("span", { className: "theme-toggle-slider" }), _jsxs("div", { className: "theme-toggle-icons", children: [_jsx("span", { children: "\uD83C\uDF19" }), _jsx("span", { children: "\u2600\uFE0F" })] })] }) })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { children: "Single Certificate Validation" }), _jsx(CertificateUploader, { onFileUpload: (file) => {
                            setCertificate(file);
                            setValidationResult(null);
                            setCertDetails(null);
                            setError(null);
                        }, label: "Upload Certificate", currentFile: certificate, onRemove: handleRemoveSingleCertificate }), certificate && (_jsx("div", { className: "validation-button-container", style: { marginTop: "1.5rem", marginBottom: "1.5rem" }, children: _jsx("button", { className: "btn", onClick: handleValidation, disabled: !certificate || loading, children: loading ? "Validating..." : "Validate Certificate" }) })), error && _jsx("div", { className: "result result-invalid", children: error }), validationResult && (_jsxs("div", { className: `result ${validationResult.valid ? "result-valid" : "result-invalid"}`, children: [_jsx("h3", { children: validationResult.valid
                                    ? "Valid Certificate"
                                    : "Invalid Certificate" }), _jsx("p", { children: validationResult.message })] })), certDetails && _jsx(CertificateDetails, { details: certDetails })] }), _jsxs("div", { className: "card", children: [_jsx("h2", { children: "Certificate Compatibility Check" }), _jsxs("div", { className: "upload-group", children: [_jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Certificate" }), _jsx(CertificateUploader, { onFileUpload: (file) => {
                                            setCertificates(Object.assign(Object.assign({}, certificates), { certificate: { file, type: "certificate" } }));
                                            setCompatibilityResult(null);
                                            setError(null);
                                        }, label: "Certificate", currentFile: ((_a = certificates.certificate) === null || _a === void 0 ? void 0 : _a.file) || null, onRemove: () => handleRemoveCertificate("certificate") })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "Private Key" }), _jsx(CertificateUploader, { onFileUpload: (file) => {
                                            setCertificates(Object.assign(Object.assign({}, certificates), { privateKey: { file, type: "privateKey" } }));
                                            setCompatibilityResult(null);
                                            setError(null);
                                        }, label: "Private Key", accept: ".key,.pem", currentFile: ((_b = certificates.privateKey) === null || _b === void 0 ? void 0 : _b.file) || null, onRemove: () => handleRemoveCertificate("privateKey") })] }), _jsxs("div", { className: "form-group", children: [_jsx("label", { children: "CA Bundle (Optional)" }), _jsx(CertificateUploader, { onFileUpload: (file) => {
                                            setCertificates(Object.assign(Object.assign({}, certificates), { caBundle: { file, type: "caBundle" } }));
                                            setCompatibilityResult(null);
                                            setError(null);
                                        }, label: "CA Bundle", currentFile: ((_c = certificates.caBundle) === null || _c === void 0 ? void 0 : _c.file) || null, onRemove: () => handleRemoveCertificate("caBundle") })] })] }), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "btn", onClick: handleCompatibilityCheck, disabled: !certificates.certificate ||
                                    !certificates.privateKey ||
                                    compatibilityLoading, children: compatibilityLoading ? "Checking..." : "Check Compatibility" }), _jsx("p", { className: "help-text", children: "Upload a certificate and its private key to check if they are compatible. CA Bundle is optional." })] }), compatibilityResult && (_jsxs("div", { className: `compatibility-result ${compatibilityResult.compatible
                            ? "compatibility-success"
                            : "compatibility-error"}`, children: [_jsx("h3", { children: compatibilityResult.compatible
                                    ? "Certificate and Private Key are compatible"
                                    : "Certificate and Private Key are not compatible" }), _jsx("p", { children: compatibilityResult.message }), compatibilityResult.details && (_jsx("ul", { className: "compatibility-details", children: compatibilityResult.details.map((detail, index) => (_jsx("li", { children: detail }, index))) }))] }))] })] }));
}
export default App;
