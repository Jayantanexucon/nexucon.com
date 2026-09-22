import os
import re
import html
import zipfile

def escape_xml(text):
    return html.escape(str(text))

def build_docx(markdown_path, output_docx_path):
    with open(markdown_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    body_xml_parts = []
    
    in_table = False
    table_rows = []
    
    in_code_block = False
    code_lines = []

    def flush_table():
        nonlocal in_table, table_rows, body_xml_parts
        if not table_rows:
            in_table = False
            return
        
        tbl_xml = ['<w:tbl>',
                   '<w:tblPr>',
                   '  <w:tblW w:w="0" w:type="auto"/>',
                   '  <w:tblBorders>',
                   '    <w:top w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '    <w:left w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '    <w:bottom w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '    <w:right w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '    <w:insideH w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '    <w:insideV w:val="single" w:sz="4" w:space="0" w:color="D0D7DE"/>',
                   '  </w:tblBorders>',
                   '</w:tblPr>']
        
        is_header = True
        for row in table_rows:
            # Check if separator row (e.g. |---|---|)
            if all(re.match(r'^\s*:?-+:?\s*$', cell) for cell in row):
                is_header = False
                continue
            
            tbl_xml.append('<w:tr>')
            for cell in row:
                cell_clean = cell.strip()
                # format bold
                fill = 'E8EEF5' if is_header else 'FFFFFF'
                tc_xml = [
                    '<w:tc>',
                    '<w:tcPr>',
                    f'  <w:shd w:val="clear" w:color="auto" w:fill="{fill}"/>',
                    '  <w:tcMar><w:top w:w="120" w:type="dxa"/><w:bottom w:w="120" w:type="dxa"/><w:left w:w="160" w:type="dxa"/><w:right w:w="160" w:type="dxa"/></w:tcMar>',
                    '</w:tcPr>',
                    '<w:p>',
                    '  <w:pPr><w:spacing w:line="240" w:lineRule="auto" w:before="0" w:after="0"/></w:pPr>'
                ]
                
                # Simple parsing for bold in cell
                parts = re.split(r'(\*\*.*?\*\*)', cell_clean)
                for part in parts:
                    if part.startswith('**') and part.endswith('**'):
                        tc_xml.append(f'<w:r><w:rPr><w:b/><w:sz w:val="{"18" if is_header else "16"}"/></w:rPr><w:t xml:space="preserve">{escape_xml(part[2:-2])}</w:t></w:r>')
                    elif part:
                        tc_xml.append(f'<w:r><w:rPr><w:sz w:val="{"18" if is_header else "16"}"/></w:rPr><w:t xml:space="preserve">{escape_xml(part)}</w:t></w:r>')
                
                tc_xml.append('</w:p></w:tc>')
                tbl_xml.extend(tc_xml)
            tbl_xml.append('</w:tr>')
            if is_header:
                is_header = False
                
        tbl_xml.append('</w:tbl>')
        body_xml_parts.append("\n".join(tbl_xml))
        table_rows = []
        in_table = False

    def flush_code_block():
        nonlocal in_code_block, code_lines, body_xml_parts
        if not code_lines:
            in_code_block = False
            return
        
        full_code = "\n".join(code_lines)
        code_xml = [
            '<w:p>',
            '<w:pPr>',
            '  <w:shd w:val="clear" w:color="auto" w:fill="0E172A"/>',
            '  <w:spacing w:before="120" w:after="120" w:line="240" w:lineRule="auto"/>',
            '  <w:ind w:left="240" w:right="240"/>',
            '</w:pPr>'
        ]
        for line in code_lines:
            code_xml.append(f'<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:color w:val="38BDF8"/><w:sz w:val="18"/></w:rPr><w:t xml:space="preserve">{escape_xml(line)}</w:t><w:br/></w:r>')
        code_xml.append('</w:p>')
        body_xml_parts.append("\n".join(code_xml))
        code_lines = []
        in_code_block = False

    for line in lines:
        line_str = line.rstrip('\r\n')

        # Code block
        if line_str.startswith('```'):
            if in_table:
                flush_table()
            if in_code_block:
                flush_code_block()
            else:
                in_code_block = True
            continue

        if in_code_block:
            code_lines.append(line_str)
            continue

        # Table detection
        if line_str.strip().startswith('|') and line_str.strip().endswith('|'):
            in_table = True
            cols = [c.strip() for c in line_str.strip()[1:-1].split('|')]
            table_rows.append(cols)
            continue
        else:
            if in_table:
                flush_table()

        # Blank line
        if not line_str.strip():
            continue

        # Horizontal rule
        if re.match(r'^-{3,}$', line_str.strip()) or re.match(r'^\*{3,}$', line_str.strip()):
            body_xml_parts.append('<w:p><w:pPr><w:pBdr><w:bottom w:val="single" w:sz="6" w:space="1" w:color="CBD5E1"/></w:pBdr><w:spacing w:before="120" w:after="120"/></w:pPr></w:p>')
            continue

        # Headings
        if line_str.startswith('# '):
            text = escape_xml(line_str[2:].strip())
            body_xml_parts.append(f'<w:p><w:pPr><w:pStyle w:val="Heading1"/><w:spacing w:before="360" w:after="140"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="40"/><w:color w:val="0B1736"/></w:rPr><w:t>{text}</w:t></w:r></w:p>')
            continue
        elif line_str.startswith('## '):
            text = escape_xml(line_str[3:].strip())
            body_xml_parts.append(f'<w:p><w:pPr><w:pStyle w:val="Heading2"/><w:spacing w:before="280" w:after="120"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="30"/><w:color w:val="0891B2"/></w:rPr><w:t>{text}</w:t></w:r></w:p>')
            continue
        elif line_str.startswith('### '):
            text = escape_xml(line_str[4:].strip())
            body_xml_parts.append(f'<w:p><w:pPr><w:pStyle w:val="Heading3"/><w:spacing w:before="220" w:after="80"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="24"/><w:color w:val="1E293B"/></w:rPr><w:t>{text}</w:t></w:r></w:p>')
            continue
        elif line_str.startswith('#### '):
            text = escape_xml(line_str[5:].strip())
            body_xml_parts.append(f'<w:p><w:pPr><w:spacing w:before="180" w:after="60"/></w:pPr><w:r><w:rPr><w:b/><w:sz w:val="22"/><w:color w:val="334155"/></w:rPr><w:t>{text}</w:t></w:r></w:p>')
            continue

        # Bullet list
        is_bullet = False
        content_line = line_str
        if line_str.strip().startswith('* ') or line_str.strip().startswith('- '):
            is_bullet = True
            content_line = line_str.strip()[2:]

        p_xml = ['<w:p>']
        if is_bullet:
            p_xml.append('<w:pPr><w:ind w:left="360"/><w:spacing w:before="40" w:after="40"/></w:pPr>')
            p_xml.append('<w:r><w:rPr><w:color w:val="0891B2"/><w:b/></w:rPr><w:t xml:space="preserve">&#x25CF;  </w:t></w:r>')
        else:
            p_xml.append('<w:pPr><w:spacing w:before="60" w:after="60" w:line="276" w:lineRule="auto"/></w:pPr>')

        # Inline formatting: bold **text**, code `text`
        parts = re.split(r'(\*\*.*?\*\*|`.*?`)', content_line)
        for part in parts:
            if part.startswith('**') and part.endswith('**'):
                p_xml.append(f'<w:r><w:rPr><w:b/></w:rPr><w:t xml:space="preserve">{escape_xml(part[2:-2])}</w:t></w:r>')
            elif part.startswith('`') and part.endswith('`'):
                p_xml.append(f'<w:r><w:rPr><w:rFonts w:ascii="Consolas" w:hAnsi="Consolas"/><w:shd w:val="clear" w:color="auto" w:fill="F1F5F9"/><w:color w:val="0F172A"/></w:rPr><w:t xml:space="preserve"> {escape_xml(part[1:-1])} </w:t></w:r>')
            elif part:
                p_xml.append(f'<w:r><w:t xml:space="preserve">{escape_xml(part)}</w:t></w:r>')

        p_xml.append('</w:p>')
        body_xml_parts.append("".join(p_xml))

    if in_table:
        flush_table()
    if in_code_block:
        flush_code_block()

    document_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    {"".join(body_xml_parts)}
    <w:sectPr>
      <w:pgSz w:w="11906" w:h="16838"/>
      <w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440" w:header="720" w:footer="720" w:gutter="0"/>
    </w:sectPr>
  </w:body>
</w:document>
"""

    content_types_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
  <Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/>
</Types>
"""

    rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>
"""

    doc_rels_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"""

    styles_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:docDefaults>
    <w:rPrDefault>
      <w:rPr>
        <w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/>
        <w:sz w:val="22"/>
        <w:color w:val="1E293B"/>
      </w:rPr>
    </w:rPrDefault>
  </w:docDefaults>
  <w:style w:type="paragraph" w:default="1" w:styleId="Normal">
    <w:name w:val="Normal"/>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading1">
    <w:name w:val="heading 1"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="0B1736"/>
      <w:sz w:val="36"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading2">
    <w:name w:val="heading 2"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="0891B2"/>
      <w:sz w:val="28"/>
    </w:rPr>
  </w:style>
  <w:style w:type="paragraph" w:styleId="Heading3">
    <w:name w:val="heading 3"/>
    <w:rPr>
      <w:b/>
      <w:color w:val="1E293B"/>
      <w:sz w:val="24"/>
    </w:rPr>
  </w:style>
</w:styles>
"""

    with zipfile.ZipFile(output_docx_path, 'w', zipfile.ZIP_DEFLATED) as docx:
        docx.writestr('[Content_Types].xml', content_types_xml)
        docx.writestr('_rels/.rels', rels_xml)
        docx.writestr('word/_rels/document.xml.rels', doc_rels_xml)
        docx.writestr('word/styles.xml', styles_xml)
        docx.writestr('word/document.xml', document_xml)

    print(f"Generated DOCX: {output_docx_path}")

def build_xlsx(markdown_table_path, output_xlsx_path):
    with open(markdown_table_path, "r", encoding="utf-8") as f:
        lines = f.readlines()

    rows = []
    for line in lines:
        l = line.strip()
        if l.startswith('|') and l.endswith('|'):
            cols = [c.strip().replace('**', '') for c in l[1:-1].split('|')]
            if all(re.match(r'^\s*:?-+:?\s*$', c) for c in cols):
                continue
            rows.append(cols)

    # Build shared strings
    shared_strings = []
    string_map = {}
    def get_string_id(s):
        if s not in string_map:
            string_map[s] = len(shared_strings)
            shared_strings.append(s)
        return string_map[s]

    sheet_data = []
    def col_name(index):
        name = ""
        while index >= 0:
            name = chr(index % 26 + 65) + name
            index = index // 26 - 1
        return name

    for r_idx, row in enumerate(rows, start=1):
        row_xml = [f'<row r="{r_idx}">']
        for c_idx, cell in enumerate(row):
            ref = f"{col_name(c_idx)}{r_idx}"
            s_id = get_string_id(cell)
            style_attr = ' s="1"' if r_idx == 1 else ' s="2"'
            row_xml.append(f'<c r="{ref}" t="s"{style_attr}><v>{s_id}</v></c>')
        row_xml.append('</row>')
        sheet_data.append("".join(row_xml))

    sst_xml = ['<?xml version="1.0" encoding="UTF-8" standalone="yes"?>',
               f'<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" count="{len(shared_strings)}" uniqueCount="{len(shared_strings)}">']
    for s in shared_strings:
        sst_xml.append(f'<si><t>{escape_xml(s)}</t></si>')
    sst_xml.append('</sst>')

    sheet1_xml = f"""<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetViews>
    <sheetView tabSelected="1" workbookViewId="0">
      <pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/>
    </sheetView>
  </sheetViews>
  <cols>
    <col min="1" max="1" width="16" customWidth="1"/>
    <col min="2" max="2" width="35" customWidth="1"/>
    <col min="3" max="3" width="30" customWidth="1"/>
    <col min="4" max="4" width="18" customWidth="1"/>
    <col min="5" max="5" width="28" customWidth="1"/>
    <col min="6" max="6" width="30" customWidth="1"/>
    <col min="7" max="7" width="15" customWidth="1"/>
    <col min="8" max="8" width="15" customWidth="1"/>
    <col min="9" max="9" width="12" customWidth="1"/>
    <col min="10" max="10" width="12" customWidth="1"/>
    <col min="11" max="11" width="18" customWidth="1"/>
  </cols>
  <sheetData>
    {"".join(sheet_data)}
  </sheetData>
</worksheet>
"""

    workbook_xml = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Requirements Traceability" sheetId="1" r:id="rId1"/>
  </sheets>
</workbook>
"""

    workbook_rels = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/sharedStrings" Target="sharedStrings.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>
"""

    content_types_xlsx = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/sharedStrings.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sharedStrings+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>
"""

    styles_xlsx = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <fonts count="3">
    <font><sz val="10"/><color rgb="FF1E293B"/><name val="Segoe UI"/></font>
    <font><b/><sz val="10"/><color rgb="FFFFFFFF"/><name val="Segoe UI"/></font>
    <font><sz val="10"/><color rgb="FF0F172A"/><name val="Segoe UI"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF0B1736"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/></border>
    <border>
      <left style="thin"><color rgb="FFCBD5E1"/></left>
      <right style="thin"><color rgb="FFCBD5E1"/></right>
      <top style="thin"><color rgb="FFCBD5E1"/></top>
      <bottom style="thin"><color rgb="FFCBD5E1"/></bottom>
    </border>
  </borders>
  <cellStyleXfs count="1">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0"/>
  </cellStyleXfs>
  <cellXfs count="3">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>
"""

    rels_xlsx = """<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>
"""

    with zipfile.ZipFile(output_xlsx_path, 'w', zipfile.ZIP_DEFLATED) as xlsx:
        xlsx.writestr('[Content_Types].xml', content_types_xlsx)
        xlsx.writestr('_rels/.rels', rels_xlsx)
        xlsx.writestr('xl/_rels/workbook.xml.rels', workbook_rels)
        xlsx.writestr('xl/workbook.xml', workbook_xml)
        xlsx.writestr('xl/styles.xml', styles_xlsx)
        xlsx.writestr('xl/sharedStrings.xml', "\n".join(sst_xml))
        xlsx.writestr('xl/worksheets/sheet1.xml', sheet1_xml)

    print(f"Generated XLSX: {output_xlsx_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    srs_md = os.path.join(base_dir, "docs", "srs", "Nexucon-Website-CMS-SRS-v1.0.md")
    srs_docx = os.path.join(base_dir, "docs", "srs", "Nexucon-Website-CMS-SRS-v1.0.docx")
    rtm_md = os.path.join(base_dir, "docs", "srs", "Nexucon-Website-CMS-Requirements-Traceability.md")
    rtm_xlsx = os.path.join(base_dir, "docs", "srs", "Nexucon-Website-CMS-Requirements-Traceability.xlsx")
    
    build_docx(srs_md, srs_docx)
    build_xlsx(rtm_md, rtm_xlsx)
