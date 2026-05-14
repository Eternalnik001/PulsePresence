#!/bin/bash
set -e

SERVICE_NAME="pulsepresence"
REGION="asia-south1"

if [ -f .env ]; then
  export $(grep -v '^#' .env | xargs)
fi

if [ -z "$GEMINI_API_KEY" ]; then
  echo "❌ GEMINI_API_KEY not set. Create a .env file or export it."
  exit 1
fi

GEMINI_MODEL_VALUE="${GEMINI_MODEL:-gemini-2.5-pro}"

echo "🏏 Deploying PulsePresence to Cloud Run..."
echo "   Service: $SERVICE_NAME"
echo "   Region:  $REGION"
echo "   Model:   $GEMINI_MODEL_VALUE"

gcloud run deploy "$SERVICE_NAME" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --port 8080 \
  --memory 256Mi \
  --cpu 1 \
  --min-instances 0 \
  --max-instances 10 \
  --set-env-vars "GEMINI_API_KEY=$GEMINI_API_KEY,GEMINI_MODEL=$GEMINI_MODEL_VALUE" \
  --quiet

echo ""
echo "✅ Deployed!"
gcloud run services describe "$SERVICE_NAME" --region "$REGION" --format='value(status.url)'
