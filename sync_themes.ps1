$themesDir = ".\scss\themes"
$files = @(
    "$themesDir\_template\_theme.scss",
    "$themesDir\example-01\_theme.scss",
    "$themesDir\example-02\_theme.scss",
    "$themesDir\example-03\_theme.scss",
    "$themesDir\example-04\_theme.scss",
    "$themesDir\example-05\_theme.scss",
    "$themesDir\example-06\_theme.scss"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        $content = Get-Content $file -Raw

        # 1. Rename Buttons Fonts to Text
        $content = $content -replace 'btn-(primary|secondary|tertiary|quaternary)-font-color', 'btn-$1-text'
        $content = $content -replace 'btn-(primary|secondary|tertiary|quaternary)-filled-font-color', 'btn-$1-filled-text'

        # 2. Rename Focus Ring and Borders
        $content = $content -replace 'semantic-color-state-focus', 'semantic-focus-ring-color'
        $content = $content -replace 'semantic-color-border-focus', 'semantic-border-focus'

        # 3. Rename States to Tones
        $content = $content -replace 'color-state-ok', 'semantic-tone-success-bg'
        $content = $content -replace 'color-state-ko', 'semantic-tone-error-bg'
        $content = $content -replace 'color-state-warning', 'semantic-tone-warning-bg'

        # 4. Inject Theme Widths inside :root if not present (Look for --theme-radius:)
        if ($content -notmatch '--theme-focus-ring-width:') {
            $content = $content -replace '--theme-radius:', "--theme-focus-ring-width: 2px;`r`n    --theme-radius:"
        }

        # 5. Inject Semantic Widths around borders
        if ($content -notmatch '--semantic-outline-width:') {
            $content = $content -replace '--semantic-color-border-default:', "--semantic-border-width: 1px;`r`n    --semantic-outline-width: var(--theme-focus-ring-width);`r`n    --semantic-color-border-default:"
        }

        # 6. Split Overlay Alpha
        if ($content -match '--semantic-background-overlay:' -and $content -notmatch '--semantic-overlay-alpha:') {
            $content = $content -replace '--semantic-background-overlay:\s*[^;]+;', "--semantic-overlay-alpha: 0.5;`r`n    --semantic-background-overlay: oklch(0 0 0 / var(--semantic-overlay-alpha));"
        }

        # 7. Add Dark Mode Override for Border focus
        if ($content -match '\[data-theme="dark"\]\s*\{' -and $content -notmatch '--semantic-border-focus: var\(--semantic-color-primary\)') {
            $content = [regex]::Replace($content, '(\[data-theme="dark"\]\s*\{(?:\s*@include dark-mode-tokens\(\);\s*)?)', "`$1`r`n    --semantic-border-focus: var(--semantic-color-primary);")
        }
        
        # 8. Add shadow fallback supports
        if ($content -match '--semantic-shadow-card:' -and $content -notmatch '@supports \(color: oklch\(0 0 0\)\)') {
            $supportsBlock = "`r`n`r`n    @supports (color: oklch(0 0 0)) {`r`n      --semantic-shadow-xs: var(--primitive-shadow-xs);`r`n      --semantic-shadow-sm: var(--primitive-shadow-sm);`r`n      --semantic-shadow-md: var(--primitive-shadow-md);`r`n      --semantic-shadow-lg: var(--primitive-shadow-lg);`r`n    }"
            $content = $content -replace '(--semantic-shadow-card:\s*[^;]+;)', "`$1$supportsBlock"
        }

        Set-Content -Path $file -Value $content -Encoding UTF8
        Write-Output "Processed: $file"
    }
    else {
        Write-Output "File not found: $file"
    }
}
