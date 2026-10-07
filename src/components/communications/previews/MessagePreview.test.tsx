import { expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import React from 'react';
import { MessagePreview } from './MessagePreview';
import type { MessageContent } from '../../../modules/sfmc-package/types';
it('renders untrusted message text as escaped React nodes with examples', () => {
  const c: MessageContent = { schema_version:1, channel:'WhatsApp', meta_template_name:'Test',
    body_text:'Olá ${1} *Maria* <script>alert(1)</script>', body_params:['%%FIRST_NAME%%'], footer:null,
    buttons:[{title:'<img onerror=alert(1)>',type:'reply'}], banner_url:'javascript:alert(1)', sms_from:null };
  const html=renderToStaticMarkup(<MessagePreview content={c}/>);
  expect(html).toContain('<strong>Maria</strong>');
  expect(html).toContain('Olá Maria');
  expect(html).toContain('&lt;script&gt;');
  expect(html).not.toContain('<script>');
  expect(html).not.toContain('src="javascript');
});

