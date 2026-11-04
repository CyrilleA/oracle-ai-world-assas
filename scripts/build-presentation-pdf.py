"""Build the student handout from the portal's exported public cards."""
import base64, io, json, re
from pathlib import Path
from html import escape
from lxml import html
from PIL import Image as PILImage
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib import colors
from reportlab.lib.styles import ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, PageBreak, KeepInFrame
from svglib.svglib import svg2rlg

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'site/documents/oracle-ai-world-assas.pdf'
INK='#233936'; RED='#bd4734'
for name,file in [('Arial','Arial.ttf'),('Arial-Bold','Arial Bold.ttf')]:
    pdfmetrics.registerFont(TTFont(name,'/System/Library/Fonts/Supplemental/'+file))
styles={
 'text':ParagraphStyle('text',fontName='Arial',fontSize=10.5,leading=15,textColor=colors.HexColor(INK),spaceAfter=9),
 'title':ParagraphStyle('title',fontName='Arial-Bold',fontSize=22,leading=26,textColor=colors.HexColor(INK),spaceAfter=15),
 'sub':ParagraphStyle('sub',fontName='Arial-Bold',fontSize=13,leading=17,textColor=colors.HexColor(INK),spaceAfter=10),
 'small':ParagraphStyle('small',fontName='Arial',fontSize=8,leading=11,textColor=colors.HexColor('#62716b'),spaceAfter=6),
 'section':ParagraphStyle('section',fontName='Arial-Bold',fontSize=10,leading=14,textColor=colors.HexColor(RED),spaceAfter=12),
}
def clean(text):
    return re.sub(r'\s+',' ',text).strip().replace('↗','').replace('→',' / ').replace('←','').replace('\u2011','-')
def para(text,style='text'):
    return Paragraph(escape(clean(text)),styles[style])
def graphic(src):
    if src.startswith('data:image/svg+xml;base64,'):
        drawing=svg2rlg(io.BytesIO(base64.b64decode(src.split(',',1)[1])))
        if not drawing:return None
        scale=min(480/drawing.width,260/drawing.height)
        drawing.scale(scale,scale);drawing.width*=scale;drawing.height*=scale
        return drawing
    if src.startswith('data:'):data=io.BytesIO(base64.b64decode(src.split(',',1)[1]))
    elif src.startswith('assets/'):data=ROOT/'site'/src
    else:return None
    with PILImage.open(data) as img:
        rgba=img.convert('RGBA');background=PILImage.new('RGBA',rgba.size,'white');background.alpha_composite(rgba);img=background.convert('RGB');img.thumbnail((1400,900)); w,h=img.size
        stream=io.BytesIO();img.save(stream,format='JPEG',quality=83);stream.seek(0)
    scale=min(480/w,240/h)
    return Image(stream,width=w*scale,height=h*scale)

def blocks(el):
    tag=el.tag
    if not isinstance(tag,str):return []
    if tag in ['h1','h2','h3','h4','p','li','summary','figcaption','tr']:
        text=clean(' '.join(el.itertext()))
        return [(text,'title' if tag in ['h1','h2'] else 'sub' if tag in ['h3','h4'] else 'small' if tag in ['figcaption','summary'] else 'text')] if text else []
    result=[]
    if el.text and clean(el.text):result.append((el.text,'small' if tag=='span' else 'text'))
    for child in el:
        result.extend(blocks(child))
        if child.tail and clean(child.tail):result.append((child.tail,'text'))
    return result

cards=json.loads((ROOT/'tmp/pdfs/cards.json').read_text())
story=[Spacer(1,90),para('ORACLE · ASSAS 2026','section'),para('La supply chain à l’heure de l’IA','title'),para('D’où vient la supply chain ? Comment évolue-t-elle avec l’Agentic Enterprise ?'),Spacer(1,24),para('Support de la matinée · 5 novembre 2026','sub'),para('Les cartes du portail, les schémas et les photographies. Les vidéos restent accessibles par leurs liens. Les jeux interactifs et leurs résultats ne sont pas inclus.'),Spacer(1,25),Paragraph('<link href="https://assas-beaujolais-votes.oracle-ai-world-assas.workers.dev/">Retrouver le portail en ligne</link>',styles['text']),PageBreak()]
for n,card in enumerate(cards):
    tree=html.fromstring(card['html'])
    matches=tree.xpath('//article[contains(@class,"lesson-card") or contains(@class,"history-card")]')
    body=matches[0] if matches else tree
    images=body.xpath('.//img/@src')
    sources=[]
    for link in body.xpath('.//a[@href]'):
        href=link.get('href')
        if href.startswith('https://') and 'animateur.html' not in href:
            label=clean(' '.join(link.itertext()))
            if (href,label) not in sources:sources.append((href,label or 'Source'))
    for unwanted in body.xpath('.//button|.//nav|.//script|.//iframe|.//*[contains(@class,"lesson-video")]|.//*[contains(@class,"feature-video")]|.//a[contains(@class,"btn")]'):
        if unwanted.getparent() is not None:unwanted.drop_tree()
    content=[para(card['section'],'section')]
    texts=blocks(body)
    # Place the first heading and lead before the visual.
    heading=next((i for i,x in enumerate(texts) if x[1]=='title'),None)
    if heading is not None:
        content.extend(para(t,s) for t,s in texts[:heading+1]);texts=texts[heading+1:]
    if images:
        item=graphic(images[0])
        if item:content.extend([item,Spacer(1,13)])
    seen=set()
    for text,style in texts:
        text=clean(text)
        if text and text not in seen and not text.startswith('Carte '):
            seen.add(text);content.append(para(text,style))
    for href,label in sources:
        content.append(Paragraph(f'<link href="{escape(href,quote=True)}" color="{RED}">{escape(label)} : {escape(href)}</link>',styles['small']))
    story.append(KeepInFrame(483,715,content,mode='shrink'))
    if n<len(cards)-1:story.append(PageBreak())

def page(canvas,doc):
    w,h=doc.pagesize
    canvas.setFillColor(colors.HexColor(RED));canvas.setFont('Arial-Bold',13);canvas.drawString(42,h-30,'ORACLE')
    canvas.setStrokeColor(colors.HexColor('#d9dfd6'));canvas.line(42,36,w-42,36)
    canvas.setFillColor(colors.HexColor('#62716b'));canvas.setFont('Arial',8)
    canvas.drawString(42,23,'ASSAS · Oracle AI World · 5 novembre 2026')
    canvas.drawRightString(w-42,23,str(doc.page))

SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),leftMargin=50,rightMargin=50,topMargin=58,bottomMargin=48,title='Oracle AI World · ASSAS · La supply chain à l’heure de l’IA',author='Cyrille Ancelot',pageCompression=1).build(story,onFirstPage=page,onLaterPages=page)
print(OUT)
print(f'{len(cards)+1} pages · {OUT.stat().st_size/1024/1024:.1f} Mo')
