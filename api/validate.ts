import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import forge from "node-forge";

// Define types for the formatted DN attributes
interface DNAttribute {
  name: string;
  value: string;
}

// Define interface for certificate details
interface CertificateDetails {
  subject: DNAttribute[];
  issuer: DNAttribute[];
  serialNumber: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  publicKeyAlgorithm: string;
  signatureAlgorithm: string;
  keyUsage: string[];
  extendedKeyUsage: string[];
  subjectAltName: string;
  error?: string;
}

// Define interface for validation response
interface ValidationResponse {
  valid: boolean;
  message?: string;
  details?: CertificateDetails | { error: string };
}

// Extend NextApiRequest to include file property
interface ExtendedNextApiRequest extends NextApiRequest {
  file?: {
    buffer: Buffer;
  };
}

// Format subject and issuer with proper attribute names
const formatDN = (dn: any): DNAttribute[] => {
  // Map of OIDs to readable attribute names in English
  const attributeNames: Record<string, string> = {
    "2.5.4.3": "Common Name", // Common Name
    "2.5.4.4": "Surname", // Surname
    "2.5.4.5": "CNPJ", // Serial Number
    "2.5.4.6": "Country", // Country
    "2.5.4.7": "Locality", // Locality
    "2.5.4.8": "State", // State
    "2.5.4.9": "Street Address", // Street Address
    "2.5.4.10": "Organization", // Organization
    "2.5.4.11": "Organizational Unit", // Organizational Unit
    "2.5.4.12": "Title", // Title
    "2.5.4.42": "Given Name", // Given Name
    "1.2.840.113549.1.9.1": "Email", // Email Address
    "2.5.4.15": "Business Category", // Business Category
    "2.5.4.17": "Postal Code", // Postal Code
    "2.5.4.97": "Organization Identifier", // Organization Identifier
    "2.5.4.13": "Description", // Description
    "2.5.4.46": "DN Qualifier", // DN Qualifier
    "2.5.4.65": "Pseudonym", // Pseudonym
    "1.3.6.1.4.1.311.60.2.1.1": "Jurisdiction Locality", // Jurisdiction Locality
    "1.3.6.1.4.1.311.60.2.1.2": "Jurisdiction State", // Jurisdiction State
    "1.3.6.1.4.1.311.60.2.1.3": "Jurisdiction Country", // Jurisdiction Country
  };

  // Return array of objects with name and value properties
  return Object.values(dn).map((attr: any) => {
    // Use the mapped name if available, otherwise use the shortName or type
    const name =
      attr.type && attributeNames[attr.type]
        ? attributeNames[attr.type]
        : attr.shortName || attr.type || "Unknown";

    // Fix encoding for Portuguese characters
    let value = attr.value || "";

    // Try to fix common encoding issues with Portuguese characters
    try {
      // Replace specific problematic character sequences
      value = value
        .replace(/Ã§/g, "ç")
        .replace(/Ã£/g, "ã")
        .replace(/Ãµ/g, "õ")
        .replace(/Ã¡/g, "á")
        .replace(/Ã©/g, "é")
        .replace(/Ã­/g, "í")
        .replace(/Ã³/g, "ó")
        .replace(/Ãº/g, "ú")
        .replace(/Ã¢/g, "â")
        .replace(/Ãª/g, "ê")
        .replace(/Ã´/g, "ô")
        .replace(/Ã\u00A3/g, "ã");

      // If it's a UTF-8 encoded string that was incorrectly decoded
      if (value.includes("Ã") || value.includes("Â")) {
        // Try to decode as Latin1 and re-encode as UTF-8
        const bytes: number[] = [];
        for (let i = 0; i < value.length; i++) {
          bytes.push(value.charCodeAt(i));
        }
        const latin1String = String.fromCharCode.apply(null, bytes);
        const decoder = new TextDecoder("utf-8");
        const encoder = new TextEncoder();
        value = decoder.decode(encoder.encode(latin1String));
      }
    } catch (e) {
      console.error("Error fixing character encoding:", e);
      // Keep original value if decoding fails
    }

    return { name, value };
  });
};

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
});

// Make multer middleware work with serverless functions
const runMiddleware = (req: any, res: any, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse<ValidationResponse>
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET,OPTIONS,PATCH,DELETE,POST,PUT"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return res.status(405).json({
      valid: false,
      message: "Method not allowed",
    });
  }

  try {
    // Run the multer middleware
    await runMiddleware(req, res, upload.single("certificate"));

    if (!req.file) {
      return res.status(400).json({
        valid: false,
        message: "No certificate file provided",
      });
    }

    const certBuffer = req.file.buffer;
    const certData = certBuffer.toString("utf-8");

    // Parse the certificate
    let cert: any;
    try {
      cert = forge.pki.certificateFromPem(certData);
    } catch (error) {
      // Try to handle DER format
      try {
        const derBuffer = certBuffer;
        const asn1 = forge.asn1.fromDer(forge.util.createBuffer(derBuffer));
        cert = forge.pki.certificateFromAsn1(asn1);
      } catch (derError) {
        return res.status(400).json({
          valid: false,
          message: "Invalid certificate format",
          details: {
            error:
              "Could not parse the certificate. Please ensure it is in PEM or DER format.",
          },
        });
      }
    }

    // Extract certificate details
    const now = new Date();
    const notBefore = new Date(cert.validity.notBefore);
    const notAfter = new Date(cert.validity.notAfter);

    // Check if certificate is valid (not expired and not before valid date)
    const isValid = now >= notBefore && now <= notAfter;

    // Extract key usage if available
    let keyUsage: string[] = [];
    let extendedKeyUsage: string[] = [];
    let subjectAltName = "";

    if (cert.extensions) {
      cert.extensions.forEach((ext: any) => {
        if (ext.name === "keyUsage" && ext.digitalSignature) {
          keyUsage = Object.keys(ext).filter(
            (key) =>
              typeof ext[key] === "boolean" &&
              ext[key] === true &&
              key !== "critical"
          );
        } else if (ext.name === "extKeyUsage") {
          // Ensure extendedKeyUsage is an array
          extendedKeyUsage = Array.isArray(ext.value) ? ext.value : [];
        } else if (ext.name === "subjectAltName") {
          subjectAltName = ext.altNames
            .map(
              (an: any) =>
                `${an.type === 2 ? "DNS" : an.type === 7 ? "IP" : "Outro"}:${
                  an.value
                }`
            )
            .join(", ");
        }
      });
    }

    // Get fingerprint
    const md = forge.md.sha1.create();
    md.update(forge.asn1.toDer(forge.pki.certificateToAsn1(cert)).getBytes());
    const fingerprint = md.digest().toHex().match(/.{2}/g)?.join(":") || "";

    // Translate key usage terms to English
    const translateKeyUsage = (usage: string): string => {
      const translations: Record<string, string> = {
        digitalSignature: "Digital Signature",
        nonRepudiation: "Non Repudiation",
        keyEncipherment: "Key Encipherment",
        dataEncipherment: "Data Encipherment",
        keyAgreement: "Key Agreement",
        keyCertSign: "Certificate Signing",
        cRLSign: "CRL Signing",
        encipherOnly: "Encipher Only",
        decipherOnly: "Decipher Only",
        serverAuth: "Server Authentication",
        clientAuth: "Client Authentication",
        codeSigning: "Code Signing",
        emailProtection: "Email Protection",
        timeStamping: "Time Stamping",
        OCSPSigning: "OCSP Signing",
      };
      return translations[usage] || usage;
    };

    // Translate key usage array
    const translatedKeyUsage = Array.isArray(keyUsage)
      ? keyUsage.map(translateKeyUsage)
      : ["Not specified"];

    // Translate extended key usage array
    const translatedExtKeyUsage = Array.isArray(extendedKeyUsage)
      ? extendedKeyUsage.map(translateKeyUsage)
      : ["Not specified"];

    // Prepare response
    const details: CertificateDetails = {
      subject: formatDN(cert.subject.attributes),
      issuer: formatDN(cert.issuer.attributes),
      serialNumber: cert.serialNumber,
      validFrom: new Date(notBefore).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      validTo: new Date(notAfter).toLocaleDateString("en-US", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      fingerprint: fingerprint,
      publicKeyAlgorithm: cert.publicKey.algorithm || "Unknown",
      signatureAlgorithm: cert.siginfo.algorithmOid || "Unknown",
      keyUsage: translatedKeyUsage,
      extendedKeyUsage: translatedExtKeyUsage,
      subjectAltName: subjectAltName || "Not specified",
    };

    // If not valid, add reason in English
    if (!isValid) {
      if (now < notBefore) {
        details.error = "Certificate is not yet valid";
      } else if (now > notAfter) {
        details.error = "Certificate has expired";
      } else {
        details.error = "Certificate is invalid for an unknown reason";
      }
    }

    return res.json({
      valid: isValid,
      details: details,
    });
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error validating certificate:", errorMessage);
    return res.status(500).json({
      valid: false,
      message: "Error validating certificate",
      details: { error: errorMessage },
    });
  }
}
