#!/bin/bash

# Test payload script - sends a sample GitHub Actions webhook to the backend

BACKEND_URL="${BACKEND_URL:-http://localhost:3000}"

echo "Sending test GitHub Actions failure webhook to $BACKEND_URL/ci/webhook"

curl -X POST "$BACKEND_URL/ci/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "action": "completed",
    "workflow_run": {
      "id": 123456789,
      "name": "CI/CD Pipeline",
      "head_branch": "main",
      "head_sha": "abc1234567890def",
      "status": "completed",
      "conclusion": "failure",
      "html_url": "https://github.com/test-org/test-repo/actions/runs/123456789",
      "run_number": 42,
      "event": "push",
      "actor": {
        "login": "testuser"
      }
    },
    "repository": {
      "full_name": "test-org/test-repo"
    }
  }'

echo -e "\n\nTest payload sent!"
echo "Check your Cliq channel for the notification card."
echo "Check the dashboard at http://localhost:5173/dashboard"
