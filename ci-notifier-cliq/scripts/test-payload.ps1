# PowerShell test payload script

$BackendUrl = if ($env:BACKEND_URL) { $env:BACKEND_URL } else { "http://localhost:3000" }

Write-Host "Sending test GitHub Actions failure webhook to $BackendUrl/ci/webhook"

$payload = @{
    action = "completed"
    workflow_run = @{
        id = 123456789
        name = "CI/CD Pipeline"
        head_branch = "main"
        head_sha = "abc1234567890def"
        status = "completed"
        conclusion = "failure"
        html_url = "https://github.com/test-org/test-repo/actions/runs/123456789"
        run_number = 42
        event = "push"
        actor = @{
            login = "testuser"
        }
    }
    repository = @{
        full_name = "test-org/test-repo"
    }
} | ConvertTo-Json -Depth 10

try {
    $response = Invoke-RestMethod -Uri "$BackendUrl/ci/webhook" `
        -Method Post `
        -ContentType "application/json" `
        -Body $payload

    Write-Host "`nTest payload sent successfully!"
    Write-Host "Response: $($response | ConvertTo-Json)"
    Write-Host "`nCheck your Cliq channel for the notification card."
    Write-Host "Check the dashboard at http://localhost:5173/dashboard"
}
catch {
    Write-Host "Error sending payload: $_"
}
