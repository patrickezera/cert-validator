# Certificate Validator

A web application that allows users to upload and validate SSL/TLS certificates. The application checks if a certificate is valid and displays detailed information about the certificate.

## Features

- Upload certificate files (supports .crt, .pem, .cer, .der formats)
- Validate certificate expiration dates
- Display detailed certificate information:
  - Subject and Issuer
  - Serial Number
  - Validity Period
  - Fingerprint
  - Public Key and Signature Algorithms
  - Key Usage and Extended Key Usage
  - Subject Alternative Names
- Built with TypeScript for improved type safety and developer experience
- Uses ES modules for the server and CommonJS for the client

## Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

## Installation

1. Clone the repository:

   ```
   git clone https://github.com/yourusername/cert-validation.git
   cd cert-validation
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Build the application:

   ```
   npm run build
   ```

4. Start the server:

   ```
   npm start
   ```

5. Open your browser and navigate to:
   ```
   http://localhost:3000
   ```

## Development

To run the application in development mode:

```
npm run dev
```

To build only the client part:

```
npm run build:client
```

To build only the server part:

```
npm run build:server
```

To type-check the TypeScript code:

```
npm run type-check
```

## How to Use

1. Upload a certificate file by dragging and dropping it into the designated area or by clicking the area to browse for a file.
2. Click the "Validate Certificate" button.
3. View the validation result and certificate details.

## Technologies Used

- Frontend:

  - React
  - TypeScript
  - CSS
  - Webpack
  - Babel

- Backend:
  - Node.js
  - Express
  - TypeScript (ES modules)
  - node-forge (for certificate parsing and validation)
  - Multer (for file uploads)

## Project Structure

```
cert-validation/
├── dist/                  # Client build output
├── dist-server/           # Server build output
├── public/                # Static files
├── src/                   # Source code
│   ├── components/        # React components
│   ├── types/             # TypeScript type definitions
│   ├── utils/             # Utility functions
│   ├── App.tsx            # Main React component
│   ├── index.tsx          # React entry point
│   └── styles.css         # Global styles
├── server.ts              # Express server
├── tsconfig.json          # TypeScript configuration for client
├── tsconfig.server.json   # TypeScript configuration for server
├── webpack.config.cjs     # Webpack configuration
└── package.json           # Project dependencies
```

## License

MIT

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.
