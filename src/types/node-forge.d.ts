declare module "node-forge" {
  namespace pki {
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

    function certificateFromPem(pem: string): Certificate;
    function certificateToAsn1(cert: Certificate): any;
    function certificateFromAsn1(asn1: any): Certificate;
  }

  namespace asn1 {
    function fromDer(buffer: util.ByteBuffer): any;
    function toDer(obj: any): util.ByteBuffer;
  }

  namespace util {
    class ByteBuffer {
      getBytes(): string;
    }
    function createBuffer(data: Buffer): ByteBuffer;
  }

  namespace md {
    namespace sha1 {
      function create(): MessageDigest;
    }

    interface MessageDigest {
      update(data: string): void;
      digest(): {
        toHex(): string;
      };
    }
  }
}

export {};
