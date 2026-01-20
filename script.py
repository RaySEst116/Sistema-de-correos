import os

EXTENSIONES_CODIGO = {
    ".py", ".js", ".ts", ".java", ".c", ".cpp", ".h", ".cs",
    ".go", ".rs", ".php", ".html", ".css", ".scss", ".vue"
}

def contar_lineas(ruta_proyecto):
    total = 0
    for root, _, files in os.walk(ruta_proyecto):
        for archivo in files:
            if os.path.splitext(archivo)[1] in EXTENSIONES_CODIGO:
                ruta_archivo = os.path.join(root, archivo)
                try:
                    with open(ruta_archivo, "r", encoding="utf-8", errors="ignore") as f:
                        total += sum(1 for _ in f)
                except Exception:
                    pass
    return total

if __name__ == "__main__":
    ruta = input("Ruta del proyecto: ").strip()
    print(f"Líneas totales de código: {contar_lineas(ruta)}")
