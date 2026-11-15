param(
  [ValidateSet("check", "verify")]
  [string]$Action = "check"
)
$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.Runtime.WindowsRuntime | Out-Null
$null = [Windows.Security.Credentials.UI.UserConsentVerifier, Windows.Security.Credentials.UI, ContentType = WindowsRuntime]
$null = [Windows.Security.Credentials.UI.UserConsentVerifierAvailability, Windows.Security.Credentials.UI, ContentType = WindowsRuntime]
$null = [Windows.Security.Credentials.UI.UserConsentVerificationResult, Windows.Security.Credentials.UI, ContentType = WindowsRuntime]

$asTask = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object {
  $_.Name -eq "AsTask" -and $_.IsGenericMethod -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq "IAsyncOperation``1"
})[0]

function Await-WinRt($operation, $resultType) {
  $method = $asTask.MakeGenericMethod($resultType)
  $task = $method.Invoke($null, @($operation))
  if (-not $task.Wait(60000)) { throw "delai" }
  if ($task.IsFaulted) { throw $task.Exception.GetBaseException().Message }
  return $task.Result
}

if ($Action -eq "check") {
  $op = [Windows.Security.Credentials.UI.UserConsentVerifier]::CheckAvailabilityAsync()
  $result = Await-WinRt $op ([type]"Windows.Security.Credentials.UI.UserConsentVerifierAvailability")
  Write-Output $result
  exit 0
}

$op = [Windows.Security.Credentials.UI.UserConsentVerifier]::RequestVerificationAsync("PULSAR : posez le doigt sur le lecteur de ce PC.")
$result = Await-WinRt $op ([type]"Windows.Security.Credentials.UI.UserConsentVerificationResult")
Write-Output $result
exit 0
