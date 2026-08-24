#!/usr/bin/env python3
"""Generate demo deck PDF + public/decks/demo/deck.json (Phase 1 rehearsal)."""

from __future__ import annotations

import json
import os
import platform
from pathlib import Path

from fpdf import FPDF, XPos, YPos

ROOT = Path(__file__).resolve().parent.parent
OUT_DIR = ROOT / "public" / "decks" / "demo"

# Keep in sync with content/decks/demo/slides/*.md page order.
SLIDES = [
    {
        "title": "Phase 1 彩排验收",
        "bullets": [
            "SSreporter 虚拟答辩助手",
            "照着稿子念 PPT — 闭环演示",
            "演示场次：demo",
        ],
    },
    {
        "title": "本次彩排要验证什么",
        "bullets": [
            "Director 队列：按讲稿逐条播报",
            "TTS 朗读 + VRM 口型",
            "slide_action 驱动 PDF 翻页",
            "编辑讲稿 → 编译 → 播放",
        ],
    },
    {
        "title": "讲稿工作流（Plan B）",
        "bullets": [
            "slides/NN.md：每页 frontmatter + 正文",
            "npm run compile:deck → script.jsonl",
            "汇报模式 → 播放本场讲稿",
            "真材料请放 content-private/",
        ],
    },
    {
        "title": "汇报界面要点",
        "bullets": [
            "布局：分屏 / 画中画 / 纯幻灯",
            "画中画：无边框 + 拖动 + 窗口大小",
            "设置 → 镜头构图（上下左右 / 远近）",
            "演讲模式：隐藏面板并浏览器全屏",
        ],
    },
    {
        "title": "彩排检查清单",
        "bullets": [
            "□ 每页朗读完整、语速可接受",
            "□ 翻页与当前页讲稿一致",
            "□ 演讲模式 + 画中画位置满意",
            "□ 发现问题记入 dev-log / 待办",
        ],
    },
    {
        "title": "结束与下一步",
        "bullets": [
            "Phase 1：Present 闭环（本彩排）",
            "Phase 2：评委问答 + 知识库 RAG",
            "手势 VRMA：彩排后再抛光",
            "谢谢各位老师！",
        ],
    },
]


def resolve_chinese_font() -> Path | None:
    system = platform.system()
    if system == "Windows":
        candidates = [
            Path(r"C:\Windows\Fonts\msyh.ttc"),
            Path(r"C:\Windows\Fonts\msyhbd.ttc"),
            Path(r"C:\Windows\Fonts\simhei.ttf"),
            Path(r"C:\Windows\Fonts\simsun.ttc"),
        ]
    elif system == "Darwin":
        candidates = [
            Path("/System/Library/Fonts/PingFang.ttc"),
            Path("/System/Library/Fonts/STHeiti Light.ttc"),
            Path("/Library/Fonts/Arial Unicode.ttf"),
        ]
    else:
        candidates = [
            Path("/usr/share/fonts/truetype/noto/NotoSansCJK-Regular.ttc"),
            Path("/usr/share/fonts/opentype/noto/NotoSansCJK-Regular.ttc"),
        ]

    for candidate in candidates:
        if candidate.exists():
            return candidate
    return None


class RehearsalPdf(FPDF):
    def header(self) -> None:
        pass

    def footer(self) -> None:
        self.set_y(-14)
        self.set_font("body", size=9)
        self.set_text_color(115, 128, 148)
        self.cell(0, 8, "SSreporter · Phase 1 rehearsal", align="L")


def main() -> None:
    font_path = resolve_chinese_font()
    if font_path is None:
        raise SystemExit(
            "No CJK font found. Install a Chinese system font or set FONT_PATH."
        )

    OUT_DIR.mkdir(parents=True, exist_ok=True)

    pdf = RehearsalPdf(orientation="L", unit="pt", format=(1280, 720))
    pdf.set_auto_page_break(auto=False)
    pdf.add_font("body", "", str(font_path))
    pdf.add_font("title", "", str(font_path))
    print(f"Using font: {font_path}")

    margin_x = 72
    page_w = 1280
    page_h = 720

    for index, slide in enumerate(SLIDES):
        pdf.add_page()
        pdf.set_fill_color(31, 59, 115)
        pdf.rect(0, 0, page_w, 96, style="F")

        pdf.set_font("title", size=36)
        pdf.set_text_color(255, 255, 255)
        pdf.set_xy(margin_x, 32)
        pdf.cell(0, 40, slide["title"], new_x=XPos.LMARGIN, new_y=YPos.NEXT)

        pdf.set_font("body", size=16)
        pdf.set_text_color(217, 230, 255)
        pdf.set_xy(page_w - margin_x - 140, 38)
        pdf.cell(140, 24, f"第 {index + 1} / {len(SLIDES)} 页", align="R")

        cursor_y = 150
        pdf.set_font("body", size=24)
        pdf.set_text_color(38, 46, 61)
        for bullet in slide["bullets"]:
            pdf.set_xy(margin_x, cursor_y)
            pdf.multi_cell(page_w - margin_x * 2, 32, f"• {bullet}")
            cursor_y = pdf.get_y() + 8

    pdf_path = OUT_DIR / "slides.pdf"
    pdf.output(str(pdf_path))

    deck_json = {
        "id": "demo",
        "title": "Phase 1 彩排验收",
        "slideSource": {
            "type": "pdf",
            "url": "/decks/demo/slides.pdf",
        },
    }
    (OUT_DIR / "deck.json").write_text(
        json.dumps(deck_json, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print(f"Wrote {pdf_path} ({len(SLIDES)} pages)")


if __name__ == "__main__":
    main()
