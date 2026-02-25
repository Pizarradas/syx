$themes = @('example-01', 'example-02', 'example-03', 'example-04', 'example-05')
$base = 'c:\Users\User\OneDrive\Escritorio\syx\scss\themes'

foreach ($t in $themes) {
    $file = "$base\$t\setup.scss"
    $lines = Get-Content $file
  
    # Find and remove the @layer order block (lines 12=comment, 13=comment, 14=comment, 15=@layer, 16=blank)
    # but use content matching to be safe
    $newLines = @()
    $skip = $false
    foreach ($line in $lines) {
        if ($line -match '^// LAYER ORDER') { $skip = $true }
        if ($skip) {
            if ($line -match '^@layer syx\.reset') {
                # skip this line too, and stop skipping after it
                $skip = $false
                continue
            }
            if ($line -match '^// Layers declared' -or $line -match '^// utilities always') {
                continue
            }
            continue
        }
        $newLines += $line
    }
  
    $tmp = $file + '.tmp'
    $newLines | Out-File $tmp -Encoding UTF8
    Remove-Item $file
    Rename-Item $tmp $file
    Write-Host "Processed: $t ($(($newLines).Count) lines)"
}
