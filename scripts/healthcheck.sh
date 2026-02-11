#!/bin/bash

# Configuration
URL="http://127.0.0.1:3000"
EXPECTED_STRING="LEADPULSE"
MAX_RETRIES=5
RETRY_INTERVAL=5

echo "Starting health check for LeadPulse at $URL..."

for i in $(seq 1 $MAX_RETRIES); do
    # Fetch the content and status code
    RESPONSE=$(curl -s -w "\n%{http_code}" "$URL")
    STATUS_CODE=$(echo "$RESPONSE" | tail -n1)
    BODY=$(echo "$RESPONSE" | sed '$d')

    if [ "$STATUS_CODE" -eq 200 ]; then
        if echo "$BODY" | grep -q "$EXPECTED_STRING"; then
            echo "[SUCCESS] LeadPulse is healthy and serving the UI."
            exit 0
        else
            echo "[WARNING] Port 3000 is open (200 OK), but expected string '$EXPECTED_STRING' was not found."
            echo "Body preview: $(echo "$BODY" | head -n 20)"
        fi
    else
        echo "[ERROR] Received status code $STATUS_CODE (Expected 200)."
    fi

    if [ "$i" -lt "$MAX_RETRIES" ]; then
        echo "Retrying in $RETRY_INTERVAL seconds... ($i/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
    fi
done

echo "[FAILURE] Health check failed after $MAX_RETRIES attempts."
exit 1
