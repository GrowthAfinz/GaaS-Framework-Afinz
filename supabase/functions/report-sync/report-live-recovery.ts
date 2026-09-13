/** Compile only the subset that can be replayed by the Google APIs.
 * Compilation is a precondition, not proof that a live restoration succeeded.
 * Never pass a raw presentations.get response to batchUpdate.
 */
type Obj = Record<string, any>;
export interface RecoveryEvidence {
  publication_id: string;
  run_id: string;
  sheet_id: string;
  slides_id: string;
  metadata: Obj;
  grid_sheets?: Obj[];
  deck: Obj;
  new_tabs: string[];
}
const owned = (id: string) => /^(rlv[12]s_|v4sld_)/.test(id);
const keysOnly = (value: Obj, keys: string[], context: string) => {
  const extra = Object.keys(value).filter(key => !keys.includes(key));
  if (extra.length) throw new Error(`${context}: campos sem recuperação suportada: ${extra.join(', ')}`);
};
const fail = (message: string): never => { throw new Error(message); };

function writableShapeProperties(shape: Obj): Obj {
  if (shape.placeholder) fail('Placeholder herdado não tem restauração certificada.');
  const p = shape.shapeProperties ?? {};
  keysOnly(p, ['shapeBackgroundFill','outline','shadow','link','contentAlignment','autofit'], 'Forma');
  if (p.shadow && p.shadow.propertyState !== 'NOT_RENDERED') fail('Sombra não reproduzível pela API.');
  if (p.autofit && ((p.autofit.autofitType && p.autofit.autofitType !== 'NONE') ||
    (p.autofit.fontScale != null && p.autofit.fontScale !== 1) || (p.autofit.lineSpacingReduction ?? 0) !== 0)) {
    fail('Autofit não reproduzível pela API.');
  }
  const { shadow: _shadow, autofit: _autofit, ...writable } = p;
  if (p.autofit) writable.autofit = { autofitType: 'NONE' };
  return writable;
}

function elementRequests(element: Obj, pageId: string): Obj[] {
  keysOnly(element, ['objectId','size','transform','title','description','shape','sheetsChart'], `Elemento ${element.objectId}`);
  const objectId = String(element.objectId);
  const elementProperties = { pageObjectId: pageId, size: element.size, transform: element.transform };
  const requests: Obj[] = [];
  if (element.shape) {
    const shape = element.shape;
    keysOnly(shape, ['shapeType','shapeProperties','text','placeholder'], `Forma ${objectId}`);
    const shapeProperties = writableShapeProperties(shape);
    requests.push({ createShape: { objectId, shapeType: shape.shapeType, elementProperties } });
    const parts: Obj[] = shape.text?.textElements ?? [];
    if (shape.text?.lists && Object.keys(shape.text.lists).length) fail('Lista com marcadores requer recuperação específica.');
    for (const part of parts) {
      keysOnly(part, ['startIndex','endIndex','textRun','paragraphMarker'], `Texto ${objectId}`);
      if (part.paragraphMarker?.bullet) fail('Marcadores não suportados na restauração.');
    }
    const text = parts.map(part => part.textRun?.content ?? '').join('');
    // A newly created shape already contains its terminal paragraph newline.
    const insert = text.endsWith('\n') ? text.slice(0, -1) : text;
    if (insert) requests.push({ insertText: { objectId, insertionIndex: 0, text: insert } });
    for (const part of parts) {
      const textRange = { type: 'FIXED_RANGE', startIndex: part.startIndex ?? 0, endIndex: part.endIndex };
      if (part.endIndex == null || part.endIndex <= (part.startIndex ?? 0)) continue;
      for (const [key, request] of [['textRun','updateTextStyle'], ['paragraphMarker','updateParagraphStyle']]) {
        const style = part[key]?.style;
        if (style && Object.keys(style).length) requests.push({ [request]: {
          objectId, textRange, style, fields: Object.keys(style).join(','),
        } });
      }
    }
    if (Object.keys(shapeProperties).length) requests.push({ updateShapeProperties: {
      objectId, shapeProperties, fields: Object.keys(shapeProperties).join(','),
    } });
  } else if (element.sheetsChart) {
    const chart = element.sheetsChart;
    const properties = chart.sheetsChartProperties?.chartImageProperties ?? {};
    keysOnly(properties, ['shadow','outline'], `Gráfico ${objectId}`);
    if ((properties.shadow && properties.shadow.propertyState !== 'NOT_RENDERED') ||
      (properties.outline && properties.outline.propertyState !== 'NOT_RENDERED')) fail('Estilo de gráfico não reproduzível pela API.');
    requests.push({ createSheetsChart: { objectId, spreadsheetId: chart.spreadsheetId,
      chartId: chart.chartId, linkingMode: 'LINKED', elementProperties } });
  } else fail(`Tipo de elemento não suportado: ${objectId}`);
  if (element.title || element.description) requests.push({ updatePageElementAltText: {
    objectId, title: element.title ?? '', description: element.description ?? '',
  } });
  return requests;
}

export function compileRecoveryManifest(evidence: RecoveryEvidence) {
  if (!Array.isArray(evidence.grid_sheets)) throw new Error('Backup sem tipos de célula; restauração recusada.');
  const grids = new Map(evidence.grid_sheets.map(sheet => [String(sheet.properties?.title), sheet]));
  const sheetSteps = evidence.grid_sheets.map(sheet => {
    const title = String(sheet.properties?.title);
    const original = evidence.metadata.sheets?.find((item: Obj) => item.properties?.title === title);
    if (!original || original.properties.sheetId !== sheet.properties.sheetId) fail('Identidade de aba divergente.');
    const sheetId = original.properties.sheetId;
    const requests: Obj[] = [{ updateCells: { range: { sheetId }, fields: 'userEnteredValue,userEnteredFormat,textFormatRuns,note,dataValidation' } }];
    for (const grid of sheet.data ?? []) {
      if (!grid.rowData?.length) continue;
      requests.push({ updateCells: { start: { sheetId, rowIndex: grid.startRow ?? 0, columnIndex: grid.startColumn ?? 0 },
        rows: grid.rowData, fields: 'userEnteredValue,userEnteredFormat,textFormatRuns,note,dataValidation' } });
    }
    return { title, sheet_id: sheetId, original_grid: original.properties.gridProperties, requests };
  });
  if (grids.size !== evidence.grid_sheets.length) fail('Abas duplicadas no backup.');
  const allSlides: Obj[] = evidence.deck.slides ?? [];
  const slideSteps = allSlides.flatMap((slide, index) => {
    const objectId = String(slide.objectId);
    if (!owned(objectId)) return [];
    const notes = slide.slideProperties?.notesPage?.pageElements ?? [];
    if (notes.some((element: Obj) => (element.shape?.text?.textElements ?? []).some((part: Obj) => part.textRun?.content?.trim()))) {
      fail('Notas de apresentação preenchidas requerem recuperação específica.');
    }
    const properties = slide.pageProperties ?? {};
    keysOnly(properties, ['pageBackgroundFill'], `Página ${objectId}`);
    const requests: Obj[] = [{ createSlide: { objectId, insertionIndex: index,
      slideLayoutReference: slide.slideProperties?.layoutObjectId
        ? { layoutId: slide.slideProperties.layoutObjectId } : { predefinedLayout: 'BLANK' } } }];
    if (Object.keys(properties).length) requests.push({ updatePageProperties: { objectId,
      pageProperties: properties, fields: Object.keys(properties).join(',') } });
    if (slide.slideProperties?.isSkipped != null) requests.push({ updateSlideProperties: {
      objectId, slideProperties: { isSkipped: slide.slideProperties.isSkipped }, fields: 'isSkipped',
    } });
    for (const element of slide.pageElements ?? []) requests.push(...elementRequests(element, objectId));
    return [{ slide_id: objectId, original_index: index, requests }];
  });
  return { schema_version: 2, publication_id: evidence.publication_id, run_id: evidence.run_id,
    sheet_id: evidence.sheet_id, slides_id: evidence.slides_id,
    sheet_steps: sheetSteps, slide_steps: slideSteps, original_slide_order: allSlides.map(slide => slide.objectId),
    charts: (evidence.metadata.sheets ?? []).flatMap((sheet: Obj) => sheet.charts ?? []),
    new_tabs: evidence.new_tabs, live_restore_verified: false };
}
