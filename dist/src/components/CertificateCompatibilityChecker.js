import { jsx as _jsx, jsxs as _jsxs, Fragment as _Fragment } from "react/jsx-runtime";
import { useState } from "react";
function CertificateCompatibilityChecker({ certificates, onCheckCompatibility, onRemoveCertificate, loading, }) {
    const { certificate, privateKey, caBundle } = certificates;
    const [allowNameMatchOverride, setAllowNameMatchOverride] = useState(false);
    const [debugMode, setDebugMode] = useState(false);
    const [forceGoDaddyOverride, setForceGoDaddyOverride] = useState(false);
    const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
    const isDisabled = !certificate || !privateKey || loading;
    const getFileStatus = (file, type) => {
        if (!file)
            return _jsx("span", { className: "status-missing", children: "Missing" });
        return (_jsxs("div", { className: "file-status-container", children: [_jsx("span", { className: "status-uploaded", children: file.file.name }), _jsx("button", { className: "btn-remove", onClick: (e) => {
                        e.stopPropagation();
                        onRemoveCertificate(type);
                    }, title: `Remove ${type}`, children: "\u2715" })] }));
    };
    return (_jsxs("div", { className: "compatibility-checker", children: [_jsx("h3", { children: "Certificate Files" }), _jsxs("div", { className: "certificate-status", children: [_jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "Certificate:" }), " ", getFileStatus(certificate, "certificate")] }), _jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "Private Key:" }), " ", getFileStatus(privateKey, "privateKey")] }), _jsxs("div", { className: "certificate-status-item", children: [_jsx("strong", { children: "CA Bundle:" }), " ", getFileStatus(caBundle, "caBundle"), " ", _jsx("span", { className: "optional", children: "(Optional)" })] })] }), caBundle && (_jsxs(_Fragment, { children: [_jsx("div", { className: "advanced-options-toggle", children: _jsxs("button", { className: "btn-advanced", onClick: () => setShowAdvancedOptions(!showAdvancedOptions), children: [showAdvancedOptions ? "Hide" : "Show", " Advanced Options", _jsx("svg", { width: "16", height: "16", viewBox: "0 0 16 16", fill: "none", style: {
                                        transform: showAdvancedOptions
                                            ? "rotate(180deg)"
                                            : "rotate(0deg)",
                                        transition: "transform 0.3s ease",
                                    }, children: _jsx("path", { d: "M8 12L2 6L3.4 4.6L8 9.2L12.6 4.6L14 6L8 12Z", fill: "currentColor" }) })] }) }), showAdvancedOptions && (_jsxs("div", { className: "advanced-options", children: [_jsx("h4", { style: { margin: "0 0 15px 0" }, children: "Advanced Options" }), _jsxs("label", { className: "checkbox-container", style: { fontWeight: "bold", color: "var(--primary)" }, children: [_jsx("input", { type: "checkbox", checked: allowNameMatchOverride, onChange: (e) => setAllowNameMatchOverride(e.target.checked) }), _jsx("span", { className: "checkbox-text", children: "Allow name match override (Recommended for GoDaddy certificates)" })] }), _jsx("div", { className: "help-text", children: _jsx("small", { children: "This option will consider certificates compatible if the CA subject matches the certificate issuer, even if signature verification fails. This is often necessary for GoDaddy certificates." }) }), _jsxs("label", { className: "checkbox-container", style: { marginTop: "15px" }, children: [_jsx("input", { type: "checkbox", checked: debugMode, onChange: (e) => setDebugMode(e.target.checked) }), _jsx("span", { className: "checkbox-text", children: "Enable Debug Mode" })] }), _jsx("div", { className: "help-text", children: _jsx("small", { children: "Enables detailed logging in the server console for troubleshooting certificate issues." }) }), _jsxs("label", { className: "checkbox-container", style: { marginTop: "15px" }, children: [_jsx("input", { type: "checkbox", checked: forceGoDaddyOverride, onChange: (e) => setForceGoDaddyOverride(e.target.checked) }), _jsx("span", { className: "checkbox-text", children: "Force GoDaddy Override" })] }), _jsx("div", { className: "help-text", children: _jsx("small", { children: "Forces compatibility for GoDaddy certificates, bypassing all verification checks. Use only for testing." }) })] }))] })), _jsxs("div", { className: "action-buttons", children: [_jsx("button", { className: "btn", onClick: () => onCheckCompatibility({
                            allowNameMatchOverride,
                            debugMode,
                            forceGoDaddyOverride,
                        }), disabled: isDisabled, children: loading ? "Checking Compatibility..." : "Check Compatibility" }), isDisabled && !loading && (_jsx("p", { className: "help-text", children: "Please upload both a certificate and private key to check compatibility" }))] })] }));
}
export default CertificateCompatibilityChecker;
