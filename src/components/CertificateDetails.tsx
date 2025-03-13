interface CertificateDetail {
  name: string;
  value: string;
}

interface CertificateDetailsProps {
  details: {
    subject: CertificateDetail[];
    issuer: CertificateDetail[];
    serialNumber: string;
    validFrom: string;
    validTo: string;
    fingerprint?: string;
    publicKeyAlgorithm?: string;
    signatureAlgorithm?: string;
    keyUsage?: string[];
    extendedKeyUsage?: string[];
    subjectAltName?: string;
    error?: string;
  };
}

function CertificateDetails({ details }: CertificateDetailsProps) {
  if (!details) return null;

  const formatDate = (dateString: string): string => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  // Filter out unwanted fields from subject and issuer
  const filterFields = (items: CertificateDetail[]) => {
    // Add names of fields you want to exclude here
    const excludedFields: string[] = [
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
  const renderNameValueList = (items: CertificateDetail[]) => {
    if (!items || !items.length) return "N/A";

    // Filter the items before rendering
    const filteredItems = filterFields(items);

    return (
      <ul className="certificate-list">
        {filteredItems.map((item, index) => (
          <li key={index}>
            <strong>{item.name}:</strong> <span>{item.value}</span>
          </li>
        ))}
      </ul>
    );
  };

  return (
    <div className="cert-details">
      <h3>Certificate Details</h3>
      <table>
        <tbody>
          <tr>
            <th>Subject</th>
            <td>
              {Array.isArray(details.subject)
                ? renderNameValueList(details.subject)
                : "N/A"}
            </td>
          </tr>
          <tr>
            <th>Issuer</th>
            <td>
              {Array.isArray(details.issuer)
                ? renderNameValueList(details.issuer)
                : "N/A"}
            </td>
          </tr>
          <tr>
            <th>Serial Number</th>
            <td>{details.serialNumber || "N/A"}</td>
          </tr>
          <tr>
            <th>Valid From</th>
            <td>{formatDate(details.validFrom)}</td>
          </tr>
          <tr>
            <th>Valid To</th>
            <td>{formatDate(details.validTo)}</td>
          </tr>
          {details.fingerprint && (
            <tr>
              <th>Fingerprint (SHA-1)</th>
              <td>{details.fingerprint}</td>
            </tr>
          )}
          {details.subjectAltName && (
            <tr>
              <th>Subject Alternative Names</th>
              <td>{details.subjectAltName}</td>
            </tr>
          )}
          {details.publicKeyAlgorithm && (
            <tr>
              <th>Public Key Algorithm</th>
              <td>{details.publicKeyAlgorithm}</td>
            </tr>
          )}
          {details.signatureAlgorithm && (
            <tr>
              <th>Signature Algorithm</th>
              <td>{details.signatureAlgorithm}</td>
            </tr>
          )}
          {details.keyUsage && (
            <tr>
              <th>Key Usage</th>
              <td>
                {Array.isArray(details.keyUsage)
                  ? details.keyUsage.join(", ")
                  : details.keyUsage}
              </td>
            </tr>
          )}
          {details.extendedKeyUsage && (
            <tr>
              <th>Extended Key Usage</th>
              <td>
                {Array.isArray(details.extendedKeyUsage)
                  ? details.extendedKeyUsage.join(", ")
                  : details.extendedKeyUsage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CertificateDetails;
