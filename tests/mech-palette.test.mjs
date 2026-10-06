import test from 'node:test';
import assert from 'node:assert/strict';
import { mechPalette, paletteMatrix } from '../src/utils/MechPalette.js';
test('mascot palettes follow arbitrary theme colors rather than two fixed styles',()=>{
  const colors=[[40,110,230],[240,45,50],[25,205,65],[190,80,240],[250,185,20],[20,180,200],[250,95,155]];
  const styles=colors.map(color=>mechPalette(color));
  assert.equal(new Set(styles.map(p=>p.filter)).size,colors.length);
  assert.equal(styles[1].source,'/mech/red.png');
  assert.equal(styles[2].mode,'green');assert.equal(styles[3].mode,'purple');assert.equal(styles[4].mode,'gold');
  assert.equal(mechPalette([255,255,255]).saturation,0);
  assert.equal(mechPalette([216,222,233],[59,66,82],'nord-frost').color,'#88c0d0');
});
test('tab transform retains neutral armor colors and finite RGB coefficients',()=>{
  for(const color of [[40,110,230],[240,45,50],[25,205,65],[190,80,240],[250,185,20],[255,255,255]]){
    const p=mechPalette(color,[240,240,240]), matrix=paletteMatrix(p);
    for(const row of matrix){assert.ok(row.every(Number.isFinite));assert.ok(Math.abs(row.reduce((a,b)=>a+b,0)-1)<.001);}
  }
});
