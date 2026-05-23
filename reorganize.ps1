$base = "public/catalog/voter data"
$target = "dataset"
$inked = Join-Path $base "with ink"
$notInk = Join-Path $base "without"

if (-not (Test-Path $target)) {
    New-Item -ItemType Directory -Path $target -Force
}

# Standardized folder names
$train_inked = Join-Path $target "train/inked"
$train_not_inked = Join-Path $target "train/not_inked"
$val_inked = Join-Path $target "val/inked"
$val_not_inked = Join-Path $target "val/not_inked"

New-Item -ItemType Directory -Path $train_inked -Force
New-Item -ItemType Directory -Path $train_not_inked -Force
New-Item -ItemType Directory -Path $val_inked -Force
New-Item -ItemType Directory -Path $val_not_inked -Force

# Helper to split and Move
function Split-and-Copy($source, $train_dest, $val_dest, $ratio) {
    if (-not (Test-Path $source)) { return }
    $files = Get-ChildItem -Path $source -File
    $count = [math]::Floor($files.Count * $ratio)
    
    $shuffled = $files | Get-Random -Count $files.Count
    for ($i=0; $i -lt $files.Count; $i++) {
        if ($i -lt $count) {
            Copy-Item $shuffled[$i].FullName -Destination $train_dest
        } else {
            Copy-Item $shuffled[$i].FullName -Destination $val_dest
        }
    }
}

Split-and-Copy $inked $train_inked $val_inked 0.8
Split-and-Copy $notInk $train_not_inked $val_not_inked 0.8

# Generate CSV
$csvData = @()
Get-ChildItem -Path $target -Recurse -File | Where-Object { $_.Extension -match "jpg|png|jpeg" } | ForEach-Object {
    $label = if ($_.FullName.Contains("not_inked")) { 0 } else { 1 }
    $csvData += [PSCustomObject]@{
        image_path = $_.FullName
        label = $label
    }
}
$csvData | Export-Csv -Path (Join-Path $target "metadata.csv") -NoTypeInformation

Write-Host "Dataset Reorganization Complete!"
Write-Host "Total Images: $($csvData.Count)"
Write-Host "Train Split: $((Get-ChildItem -Path (Join-Path $target "train") -Recurse -File).Count)"
Write-Host "Val Split: $((Get-ChildItem -Path (Join-Path $target "val") -Recurse -File).Count)"
