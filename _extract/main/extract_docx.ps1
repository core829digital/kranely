$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open("c:\Users\STEFAN\Desktop\iwhome.app-main\IWHome Debug Feature Prompt.docx")
$text = $doc.Content.Text
$doc.Close()
$word.Quit()
[System.Runtime.InteropServices.Marshal]::ReleaseComObject($word) | Out-Null
$text | Out-File -FilePath "c:\Users\STEFAN\Desktop\iwhome.app-main\docx_content.txt" -Encoding utf8
Write-Output "Done extracting"
