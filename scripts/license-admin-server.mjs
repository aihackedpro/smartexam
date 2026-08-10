/*
ออกแบบและพัฒนาโดย
ครูโต้ง | hAcKEdpRO | Pongwattana Suebsing
ให้เครดิตผู้พัฒนาระบบ
*/

import { randomBytes } from 'node:crypto';
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { getAuthorityStatus, issueLicense } from './license-authority-core.mjs';

const host = '127.0.0.1';
const port = 4174;
const origin = `http://${host}:${port}`;
const sessionToken = randomBytes(32).toString('base64url');

const page = `<!doctype html>
<html lang="th">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>SmartExam License Authority</title>
  <style>
    *{box-sizing:border-box}body{margin:0;font-family:-apple-system,BlinkMacSystemFont,"Noto Sans Thai",sans-serif;background:#f3f7f8;color:#102a43}.shell{max-width:980px;margin:auto;padding:28px 18px 60px}.hero{border-radius:28px;background:linear-gradient(135deg,#092f4f,#0f5570 70%,#087f5b);padding:28px;color:#fff;box-shadow:0 18px 45px #0f3d5e30}.eyebrow{color:#7ee2bb;font-weight:800;font-size:13px}.hero h1{font-size:30px;margin:7px 0}.hero p{margin:0;color:#d9edf7;line-height:1.7}.status{margin-top:17px;display:inline-flex;gap:8px;align-items:center;background:#ffffff16;border:1px solid #ffffff30;border-radius:999px;padding:9px 13px;font-weight:700}.grid{display:grid;grid-template-columns:1.2fr .8fr;gap:18px;margin-top:20px}.card{background:#fff;border:1px solid #d9e2ec;border-radius:24px;padding:22px;box-shadow:0 12px 30px #102a4310}h2{margin:0 0 16px;font-size:21px}label{display:block;font-size:14px;font-weight:800;margin:14px 0 6px}input,textarea,select{width:100%;border:1px solid #bcccdc;border-radius:12px;padding:12px;font:inherit;background:#fff;outline:none}textarea{min-height:112px;resize:vertical;font-family:ui-monospace,monospace;font-size:12px}input:focus,textarea:focus,select:focus{border-color:#0ca678;box-shadow:0 0 0 4px #c3fae8}.plans{display:grid;grid-template-columns:repeat(3,1fr);gap:9px}.plan{cursor:pointer;border:2px solid #d9e2ec;border-radius:15px;padding:12px;text-align:center}.plan:has(input:checked){border-color:#0ca678;background:#e6fcf5}.plan input{position:absolute;opacity:0;width:1px}.plan strong,.plan span{display:block}.plan span{font-size:12px;color:#627d98;margin-top:3px}.price{font-size:19px;color:#087f5b;margin-top:4px}.primary{width:100%;min-height:54px;border:0;border-radius:14px;background:#0ca678;color:#fff;font-size:17px;font-weight:900;margin-top:18px;cursor:pointer}.primary:hover{background:#099268}.primary:disabled{opacity:.6;cursor:wait}.result{display:none}.result.show{display:block}.success{background:#e6fcf5;color:#087f5b;border-radius:14px;padding:12px;font-weight:800}.error{background:#fff0f0;color:#c92a2a;border-radius:14px;padding:12px;font-weight:800}.copy{width:100%;min-height:48px;border:1px solid #0f3d5e;border-radius:12px;background:#fff;color:#0f3d5e;font-weight:800;cursor:pointer}.security{list-style:none;padding:0;margin:0}.security li{display:flex;gap:10px;margin:12px 0;line-height:1.5;font-size:14px}.dot{width:10px;height:10px;margin-top:6px;border-radius:50%;background:#0ca678;flex:none}.muted{font-size:12px;color:#829ab1;line-height:1.6}@media(max-width:720px){.grid{grid-template-columns:1fr}.plans{grid-template-columns:1fr}.hero h1{font-size:25px}}
  </style>
</head>
<body>
  <main class="shell">
    <header class="hero"><div class="eyebrow">OWNER ONLY • LOCAL SECURE TOOL</div><h1>SmartExam License Authority</h1><p>ศูนย์ออก Activate Key สำหรับเจ้าของระบบ ทำงานเฉพาะบนเครื่องนี้และลงลายเซ็นด้วย private key ใน macOS Keychain</p><div class="status">● พร้อมออกคีย์ • owner-2026-01</div></header>
    <div class="grid">
      <section class="card"><h2>ออก Activate Key</h2><form id="form">
        <label for="device">Key โปรแกรมของลูกค้า</label><textarea id="device" required placeholder="SME-D1-..."></textarea>
        <label>แพ็กเกจ</label><div class="plans">
          <label class="plan"><input type="radio" name="plan" value="month" checked><strong>1 เดือน</strong><b class="price">19 บาท</b><span>30 วัน</span></label>
          <label class="plan"><input type="radio" name="plan" value="year"><strong>1 ปี</strong><b class="price">99 บาท</b><span>365 วัน</span></label>
          <label class="plan"><input type="radio" name="plan" value="lifetime"><strong>ตลอดอายุ</strong><b class="price">199 บาท</b><span>ไม่หมดอายุ</span></label>
        </div>
        <label for="customer">ข้อมูลอ้างอิงลูกค้า (ไม่บังคับ)</label><input id="customer" maxlength="120" placeholder="เช่น ชื่อเล่น / เลขคำสั่งซื้อ">
        <label for="licenseId">License ID กำหนดเอง (ไม่บังคับ)</label><input id="licenseId" maxlength="80" placeholder="ระบบสร้างให้อัตโนมัติ">
        <button id="issue" class="primary" type="submit">สร้าง Activate Key</button>
      </form></section>
      <aside class="card"><h2>การป้องกัน</h2><ul class="security"><li><i class="dot"></i><span>private key อยู่ใน macOS Keychain และไม่ถูกส่งให้ browser</span></li><li><i class="dot"></i><span>เปิดรับเฉพาะ 127.0.0.1 ไม่รับการเชื่อมต่อจากเครือข่าย</span></li><li><i class="dot"></i><span>session token สุ่มใหม่ทุกครั้ง พร้อมตรวจ Origin และปิด CORS</span></li><li><i class="dot"></i><span>บันทึกประวัติออกคีย์ในโฟลเดอร์ส่วนตัวของผู้ใช้</span></li></ul><p class="muted">ปิดหน้าต่าง Terminal ที่รันระบบนี้เพื่อหยุดศูนย์ออกคีย์ทันที</p></aside>
    </div>
    <section id="result" class="card result" style="margin-top:18px"><div id="message"></div><label for="token">Activate Key</label><textarea id="token" readonly></textarea><button id="copy" class="copy" type="button">คัดลอก Activate Key</button></section>
  </main>
  <script>
    const adminToken=new URLSearchParams(location.search).get('token');
    const form=document.getElementById('form'),button=document.getElementById('issue'),result=document.getElementById('result'),message=document.getElementById('message'),token=document.getElementById('token');
    form.addEventListener('submit',async(event)=>{event.preventDefault();button.disabled=true;button.textContent='กำลังลงลายเซ็น…';result.classList.remove('show');try{const response=await fetch('/api/issue',{method:'POST',headers:{'content-type':'application/json','x-smartexam-admin-token':adminToken},body:JSON.stringify({deviceCode:document.getElementById('device').value,plan:new FormData(form).get('plan'),customerReference:document.getElementById('customer').value,licenseId:document.getElementById('licenseId').value||undefined})});const data=await response.json();result.classList.add('show');if(!response.ok)throw new Error(data.error||'ออกคีย์ไม่สำเร็จ');message.className='success';message.textContent='ออกคีย์สำเร็จ • '+data.claims.licenseId+' • '+(data.claims.expiresAt||'ตลอดอายุการใช้งาน');token.value=data.token;result.scrollIntoView({behavior:'smooth'});}catch(error){result.classList.add('show');message.className='error';message.textContent=error.message;token.value='';}finally{button.disabled=false;button.textContent='สร้าง Activate Key';}});
    document.getElementById('copy').addEventListener('click',async()=>{await navigator.clipboard.writeText(token.value);document.getElementById('copy').textContent='คัดลอกแล้ว';});
  </script>
</body></html>`;

function setSecurityHeaders(response) {
  response.setHeader('cache-control', 'no-store');
  response.setHeader(
    'content-security-policy',
    "default-src 'none'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'",
  );
  response.setHeader('referrer-policy', 'no-referrer');
  response.setHeader('x-content-type-options', 'nosniff');
  response.setHeader('x-frame-options', 'DENY');
}

async function readJsonBody(request) {
  const chunks = [];
  let size = 0;
  for await (const chunk of request) {
    size += chunk.length;
    if (size > 16_384) throw new Error('ข้อมูลคำขอมีขนาดใหญ่เกินไป');
    chunks.push(chunk);
  }
  return JSON.parse(Buffer.concat(chunks).toString('utf8'));
}

getAuthorityStatus();
const server = createServer(async (request, response) => {
  setSecurityHeaders(response);
  const url = new URL(request.url ?? '/', origin);
  if (
    request.method === 'GET' &&
    url.pathname === '/' &&
    url.searchParams.get('token') === sessionToken
  ) {
    response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
    response.end(page);
    return;
  }
  if (request.method === 'POST' && url.pathname === '/api/issue') {
    if (
      request.headers.origin !== origin ||
      request.headers['x-smartexam-admin-token'] !== sessionToken
    ) {
      response.writeHead(403, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ error: 'ปฏิเสธคำขอที่ไม่ได้มาจากศูนย์ออกคีย์บนเครื่องนี้' }));
      return;
    }
    try {
      const body = await readJsonBody(request);
      const issued = await issueLicense(body);
      response.writeHead(200, { 'content-type': 'application/json' });
      response.end(JSON.stringify(issued));
    } catch (error) {
      response.writeHead(400, { 'content-type': 'application/json' });
      response.end(
        JSON.stringify({ error: error instanceof Error ? error.message : 'ออกคีย์ไม่สำเร็จ' }),
      );
    }
    return;
  }
  response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
  response.end('Not found');
});

server.listen(port, host, () => {
  const url = `${origin}/?token=${sessionToken}`;
  console.log('SmartExam License Authority เปิดแล้ว');
  console.log(`Local URL: ${url}`);
  console.log('กด Control+C เพื่อปิดระบบ');
  spawn('/usr/bin/open', [url], { detached: true, stdio: 'ignore' }).unref();
});
