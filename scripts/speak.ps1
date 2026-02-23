param(
  [Parameter(Mandatory=$true)][string]$Text,
  [string]$Channel = "1473108262026219612",
  [string]$Voice = "af_sarah",
  [string]$Lang = "en-us"
)

$ErrorActionPreference = "Stop"

$root = Split-Path -Parent $PSScriptRoot
$outDir = Join-Path $env:USERPROFILE ".openclaw\workspace\_tts-out"
New-Item -ItemType Directory -Force -Path $outDir | Out-Null

$ts = Get-Date -Format "yyyyMMdd-HHmmss"
$wav = Join-Path $outDir "tts-$ts.wav"
$ogg = Join-Path $outDir "tts-$ts.ogg"

$py = $env:LOCAL_TTS_PYTHON
if (-not $py) { $py = "C:\Users\Michaelangelo\voice\tts-kokoro\.venv\Scripts\python.exe" }
$model = $env:LOCAL_TTS_KOKORO_MODEL
if (-not $model) { $model = "C:\Users\Michaelangelo\voice\tts-kokoro\kokoro-v1.0.onnx" }
$voices = $env:LOCAL_TTS_KOKORO_VOICES
if (-not $voices) { $voices = "C:\Users\Michaelangelo\voice\tts-kokoro\voices-v1.0.bin" }

& $py (Join-Path $PSScriptRoot "synthesize_kokoro.py") --text $Text --out $wav --voice $Voice --lang $Lang --model $model --voices $voices
if ($LASTEXITCODE -ne 0) { throw "Kokoro synth failed" }

$ffmpeg = $env:LOCAL_TTS_FFMPEG
if (-not $ffmpeg) { $ffmpeg = "C:\Users\Michaelangelo\AppData\Local\Microsoft\WinGet\Packages\Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe\ffmpeg-8.0.1-full_build\bin\ffmpeg.exe" }

& $ffmpeg -y -i $wav -c:a libopus -b:a 48k $ogg | Out-Null
if ($LASTEXITCODE -ne 0) { throw "ffmpeg encode failed" }

node (Join-Path $PSScriptRoot "send_discord_voice.js") --channel $Channel --file $ogg --account main
if ($LASTEXITCODE -ne 0) { throw "Discord voice send failed" }

Write-Output "OK: $ogg"
