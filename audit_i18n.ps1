function Get-JsonPaths($obj, $prefix = "") {
    $paths = @()
    if ($obj -is [System.Management.Automation.PSCustomObject]) {
        foreach ($name in $obj.psobject.Properties.Name) {
            $val = $obj.$name
            $currentPath = if ($prefix -eq "") { $name } else { "$prefix.$name" }
            $paths += Get-JsonPaths $val $currentPath
        }
    } else {
        $paths += $prefix
    }
    return $paths
}

$ar = Get-Content "client/src/locales/ar.json" -Raw | ConvertFrom-Json
$en = Get-Content "client/src/locales/en.json" -Raw | ConvertFrom-Json
$fr = Get-Content "client/src/locales/fr.json" -Raw | ConvertFrom-Json

$arPaths = Get-JsonPaths $ar
$enPaths = Get-JsonPaths $en
$frPaths = Get-JsonPaths $fr

$allKeysInCode = Get-ChildItem -Path client/src -Include *.js,*.jsx,*.ts,*.tsx -Recurse | Select-String -Pattern "t\(['\"](.+?)['\"]\)" -AllMatches | ForEach-Object { $_.Matches } | ForEach-Object { $_.Groups[1].Value } | Sort-Object -Unique

"--- AR ---"
$arPaths | Out-File "ar_paths.txt"
"--- EN ---"
$enPaths | Out-File "en_paths.txt"
"--- FR ---"
$frPaths | Out-File "fr_paths.txt"
"--- CODE ---"
$allKeysInCode | Out-File "code_keys.txt"
