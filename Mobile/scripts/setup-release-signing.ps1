$ErrorActionPreference = 'Stop'

$androidDirectory = Join-Path $PSScriptRoot '..\android'
$keystorePath = Join-Path $androidDirectory 'app\release.keystore'
$propertiesPath = Join-Path $androidDirectory 'release-signing.properties'

if ((Test-Path $keystorePath) -or (Test-Path $propertiesPath)) {
    throw 'Release signing files already exist. Back them up and keep using the same key for app updates.'
}

$javaKeytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME 'bin\keytool.exe' }
$keytool = if ($javaKeytool -and (Test-Path $javaKeytool)) {
    $javaKeytool
} else {
    (Get-Command keytool -ErrorAction Stop).Source
}
$password = [BitConverter]::ToString([Security.Cryptography.RandomNumberGenerator]::GetBytes(24)).Replace('-', '')
$alias = 'royalclubmatka'

& $keytool -genkeypair -keystore $keystorePath -storetype PKCS12 -alias $alias -keyalg RSA -keysize 3072 -validity 10000 -storepass $password -keypass $password -dname 'CN=Royal Club Matka'
if ($LASTEXITCODE -ne 0) {
    throw 'keytool could not create the release keystore.'
}

@"
storeFile=app/release.keystore
storePassword=$password
keyAlias=$alias
keyPassword=$password
"@ | Set-Content -Path $propertiesPath -Encoding ascii -NoNewline

Write-Output 'Release signing is ready. Securely back up android/app/release.keystore and android/release-signing.properties; both are required for future app updates.'
