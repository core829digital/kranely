[xml]$xml = Get-Content 'c:\Users\STEFAN\Desktop\iwhome.app-main\temp_docx_extracted\word\document.xml'
$ns = New-Object System.Xml.XmlNamespaceManager($xml.NameTable)
$ns.AddNamespace('w', 'http://schemas.openxmlformats.org/wordprocessingml/2006/main')
$paragraphs = $xml.SelectNodes('//w:p', $ns)
$text = ''
foreach ($p in $paragraphs) {
    $runs = $p.SelectNodes('.//w:r/w:t', $ns)
    $line = ''
    foreach ($r in $runs) {
        $line += $r.'#text'
    }
    if ($line) {
        $text += $line + "`r`n"
    } else {
        $text += "`r`n"
    }
}
$text | Out-File 'c:\Users\STEFAN\Desktop\iwhome.app-main\docx_content.txt' -Encoding utf8
Write-Output 'Done'
