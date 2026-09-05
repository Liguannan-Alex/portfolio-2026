import test from 'node:test';
import assert from 'node:assert/strict';
import { content } from '../lib/world/content.ts';
import { careerEntries, findNearbyCareer, normalizeCareerIndex, isCareerGround } from '../lib/world/career.ts';

test('each public career record has one independent exhibit without losing its date range',()=>{
 assert.equal(careerEntries.length,content.career.length);
 assert.equal(new Set(careerEntries.map(e=>e.id)).size,content.career.length);
 careerEntries.forEach((e,i)=>{assert.equal(e.year,content.career[i].year);assert.equal(e.description,content.career[i].description);});
 assert.equal(careerEntries[6].kind,'broadcast');assert.equal(careerEntries[8].kind,'cards');
});
test('summaries only activate inside the career corridor, including index zero',()=>{
 assert.equal(findNearbyCareer({x:0,z:7}),null);assert.equal(findNearbyCareer({x:16,z:25}),null);
 careerEntries.forEach(e=>assert.equal(findNearbyCareer({x:e.x,z:-14.5}),e.index));
 assert.equal(findNearbyCareer({x:3,z:-14.5}),0);
});
test('near-boundary motion does not flicker until the next year is clearly closer',()=>{
 const x=(careerEntries[0].x+careerEntries[1].x)/2;
 assert.equal(findNearbyCareer({x:x+.1,z:-14.5},0),0);
 assert.equal(findNearbyCareer({x:x+.8,z:-14.5},0),1);
 assert.equal(findNearbyCareer({x:0,z:7},0),null);
});
test('continuous reading wraps and exhibits leave a clear approach lane',()=>{
 assert.equal(normalizeCareerIndex(-1),careerEntries.length-1);assert.equal(normalizeCareerIndex(careerEntries.length),0);
 assert.equal(isCareerGround(16,-17),true);assert.equal(isCareerGround(16,7),false);
 careerEntries.forEach(e=>assert.ok(Math.abs(e.z-(-14.5))>2));
});
