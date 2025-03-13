import { jsxs as _jsxs, jsx as _jsx } from "react/jsx-runtime";
function CertificateDetails({ details }) {
    if (!details)
        return null;
    const formatDate = (dateString) => {
        if (!dateString)
            return "N/A";
        const date = new Date(dateString);
        return date.toLocaleString();
    };
    // Filter out unwanted fields from subject and issuer
    const filterFields = (items) => {
        // Add names of fields you want to exclude here
        const excludedFields = [
            "Jurisdiction Country",
            "Jurisdiction State",
            "Jurisdiction Locality",
            "Business Category",
            "fingerprint",
            "serialNumber",
            "organizationalUnit",
        ];
        return items.filter((item) => !excludedFields.includes(item.name));
    };
    // Render array of name-value pairs as a list
    const renderNameValueList = (items) => {
        if (!items || !items.length)
            return "N/A";
        // Filter the items before rendering
        const filteredItems = filterFields(items);
        return (_jsx("ul", { className: "certificate-list", children: filteredItems.map((item, index) => (_jsxs("li", { children: [_jsxs("strong", { children: [item.name, ":"] }), " ", _jsx("span", { children: item.value })] }, index))) }));
    };
    return (_jsxs("div", { className: "cert-details", children: [_jsx("h3", { children: "Certificate Details" }), _jsx("table", { children: _jsxs("tbody", { children: [_jsxs("tr", { children: [_jsx("th", { children: "Subject" }), _jsx("td", { children: Array.isArray(details.subject)
                                        ? renderNameValueList(details.subject)
                                        : "N/A" })] }), _jsxs("tr", { children: [_jsx("th", { children: "Issuer" }), _jsx("td", { children: Array.isArray(details.issuer)
                                        ? renderNameValueList(details.issuer)
                                        : "N/A" })] }), _jsxs("tr", { children: [_jsx("th", { children: "Serial Number" }), _jsx("td", { children: details.serialNumber || "N/A" })] }), _jsxs("tr", { children: [_jsx("th", { children: "Valid From" }), _jsx("td", { children: formatDate(details.validFrom) })] }), _jsxs("tr", { children: [_jsx("th", { children: "Valid To" }), _jsx("td", { children: formatDate(details.validTo) })] }), details.fingerprint && (_jsxs("tr", { children: [_jsx("th", { children: "Fingerprint (SHA-1)" }), _jsx("td", { children: details.fingerprint })] })), details.subjectAltName && (_jsxs("tr", { children: [_jsx("th", { children: "Subject Alternative Names" }), _jsx("td", { children: details.subjectAltName })] })), details.publicKeyAlgorithm && (_jsxs("tr", { children: [_jsx("th", { children: "Public Key Algorithm" }), _jsx("td", { children: details.publicKeyAlgorithm })] })), details.signatureAlgorithm && (_jsxs("tr", { children: [_jsx("th", { children: "Signature Algorithm" }), _jsx("td", { children: details.signatureAlgorithm })] })), details.keyUsage && (_jsxs("tr", { children: [_jsx("th", { children: "Key Usage" }), _jsx("td", { children: Array.isArray(details.keyUsage)
                                        ? details.keyUsage.join(", ")
                                        : details.keyUsage })] })), details.extendedKeyUsage && (_jsxs("tr", { children: [_jsx("th", { children: "Extended Key Usage" }), _jsx("td", { children: Array.isArray(details.extendedKeyUsage)
                                        ? details.extendedKeyUsage.join(", ")
                                        : details.extendedKeyUsage })] }))] }) })] }));
}
export default CertificateDetails;
