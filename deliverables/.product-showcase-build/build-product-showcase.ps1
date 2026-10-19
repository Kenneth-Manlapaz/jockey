$ErrorActionPreference = 'Stop'
$root = 'C:\Users\USER\Downloads\jockey'
$out = Join-Path $root 'deliverables'
$build = Join-Path $out '.product-showcase-build'
$images = Join-Path $root 'FE\jockey_frontend-main\docs\mobile-screenshots'
$render = Join-Path $build 'rendered'
New-Item -ItemType Directory -Force $render | Out-Null
function RGB($hex) {
  return [Convert]::ToInt32($hex.Substring(0,2),16) + 256*[Convert]::ToInt32($hex.Substring(2,2),16) + 65536*[Convert]::ToInt32($hex.Substring(4,2),16)
}
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
  $r.ParagraphFormat.SpaceAfter=6
  return $s
}
function S($n,$section,$dark=$false) {
  $script:slide=$deck.Slides.Add($deck.Slides.Count+1,12)
  $script:slide.FollowMasterBackground=0
  if($dark) { $script:slide.Background.Fill.ForeColor.RGB=$green; $script:ink=$paper; $script:soft=$cream }
  else { $script:slide.Background.Fill.ForeColor.RGB=$paper; $script:ink=$green; $script:soft=$muted }
  $null=T 'JOCKEY' 64 26 250 28 18 $script:ink 'Aptos' $true
  $null=T $section.ToUpper() 500 30 716 24 12 $script:soft
  $null=T 'PRODUCT SHOWCASE  /  19 OCTOBER 2026' 64 682 1050 20 11 $script:soft
  $null=T ('{0:D2}' -f $n) 1176 678 40 24 14 $script:soft
}
function Heading($text) { $null=T $text 64 90 1152 58 36 $script:ink 'Georgia' }
function Shot($name,$x,$y,$w,$h,$top=0) {
  $p=$script:slide.Shapes.AddPicture((Join-Path $images $name),0,-1,0,0,-1,-1)
  $pw=$w; $ph=$w*$p.Height/$p.Width
  $crop=$p.PictureFormat.Crop
  $crop.ShapeWidth=$w; $crop.ShapeHeight=$h
  $crop.PictureWidth=$pw; $crop.PictureHeight=$ph
  $crop.PictureOffsetX=0; $crop.PictureOffsetY=($ph-$h)/2-$ph*$top
  $p.Left=$x; $p.Top=$y
  $p.Line.Visible=-1; $p.Line.ForeColor.RGB=$line; $p.Line.Weight=.6
  $p.AlternativeText="Actual saved mobile interface: $name; captured 18 October 2026. Cropped for slide layout."
  return $p
}
function Caption($x,$y,$w=470) { $null=T 'SAVED MOBILE INTERFACE / 18 OCT 2026' $x $y $w 22 11 $script:soft }
function N($body,$asset='',$extra='') {
  $note=$body
  if($asset) { $note += "`r`n`r`nImage provenance: actual saved mobile UI capture, 18 October 2026. This predates the latest web directory, header and membership refinements. UI values are illustrative records, not official racing coverage. Cropping changes framing only." }
  $note += "`r`n`r`n[Sources]`r`nSETUP.md: current access policy, plans, generated seed and deployment status.`r`nRECONSTRUCTION.md: race information and recorded-history behavior."
  if($asset) { $note += "`r`nFE/jockey_frontend-main/docs/mobile-screenshots/$asset`r`nFE/jockey_frontend-main/docs/mobile-screenshots/manifest.json: capture-to-route mapping." }
  if($extra) { $note += "`r`n$extra" }
  $note += "`r`n[/Sources]"
  $script:slide.NotesPage.Shapes.Placeholders.Item(2).TextFrame.TextRange.Text=$note
}
try {
  S 1 'Racing information platform' $true
  $null=T 'JOCKEY' 64 134 700 92 66 $paper 'Georgia'
  $null=T "Racing,`nwithin reach." 64 264 710 170 56 $paper 'Georgia'
  $null=T 'Programs. Form. Results.' 68 472 680 44 27 $cream
  $null=T 'A connected racing experience with membership access.' 68 545 650 70 22 $paper
  $null=Shot '06-home-dashboard.png' 850 96 330 548
  Caption 850 653 360
  N 'Open with the product, rather than the technology. JOCKEY connects discovery, race information and results. The cover shows the saved mobile home interface; current web membership is covered later.' '06-home-dashboard.png'

  S 2 'The customer journey'
  Heading 'One place to follow race day'
  $null=Shot '12-race-detail.png' 76 174 290 468
  Caption 76 651 400
  $null=T '01' 456 204 70 44 28 $gold
  $null=T 'Discover the meeting' 550 201 650 44 29 $green 'Georgia'
  $null=T 'Start with the date, venue and race program.' 550 254 650 58 21
  $null=T '02' 456 346 70 44 28 $gold
  $null=T 'Study the field' 550 343 650 44 29 $green 'Georgia'
  $null=T 'Open runners, connections and recorded form.' 550 396 650 58 21
  $null=T '03' 456 488 70 44 28 $gold
  $null=T 'Follow the result' 550 485 650 44 29 $green 'Georgia'
  $null=T 'Return for the finish order and published detail.' 550 538 650 58 21
  N 'The current web entry point is the public racing calendar. Meeting programs, profiles, statistics and results require membership. This slide establishes the story followed by the next three product screens. The mobile program image is a saved interface capture, rather than a screenshot of the current web calendar.' '12-race-detail.png'

  S 3 'Study the field'
  Heading 'Know the field before the start'
  $null=T 'A program makes the race tangible.' 64 216 640 90 31 $green 'Georgia'
  $null=T "Declared runners`nAssigned riders and connections`nWeights and entry status" 64 346 650 170 25
  $null=T 'Each runner leads to a deeper profile.' 64 566 650 54 22 $muted
  $null=Shot '13-race-entries.png' 858 174 320 474
  Caption 858 653 360
  N 'Use the entries screen to explain the practical value of a program. The current information platform also preserves declarations after results and links horses by permanent IDs. The saved mobile capture includes an older betting-oriented experience outside this crop; membership information is the scope of this showcase.' '13-race-entries.png'

  S 4 'Explore the runner' $true
  Heading 'Look beyond the race number'
  $null=T 'Connections give every runner context.' 64 223 690 95 32 $cream 'Georgia'
  $null=T "Horse identity and pedigree`nJockey, trainer and owner links`nRecent and comparable form" 64 362 690 172 26
  $null=T 'The current web platform links these pages to recorded history.' 64 582 690 64 21 $paper
  $null=Shot '24-horse-profile.png' 890 96 260 563
  Caption 890 661 330
  N 'The screenshot illustrates the existing mobile horse profile and its connection links. The reconstructed web profile adds pedigree, permanent IDs and recorded recent/comparable form. Explain that distinction if asked: the capture predates those web refinements, and the displayed odds and example horse are not authoritative data.' '24-horse-profile.png'

  S 5 'Review the outcome'
  Heading 'See the result, then the detail'
  $null=Shot '21-result-detail.png' 100 160 240 486
  Caption 100 653 390
  $null=T 'The racing story continues after the finish.' 470 216 730 92 31 $green 'Georgia'
  $null=T "Finish order`nOfficial timing where recorded`nPublished dividend information" 470 354 730 168 26
  $null=T 'The original program stays available alongside the result.' 470 580 700 64 21 $muted
  N 'Result pages preserve the route back to the original race program. Current web dividends are stored publications with event legs and correction relationships; missing information stays unavailable. The saved interface image shows illustrative finish positions and dividend values, not a verified operator publication.' '21-result-detail.png'

  S 6 'Learn the language of racing'
  Heading 'Give new visitors a starting point'
  $null=T 'Learn the program.' 64 225 700 60 32 $green 'Georgia'
  $null=T 'Understand the form.' 64 324 700 60 32 $green 'Georgia'
  $null=T 'Interpret the result.' 64 423 700 60 32 $green 'Georgia'
  $null=T 'The learning guide stays public.' 64 565 700 62 23 $muted
  $null=Shot '33-racing-guide.png' 868 166 300 484
  Caption 868 655 340
  N 'Education supports discovery before a subscription decision. The current web guide has eight illustrated chapters covering programs, form, statistics, results, dividends and terminology. This image is the saved mobile guide and retains earlier reference wording; it is not the current redesigned web guide.' '33-racing-guide.png'

  S 7 'Membership model'
  Heading 'A simple membership rule'
  $null=T 'DAILY ACCESS' 64 199 340 30 16 $muted 'Aptos' $true
  $null=T ([char]0x20B1+'50') 64 243 350 98 64 $green 'Georgia'
  $null=T '24 hours' 64 351 350 42 25
  $null=T 'MONTHLY ACCESS' 434 199 360 30 16 $muted 'Aptos' $true
  $null=T ([char]0x20B1+'499') 434 243 370 98 64 $green 'Georgia'
  $null=T 'One calendar month' 434 351 370 42 25
  $null=T 'Choose a plan. Sign in. Confirm payment.' 64 459 720 70 26 $green 'Georgia'
  $null=T 'Demo confirmation unlocks access. No money is charged.' 64 555 700 80 21 $muted
  $null=Shot '04-login.png' 894 187 290 410 .13
  Caption 894 612 320
  N 'These are the current configurable web plan prices. Both plans unlock the same protected racing information. Daily access lasts 24 hours; monthly access uses a calendar month. Confirm payment is now a normal page button, with no iframe or payment-provider integration. This slide uses the saved sign-in screen only; it does not pretend to show the current membership page. There is no automatic renewal.' '04-login.png' 'web/src/features/subscriptions/subscription-flow.tsx: direct confirmation buttons and activation.'

  S 8 'Depth behind the experience' $true
  Heading 'Enough depth to explore'
  $null=T '132' 64 241 345 108 80 $cream 'Georgia'
  $null=T 'horses' 64 367 345 48 28
  $null=T '306' 464 241 345 108 80 $cream 'Georgia'
  $null=T 'races' 464 367 345 48 28
  $null=T '2,036' 864 241 352 108 80 $cream 'Georgia'
  $null=T 'finishing records' 864 367 352 48 28
  $null=T 'Varied programs, connections, histories and event relationships.' 64 486 1152 80 27
  $null=T 'Generated showcase data / current local workspace totals' 64 608 1152 30 17 $cream
  N 'These counts describe generated local showcase records, not users, revenue or official live coverage. A fresh database receives 128 newly seeded horses; the local total includes four earlier retained records. The reproducible seed supports demonstrations on another configured database. An authorized source is needed before presenting real racing coverage.'

  S 9 'What is working'
  Heading 'The core journey is working'
  $null=Shot '10-results.png' 76 174 290 474
  Caption 76 653 390
  $null=T 'Connected racing information' 470 211 730 48 29 $green 'Georgia'
  $null=T 'Programs, profiles, form and results.' 470 272 730 54 22
  $null=T 'Account and access flow' 470 365 730 48 29 $green 'Georgia'
  $null=T 'Sign-in, membership activation and favorites.' 470 426 730 64 22
  $null=T 'Verified locally' 470 519 730 48 29 $green 'Georgia'
  $null=T 'Production build and end-to-end account checks passed.' 470 580 730 64 21 $muted
  N 'The existing saved results-list interface supplies the visual. The current local web implementation has passed its production build, 86 backend tests, 82 existing frontend tests, 17 UI tests and seven HTTP journey checks. The verification script exercises registration, membership activation, SSR race/horse and directory/participant pages, favorites, refresh and logout. These checks are not production load testing; fresh browser and device QA of the web updates remains outstanding.' '10-results.png' 'BE/jockey_backend-main/scripts/verify_web_auth.py: expanded subscriber page checks.'

  S 10 'The next decision' $true
  $null=T "Move into a`ncontrolled pilot." 64 140 1120 166 56 $paper 'Georgia'
  $null=T '01  Authorize the racing data source.' 68 366 1100 56 27
  $null=T '02  Assign payment and deployment owners.' 68 442 1100 56 27
  $null=T '03  Agree on pilot scope and success measures.' 68 518 1100 56 27
  $link=T 'Explore JOCKEY: dev6.comclark.com' 68 618 1100 36 21 $cream
  $link.ActionSettings.Item(1).Hyperlink.Address='https://dev6.comclark.com/'
  N 'Close with a concrete stakeholder decision. Pricing is a configurable current proposal, and real payments still require a verified provider integration. Data authority, production deployment, restoration testing and browser/device QA remain launch dependencies. Agree on pilot scope and success measures before setting a launch date. The environment URL comes from the user-provided screenshots and was not independently checked during this build.' '' 'User-provided platform screenshots: dev6.comclark.com environment URL.'

  $pptx=Join-Path $out 'JOCKEY-Product-Showcase.pptx'
  $pdf=Join-Path $out 'JOCKEY-Product-Showcase.pdf'
  $deck.SaveAs($pptx,24)
  $deck.SaveAs($pdf,32)
  $deck.Export($render,'PNG',1920,1080)
  $issues=@()
  foreach($sl in $deck.Slides) {
    $bounds=@()
    foreach($sh in $sl.Shapes) {
      if($sh.Left -lt -1 -or $sh.Top -lt -1 -or ($sh.Left+$sh.Width) -gt 1281 -or ($sh.Top+$sh.Height) -gt 721) { $issues += "Slide $($sl.SlideIndex): shape outside canvas" }
      if($sh.HasTextFrame -eq -1 -and $sh.TextFrame.HasText -eq -1) {
        if($sh.TextFrame.TextRange.BoundHeight -gt $sh.Height+2) { $issues += "Slide $($sl.SlideIndex): text height overflow: $($sh.TextFrame.TextRange.Text)" }
        $tr=$sh.TextFrame.TextRange
        $bounds += @{ name=$sh.Name; left=$tr.BoundLeft; top=$tr.BoundTop; right=($tr.BoundLeft+$tr.BoundWidth); bottom=($tr.BoundTop+$tr.BoundHeight) }
      } elseif($sh.Type -eq 13) {
        $bounds += @{ name=$sh.Name; left=$sh.Left; top=$sh.Top; right=($sh.Left+$sh.Width); bottom=($sh.Top+$sh.Height) }
      }
    }
    for($i=0; $i -lt $bounds.Count; $i++) {
      for($j=$i+1; $j -lt $bounds.Count; $j++) {
        $a=$bounds[$i]; $b=$bounds[$j]
        $ix=[Math]::Min($a.right,$b.right)-[Math]::Max($a.left,$b.left)
        $iy=[Math]::Min($a.bottom,$b.bottom)-[Math]::Max($a.top,$b.top)
        if($ix -gt 2 -and $iy -gt 2) { $issues += "Slide $($sl.SlideIndex): overlap $($a.name) / $($b.name)" }
      }
    }
  }
  if($issues.Count) { $issues | Set-Content (Join-Path $build 'qa.txt'); throw ($issues -join "`n") }
  'PASS: 10 slides exported; no text overflow, content overlaps or out-of-canvas shapes.' | Set-Content (Join-Path $build 'qa.txt')
  Get-Item $pptx,$pdf | Select-Object FullName,Length
} finally { $deck.Close(); $app.Quit() }
