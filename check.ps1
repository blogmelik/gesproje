$run = Invoke-RestMethod -Uri 'https://api.github.com/repos/blogmelik/gesproje/actions/runs' | Select-Object -ExpandProperty workflow_runs | Select-Object -First 1
$jobs = Invoke-RestMethod -Uri $run.jobs_url | Select-Object -ExpandProperty jobs
$failedJob = $jobs | Where-Object conclusion -eq 'failure'
Write-Host "Failed Job:" $failedJob.name
$steps = $failedJob.steps | Where-Object conclusion -eq 'failure'
Write-Host "Failed Step:" $steps.name
