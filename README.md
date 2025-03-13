# Certificate Validator

A modern web application for validating SSL/TLS certificates and checking compatibility between certificates and private keys.

## Features

- Certificate validation
- Certificate and private key compatibility checking
- CA bundle verification
- Modern UI with light/dark theme
- Drag-and-drop file uploads

## Deployment to Vercel

This application has been configured to work with Vercel's serverless functions. To deploy:

1. Install the Vercel CLI:

   ```
   npm install -g vercel
   ```

2. Login to Vercel:

   ```
   vercel login
   ```

3. Deploy the application:

   ```
   vercel
   ```

4. For production deployment:
   ```
   vercel --prod
   ```

## Local Development

1. Install dependencies:

   ```
   npm install
   ```

2. Start the development server:

   ```
   npm run dev
   ```

3. Build for production:

   ```
   npm run build
   ```

4. Start the production server:
   ```
   npm start
   ```

## Project Structure

- `/src` - React frontend code
- `/api` - Serverless API functions for Vercel
- `/dist` - Built frontend assets
- `/dist-server` - Built server code

## Technologies Used

- React
- TypeScript
- Node.js
- Express
- node-forge (for certificate operations)
- Vercel Serverless Functions

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
