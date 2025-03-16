$exclude = @("node_modules","college","modules", "lycee", "logiciels", ".next", "dist", "package-lock.json", ".git", ".vscode", ".eslint*", ".gitignore", ".DS_Store")

function Get-Tree {
    param (
        [string]$Path = ".",
        [int]$Level = 0
    )
    $items = Get-ChildItem -Path $Path -Force | Where-Object { $_.Name -notin $exclude }

    foreach ($item in $items) {
        $indent = "  " * $Level
        if ($item.PSIsContainer) {
            "$indent\-- $($item.Name)" | Out-Host
            Get-Tree -Path $item.FullName -Level ($Level + 2)
        } else {
            "$indent|-- $($item.Name)" | Out-Host
        }
    }
}
Get-Tree | clip
