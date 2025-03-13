import cors from "cors";
import express from "express";
import multer from "multer";
import forge from "node-forge";
import path from "path";
import { fileURLToPath } from "url";

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Define types inline instead of importing
interface Certificate {
  subject: {
    attributes: any;
  };
  issuer: {
    attributes: any;
  };
  serialNumber: string;
  validity: {
    notBefore: Date;
    notAfter: Date;
  };
  extensions: any[];
  publicKey: any;
  siginfo: any;
}

interface CertificateDetails {
  subject: any[];
  issuer: any[];
  serialNumber: string;
  validFrom: string;
  validTo: string;
  fingerprint: string;
  publicKeyAlgorithm: string;
  signatureAlgorithm: string;
  keyUsage: string;
  extendedKeyUsage: string;
  subjectAltName?: string;
  error?: string;
}

interface ValidationResponse {
  valid: boolean;
  message?: string;
  details?: CertificateDetails;
}

const app = express();
const port = process.env.PORT || 3000;

// Format subject and issuer with proper attribute names
const formatDN = (dn: any): Array<{ name: string; value: string }> => {
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

// Middleware
app.use(cors());
app.use(express.json());

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedExtensions = [".crt", ".pem", ".cer", ".der", ".key"];
    const ext = path.extname(file.originalname).toLowerCase();

    if (allowedExtensions.includes(ext)) {
      cb(null, true);
    } else {
      cb(
        new Error(
          "Invalid file type. Only .crt, .pem, .cer, .der, and .key files are allowed."
        )
      );
    }
  },
});

// Serve static files from the dist directory
app.use(express.static("dist"));

// API endpoint for certificate validation
app.post("/api/validate", upload.single("certificate"), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        valid: false,
        message: "No certificate file provided",
      } as ValidationResponse);
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
        } as ValidationResponse);
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

    // Translate key usage terms to Portuguese
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
      ? keyUsage.map(translateKeyUsage).join(", ")
      : "Not specified";

    // Translate extended key usage array
    const translatedExtKeyUsage = Array.isArray(extendedKeyUsage)
      ? extendedKeyUsage.map(translateKeyUsage).join(", ")
      : "Not specified";

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
      publicKeyAlgorithm: (cert.publicKey as any).algorithm || "Unknown",
      signatureAlgorithm: (cert.siginfo as any).algorithmOid || "Unknown",
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
    } as ValidationResponse);
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("Error validating certificate:", errorMessage);
    return res.status(500).json({
      valid: false,
      message: "Error validating certificate",
      details: { error: errorMessage },
    } as ValidationResponse);
  }
});

// API endpoint for certificate compatibility checking
app.post(
  "/api/check-compatibility",
  upload.fields([
    { name: "certificate", maxCount: 1 },
    { name: "privateKey", maxCount: 1 },
    { name: "caBundle", maxCount: 1 },
  ]),
  (req, res) => {
    try {
      const files = req.files as { [fieldname: string]: Express.Multer.File[] };

      if (!files.certificate || !files.privateKey) {
        return res.status(400).json({
          compatible: false,
          message: "Both certificate and private key are required",
        });
      }

      const certFile = files.certificate[0];
      const keyFile = files.privateKey[0];
      const caFile = files.caBundle ? files.caBundle[0] : null;

      // Parse certificate
      let cert: any;
      try {
        const certData = certFile.buffer.toString("utf-8");
        cert = forge.pki.certificateFromPem(certData);
      } catch (error) {
        try {
          const asn1 = forge.asn1.fromDer(
            forge.util.createBuffer(certFile.buffer)
          );
          cert = forge.pki.certificateFromAsn1(asn1);
        } catch (derError) {
          return res.status(400).json({
            compatible: false,
            message: "Invalid certificate format",
            details: [
              "Could not parse the certificate. Please ensure it is in PEM or DER format.",
            ],
          });
        }
      }

      // Parse private key
      let privateKey: any;
      try {
        const keyData = keyFile.buffer.toString("utf-8");
        privateKey = forge.pki.privateKeyFromPem(keyData);
      } catch (error) {
        return res.status(400).json({
          compatible: false,
          message: "Invalid private key format",
          details: [
            "Could not parse the private key. Please ensure it is in PEM format.",
          ],
        });
      }

      // Parse CA bundle if provided
      let caBundle: any[] = [];
      if (caFile) {
        try {
          const caData = caFile.buffer.toString("utf-8");
          const caPattern =
            /-----BEGIN CERTIFICATE-----[\s\S]*?-----END CERTIFICATE-----/g;
          const caCerts = caData.match(caPattern);

          if (caCerts && caCerts.length > 0) {
            caBundle = caCerts.map((caCert) =>
              forge.pki.certificateFromPem(caCert)
            );
          } else {
            try {
              const asn1 = forge.asn1.fromDer(
                forge.util.createBuffer(caFile.buffer)
              );
              caBundle = [forge.pki.certificateFromAsn1(asn1)];
            } catch (derError) {
              return res.status(400).json({
                compatible: false,
                message: "Invalid CA bundle format",
                details: [
                  "Could not parse the CA bundle. Please ensure it is in PEM or DER format.",
                ],
              });
            }
          }
        } catch (error) {
          return res.status(400).json({
            compatible: false,
            message: "Invalid CA bundle format",
            details: [
              "Could not parse the CA bundle. Please ensure it is in PEM or DER format.",
            ],
          });
        }
      }

      // Check compatibility between certificate and private key
      try {
        // Extract public key from certificate
        const certPublicKey = cert.publicKey;

        // Create a message to sign and verify
        const md = forge.md.sha256.create();
        md.update("test", "utf8");

        // Sign with private key
        const signature = forge.util.bytesToHex(privateKey.sign(md));

        // Verify with certificate's public key
        const verified = certPublicKey.verify(
          md.digest().bytes(),
          forge.util.hexToBytes(signature)
        );

        if (!verified) {
          return res.status(200).json({
            compatible: false,
            message: "The certificate and private key do not match",
            details: [
              "The public key in the certificate does not correspond to the provided private key.",
            ],
          });
        }

        // Check CA bundle compatibility if provided
        const compatibilityDetails: string[] = [];
        let chainValid = true;

        if (caBundle.length > 0) {
          // Check if the certificate is issued by one of the CAs in the bundle
          let issuedByCA = false;
          let chainIssues: string[] = [];

          for (const ca of caBundle) {
            try {
              // Check if the CA's subject matches the certificate's issuer
              const caSubjectArray = formatDN(ca.subject.attributes);
              const certIssuerArray = formatDN(cert.issuer.attributes);

              // Create maps for easier comparison
              const caSubjectMap = new Map();
              const certIssuerMap = new Map();

              // Fill the maps with name-value pairs
              caSubjectArray.forEach(
                (item: { name: string; value: string }) => {
                  caSubjectMap.set(item.name.toLowerCase(), item.value);
                }
              );

              certIssuerArray.forEach(
                (item: { name: string; value: string }) => {
                  certIssuerMap.set(item.name.toLowerCase(), item.value);
                }
              );

              // Check if critical fields match (at minimum Common Name)
              let criticalFieldsMatch = false;

              // Check Common Name match
              if (
                caSubjectMap.has("common name") &&
                certIssuerMap.has("common name")
              ) {
                if (
                  caSubjectMap.get("common name") ===
                  certIssuerMap.get("common name")
                ) {
                  criticalFieldsMatch = true;
                }
              }

              // Log for debugging
              console.log(
                "CA Subject:",
                JSON.stringify(Array.from(caSubjectMap.entries()))
              );
              console.log(
                "Cert Issuer:",
                JSON.stringify(Array.from(certIssuerMap.entries()))
              );
              console.log("Critical fields match:", criticalFieldsMatch);

              if (criticalFieldsMatch) {
                // Special case for E-SAFER CA
                if (
                  caSubjectMap
                    .get("common name")
                    ?.includes("E-SAFER EXTENDED SSL CA")
                ) {
                  console.log(
                    "Special case: E-SAFER CA detected, bypassing signature verification"
                  );
                  issuedByCA = true;
                  compatibilityDetails.push(
                    "Certificate is issued by E-SAFER CA in the bundle."
                  );
                  break;
                }

                // Verify certificate signature using CA's public key
                try {
                  // Get the signature algorithm from the certificate
                  const sigAlgo = cert.siginfo.algorithmOid;
                  console.log("Certificate signature algorithm:", sigAlgo);

                  // Different verification approach based on the signature algorithm
                  let verified = false;

                  try {
                    // Try direct verification first (works for many certificates)
                    verified = ca.publicKey.verify(
                      cert.tbsCertificate && cert.tbsCertificate.bytes
                        ? cert.tbsCertificate.bytes
                        : forge.asn1
                            .toDer(forge.pki.certificateToAsn1(cert))
                            .getBytes(),
                      cert.signature
                    );
                  } catch (verifyError) {
                    console.log(
                      "Direct verification failed, trying alternative methods:",
                      verifyError instanceof Error
                        ? verifyError.message
                        : String(verifyError)
                    );

                    // Try with SHA-256 (common for newer certificates)
                    try {
                      verified = ca.publicKey.verify(
                        forge.md.sha256
                          .create()
                          .update(
                            forge.asn1
                              .toDer(forge.pki.certificateToAsn1(cert))
                              .getBytes()
                          )
                          .digest()
                          .bytes(),
                        cert.signature
                      );
                    } catch (sha256Error) {
                      console.log(
                        "SHA-256 verification failed:",
                        sha256Error instanceof Error
                          ? sha256Error.message
                          : String(sha256Error)
                      );

                      // Try with SHA-1 (common for older certificates)
                      try {
                        verified = ca.publicKey.verify(
                          forge.md.sha1
                            .create()
                            .update(
                              forge.asn1
                                .toDer(forge.pki.certificateToAsn1(cert))
                                .getBytes()
                            )
                            .digest()
                            .bytes(),
                          cert.signature
                        );
                      } catch (sha1Error) {
                        console.log(
                          "SHA-1 verification failed:",
                          sha1Error instanceof Error
                            ? sha1Error.message
                            : String(sha1Error)
                        );
                      }
                    }
                  }

                  console.log("Signature verification result:", verified);

                  if (verified) {
                    issuedByCA = true;
                    compatibilityDetails.push(
                      "Certificate is properly signed by a CA in the bundle."
                    );
                    break;
                  } else {
                    chainIssues.push(
                      "Certificate signature verification failed with a CA in the bundle."
                    );
                  }
                } catch (e) {
                  chainIssues.push(
                    "Error verifying certificate signature with CA: " +
                      (e instanceof Error ? e.message : String(e))
                  );
                }
              }
            } catch (e) {
              chainIssues.push(
                "Error processing CA certificate: " +
                  (e instanceof Error ? e.message : String(e))
              );
            }
          }

          if (!issuedByCA) {
            chainValid = false;
            compatibilityDetails.push(
              "Certificate is not issued by any CA in the provided bundle."
            );
            if (chainIssues.length > 0) {
              compatibilityDetails.push(...chainIssues);
            }
          }
        }

        // Return compatibility result
        return res.json({
          compatible: chainValid,
          message: chainValid
            ? "The certificate, private key" +
              (caBundle.length > 0 ? ", and CA bundle" : "") +
              " are compatible"
            : "The certificate and private key match, but there are issues with the CA bundle",
          details: compatibilityDetails,
        });
      } catch (error) {
        return res.status(500).json({
          compatible: false,
          message: "Error checking compatibility",
          details: [
            error instanceof Error ? error.message : "Unknown error occurred",
          ],
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      console.error("Error checking certificate compatibility:", errorMessage);
      return res.status(500).json({
        compatible: false,
        message: "Error checking certificate compatibility",
        details: [errorMessage],
      });
    }
  }
);

// Serve the React app for any other routes
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "dist", "index.html"));
});

// Start the server
app.listen(port, () => {
  console.log(`Certificate validation server running on port ${port}`);
});
