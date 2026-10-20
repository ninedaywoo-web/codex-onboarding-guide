from pathlib import Path
import json, hashlib, struct

ROOT=Path(__file__).resolve().parents[1]
data_js=(ROOT/'data.js').read_text(encoding='utf-8')
data=json.loads(data_js.removeprefix('window.KB_DATA = ').strip().removesuffix(';'))
steps=json.loads((ROOT/'knowledge/steps.json').read_text(encoding='utf-8'))
assert data==steps, '网页数据与 AI 数据不一致'
mapping=json.loads((ROOT/'knowledge/source-map.json').read_text(encoding='utf-8'))
pdf=ROOT/'原版图解指南.pdf'
assert hashlib.sha256(pdf.read_bytes()).hexdigest()==mapping['sha256']==data['sourceSha256']
assert len(data['pages'])==mapping['page_count']==23
assert mapping['embedded_image_count']==13 and mapping['link_count']==52
assert len({s['id'] for s in data['steps']})==len(data['steps'])==44
assert len(list((ROOT/'assets/pages').glob('*.png')))==23
for p in data['pages']:
    image=ROOT/p['image'];raw=image.read_bytes()
    assert raw.startswith(b'\x89PNG\r\n\x1a\n')
    w,h=struct.unpack('>II',raw[16:24]);assert w>1000 and h>1000
    assert (ROOT/f"knowledge/page-{p['number']:02}.txt").exists()
    assert any(s['page']==p['number'] for s in data['steps']) or p['number'] in mapping['error_case_pages'].values() or p['number'] in mapping['reference_only_pages']
for s in data['steps']:
    assert 1<=s['page']<=23
    if s['url']:assert s['url'] in data['links']
    assert s['action'] and s['expect']
for p in mapping['pages']:
    assert p['steps']==[s['id'] for s in data['steps'] if s['page']==p['page']]
assert data['links']['gift_alipay'].startswith('https://render.alipay.com/p/s/i/?scheme=alipays%3A')
assert 'shareTimestamp%3D1772934191191' in data['links']['gift_alipay']
assert all((ROOT/f).exists() for f in ['index.html','style.css','app.js','core.js','AI_START.txt','SKILL.md','test-kit/read-me.txt','knowledge/full-guide.txt'])
try:
    from pypdf import PdfReader
    r=PdfReader(str(pdf))
    assert len(r.pages)==23
    assert sum(len(p.images) for p in r.pages)==13
    assert sum(len(p.get('/Annots',[])) for p in r.pages)==52
    pdf_check='实读 PDF：23 页、13 张嵌入图、52 个链接'
except ImportError:
    pdf_check='按已知原 PDF 的完整 SHA-256 核对，未安装可选 pypdf，未重复解析页数'
print(json.dumps({'status':'passed','steps':len(data['steps']),'page_images':23,'pdf':pdf_check,'source_sha256':mapping['sha256'],'links_preserved':True,'web_and_ai_data_match':True},ensure_ascii=False,indent=2))
