$ErrorActionPreference = 'Stop'
$root = 'C:\Users\USER\Downloads\jockey\deliverables'
$build = Join-Path $root '.showcase-build'
$renderDir = Join-Path $build 'rendered'
New-Item -ItemType Directory -Force $renderDir | Out-Null
$pptx = Join-Path $root 'JOCKEY-Stakeholder-Showcase.pptx'
$pdf = Join-Path $root 'JOCKEY-Stakeholder-Showcase.pdf'
function Color($hex) {
  $hex = $hex.TrimStart('#')
  return [Convert]::ToInt32($hex.Substring(0,2),16) + 256 * [Convert]::ToInt32($hex.Substring(2,2),16) + 65536 * [Convert]::ToInt32($hex.Substring(4,2),16)
}
$green = Color '123C32'; $gold = Color 'B99756'; $paper = Color 'F6F2E9'; $muted = Color '63736B'; $white = Color 'FFFFFF'
$app = New-Object -ComObject PowerPoint.Application
$deck = $app.Presentations.Add(0)
$deck.PageSetup.SlideWidth = 960; $deck.PageSetup.SlideHeight = 540
$script:slide = $null; $script:ink = $green; $script:small = $muted
function Text($value,$x,$y,$w,$h,$size=20,$color=$script:ink,$font='Aptos',$bold=$false) {
  $s = $script:slide.Shapes.AddTextbox(1,$x,$y,$w,$h)
  $s.TextFrame.MarginLeft=0; $s.TextFrame.MarginRight=0; $s.TextFrame.MarginTop=0; $s.TextFrame.MarginBottom=0
  $s.TextFrame.WordWrap=-1
  $r=$s.TextFrame.TextRange; $r.Text=$value; $r.Font.Name=$font; $r.Font.Size=$size; $r.Font.Color.RGB=$color; $r.Font.Bold=[int]$bold * -1
  $r.ParagraphFormat.SpaceAfter=8
  return $s
}
function NewSlide($n,$label,$dark=$false) {
  $script:slide=$deck.Slides.Add($deck.Slides.Count+1,12)
  $script:slide.FollowMasterBackground=0
  if ($dark) { $script:slide.Background.Fill.ForeColor.RGB=$green; $script:ink=$paper; $script:small=$gold }
  else { $script:slide.Background.Fill.ForeColor.RGB=$paper; $script:ink=$green; $script:small=$muted }
  $null=Text 'JOCKEY' 48 24 160 25 17 $script:ink 'Aptos' $true
  $null=Text $label.ToUpper() 260 27 650 20 11 $script:small
  $null=Text 'STAKEHOLDER SHOWCASE  /  18 OCT 2026' 48 506 700 18 10 $script:small
  $null=Text ('{0:D2}' -f $n) 875 502 40 22 13 $script:small
}
function Title($value) { $null=Text $value 48 88 864 110 37 $script:ink 'Georgia' }
function Notes($value) {
  $script:slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text=$value
}
$source=Get-Content (Join-Path $root 'JOCKEY-Stakeholder-Showcase.txt') -Raw -Encoding UTF8
$notes=@{}
$matches=[regex]::Matches($source,'(?s)SLIDE (\d{2})\r?\n(.*?)(?=\r?\nSLIDE \d{2}|\r?\nPRESENTER WALKTHROUGH)')
foreach($m in $matches) { $parts=$m.Groups[2].Value -split 'Speaker notes:',2; $notes[[int]$m.Groups[1].Value]=$parts[1].Trim() }
try {
  NewSlide 1 'Platform showcase' $true
  $null=Text 'JOCKEY' 48 140 864 96 76 $paper 'Georgia'
  $null=Text 'Racing information. Connected.' 52 260 850 56 32 $gold
  $null=Text 'A membership experience for following the racing day.' 52 350 770 76 23 $paper
  Notes $notes[1]

  NewSlide 2 'The product experience'
  Title 'Follow the racing day in one place'
  $null=Text '01' 48 242 70 55 34 $gold
  $null=Text 'Discover the meeting.' 144 241 740 52 30
  $null=Text '02' 48 316 70 55 34 $gold
  $null=Text 'Study the field.' 144 315 740 52 30
  $null=Text '03' 48 390 70 55 34 $gold
  $null=Text 'Review the result.' 144 389 740 52 30
  Notes $notes[2]

  NewSlide 3 'Discovery'
  Title 'The calendar is the entry point'
  $null=Text 'PUBLIC' 48 236 350 30 16 $gold 'Aptos' $true
  $null=Text "Racing dates`nMeeting summaries`nLearning guide" 48 286 375 150 26
  $null=Text 'WITH MEMBERSHIP' 500 236 400 30 16 $gold 'Aptos' $true
  $null=Text "Meeting programs`nRace declarations`nRecorded form and results" 500 286 412 150 26
  Notes $notes[3]

  NewSlide 4 'Race programs'
  Title 'Connect the field to its history'
  $null=Text 'The program' 48 233 260 44 26 $green 'Georgia'
  $null=Text "Declarations, riders, connections and weights" 48 293 260 150 23
  $null=Text 'The form' 350 233 260 44 26 $green 'Georgia'
  $null=Text 'Recent finishes and comparable performances' 350 293 260 150 23
  $null=Text 'The result' 652 233 260 44 26 $green 'Georgia'
  $null=Text 'Published outcomes linked to the original program' 652 293 260 150 23
  Notes $notes[4]

  NewSlide 5 'Profiles and connections' $true
  Title 'Give the racing records context'
  $null=Text 'A horse has more than its latest finish.' 48 232 864 55 29 $gold
  $null=Text "Explore pedigree and recorded performance.`nFind jockeys, trainers and owners.`nFollow historical connections through results." 48 310 850 160 24
  Notes $notes[5]

  NewSlide 6 'Membership'
  Title 'Two ways to access racing'
  $null=Text 'DAILY ACCESS' 48 218 375 28 16 $muted 'Aptos' $true
  $null=Text ([char]0x20B1 + '50') 48 262 380 92 66 $green 'Georgia'
  $null=Text '24 hours' 48 368 380 38 25
  $null=Text 'MONTHLY MEMBERSHIP' 500 218 412 28 16 $muted 'Aptos' $true
  $null=Text ([char]0x20B1 + '499') 500 262 412 92 66 $green 'Georgia'
  $null=Text 'One calendar month' 500 368 412 38 25
  $null=Text ('Save ' + [char]0x20B1 + '1,001 monthly vs. 30 daily passes. Same racing access. No auto-renewal.') 48 446 864 38 18 $muted
  Notes $notes[6]

  NewSlide 7 'Checkout and access'
  Title 'The subscription journey works'
  $null=Text '01   Choose a plan' 48 231 864 48 28
  $null=Text '02   Sign in or create an account' 48 300 864 48 28
  $null=Text '03   Complete checkout and continue' 48 369 864 48 28
  $null=Text 'Current checkout activates access without collecting money.' 48 450 864 34 18 $muted
  Notes $notes[7]

  NewSlide 8 'Showcase data' $true
  Title 'Enough depth for a real walkthrough'
  $null=Text '132' 48 218 370 80 58 $gold 'Georgia'
  $null=Text 'horses' 48 304 370 34 23
  $null=Text '306' 500 218 412 80 58 $gold 'Georgia'
  $null=Text 'races' 500 304 412 34 23
  $null=Text '50 meetings  /  2,036 finishing records' 48 380 864 48 28
  $null=Text 'Generated showcase records; current workspace totals.' 48 451 864 30 17 $paper
  Notes $notes[8]

  NewSlide 9 'Reasons to return'
  Title 'Support discovery and return visits'
  $null=Text 'Learn' 48 228 235 46 29 $green 'Georgia'
  $null=Text 'A public guide explains the racing information.' 48 294 235 142 24
  $null=Text 'Follow' 363 228 235 46 29 $green 'Georgia'
  $null=Text 'Favorites keep selected horses within reach.' 363 294 235 142 24
  $null=Text 'Manage' 678 228 234 46 29 $green 'Georgia'
  $null=Text 'Membership shows the active access period.' 678 294 234 142 24
  Notes $notes[9]

  NewSlide 10 'Engineering verification'
  Title 'Core journeys have been verified'
  $null=Text '86' 48 225 245 80 59 $green 'Georgia'
  $null=Text 'backend tests' 48 318 245 44 22
  $null=Text '97' 358 225 245 80 59 $green 'Georgia'
  $null=Text 'frontend + UI tests' 358 318 245 58 22
  $null=Text '7' 668 225 244 80 59 $green 'Georgia'
  $null=Text 'HTTP journey checks' 668 318 244 58 22
  $null=Text 'Production build and account-to-membership flow passed.' 48 424 864 58 24 $muted
  Notes $notes[10]

  NewSlide 11 'Path to launch'
  Title 'Three dependencies shape launch'
  $null=Text 'Racing data' 48 228 250 45 27 $green 'Georgia'
  $null=Text 'Authorize the source and publication process.' 48 294 250 148 24
  $null=Text 'Payments' 355 228 250 45 27 $green 'Georgia'
  $null=Text 'Connect a provider with verified confirmation.' 355 294 250 148 24
  $null=Text 'Deployment' 662 228 250 45 27 $green 'Georgia'
  $null=Text 'Validate hosting, recovery and browser experience.' 662 294 250 148 24
  Notes $notes[11]

  NewSlide 12 'Stakeholder decision' $true
  Title 'Align on a controlled pilot'
  $null=Text "Confirm pricing and the intended audience.`nAssign data, payment and deployment owners.`nAgree on pilot scope and success measures." 48 232 864 180 27
  $null=Text 'Review the live customer journey before wider release.' 48 439 864 44 22 $gold
  Notes $notes[12]

  $deck.SaveAs($pptx,24)
  $deck.SaveAs($pdf,32)
  $deck.Export($renderDir,'PNG',1600,900)
  $issues=@()
  foreach($sl in $deck.Slides) {
    foreach($sh in $sl.Shapes) {
      if($sh.HasTextFrame -eq -1 -and $sh.TextFrame.HasText -eq -1) {
        if($sh.TextFrame.TextRange.BoundHeight -gt ($sh.Height+2)) { $issues += "Slide $($sl.SlideIndex): text exceeds shape height: $($sh.TextFrame.TextRange.Text)" }
        if($sh.Left -lt 0 -or $sh.Top -lt 0 -or ($sh.Left+$sh.Width) -gt 961 -or ($sh.Top+$sh.Height) -gt 541) { $issues += "Slide $($sl.SlideIndex): shape outside canvas" }
      }
    }
  }
  if($issues.Count) { $issues | Set-Content (Join-Path $build 'qa.txt'); throw ($issues -join "`n") }
  'PASS: 12 slides exported; no text height overflow or out-of-canvas shapes.' | Set-Content (Join-Path $build 'qa.txt')
  Get-Item $pptx,$pdf | Select-Object FullName,Length
} finally { $deck.Close(); $app.Quit() }
