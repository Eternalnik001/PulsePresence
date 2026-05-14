#!/bin/bash
# PulsePresence — GCP Cloud Run Deploy Script

set -e

PROJECT_ID="${GCP_PROJECT_ID:-pulsepresence-demo}"
REGION="${GCP_REGION:-asia-south1}"
SERVICE_NAME="pulsepresence"

echo "🏏 PulsePresence — GCP Cloud Run Deployment"
echo "============================================="

# Read API Key from .env if it exists
if [ -f .env ]; then
  export $(cat .env | grep -v '^#' | xargs)
fi

API_KEY="${OPENAI_API_KEY}"

if [ -z "$API_KEY" ]; then
  echo "⚠️  OPENAI_API_KEY not found in .env."
  read -p "Please paste your OpenAI API Key: " API_KEY
fi

if [ -z "$API_KEY" ]; then
  echo "Error: API Key is required."
  exit 1
fi

echo "🐳 Building & deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --source . \
  --region ${REGION} \
  --project ${PROJECT_ID} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars="OPENAI_API_KEY=${API_KEY}"

echo "✅ Deployment complete."
