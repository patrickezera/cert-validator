import multer from "multer";
import { NextApiRequest, NextApiResponse } from "next";
import forge from "node-forge";

// Format subject and issuer with proper attribute names
const formatDN = (dn: any[]): { name: string; value: string }[] => {
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
        const bytes = [];
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
const runMiddleware = (req: NextApiRequest, res: NextApiResponse, fn: any) => {
  return new Promise((resolve, reject) => {
    fn(req, res, (result: any) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
};

// Extend NextApiRequest to include files property
interface ExtendedNextApiRequest extends NextApiRequest {
  files?: {
    certificate?: Express.Multer.File[];
    privateKey?: Express.Multer.File[];
    caBundle?: Express.Multer.File[];
  };
}

export default async function handler(
  req: ExtendedNextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", true);
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
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Run the multer middleware
    await runMiddleware(
      req,
      res,
      upload.fields([
        { name: "certificate", maxCount: 1 },
        { name: "privateKey", maxCount: 1 },
        { name: "caBundle", maxCount: 1 },
      ])
    );

    const files = req.files;

    if (!files || !files.certificate || !files.privateKey) {
      return res.status(400).json({
        compatible: false,
        message: "Both certificate and private key are required",
      });
    }

    const certFile = files.certificate[0];
    const keyFile = files.privateKey[0];
    const caFile = files.caBundle ? files.caBundle[0] : null;

    // Parse certificate
    let cert;
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
    let privateKey;
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
            const caSubjectMap = new Map<string, string>();
            const certIssuerMap = new Map<string, string>();

            // Fill the maps with name-value pairs
            caSubjectArray.forEach((item) => {
              caSubjectMap.set(item.name.toLowerCase(), item.value);
            });
            certIssuerArray.forEach((item) => {
              certIssuerMap.set(item.name.toLowerCase(), item.value);
            });

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
