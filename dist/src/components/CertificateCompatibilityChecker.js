import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
function CertificateCompatibilityChecker({ certificates, onCheckCompatibility, onRemoveCertificate, loading, }) {
    const { certificate, privateKey, caBundle } = certificates;
    const isDisabled = !certificate || !privateKey || loading;
    const getFileStatus = (file, type) => {
        if (!file)
            return _jsx("span", { className: "status-missing", children: "Missing" });
        return (_jsxs("div", { className: "file-status-container", children: [_jsx("span", { className: "status-uploaded", children: file.file.name }), _jsx("button", { className: "btn-remove", onClick: (e) => {
                        e.stopPropagation();
                        onRemoveCertificate(type);
                    }, title: `Remove ${type}`, children: "\u2715" })] }));
    };
    return (_jsxs("div", { className: "compatibility-checker", children: [_jsx("h3", { children: "Certificate Files" }), _jsxs("div", { className: "certificate-status", children: [_jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "Certificate:" }), " ", getFileStatus(certificate, "certificate")] }), _jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "Private Key:" }), " ", getFileStatus(privateKey, "privateKey")] }), _jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "CA Bundle:" }), " ", getFileStatus(caBundle, "caBundle"), " ", _jsx("span", { className: "optional", children: "(Optional)" })] })] }), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "btn", onClick: onCheckCompatibility, disabled: isDisabled, children: loading ? "Checking Compatibility..." : "Check Compatibility" }), isDisabled && !loading && (_jsx("p", { className: "help-text", children: "Please upload both a certificate and private key to check compatibility" }))] })] }));
}
export default CertificateCompatibilityChecker;
