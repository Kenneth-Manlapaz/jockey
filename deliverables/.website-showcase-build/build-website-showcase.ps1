$ErrorActionPreference = 'Stop'
$root='C:\Users\USER\Downloads\jockey'
$out=Join-Path $root 'deliverables'
$build=Join-Path $out '.website-showcase-build'
$images=Join-Path $root 'ppt images'
$render=Join-Path $build 'rendered'
New-Item -ItemType Directory -Force $render | Out-Null
Add-Type -AssemblyName System.Drawing
function RGB($hex) { return [Convert]::ToInt32($hex.Substring(0,2),16)+256*[Convert]::ToInt32($hex.Substring(2,2),16)+65536*[Convert]::ToInt32($hex.Substring(4,2),16) }
$green=RGB '103B2F'; $paper=RGB 'F5F1E8'; $gold=RGB 'C6A15B'; $muted=RGB '65746C'; $line=RGB 'D9DED6'; $cream=RGB 'F2D78F'
$app=New-Object -ComObject PowerPoint.Application
$deck=$app.Presentations.Add(0)
$deck.PageSetup.SlideWidth=1280; $deck.PageSetup.SlideHeight=720
$script:slide=$null; $script:ink=$green; $script:soft=$muted
function T($text,$x,$y,$w,$h,$size=24,$color=$script:ink,$font='Aptos',$bold=$false) {
  $s=$script:slide.Shapes.AddTextbox(1,$x,$y,$w,$h)
  $s.TextFrame.MarginLeft=0; $s.TextFrame.MarginRight=0; $s.TextFrame.MarginTop=0; $s.TextFrame.MarginBottom=0
  $s.TextFrame.WordWrap=-1
  $r=$s.TextFrame.TextRange; $r.Text=$text; $r.Font.Name=$font; $r.Font.Size=$size; $r.Font.Color.RGB=$color; $r.Font.Bold=-[int]$bold
  $r.ParagraphFormat.SpaceAfter=8
  return $s
}
function S($n,$section,$dark=$false) {
  $script:slide=$deck.Slides.Add($deck.Slides.Count+1,12)
  $script:slide.FollowMasterBackground=0
  if($dark) { $script:slide.Background.Fill.ForeColor.RGB=$green; $script:ink=$paper; $script:soft=$cream }
  else { $script:slide.Background.Fill.ForeColor.RGB=$paper; $script:ink=$green; $script:soft=$muted }
  $null=T 'JOCKEY' 64 26 260 28 18 $script:ink 'Aptos' $true
  $null=T $section.ToUpper() 500 30 716 24 12 $script:soft
  $null=T 'WEBSITE SHOWCASE  /  19 OCTOBER 2026' 64 682 1050 20 11 $script:soft
  $null=T ('{0:D2}' -f $n) 1176 678 40 24 14 $script:soft
}
function Heading($text) { $null=T $text 64 90 1152 64 36 $script:ink 'Georgia' }
function Region($name,$x,$y,$maxW,$maxH,$sx,$sy,$sw,$sh) {
  $path=Join-Path $images $name
  $img=[System.Drawing.Image]::FromFile($path)
  $iw=$img.Width; $ih=$img.Height; $img.Dispose()
  if($sx -lt 0 -or $sy -lt 0 -or ($sx+$sw) -gt $iw -or ($sy+$sh) -gt $ih) { throw "Invalid source crop: $name" }
  $scale=[Math]::Min($maxW/$sw,$maxH/$sh)
  $w=$sw*$scale; $h=$sh*$scale; $pw=$iw*$scale; $ph=$ih*$scale
  $p=$script:slide.Shapes.AddPicture($path,0,-1,0,0,-1,-1)
  $crop=$p.PictureFormat.Crop
  $crop.ShapeWidth=$w; $crop.ShapeHeight=$h; $crop.PictureWidth=$pw; $crop.PictureHeight=$ph
  $crop.PictureOffsetX=($pw-$w)/2-$sx*$scale
  $crop.PictureOffsetY=($ph-$h)/2-$sy*$scale
  $p.Left=$x; $p.Top=$y
  $p.Line.Visible=-1; $p.Line.ForeColor.RGB=$line; $p.Line.Weight=.5
  $p.AlternativeText="Actual website screenshot supplied by user: ppt images/$name. Native presentation crop; original UI unchanged."
  return $p
}
function N($body,$assets) {
  $notes=$body+"`r`n`r`n[Sources]"
  foreach($asset in $assets) { $notes += "`r`nppt images/${asset}: user-supplied screenshot of the reconstructed website." }
  $notes += "`r`nSETUP.md: membership policy, demo activation and deployment requirements.`r`nRECONSTRUCTION.md: information model and recorded-history behavior.`r`n[/Sources]"
  $notes += "`r`n`r`nScreenshot provenance: the website images supplied in the workspace's ppt images folder. UI text and data are retained; framing uses native PowerPoint cropping. Example racing records do not establish official live coverage."
  $script:slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text=$notes
}
try {
  S 1 'The website we built' $true
  $null=T 'JOCKEY' 64 139 420 90 62 $paper 'Georgia'
  $null=T "Race day,`nconnected." 64 274 420 154 50 $paper 'Georgia'
  $null=T 'Calendar. Programs. Form. Results.' 64 487 380 80 23 $cream
  $null=T 'Stakeholder product showcase' 64 607 430 40 20 $paper
  $null=Region 'aboutus.png' 510 123 706 510 264 106 1324 730
  N 'Introduce the reconstructed JOCKEY website as a connected racing information and education platform. The screenshot is the actual About page supplied in ppt images. The following slides follow a visitor from public discovery to membership and deeper racing information.' @('aboutus.png')

  S 2 '01 / Discover'
  Heading 'Start with the racing calendar'
  $null=Region 'no membership homepage.png' 64 182 800 452 355 270 1145 648
  $null=T 'Choose a date' 920 212 296 42 25 $green 'Georgia'
  $null=T 'See venues and meeting summaries.' 920 268 296 96 21
  $null=T 'Explore freely' 920 410 296 42 25 $green 'Georgia'
  $null=T 'Full programs open through membership.' 920 466 296 100 21
  N 'The calendar and meeting summaries are public. This exact screenshot shows the selected racing date, two venues, and membership prompts where protected program details would appear. Date navigation stays meaningful even before a visitor subscribes.' @('no membership homepage.png')

  S 3 '02 / Learn'
  Heading 'Give newcomers a way into racing'
  $null=T 'Read the program.' 64 225 380 54 29 $green 'Georgia'
  $null=T 'Understand form.' 64 331 380 54 29 $green 'Georgia'
  $null=T 'Interpret results.' 64 437 380 54 29 $green 'Georgia'
  $null=T 'Eight illustrated chapters, open to everyone.' 64 564 380 72 22 $muted
  $null=Region 'learn_to_race_free.png' 510 169 706 472 340 98 1176 840
  N 'The public learning guide covers getting started, programs, horse form, racing statistics, terminology, results, dividends and a glossary. The visible chapter connects racing date, meeting, program and published result. It supports understanding before a subscription decision; no conversion outcome is claimed.' @('learn_to_race_free.png')

  S 4 '03 / Join'
  Heading 'Two plans. The same racing access.'
  $null=T 'DAILY ACCESS' 64 202 300 28 16 $muted 'Aptos' $true
  $null=T ([char]0x20B1+'50') 64 243 300 90 58 $green 'Georgia'
  $null=T '24 hours' 64 342 300 40 24
  $null=T 'MONTHLY ACCESS' 64 430 300 28 16 $muted 'Aptos' $true
  $null=T ([char]0x20B1+'499') 64 471 300 90 58 $green 'Georgia'
  $null=T 'One calendar month' 64 566 300 48 22
  $null=Region 'pay_membership.png' 414 180 802 454 407 285 1036 604
  N 'Both plans unlock programs, form, statistics, results and dividends. Daily lasts 24 hours; monthly uses a calendar month. Prices are configurable in admin. The current demo journey is choose a plan, sign in or create an account, then Confirm payment. Confirmation activates membership without collecting money. No real payment provider or automatic renewal is implied. The supplied membership screenshot shows the actual pricing page; signup.png is available as supporting evidence of registration.' @('pay_membership.png','signup.png')

  S 5 '04 / Unlock' $true
  Heading 'Membership opens the race program'
  $null=Region 'paid_homepage.png' 64 182 850 452 278 300 1288 638
  $null=T 'Same calendar.' 963 223 253 82 28 $cream 'Georgia'
  $null=T 'More detail.' 963 344 253 82 28 $cream 'Georgia'
  $null=T 'Open the races within each meeting.' 963 474 253 116 23 $paper
  N 'This is the actual subscribed homepage. Compared with the public calendar on slide 2, the meeting card now reveals its scheduled races, post times, distances, surfaces and declarations. The selected date is retained. All screenshot values are supplied example records; membership flow is demonstrated without a real charge.' @('paid_homepage.png')

  S 6 '05 / Study the field'
  Heading 'One program connects the racing detail'
  $null=T 'Race conditions' 64 220 350 52 28 $green 'Georgia'
  $null=T 'Distance, surface, class and purse.' 64 282 350 74 21
  $null=T 'Declared entries' 64 411 350 52 28 $green 'Georgia'
  $null=T 'Runners, riders, weights and profile links.' 64 473 350 110 21
  $null=Region 'paid_racing_info.png' 480 176 736 460 280 156 1288 770
  N 'Use Sampaguita Sprint as the on-screen example. The program includes race conditions, classifications, purse and declared entries. Links lead to the complete meeting and to horses and participants. The lower table includes recent form and declaration details. Missing comparable times remain unavailable, as shown; no timing is invented.' @('paid_racing_info.png')

  S 7 '06 / Follow the horse'
  Heading 'Trace the horse beyond one race'
  $null=Region 'horses_zoomed.png' 64 192 846 420 283 80 1286 850
  $null=T 'Pedigree' 959 215 257 44 25 $green 'Georgia'
  $null=T 'Sire, dam and current connections.' 959 268 257 90 20
  $null=T 'Recorded form' 959 427 257 44 25 $green 'Georgia'
  $null=T 'Finishes, timing and the latest five races.' 959 480 257 110 20
  N 'The supplied horse profile shows pedigree, current trainer and owner, recorded performance totals and recent form rows. These histories link back to races and their connections. Comparable form depends on an appropriate race context, and the screen explicitly marks unavailable comparable timing. Counts here describe the example horse only.' @('horses_zoomed.png')

  S 8 '07 / Explore the directory'
  Heading 'Find the horses and people behind racing'
  $null=Region 'horses.png' 64 178 850 460 278 272 1288 650
  $null=T '128' 964 187 250 57 39 $green 'Georgia'
  $null=T 'horses' 964 248 250 32 21
  $null=T '18' 964 310 250 57 39 $green 'Georgia'
  $null=T 'jockeys' 964 371 250 32 21
  $null=T '12 trainers' 964 440 250 45 25 $green 'Georgia'
  $null=T '10 owners' 964 516 250 45 25 $green 'Georgia'
  $null=T 'Search by name. Open any profile.' 64 622 850 40 23 $muted
  N 'The screenshot demonstrates the actual compact directory with active category tabs and a name search. Counts are read from this supplied website capture and the corresponding jockey, trainer and owner screenshots: 128 horses, 18 jockeys, 12 trainers and 10 owners. They describe generated demonstration data in that installation, not customers or authoritative coverage. This avoids substituting the different local workspace total.' @('horses.png','jockeys.png','trainers.png','owners.png')

  S 9 '08 / Understand the connections' $true
  Heading 'Every rider has a recorded history'
  $null=T 'Performance at a glance' 64 222 380 90 29 $cream 'Georgia'
  $null=T 'Finishes, wins and top-three results.' 64 335 380 84 23 $paper
  $null=T 'Follow the partnerships' 64 476 380 80 29 $cream 'Georgia'
  $null=T 'Horse associations and combination records.' 64 570 380 74 22 $paper
  $null=Region 'jockeys_zoomed.png' 510 178 706 463 279 70 1287 860
  N 'Adrian Cruz is the example shown. The profile ties recorded performance to associated horses and horse/rider combinations. These are records in the demonstration database, not verified real-world career claims. The detail table below, shown in jockeys_zoomed(1).png, links recent finishes back to races and their connections.' @('jockeys_zoomed.png')

  S 10 '09 / Connect the wider team'
  Heading 'Trainers and owners complete the picture'
  $null=T 'TRAINER RECORD' 64 176 548 28 16 $muted 'Aptos' $true
  $null=T 'OWNER RECORD' 668 176 548 28 16 $muted 'Aptos' $true
  $null=Region 'trainers_zoomed.png' 64 222 548 370 287 80 1287 814
  $null=Region 'owners_zoomed.png' 668 222 548 370 278 155 1288 760
  $null=T 'Each profile leads back to horses, combinations and finishing records.' 64 620 1152 44 23 $green
  N 'These are the actual trainer and owner profile screenshots supplied by the user. Both share the participant structure: recorded performance, associated horses and combinations, followed by recent results. The consistent pattern helps users explore connections without learning a different screen for every role.' @('trainers_zoomed.png','owners_zoomed.png')

  S 11 '10 / Review the outcome'
  Heading 'The journey continues through results'
  $null=Region 'races.png' 64 178 850 460 281 149 1288 779
  $null=T 'Filter by date' 964 219 252 74 26 $green 'Georgia'
  $null=T 'Browse published outcomes.' 964 311 252 90 21
  $null=T 'Reopen the race' 964 451 252 76 26 $green 'Georgia'
  $null=T 'Keep program and history connected.' 964 543 252 96 21
  N 'The screenshot is the website Results page, despite the source filename races.png. It shows a date filter and linked published race results across venues. The information journey preserves the program after results and can lead into published event/dividend records. No unprovided dividend screenshot is invented here.' @('races.png')

  S 12 'Stakeholder takeaway' $true
  $null=T "One connected`nracing website." 64 142 1152 162 56 $paper 'Georgia'
  $null=T 'Discover freely.' 68 366 1100 54 30 $cream 'Georgia'
  $null=T 'Unlock programs and racing intelligence.' 68 444 1100 54 30 $paper 'Georgia'
  $null=T 'Follow horses, connections and results.' 68 522 1100 54 30 $paper 'Georgia'
  $link=T 'Explore the platform: dev6.comclark.com' 68 620 1100 38 21 $cream
  $link.ActionSettings.Item(1).Hyperlink.Address='https://dev6.comclark.com/'
  N 'Close by bringing the journey together, then move into the live website. Stakeholders can evaluate the public/member boundary and connected information flow. For an operational paid launch, authoritative data, verified payment processing and production validation are still required. The current payment button is a demonstration of access activation, not a money transfer. No launch date, revenue or adoption claim is made.' @('aboutus.png','pay_membership.png','paid_homepage.png')

  $pptx=Join-Path $out 'JOCKEY-Website-Showcase.pptx'
  $pdf=Join-Path $out 'JOCKEY-Website-Showcase.pdf'
  $deck.SaveAs($pptx,24); $deck.SaveAs($pdf,32); $deck.Export($render,'PNG',1920,1080)
  $issues=@()
  foreach($sl in $deck.Slides) {
    $bounds=@()
    foreach($sh in $sl.Shapes) {
      if($sh.Left -lt -1 -or $sh.Top -lt -1 -or ($sh.Left+$sh.Width) -gt 1281 -or ($sh.Top+$sh.Height) -gt 721) { $issues += "Slide $($sl.SlideIndex): shape outside canvas" }
      if($sh.HasTextFrame -eq -1 -and $sh.TextFrame.HasText -eq -1) {
        $tr=$sh.TextFrame.TextRange
        if($tr.BoundHeight -gt $sh.Height+2) { $issues += "Slide $($sl.SlideIndex): text height overflow: $($tr.Text)" }
        $bounds += @{name=$sh.Name;left=$tr.BoundLeft;top=$tr.BoundTop;right=($tr.BoundLeft+$tr.BoundWidth);bottom=($tr.BoundTop+$tr.BoundHeight)}
      } elseif($sh.Type -eq 13) { $bounds += @{name=$sh.Name;left=$sh.Left;top=$sh.Top;right=($sh.Left+$sh.Width);bottom=($sh.Top+$sh.Height)} }
    }
    for($i=0;$i -lt $bounds.Count;$i++) { for($j=$i+1;$j -lt $bounds.Count;$j++) {
      $a=$bounds[$i];$b=$bounds[$j]
      $ix=[Math]::Min($a.right,$b.right)-[Math]::Max($a.left,$b.left)
      $iy=[Math]::Min($a.bottom,$b.bottom)-[Math]::Max($a.top,$b.top)
      if($ix -gt 2 -and $iy -gt 2) { $issues += "Slide $($sl.SlideIndex): overlap $($a.name) / $($b.name)" }
    }}
  }
  if($issues.Count) { $issues | Set-Content (Join-Path $build 'qa.txt'); throw ($issues -join "`n") }
  'PASS: 12 slides; no text overflow, content overlaps or out-of-canvas shapes.' | Set-Content (Join-Path $build 'qa.txt')
  Get-Item $pptx,$pdf | Select-Object FullName,Length
} finally { $deck.Close(); $app.Quit() }
