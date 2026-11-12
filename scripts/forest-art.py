"""Original deterministic woodland illustration. No third-party photograph or asset."""
from pathlib import Path
import random, math
R=random.Random(76411)
f=lambda n: f'{n:.1f}'
parts=['''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1800 1200" preserveAspectRatio="xMidYMid slice"><defs>
<linearGradient id="air" x2=".2" y2="1"><stop stop-color="#eef1df"/><stop offset=".48" stop-color="#acb9a1"/><stop offset="1" stop-color="#3a5948"/></linearGradient>
<radialGradient id="light" cx=".65" cy=".28" r=".65"><stop stop-color="#fcf8dc" stop-opacity=".9"/><stop offset=".6" stop-color="#d7dfbd" stop-opacity=".2"/><stop offset="1" stop-color="#91a68b" stop-opacity="0"/></radialGradient>
<linearGradient id="ground" x2="0" y2="1"><stop stop-color="#729071"/><stop offset="1" stop-color="#1a372a"/></linearGradient>
<linearGradient id="bark" x2="1" y2="0"><stop stop-color="#263d32"/><stop offset=".45" stop-color="#61715b"/><stop offset=".7" stop-color="#394c3c"/><stop offset="1" stop-color="#1a3327"/></linearGradient>
<linearGradient id="path" x2=".4" y2="1"><stop stop-color="#c0c4a2"/><stop offset="1" stop-color="#9b9c73"/></linearGradient>
<filter id="soft"><feGaussianBlur stdDeviation="2"/></filter>
<filter id="grain"><feTurbulence type="fractalNoise" baseFrequency=".65" numOctaves="3" seed="17" stitchTiles="stitch"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".08"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter>
<g id="leaves"><path d="M-26 1 Q-17-25-3-17 Q8-31 19-13 Q39-19 31-1 Q44 14 20 16 Q9 34-5 16 Q-30 27-25 10 Q-39 2-26 1Z"/><path d="M-15-8 Q-3-18 7-8 Q21-13 19 0 Q26 14 11 12 Q1 24-9 10 Q-26 12-15-8Z" opacity=".65"/></g>
</defs><rect width="1800" height="1200" fill="url(#air)"/>''']
# Distant deciduous woodland: many irregular slender trunks, no repeated triangle silhouettes.
for layer,(count,fill,opacity,base,scale) in enumerate([(90,'#82977f',.30,800,.7),(55,'#536f58',.48,940,1),(26,'#2c523b',.72,1100,1.5)]):
 parts.append(f'<g fill="{fill}" stroke="{fill}" opacity="{opacity}">')
 for i in range(count):
  x=R.uniform(-100,1900); y=base+R.uniform(-65,60); h=R.uniform(360,760)*scale; w=R.uniform(4,16)*scale; bend=R.uniform(-45,45)
  parts.append(f'<path d="M{f(x-w)} {f(y)} Q{f(x+bend-w)} {f(y-h*.55)} {f(x+bend)} {f(y-h)} Q{f(x+bend+w)} {f(y-h*.4)} {f(x+w)} {f(y)}Z"/>')
  for side in [-1,1]:
   sy=y-h*R.uniform(.45,.75); reach=R.uniform(30,95)*scale
   parts.append(f'<path d="M{f(x)} {f(sy+30)} Q{f(x+side*reach*.35)} {f(sy)} {f(x+side*reach)} {f(sy-90*scale)}" stroke-width="{f(w*.4)}" fill="none"/>')
  for j in range(6):
   lx=x+bend+R.uniform(-90,90)*scale; ly=y-h+R.uniform(-20,180)*scale; sz=R.uniform(.8,2.1)*scale
   parts.append(f'<use href="#leaves" transform="translate({f(lx)} {f(ly)}) scale({f(sz)}) rotate({R.randint(-30,30)})" stroke="none"/>')
 parts.append('</g>')
 if layer<2:parts.append(f'<path d="M0 {base-150} Q450 {base-250} 900 {base-130} T1800 {base-180} V{base+70} H0Z" fill="#dfe5d1" opacity=".18" filter="url(#soft)"/>')
parts.append('<path d="M0 1000 Q250 940 570 1020 Q950 900 1800 1030 V1200 H0Z" fill="url(#ground)"/>')
# An unmarked woodland path gives the eye a place to rest behind the reading page.
parts.append('<path d="M1110 826 C1060 912 1250 970 1100 1040 C970 1110 1020 1150 1190 1200 H1570 C1360 1100 1200 1095 1260 1010 C1300 930 1140 900 1130 826Z" fill="url(#path)" opacity=".55"/>')
# Foreground trees: curved bark, roots and long branching limbs.
for x,y,h,w,side in [(70,1280,1280,64,1),(360,1260,1410,47,-1),(1510,1300,1430,69,-1),(1770,1290,1210,80,-1)]:
 bend=side*85
 parts.append(f'<g><path d="M{x-w} {y} C{x-w-25} {y-h*.3} {x+bend-w} {y-h*.7} {x+bend} {y-h} C{x+bend+w*.25} {y-h*.65} {x+w} {y-h*.3} {x+w} {y}Z" fill="url(#bark)"/>')
 for k in range(14):
  q=R.uniform(-w*.8,w*.8);start=R.uniform(y-h*.95,y-h*.15)
  parts.append(f'<path d="M{f(x+q)} {f(start)} q{R.randint(-14,12)} 65 {R.randint(-8,13)} {R.randint(90,220)}" stroke="{R.choice(["#192f23","#8a9778","#354c37"])}" opacity=".35" stroke-width="{R.uniform(.7,2):.1f}" fill="none"/>')
 for direction in [-1,1]:
  sy=y-h*R.uniform(.55,.79);reach=R.uniform(180,350)*direction
  parts.append(f'<path d="M{x} {f(sy+65)} C{f(x+reach*.25)} {f(sy+10)} {f(x+reach*.65)} {f(sy-10)} {f(x+reach)} {f(sy-140)}" stroke="#314b34" stroke-width="18" fill="none"/>')
  parts.append(f'<path d="M{f(x+reach*.6)} {f(sy-30)} q{f(reach*.15)} -130 {f(reach*.12)} -230" stroke="#314b34" stroke-width="7" fill="none"/>')
  for j in range(16):
   lx=x+reach*R.uniform(.45,1.2);ly=sy-R.uniform(85,260);sz=R.uniform(.6,1.7)
   parts.append(f'<use href="#leaves" transform="translate({f(lx)} {f(ly)}) scale({f(sz)}) rotate({R.randint(-90,90)})" fill="{R.choice(["#34583a","#476747","#618253","#789064"])}" opacity=".8"/>')
 parts.append('</g>')
# Ground plants and dappled sunlight. Static artwork, no animation or embedded scripts.
for i in range(220):
 x=R.uniform(0,1800); y=R.uniform(1010,1240);s=R.uniform(3,13)
 parts.append(f'<path d="M{f(x)} {f(y)} q{f(-s)} {f(-s*3)} {f(-s*2)} {f(-s*2)} M{f(x)} {f(y)} q{f(s)} {f(-s*3)} {f(s*2)} {f(-s*2)}" stroke="{R.choice(["#4e7450","#87966b","#32543a"])}" stroke-width="1.5" fill="none" opacity=".7"/>')
for i in range(85):
 x=R.uniform(0,1800);y=R.uniform(860,1200)
 parts.append(f'<ellipse cx="{f(x)}" cy="{f(y)}" rx="{R.uniform(2,13):.1f}" ry="{R.uniform(1,3):.1f}" fill="#d7d7a1" opacity="{R.uniform(.05,.24):.2f}"/>')
parts.append('<rect width="1800" height="1200" fill="url(#light)"/><path d="M1220 0 L510 1170 L680 1200 L1370 0Z" fill="#fbf4cf" opacity=".045"/><rect width="1800" height="1200" fill="transparent" filter="url(#grain)"/></svg>')
Path('assets/forest.svg').write_text(''.join(parts)+'\n')
print('Original woodland artwork:',Path('assets/forest.svg').stat().st_size,'bytes')
