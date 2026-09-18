#!/usr/bin/env python3
"""Validate templates/index.json against the section schemas. Exits 1 on failure."""
import json, re, pathlib, sys
t = json.loads(pathlib.Path('templates/index.json').read_text())
bad = []
for name, sec in t['sections'].items():
    src = pathlib.Path(f"sections/{sec['type']}.liquid").read_text()
    sch = json.loads(re.search(r'\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}', src, re.S).group(1))
    S = {x['id']: x for x in sch['settings'] if isinstance(x, dict) and x.get('id')}
    for k, v in sec.get('settings', {}).items():
        d = S.get(k)
        if not d: bad.append(f"{name}.{k}: not in {sec['type']} schema"); continue
        if d['type'] == 'range':
            lo, hi, st = d['min'], d['max'], d.get('step', 1)
            if not isinstance(v,(int,float)) or v<lo or v>hi or round((v-lo)/st,6)%1!=0:
                bad.append(f"{name}.{k}={v} invalid for range {lo}-{hi}/{st}")
        elif d['type'] == 'select' and str(v) not in {o['value'] for o in d['options']}:
            bad.append(f"{name}.{k}={v!r} not an option")
    BT = {b['type']: {x['id'] for x in b.get('settings',[]) if isinstance(x,dict) and x.get('id')}
          for b in sch.get('blocks', [])}
    for bid, b in sec.get('blocks', {}).items():
        if b['type'] not in BT: bad.append(f"{name}.{bid}: block type {b['type']!r} unknown"); continue
        for k in b.get('settings', {}):
            if k not in BT[b['type']]: bad.append(f"{name}.{bid}.{k}: not in block schema")
# Shopify schema limits, checked here so they fail locally rather than on upload:
#   - a range may have at most 101 steps
#   - a range unit is at most 3 characters
#   - a range default must sit on the step grid
for f in sorted(pathlib.Path('sections').glob('*.liquid')):
    m = re.search(r'\{%-?\s*schema\s*-?%\}(.*?)\{%-?\s*endschema\s*-?%\}', f.read_text(), re.S)
    if not m: continue
    try: sc = json.loads(m.group(1))
    except Exception as e: bad.append(f"{f.name}: schema will not parse ({e})"); continue
    pools = [(sc.get('settings', []), '')] + [(b.get('settings', []), ' [block]') for b in sc.get('blocks', [])]
    for pool, where in pools:
        for x in pool:
            if not isinstance(x, dict) or x.get('type') != 'range': continue
            lo, hi, st = x['min'], x['max'], x.get('step', 1)
            if (hi-lo)/st > 100: bad.append(f"{f.name}:{x['id']}{where} range exceeds 101 steps")
            u = x.get('unit', '')
            if len(u) > 3: bad.append(f"{f.name}:{x['id']}{where} unit {u!r} over 3 chars")
            d = x.get('default')
            if d is not None and (d < lo or d > hi or round((d-lo)/st, 6) % 1 != 0):
                bad.append(f"{f.name}:{x['id']}{where} default {d} off the step grid")
# Inside a {% liquid %} tag every line is a bare tag: {% ... %} is a syntax
# error there, and Shopify rejects the whole file for it.
for f in list(pathlib.Path('sections').glob('*.liquid')) + \
         list(pathlib.Path('snippets').glob('*.liquid')) + [pathlib.Path('layout/theme.liquid')]:
    if not f.exists(): continue
    for m in re.finditer(r'\{%-?\s*liquid\b(.*?)-?%\}', f.read_text(), re.S):
        if '{%' in m.group(1):
            bad.append(f"{f.name}: '{{%' used inside a liquid tag (use # for comments)")

for b in bad: print("  " + b)
print("  ALL VALID" if not bad else f"  {len(bad)} PROBLEMS — not pushing")
sys.exit(1 if bad else 0)
