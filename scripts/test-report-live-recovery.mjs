import test from 'node:test';
import assert from 'node:assert/strict';
import { compileRecoveryManifest } from '../supabase/functions/report-sync/report-live-recovery.ts';

const evidence = () => ({ publication_id:'pub',run_id:'run',sheet_id:'sheet',slides_id:'deck',new_tabs:['new'],
 metadata:{sheets:[{properties:{title:'Data',sheetId:1,gridProperties:{rowCount:100,columnCount:20}},charts:[]}]},
 grid_sheets:[{properties:{title:'Data',sheetId:1},data:[{rowData:[{values:[
   {userEnteredValue:{formulaValue:'=1+1'}},{userEnteredValue:{stringValue:'=1+1'}},
   {userEnteredValue:{numberValue:0}},{userEnteredValue:{boolValue:false}},
 ]}]}]}],deck:{slides:[{objectId:'rlv2s_old_page',pageProperties:{},pageElements:[{
 objectId:'old_text',size:{width:{magnitude:100,unit:'PT'},height:{magnitude:50,unit:'PT'}},
 transform:{scaleX:1,scaleY:1,unit:'PT'},shape:{shapeType:'TEXT_BOX',shapeProperties:{
 shadow:{propertyState:'NOT_RENDERED'},autofit:{autofitType:'NONE',fontScale:1}},
 text:{textElements:[{endIndex:5,textRun:{content:'Test\n',style:{bold:true}}}]}}
 }]}]}});

test('recovery retains formula, literal formula text, zero and false as separate cell types', () => {
 const input=evidence(), plan=compileRecoveryManifest(input);
 const restored=plan.sheet_steps[0].requests[1].updateCells.rows[0].values;
 assert.deepEqual(restored,input.grid_sheets[0].data[0].rowData[0].values);
 assert.equal(plan.live_restore_verified,false);
 assert.deepEqual(plan.new_tabs,['new']);
});

test('recovery excludes readonly shape properties and avoids doubling the terminal newline', () => {
 const plan=compileRecoveryManifest(evidence()), requests=plan.slide_steps[0].requests;
 assert.equal(requests.find(r=>r.insertText).insertText.text,'Test');
 const properties=requests.find(r=>r.updateShapeProperties).updateShapeProperties.shapeProperties;
 assert.equal(properties.shadow,undefined);
 assert.deepEqual(properties.autofit,{autofitType:'NONE'});
});

test('unsupported elements, rendered shadows, autofit, notes and untyped backups fail before any replay', () => {
 for (const change of [
  e=>{delete e.grid_sheets;},
  e=>{e.deck.slides[0].pageElements[0].video={id:'video'};},
  e=>{e.deck.slides[0].pageElements[0].shape.shapeProperties.shadow.propertyState='RENDERED';},
  e=>{e.deck.slides[0].pageElements[0].shape.shapeProperties.autofit.autofitType='TEXT_AUTOFIT';},
  e=>{e.deck.slides[0].slideProperties={notesPage:{pageElements:[{shape:{text:{textElements:[{textRun:{content:'Notes'}}]}}}]}};},
 ]) { const input=evidence();change(input);assert.throws(()=>compileRecoveryManifest(input)); }
});

test('restoration identifies legacy generated slides without claiming user-owned slides', () => {
 const input=evidence();input.deck.slides.push({objectId:'v4sld_legacy',pageElements:[]},{objectId:'user_slide',pageElements:[]});
 const plan=compileRecoveryManifest(input);
 assert.deepEqual(plan.slide_steps.map(s=>s.slide_id),['rlv2s_old_page','v4sld_legacy']);
 assert.deepEqual(plan.original_slide_order,['rlv2s_old_page','v4sld_legacy','user_slide']);
});
