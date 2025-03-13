#!/bin/bash

# Build the project
echo "Building project..."
npm run build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo "Build successful! Deploying to Vercel..."
  # Deploy to Vercel
  vercel --prod
else
  echo "Build failed. Please fix the errors before deploying."
  exit 1
fi 