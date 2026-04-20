import pdfplumber
import sys

pdf_path = r"c:\Users\la_no\OneDrive\Desktop\algerac-platform\documentation\procedures\PRO_22_Procedure_Traitement_Recusations_ALGERAC_Rev02_03_06_2025_sw.pdf"

try:
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            text = page.extract_text()
            if text:
                print(text)
            else:
                print(f"--- No text found on page {i+1} ---")
except Exception as e:
    print(f"Error: {e}")
