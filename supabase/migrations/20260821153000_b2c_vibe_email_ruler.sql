alter table public.dynamic_email_briefings
  add column if not exists template_slot_id text
  references public.dynamic_email_template_slots(id) on delete set null;

create index if not exists dynamic_email_briefings_template_slot_idx
  on public.dynamic_email_briefings (template_slot_id);

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-01-control', 'B2C Classic + Vibe · E-mail 1 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
body, .tb_properties{font-family: Arial !important; font-size: 16px !important; color: #000000 !important; line-height: 1.5 !important; padding: 0px !important; }.buttonstyles{font-family: Tahoma, Geneva, sans-serif !important; font-size: 16px !important; color: #FFFFFF !important; padding: 10px !important; }h1{font-family: Arial !important; font-size: 22px !important; color: #202020 !important; line-height: 1 !important; }h2{font-family: Arial !important; font-size: 20px !important; color: #202020 !important; line-height: 1 !important; }h3{font-family: Arial !important; font-size: 18px !important; color: #202020 !important; line-height: 1 !important; }a:not(.buttonstyles){line-height: 1 !important; }.mobile-hidden{display: none !important; }.responsive-td {width: 100% !important; display: block !important; padding: 0 !important;}
/* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="https://"><img data-assetid="174009" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1cff3901-45e3-4245-a0e5-59c8bf28c638.png" alt="" height="250" width="600" style="display: block; padding: 0px; text-align: center; height: 250px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 30px 5px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#00c6cc;"><span style="font-size:22px;"><b>Ol&aacute;, %%FIRST_NAME%%</b></span></span><br>
 <br>
 <span style="font-size:19px;"><b>Pe&ccedil;a seu </b><span style="color:#00c6cc;"><b>cart&atilde;o Afinz Visa </b></span><b>e ganhe cr&eacute;ditos&nbsp;para aproveitar super ofertas e descontos no app Vibe.</b></span></span></div><div style="text-align: center;">
 <br>
 <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b><span style="background-color:#d3ff00;">E mais:</span><span style="color:#00c6cc;"><b> </b></span>usando seus Cr&eacute;ditos Vibes, voc&ecirc; concorre a<br>
 R$100 mil todo m&ecirc;s!</b></span></span><br>
 &nbsp;</div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #00C6CC;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D01" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 9px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 9px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>N&atilde;o perca os&nbsp;<span style="color:#00c6cc;">benef&iacute;cios e descontos</span></b></span></span><span style="font-family: Tahoma, Geneva, sans-serif;"><b style=""><span style="color: rgb(0, 198, 204);"><span style="font-size: 20px;">&nbsp;</span></span></b></span><b><span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;">nas melhores marcas, direto no App Vibe!</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="175774" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/814bdf22-1f7d-4680-a707-682e9d61b9e8.png" alt="" width="500" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <br>
 <span style="font-size:19px;"><span style="color:#000000;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>N&atilde;o perca tempo! Pe&ccedil;a j&aacute; o seu </b></span></span><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>cart&atilde;o Afinz Visa:</b></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 8px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; background-color: #00C6CC;"><a target="_blank" class="buttonstyles" style=" font-size: 18px; font-family: Tahoma, Geneva, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 0px; padding: 10px 15px; border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D01" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="line-height:115%"><span style="font-family:Aptos,sans-serif">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#555555;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-02-control', 'B2C Classic + Vibe · E-mail 2 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
        body { padding: 0px !important; font-size: 16px !important; line-height: 150% !important;}
        h1 { font-size: 22px !important; line-height: normal !important;}
        h2 { font-size: 20px !important; line-height: normal !important;}
        h3 { font-size: 18px !important; line-height: normal !important;}
        .buttonstyles {
          font-family:arial,helvetica,sans-serif !important;
          font-size: 16px !important;
          color: #FFFFFF !important;
          padding: 10px !important;
        }
        /* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="http://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="http://"><img data-assetid="174007" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/0e8a7666-182b-41ef-a7c6-440f6855a478.png" alt="Está na hora de desbloquear" height="250" width="600" style="display: block; padding: 0px; text-align: center; height: 250px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 41px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#00c6cc;"><span style="font-size:22px;"><b>Ol&aacute;, %%FIRST_NAME%%</b></span></span><br>
 <br>
 <span style="font-size:20px;">Garanta seu <b>cart&atilde;o Afinz Visa</b> e aproveite descontos incr&iacute;veis nas melhores marcas,&nbsp;no <b>app Vibe</b>!</span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px 30px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="175791" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3736d8c4-a8ce-47fb-944c-911039706324.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 17px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D01" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 2px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#ffffff;"><span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Pe&ccedil;a o seu agora mesmo e j&aacute; comece a utilizar o <b>cart&atilde;o Afinz virtual</b>!<br>
 <br>
 <b>Ganhe R$100 em Cr&eacute;ditos Vibe fazendo a primeira compra com a Afinz.</b></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 0px 4px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 17px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D01" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 2px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; border-top: 0px; border-right: 0px; border-bottom: 1px solid #00C6CC; border-left: 0px; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 40px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="43" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 43px; width: 80px; border: 0px;" width="80"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#ffffff;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-03-control', 'B2C Classic + Vibe · E-mail 3 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
body, .tb_properties{font-family: Arial !important; font-size: 16px !important; color: #000000 !important; line-height: 1.5 !important; padding: 0px !important; }.buttonstyles{font-family: Tahoma, Geneva, sans-serif !important; font-size: 16px !important; color: #FFFFFF !important; padding: 10px !important; }h1{font-family: Arial !important; font-size: 22px !important; color: #202020 !important; line-height: 1 !important; }h2{font-family: Arial !important; font-size: 20px !important; color: #202020 !important; line-height: 1 !important; }h3{font-family: Arial !important; font-size: 18px !important; color: #202020 !important; line-height: 1 !important; }a:not(.buttonstyles){line-height: 1 !important; }.mobile-hidden{display: none !important; }.responsive-td {width: 100% !important; display: block !important; padding: 0 !important;}
/* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="https://"><img data-assetid="174009" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1cff3901-45e3-4245-a0e5-59c8bf28c638.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 13px 13px 5px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D02" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 8px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 18px 41px 5px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#00c6cc;"><span style="font-size:22px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Ol&aacute;, %%PRI_NOME%%</b></span></span></span><br>
 &nbsp;<div style="text-align: justify;">
  <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="unicode-bidi:embed"><span style="word-break:normal"><span style="color:black">Com o cart&atilde;o Afinz Visa, voc&ecirc; tem </span><span style="color:#00c6cc;"><span style="font-weight:bold">cr&eacute;dito na hora</span></span></span></span><span style="unicode-bidi:embed"><span style="word-break:normal"><span style="color:black"><span style="font-weight:bold">&nbsp;</span>e j&aacute; pode usar seu </span><span style="color:#00c6cc;"><span style="font-weight:bold">cart&atilde;o virtual</span></span><span style="color:black"> para compras online. E voc&ecirc; ainda ganha Cr&eacute;ditos para aproveitar descontos incr&iacute;veis direto no </span><span style="color:#00c6cc;"><span style="font-weight:bold">app Vibe</span></span><span style="color:black">.</span></span></span></span></span><br>
  &nbsp;</div><ul>
  <li style="text-align: justify;">
   <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:107%">Ganhe at&eacute; <b>R$100 </b>em Cr&eacute;ditos no <b>App Vibe</b>, fazendo a primeira compra com seu cart&atilde;o Afinz.</span></span></span></li><li style="text-align: justify;">
   <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:107%">Ganhe <b>R$30</b>&nbsp;em Cr&eacute;ditos Vibe todo m&ecirc;s pagando sua fatura em dia.</span></span></span></li><li style="text-align: justify;">
   <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:107%">Concorra a <b>R$100mil</b> todo m&ecirc;s utilizando seus cr&eacute;ditos Vibe.</span></span></span></li></ul></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #00C6CC;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D02" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 9px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:20px;"><span style="unicode-bidi:embed"><span style="word-break:normal"><span style="font-weight:bold">Aproveite seus Cr&eacute;ditos Vibe em cinema, delivery, viagens e muito mais!</span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="175809" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <br>
 <span style="font-size:19px;"><span style="color:#000000;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>N&atilde;o perca tempo! Pe&ccedil;a j&aacute; o seu </b></span></span><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>cart&atilde;o Afinz Visa:</b></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 8px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; background-color: #00C6CC;"><a target="_blank" class="buttonstyles" style=" font-size: 18px; font-family: Tahoma, Geneva, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 0px; padding: 10px 15px; border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s1&af_sub3=b2c_email_vibe_bsp_S1D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#555555;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-04-control', 'B2C Classic + Vibe · E-mail 4 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
body, .tb_properties{font-family: Arial !important; font-size: 16px !important; color: #000000 !important; line-height: 1.5 !important; padding: 0px !important; }.buttonstyles{font-family: Tahoma, Geneva, sans-serif !important; font-size: 16px !important; color: #FFFFFF !important; padding: 10px !important; }h1{font-family: Arial !important; font-size: 22px !important; color: #202020 !important; line-height: 1 !important; }h2{font-family: Arial !important; font-size: 20px !important; color: #202020 !important; line-height: 1 !important; }h3{font-family: Arial !important; font-size: 18px !important; color: #202020 !important; line-height: 1 !important; }a:not(.buttonstyles){line-height: 1 !important; }.mobile-hidden{display: none !important; }.responsive-td {width: 100% !important; display: block !important; padding: 0 !important;}
/* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="https://"><img data-assetid="174045" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/413ba064-4762-41b5-80fe-eae9b0475fdb.png" alt="" height="250" width="600" style="display: block; padding: 0px; text-align: center; height: 250px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 30px 2px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:22px;"><b>Ol&aacute;, %%PRI_NOME%%</b></span></span><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:22px;"><b>!</b></span><br>
 <br>
 <span style="font-size:19px;">Com o&nbsp;<b>cart&atilde;o Afinz Visa</b> voc&ecirc; tem&nbsp;<b>limite liberado na hora</b> e <b><span style="background-color:#d3ff00;">benef&iacute;cios que te ajudam a economizar:</span></b></span></span></div><ul>
 <li>
  <span style="font-size:19px;"><b>R$100 </b>em cr&eacute;ditos Vibe fazendo a primeira compra</span></li><li>
  <span style="font-size:19px;"><b>R$30</b> em cr&eacute;ditos Vibe todo m&ecirc;s pagando a fatura em dia</span></li><li>
  <span style="font-size:19px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>At&eacute; 70% de desconto</b> em medicamentos, consultas e exames m&eacute;dicos</span></span></li></ul></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; border: 0px; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 4px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; background-color: #000000;"><a target="_blank" class="buttonstyles" style=" font-size: 18px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 0px; padding: 13px; border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Sujeito &agrave; an&aacute;lise de cr&eacute;dito</b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:20px;"><b>Aproveite os melhores descontos nas melhores marcas!</b></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="143346" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif" alt="" width="720" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" class="stylingblock-content-wrapper" style="min-width: 100%; "><tr><td class="stylingblock-content-margin-cell" style="padding: 20px 0px 0px; "><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 18px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:20px;"><b>N&atilde;o perca tempo!</b><br>
 <br>
 Pe&ccedil;a o seu agora mesmo e j&aacute; comece a utilizar seu&nbsp;<b>cart&atilde;o virtual:</b></span></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; border: 0px; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 30px 8px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px; background-color: #00C6CC;"><a target="_blank" class="buttonstyles" style=" font-size: 18px; font-family: Tahoma, Geneva, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 0px; padding: 13px; border-radius: 5px; -moz-border-radius: 5px; -webkit-border-radius: 5px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s2&af_sub3=b2c_email_vibe_bsp_S2D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 18px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Sujeito &agrave; an&aacute;lise de cr&eacute;dito</b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em Cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais Cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span>.</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; border-top: 0px; border-right: 0px; border-bottom: 1px solid #00C6CC; border-left: 0px; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="43" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 43px; width: 80px; border: 0px;" width="80"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#555555;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-05-control', 'B2C Classic + Vibe · E-mail 5 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
        body { padding: 0px !important; font-size: 16px !important; line-height: 150% !important;}
        h1 { font-size: 22px !important; line-height: normal !important;}
        h2 { font-size: 20px !important; line-height: normal !important;}
        h3 { font-size: 18px !important; line-height: normal !important;}
        .buttonstyles {
          font-family:arial,helvetica,sans-serif !important;
          font-size: 16px !important;
          color: #FFFFFF !important;
          padding: 10px !important;
        }
        /* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="http://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="http://"><img data-assetid="175821" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1e08e54a-716a-4a59-96a0-3b652119ed13.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 13px 13px 3px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #00C6CC;"><a style=" font-size: 17px; font-family: Arial, helvetica, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?chttps://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D01" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center; line-height: 150%;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:20px;"><b>Ol&aacute;, %%FIRST_NAME%%</b></span></span></div><div style="text-align: center; line-height: 150%;">
 <br>
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:20px;"><b><span style="line-height:107%">Com o <span style="color:#00c6cc;">cart&atilde;o Afinz</span> voc&ecirc; ganha Cr&eacute;ditos Vibe e <span style="background-color:#d3ff00;">economiza todo m&ecirc;s</span>!</span></b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td valign="top" style="width: 33%; padding-right: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174004" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" style="width: 33%; padding-left: 2px; padding-right: 2px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174003" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" style="width: 33%; padding-left: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174005" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 40px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><b><span style="font-size:20px;">Pe&ccedil;a o seu agora mesmo e j&aacute; comece a utilizar o <span style="background-color:#d3ff00;">cart&atilde;o virtual</span>!</span></b></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid #5D5D5D; padding: 13px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D01" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; border-top: 0px; border-right: 0px; border-bottom: 1px solid #00C6CC; border-left: 0px; " class="stylingblock-content-wrapper"><tr><td style="padding: 25px 40px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#ffffff;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-06-control', 'B2C Classic + Vibe · E-mail 6 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
        body { padding: 0px !important; font-size: 16px !important; line-height: 150% !important;}
        h1 { font-size: 22px !important; line-height: normal !important;}
        h2 { font-size: 20px !important; line-height: normal !important;}
        h3 { font-size: 18px !important; line-height: normal !important;}
        .buttonstyles {
          font-family:arial,helvetica,sans-serif !important;
          font-size: 16px !important;
          color: #FFFFFF !important;
          padding: 10px !important;
        }
        /* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="http://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="http://"><img data-assetid="174010" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ecc98b44-e31d-47cd-9ec8-a2bf6285ff7c.png" alt="Está na hora de desbloquear" width="600" style="display: block; padding: 0px; text-align: center; height: 250px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:22px;"><b>Ol&aacute;, %%FIRST_NAME%%</b></span></span><br>
 <br>
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:19px;"><b>Pe&ccedil;a j&aacute; o seu cart&atilde;o Afinz Visa e </b></span></span><br>
 <span style="font-size:19px;"><b><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="background-color:#d3ff00;">ganhe R$100</span> em Cr&eacute;ditos Vibe fazendo a primeira compra!</span></b></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:21px;"><span style="color:#ffffff;"><span style="font-family:Tahoma,Geneva,sans-serif;">Garanta o seu agora mesmo e j&aacute; comece a utilizar o&nbsp;<b>cart&atilde;o virtual</b>!</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 0px 2px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 17px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Sujeito &agrave; an&aacute;lise de cr&eacute;dito</b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:20px;">Aproveite descontos incr&iacute;veis nas melhores marcas,&nbsp;no <b>app Vibe e concorra a R$100 MIL todo m&ecirc;s!</b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="143346" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 0px 2px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 17px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s3&af_sub3=b2c_email_vibe_bsp_S3D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Sujeito &agrave; an&aacute;lise de cr&eacute;dito</b></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; border-top: 0px; border-right: 0px; border-bottom: 1px solid #00C6CC; border-left: 0px; " class="stylingblock-content-wrapper"><tr><td style="padding: 25px 40px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#ffffff;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-07-control', 'B2C Classic + Vibe · E-mail 7 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
body, .tb_properties{font-family: Tahoma, Geneva, sans-serif !important; font-size: 16px !important; color: #000000 !important; line-height: 1.5 !important; padding: 0px !important; }.buttonstyles{font-family: Tahoma, Geneva, sans-serif !important; font-size: 16px !important; color: #FFFFFF !important; padding: 10px !important; }h1{font-family: Tahoma, Geneva, sans-serif !important; font-size: 22px !important; color: #202020 !important; line-height: 1 !important; }h2{font-family: Tahoma, Geneva, sans-serif !important; font-size: 20px !important; color: #202020 !important; line-height: 1 !important; }h3{font-family: Tahoma, Geneva, sans-serif !important; font-size: 18px !important; color: #202020 !important; line-height: 1 !important; }a:not(.buttonstyles){line-height: 1 !important; }.mobile-hidden{display: none !important; }.responsive-td {width: 100% !important; display: block !important; padding: 0 !important;}
/* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; width: 600px; height: 80px; padding: 6px 0px; text-align: center;"></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://onelink.to/jztxbk" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="175741" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2e28aab8-b586-4223-a19a-bd7a90138594.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 3px 20px 5px; " class="stylingblock-content-wrapper camarker-inner"><div style="line-height: 150%; text-align: center;">
 <span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b><span style="color:#ffffff;">Pe&ccedil;a seu cart&atilde;o Afinz e j&aacute; comece a<br>
 utilizar o virtual na hora!</span></b></span></span>&nbsp;</div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; border-top: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 0px; border-left: 12px solid transparent; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 0px transparent; padding: 8px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D01" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #00C6CC; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 40px 15px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 41px 0px; " class="stylingblock-content-wrapper camarker-inner"><div style="line-height: 150%; text-align: justify;">
 <span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#00c6cc;"><b>Ol&aacute;, %%PRI_NOME%%</b></span></span></span></div><p style="text-align: justify;">
 <font face="Tahoma, Geneva, sans-serif"><span style="font-size: 18px;">N&atilde;o perca essa chance de pedir seu <b>Cart&atilde;o Afinz Visa!</b> Ganhe <b>R$100 em Cr&eacute;ditos Vibe</b> para economizar nas melhores marcas.</span></font></p><p style="text-align: justify;">
 <span style="font-size:18px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#00c6cc;"><strong>Aproveite! Garanta seu cart&atilde;o Afinz Visa e comece a usar o seu cart&atilde;o virtual:</strong></span></span></span></p></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; border-top: 12px solid transparent; border-right: 12px solid transparent; border-bottom: 0px; border-left: 12px solid transparent; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 0px; padding: 8px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D01" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 40px 0px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="line-height: 150%;">
 <p paraeid="{268141ce-d5f3-4290-bfb5-c10efc1d122a}{234}" paraid="2045692188" style="text-align: center;">
  <span style="font-size:20px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>E mais: <span style="background-color:#d3ff00;">todo m&ecirc;s voc&ecirc; ganha Cr&eacute;ditos Vibe</span>&nbsp;para aproveitar super descontos em cinema, moda, casa, lazer, presentes e muito mais. Tudo no <span style="background-color:#d3ff00;">app Vibe!</span></b></span></span></p></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 10px 20px; " class="stylingblock-content-wrapper camarker-inner"><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td valign="top" class="responsive-td" style="width: 33%; padding-right: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174004" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" class="responsive-td" style="width: 33%; padding-left: 2px; padding-right: 2px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174003" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" class="responsive-td" style="width: 33%; padding-left: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174005" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; border-top: 0px; border-right: 14px solid transparent; border-bottom: 0px; border-left: 14px solid transparent; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a target="_blank" class="buttonstyles" style=" font-size: 16px; font-family: Tahoma, Geneva, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 0px; padding: 8px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D01" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 40px 0px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; border: 0px transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:24px;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; border: 0px; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 25px 40px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 10px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><br>
 <br>
 <span style="color:#ffffff;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span><br>
 <span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial">&nbsp;</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#ffffff;"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:16px"><span style="font-size:10px"><span style="font-family:Tahoma, Geneva, sans-serif">Enviado por&nbsp;<b>Banco Afinz S.A &ndash; Banco M&uacute;ltiplo &ndash; CNPJ: 04</b></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:16px"><span style="color:#999999"><span style="font-size:10px"><span style="font-family:Tahoma, Geneva, sans-serif"><b>.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A &ndash; CNPJ 60.114.865/0001-00</b></span></span></span><br>
 <span style="color:#999999"><span style="font-size:10px"><span style="font-family:Tahoma, Geneva, sans-serif">Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span></span>&nbsp;</div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_template_slots
  (id, name, source, is_principal, status, version, created_by, updated_by)
values ('b2c-classic-vibe-email-08-control', 'B2C Classic + Vibe · E-mail 8 · Controle', $gaas$<!DOCTYPE HTML PUBLIC "-//W3C//DTD HTML 4.01 Transitional//EN" "http://www.w3.org/TR/html4/loose.dtd">
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <style type="text/css">
      ReadMsgBody{ width: 100%;}
      .ExternalClass {width: 100%;}
      .ExternalClass, .ExternalClass p, .ExternalClass span, .ExternalClass font, .ExternalClass td, .ExternalClass div {line-height: 100%;}
      body {-webkit-text-size-adjust:100%; -ms-text-size-adjust:100%;margin:0 !important;}
      p { margin: 1em 0;}
      table td { border-collapse: collapse;}
      img {outline:0;}
      a img {border:none;}
      @-ms-viewport{ width: device-width;}
    </style>
    <style type="text/css">
      @media only screen and (max-width: 480px) {
        .container {width: 100% !important;}
        .footer { width:auto !important; margin-left:0; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        img { max-width:100% !important; height:auto !important; max-height:auto !important;}
        .header img{max-width:100% !important;height:auto !important; max-height:auto !important;}
        .photo img { width:100% !important; max-width:100% !important; height:auto !important;}
        .drop { display:block !important; width: 100% !important; float:left; clear:both;}
        .footerlogo { display:block !important; width: 100% !important; padding-top:15px; float:left; clear:both;}
        .nav4, .nav5, .nav6 { display: none !important; }
        .tableBlock {width:100% !important;}
        .responsive-td {width:100% !important; display:block !important; padding:0 !important; }
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
        /* MOBILE GLOBAL STYLES - DO NOT CHANGE */
        body { padding: 0px !important; font-size: 16px !important; line-height: 150% !important;}
        h1 { font-size: 22px !important; line-height: normal !important;}
        h2 { font-size: 20px !important; line-height: normal !important;}
        h3 { font-size: 18px !important; line-height: normal !important;}
        .buttonstyles {
          font-family:arial,helvetica,sans-serif !important;
          font-size: 16px !important;
          color: #FFFFFF !important;
          padding: 10px !important;
        }
        /* END OF MOBILE GLOBAL STYLES - DO NOT CHANGE */
      }
      @media only screen and (max-width: 640px) {
        .container { width:100% !important; }
        .mobile-hidden { display:none !important; }
        .logo { display:block !important; padding:0 !important; }
        .photo img { width:100% !important; height:auto !important;}
        .nav5, .nav6 { display: none !important;}
        .fluid, .fluid-centered {
          width: 100% !important;
          max-width: 100% !important;
          height: auto !important;
          margin-left: auto !important;
          margin-right: auto !important;
        }
        .fluid-centered {
          margin-left: auto !important;
          margin-right: auto !important;
        }
      }
    </style>
    <!--[if mso]>
      <style type="text/css">
          /* Begin Outlook Font Fix */
          body, table, td {
              font-family: Arial, Helvetica, sans-serif ;
              font-size:16px;
              color:#000000;
              line-height:1;
          }
          /* End Outlook Font Fix */
      </style>
    <![endif]-->
  </head>
  <body bgcolor="#ffffff" text="#000000" style="background-color: #ffffff; color: #000000; padding: 0px; -webkit-text-size-adjust:none; font-size: 16px; font-family:arial,helvetica,sans-serif;">
    <div style="font-size:0; line-height:0;"><custom name="opencounter" type="tracking"><custom name="usermatch" type="tracking" /></div>
    <table width="100%" border="0" cellpadding="0" cellspacing="0" align="center">
      <tr>
        <td align="center" valign="top">
          <custom type="header"/>
        </td>
      </tr>
      <tr>
        <td align="center">
          <table cellspacing="0" cellpadding="0" border="0" width="600" class="container" align="center">
            <tr>
              <td>
                <table class="tb_properties border_style" style="background-color:#FFFFFF;" cellspacing="0" cellpadding="0" bgcolor="#ffffff" width="100%">
                  <tr>
                    <td align="center" valign="top">
                      <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                        <tr>
                          <!-- added padding here -->
                          <td class="content_padding" style="">
                            <!-- end of comment -->
                            <table border="0" cellpadding="0" cellspacing="0" width="100%">
                              <tr> <!-- top slot -->
                                <td align="center" class="header" valign="top">
                                  <table align="left" border="0" cellpadding="0" cellspacing="0" width="100%">
                                    <tbody>
                                        <tr>
                                          <td align="left" valign="top">
                                            <table cellspacing="0" cellpadding="0" style="width:100%">
                                              <tbody>
                                              <tr>
                                                <td class="responsive-td" valign="top" style="width: 100%;">
                                                  <table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="https://afinz.com.br/" title="" alias="" conversion="false" data-linkto="https://"><img data-assetid="13806" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png" alt="" height="80" width="600" style="display: block; padding: 0px; text-align: center; height: 80px; width: 600px; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><a href="http://onelink.to/jztxbk" title="Banner_Topo" alias="Banner_Topo" conversion="false" data-linkto="http://"><img data-assetid="175748" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/bcba23af-49bb-4435-a8e7-e66b8358c037.png" alt="" width="600" style="display: block; padding: 0px; text-align: center; height: auto; width: 100%; border: 0px transparent;"></a></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 13px 13px 5px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#00C6CC" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #00C6CC;"><a style=" font-size: 17px; font-family: Arial, helvetica, sans-serif; color: #000000; text-align: center; text-decoration: none; display: block; background-color: #00C6CC; border: 1px solid transparent; padding: 10px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D02" title="" alias="" conversion="false" data-linkto="https://">Quero meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:21px;"><span style="color:#00c6cc;"><b>Ol&aacute;, %%PRI_NOME%%</b></span></span><br>
 <br>
 <span style="font-size:20px;"><span style="line-height:107%">Com o <b><span style="color:#00c6cc;">Cart&atilde;o Afinz</span></b> voc&ecirc; ganha <b>Cr&eacute;ditos Vibe</b> e economiza todo m&ecirc;s nas melhores marcas!</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td valign="top" style="width: 33%; padding-right: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174004" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" style="width: 33%; padding-left: 2px; padding-right: 2px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174003" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" style="width: 33%; padding-left: 4px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="174005" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png" alt="" height="250" width="150" style="display: block; padding: 0px; text-align: center; height: 250px; width: 150px; border: 0px transparent;"></td></tr></table></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 41px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <br>
 <span style="font-family:Tahoma,Geneva,sans-serif;"><span style="font-size:20px;">Aproveite ofertas e descontos incr&iacute;veis direto no <b><span style="color:#00c6cc;">App Vibe:</span> <span style="background-color:#d3ff00;">mercado, cinema, moda, presentes, lazer</span>&nbsp;</b>e ainda um marketplace com tudo o que voc&ecirc; precisa!</span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #EB6B0A; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 0px; " class="stylingblock-content-wrapper camarker-inner"><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td><table cellspacing="0" cellpadding="0" role="presentation" style="width: 100%;"><tr><td valign="top" style="width: 50%; padding-right: 5px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding-bottom: 10px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><img data-assetid="107117" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dfcce93f-cd10-4245-aea6-2bd11ffc66e3.png" alt="" height="260" width="300" style="display: block; padding: 0px; text-align: center; height: 260px; width: 300px; border: 0px transparent;"></td></tr></table></td></tr></table></td><td valign="top" style="width: 50%; padding-left: 5px;"><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 41px 10px 0px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
</div><div>
 <span style="font-size:16px;"><span style="color:#ffffff;"><span style="font-family:Tahoma,Geneva,sans-serif">No <b>Vibe Shop</b>&nbsp;seus Cr&eacute;ditos Vibe valem muito mais e voc&ecirc; pode us&aacute;-los para comprar produtos com desconto direto no <b>marketplace do app Vibe</b>. Aproveite!</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 0px 5px; " class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="left"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: left; text-decoration: none; display: block; background-color: #000000; border: 0px transparent; padding: 13px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 1px 41px 10px 0px; " class="stylingblock-content-wrapper camarker-inner"><div>
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 40px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <br>
 <span style="font-family:Tahoma,Geneva,sans-serif;"><b><span style="font-size:20px;">Pe&ccedil;a o seu agora mesmo e j&aacute; comece a utilizar o <span style="background-color:#d3ff00;">cart&atilde;o virtual!</span></span></b></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="min-width: 100%; " class="stylingblock-content-wrapper"><tr><td class="stylingblock-content-wrapper camarker-inner"><table width="100%" border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td align="center"><table border="0" cellspacing="0" cellpadding="0" role="presentation"><tr><td class="innertd buttonblock" bgcolor="#000000" style=" border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px; background-color: #000000;"><a style=" font-size: 16px; font-family: Arial, helvetica, sans-serif; color: #FFFFFF; text-align: center; text-decoration: none; display: block; background-color: #000000; border: 1px solid #5D5D5D; padding: 13px; border-radius: 3px; -moz-border-radius: 3px; -webkit-border-radius: 3px;" target="_blank" class="buttonstyles" href="https://cartao-afinz.onelink.me/9ODN/mtuc2zhn?c=b2c_topo_de_funil_vibe&af_sub1=base_proprietaria&af_sub2=s4&af_sub3=b2c_email_vibe_bsp_S4D02" title="" alias="" conversion="false" data-linkto="https://">Pedir meu cart&atilde;o</a></td></tr></table></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 5px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <b><span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Sujeito &agrave; an&aacute;lise de cr&eacute;dito</span></span></b></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: transparent; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 30px 30px 20px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: justify;">
 <span style="color:#999999;"><span style="font-size:9px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="line-height:115%">*Ap&oacute;s realizar a primeira compra com o seu cart&atilde;o com anuidade ativa, independentemente do valor, voc&ecirc; receber&aacute; em at&eacute; 5 dias &uacute;teis R$ 100 em cr&eacute;ditos no App Vibe, com validade de at&eacute; 6 meses. Para visualizar o seu saldo, baixe o App Vibe. A primeira compra dever&aacute; ser realizada em at&eacute; 30 dias. / A cada fatura paga, com anuidade ativa, voc&ecirc; receber&aacute; mais cr&eacute;ditos no App Vibe, conforme condi&ccedil;&otilde;es da loja parceira, tamb&eacute;m com validade de at&eacute; 6 meses. Os benef&iacute;cios acumulados no app da Vibe podem ser trocados por descontos e vantagens das marcas parceiras. Eles s&atilde;o din&acirc;micos e podem ser alterados ou apresentados conforme as regras de elegibilidade de cada fornecedor parceiro. / Consulte o regulamento completo no app da Vibe. Promo&ccedil;&atilde;o v&aacute;lida por tempo limitado, podendo ser alterada ou encerrada a qualquer momento, sem aviso pr&eacute;vio. / Sujeito a disponibilidade.</span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; border-top: 0px; border-right: 0px; border-bottom: 1px solid #00C6CC; border-left: 0px; " class="stylingblock-content-wrapper"><tr><td style="padding: 25px 41px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="font-size:24px;"><span style="color:#00c6cc;"><span style="font-family:Tahoma,Geneva,sans-serif;"><strong>Cart&atilde;o Afinz, vantagens de ponta a ponta!</strong></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #FFFFFF; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 20px 30px 15px; " class="stylingblock-content-wrapper camarker-inner"><table align="center" border="0" cellpadding="10" cellspacing="0" style="width:100%;">
 
  <tr>
   <td>
    <span style="font-size:11px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#000000;"><b>Curta a Afinz</b> nas redes sociais e fique por dentro de tudo que acontece por aqui</span></span></span></td><td>
    <div style="text-align: center;">
     <table align="center" border="0" cellpadding="5" cellspacing="5" style="width:100%;">
      
       <tr>
        <td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.instagram.com/afinzoficial/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10726" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://web.facebook.com/Afinz" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10724" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://www.tiktok.com/@afinzoficial" rel="noopener" target="_blank" title=""><img alt="" data-assetid="83543" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png" style="height: 30px; width: 30px; padding: 0px; text-align: center;" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/blog/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10725" height="30" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png" width="30"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" rel="noopener" target="_blank" title=""><img alt="" data-assetid="10727" height="31" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png" width="31"></a></td><td>
         <a alias="" conversion="false" data-linkto="https://" href="https://afinz.com.br/" title=""><img alt="" data-assetid="34794" height="48" src="https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png" style="padding: 0px; text-align: center; height: 48px; width: 90px; border: 0px;" width="90"></a></td></tr></table></div></td></tr></table></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Por favor, n&atilde;o responda esse e-mail.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div><div style="text-align:center">
 <span style="font-size:16px"><span style="color:#000000"><span style="font-family:arial, helvetica, sans-serif"><span style="font-style:normal"><span style="font-variant-ligatures:normal"><span style="font-weight:400"><span style="white-space:normal"><span style="background-color:#000000"><span style="text-decoration-thickness:initial"><span style="text-decoration-style:initial"><span style="text-decoration-color:initial"><span style="line-height:24px"><span style="font-size:12px"><span style="font-family:Tahoma, Geneva, sans-serif"><font color="#ffffff">Essa &eacute; uma mensagem autom&aacute;tica e n&atilde;o conseguimos te atender por aqui.</font></span></span></span></span></span></span></span></span></span></span></span></span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 10px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align:center">
 <span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;"><span style="color:#ffffff;"><b>Canal de atendimento:</b><br>
 <br>
 <b>Ouvidoria</b><br>
 0800 772 0602<br>
 &nbsp;</span></span></span></div></td></tr></table><table cellpadding="0" cellspacing="0" width="100%" role="presentation" style="background-color: #000000; min-width: 100%; " class="stylingblock-content-wrapper"><tr><td style="padding: 15px 30px; " class="stylingblock-content-wrapper camarker-inner"><div style="text-align: center;">
 <span style="color:#ffffff;"><span style="font-size:12px;"><span style="font-family:Tahoma,Geneva,sans-serif;">Enviado por <b>Banco Afinz S.A - Banco M&uacute;ltiplo - CNPJ: 04.814.563/0001-74 | Afinz Institui&ccedil;&atilde;o de Pagamento S.A - CNPJ: 60.114.865/0001-00</b><br>
 Rua XV de novembro, 45 - Sorocaba, SP</span></span></span></div></td></tr></table>
                                                </td>
                                              </tr>
                                              </tbody>
                                            </table>
                                          </td>
                                        </tr>
                                    </tbody>
                                  </table>
                                </td>
                              </tr>
                            </table>
                          </td>
                        </tr>
                      </table>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td valign="top">
          <custom type="footer" />
        </td>
      </tr>
    </table>
  </body>
</html>
$gaas$, false, 'active', 1, null, null)
on conflict (id) do update set
  name = excluded.name, source = excluded.source, status = 'active',
  version = greatest(public.dynamic_email_template_slots.version, excluded.version), updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Está na hora de desbloquear', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/0e8a7666-182b-41ef-a7c6-440f6855a478.png', 'http://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', 'Está na hora de desbloquear', 600, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-2'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Logo Afinz', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/160b947b-93b3-49f8-9537-84245584e143.png', 'https://afinz.com.br/', 'generic', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, 80, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 174009', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1cff3901-45e3-4245-a0e5-59c8bf28c638.png', 'https://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-3'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175821', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/1e08e54a-716a-4a59-96a0-3b652119ed13.png', 'http://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-5'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175741', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/2e28aab8-b586-4223-a19a-bd7a90138594.png', 'https://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-7'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 83543', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/31227d6c-28bc-41b4-8b27-c64795765698.png', 'https://www.tiktok.com/@afinzoficial', 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 30, 30, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175791', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/3736d8c4-a8ce-47fb-944c-911039706324.png', null, 'banner_1', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-2'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 174045', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/413ba064-4762-41b5-80fe-eae9b0475fdb.png', 'https://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-4'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 174003', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/481a91c2-9f6a-4d43-84bd-dd06d5db3cb8.png', null, 'banner_2', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 150, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-5','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175809', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/4db4ae3d-6fd9-4256-b87e-7b875b932ecc.png', null, 'banner_1', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-3'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 34794', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/787eb5c7-39ee-4b30-987a-0a81a38241a3.png', 'https://afinz.com.br/', 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 90, 48, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 174004', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/7b74ae58-653d-4037-b494-1a04d89c4fc7.png', null, 'banner_1', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 150, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-5','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175774', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/814bdf22-1f7d-4680-a707-682e9d61b9e8.png', null, 'banner_1', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 500, null, array['b2c','classic-vibe','controle','historico-aprovado','email-1'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 10724', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/8f2daf4e-a386-471d-bc7b-aea7a6c8c416.png', 'https://web.facebook.com/Afinz', 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 30, 30, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 10726', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/b07a3e46-7c00-409b-81fe-c1b5eceebf64.png', 'https://www.instagram.com/afinzoficial/', 'banner_2', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 31, 31, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 175748', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/bcba23af-49bb-4435-a8e7-e66b8358c037.png', 'http://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 107117', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/dfcce93f-cd10-4245-aea6-2bd11ffc66e3.png', null, 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 300, 260, array['b2c','classic-vibe','controle','historico-aprovado','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 143346', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/e31039cf-fa85-41b7-bf16-9cbccacaaf10.gif', null, 'banner_1', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 720, null, array['b2c','classic-vibe','controle','historico-aprovado','email-4','email-6'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Está na hora de desbloquear', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ecc98b44-e31d-47cd-9ec8-a2bf6285ff7c.png', 'http://onelink.to/jztxbk', 'header', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', 'Está na hora de desbloquear', 600, null, array['b2c','classic-vibe','controle','historico-aprovado','email-6'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 10727', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/ef14c352-0006-411d-b873-9b35c7dffde9.png', 'https://afinz.com.br/', 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 31, 31, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 10725', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/f37dd205-17fa-47d9-a98a-4f538ef8d637.png', 'https://afinz.com.br/blog/', 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 30, 30, array['b2c','classic-vibe','controle','historico-aprovado','email-1','email-2','email-3','email-4','email-5','email-6','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_assets
  (name, external_url, click_url, slot, bu, partner, segment, subgroup, product, alt_text, width, height, tags, status, version, created_by, updated_by)
values ('Ativo visual B2C 174005', 'https://image.relacionamento.afinz.com.br/lib/fe3711747364047d761773/m/1/fe5a60a4-6a4c-454b-8681-3d5722951429.png', null, 'banner_3', 'B2C', 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Cartao', null, 150, 250, array['b2c','classic-vibe','controle','historico-aprovado','email-5','email-7','email-8'], 'ready', 1, null, null)
on conflict (external_url) do update set
  tags = (select array_agg(distinct tag) from unnest(public.dynamic_email_assets.tags || excluded.tags) tag),
  updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000001'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S1_D1", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 1", "ASSUNTO": "Peça seu cartão Afinz e concorra a R$100 mil todo mês!", "PRE_CABECALHO": "Aproveite os descontos incríveis nas melhores marcas.", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 1', array['afz_car_vis_aqs_email_bsp_disp1s1vibe_pontual'], 'b2c10000-0000-4000-8000-000000000001'::uuid, 'b2c-classic-vibe-email-01-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000002'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S1_D2", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 2", "ASSUNTO": "GANHE Créditos Vibe com o cartão Afinz Visa! 💳", "PRE_CABECALHO": "Peça seu cartão e tenha descontos em cinema, delivery e muito mais!", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 1', array['afz_car_vis_aqs_email_bsp_disp2s1vibe_pontual'], 'b2c10000-0000-4000-8000-000000000002'::uuid, 'b2c-classic-vibe-email-02-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000003'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S2_D1", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 3", "ASSUNTO": "Concorra a R$100 MIL todo mês com o cartão Afinz!", "PRE_CABECALHO": "Peça seu cartão e ganhe R$100 em créditos Vibe na 1ª compra.", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 2', array['afz_car_vis_aqs_email_bsp_disp1s2vibe_pontual'], 'b2c10000-0000-4000-8000-000000000003'::uuid, 'b2c-classic-vibe-email-03-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000004'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S2_D2", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 4", "ASSUNTO": "Cartão Afinz com limite para usar na hora. Peça já!", "PRE_CABECALHO": "Ganhe até R$100 em Créditos Vibe para suas compras. Aproveite!", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 2', array['afz_car_vis_aqs_email_bsp_disp2s2vibe_pontual'], 'b2c10000-0000-4000-8000-000000000004'::uuid, 'b2c-classic-vibe-email-04-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000005'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S3_D1", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 5", "ASSUNTO": "Economize todo mês com seus Créditos Vibe!", "PRE_CABECALHO": "Peça seu cartão Afinz e concorra a R$100 MIL todo mês.", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 3', array['afz_car_vis_aqs_email_bsp_disp1s3vibe_pontual'], 'b2c10000-0000-4000-8000-000000000005'::uuid, 'b2c-classic-vibe-email-05-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000006'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S3_D2", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 6", "ASSUNTO": "Quer concorrer a R$100 MIL todo mês? Peça seu Cartão Afinz!", "PRE_CABECALHO": "Ganhe R$100 em Créditos Vibe na 1ª compra e aproveite nas melhores marcas.", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 3', array['afz_car_vis_aqs_email_bsp_disp2s3vibe_pontual'], 'b2c10000-0000-4000-8000-000000000006'::uuid, 'b2c-classic-vibe-email-06-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000007'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S4_D1", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 7", "ASSUNTO": "Não perca seu cartão Afinz com Créditos Vibe exclusivos!", "PRE_CABECALHO": "Ganhe R$100 em Créditos Vibe para economizar nas melhores marcas.", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 4', array['afz_car_vis_aqs_email_bsp_disp1s4vibe_pontual'], 'b2c10000-0000-4000-8000-000000000007'::uuid, 'b2c-classic-vibe-email-07-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();

insert into public.dynamic_email_briefings
  (id, briefing_data, partner, segment, subgroup, week_key, activity_names, campaign_group_id, template_slot_id, status, version, journey_confirmed, acknowledged_missing_activity, legal_override, created_by, updated_by)
values ('b2c00000-0000-4000-8000-000000000008'::uuid, '{"DT_INICIO": "", "DT_FIM": "", "UTM_CAMPANHA": "B2C_CLASSIC_VIBE_S4_D2", "TP_CAMPANHA": "Aquisicao", "SEQUENCIA": "E-mail 8", "ASSUNTO": "ÚLTIMA CHANCE: ganhe até R$100 Créditos Vibe!", "PRE_CABECALHO": "Concorra R$100 MIL todo mês e economize em +250 marcas. Aproveite!", "HEADER": "", "CARTAO_NM_COMERCIAL": "Afinz Visa", "NM_PRODUTO_INTERNO": "INSTITUCIONAL"}'::jsonb, 'Institucional B2C', 'Base_Proprietaria', 'Classic + Vibe', 'Semana 4', array['afz_car_vis_aqs_email_bsp_disp2s4vibe_pontual'], 'b2c10000-0000-4000-8000-000000000008'::uuid, 'b2c-classic-vibe-email-08-control', 'needs_review', 1, false, false, false, null, null)
on conflict (id) do update set
  briefing_data = excluded.briefing_data, partner = excluded.partner, segment = excluded.segment,
  subgroup = excluded.subgroup, week_key = excluded.week_key, activity_names = excluded.activity_names,
  campaign_group_id = excluded.campaign_group_id, template_slot_id = excluded.template_slot_id,
  status = excluded.status, updated_at = now();
