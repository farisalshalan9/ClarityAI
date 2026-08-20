import os
import fitz  # PyMuPDF
from typing import Dict, List, Any, Optional

class PDFService:
    @staticmethod
    def extract_document_info(file_path: str) -> Dict[str, Any]:
        """Extract metadata, total pages, and full extracted text per page."""
        doc = fitz.open(file_path)
        page_count = len(doc)
        pages_text = []
        full_text_list = []
        
        for page_num in range(page_count):
            page = doc[page_num]
            text = page.get_text()
            pages_text.append({
                "page": page_num + 1,
                "text": text.strip()
            })
            if text.strip():
                full_text_list.append(f"--- PAGE {page_num + 1} ---\n{text.strip()}")
                
        doc.close()
        
        return {
            "page_count": page_count,
            "pages": pages_text,
            "full_text": "\n\n".join(full_text_list)
        }

    @staticmethod
    def render_page_image(file_path: str, page_number: int, zoom: float = 1.5) -> bytes:
        """Render a specific PDF page as PNG bytes for instant split-screen display."""
        doc = fitz.open(file_path)
        if page_number < 1 or page_number > len(doc):
            doc.close()
            raise ValueError(f"Page number {page_number} is out of bounds (1-{len(doc)})")
        
        page = doc[page_number - 1]
        mat = fitz.Matrix(zoom, zoom)
        pix = page.get_pixmap(matrix=mat, alpha=False)
        img_bytes = pix.tobytes("png")
        doc.close()
        return img_bytes

    @staticmethod
    def search_text_in_pdf(file_path: str, query: str) -> List[Dict[str, Any]]:
        """Search query text and return matching pages with snippets."""
        doc = fitz.open(file_path)
        results = []
        query_lower = query.lower()
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            if query_lower in text.lower():
                # Extract surrounding snippet
                idx = text.lower().find(query_lower)
                start = max(0, idx - 80)
                end = min(len(text), idx + len(query) + 80)
                snippet = "..." + text[start:end].replace("\n", " ").strip() + "..."
                results.append({
                    "page": page_num + 1,
                    "snippet": snippet
                })
        doc.close()
        return results

pdf_service = PDFService()
