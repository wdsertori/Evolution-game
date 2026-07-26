#!/usr/bin/env python3
"""
Gera index.html a partir de rumo-a-lagoa.jsx.

Uso:
    python3 build.py

Pega o componente React puro (rumo-a-lagoa.jsx), remove a linha de
import e o "export default", e embrulha tudo num HTML autocontido que
carrega React + ReactDOM + Babel standalone + Tailwind via CDN. O
resultado (index.html) roda offline em qualquer navegador, sem build
step, sem servidor — inclusive Safari do iPhone abrindo o arquivo
local direto pelo app Arquivos.
"""
import re

SRC = "rumo-a-lagoa.jsx"
OUT = "index.html"

HEAD = """<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
<title>Evo Path</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.2.0/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.2.0/umd/react-dom.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.23.5/babel.min.js"></script>
<link href="https://cdnjs.cloudflare.com/ajax/libs/tailwindcss/2.2.19/tailwind.min.css" rel="stylesheet" />
<style>html,body{margin:0;padding:0;}</style>
</head>
<body>
<div id="root"></div>
<script type="text/babel" data-presets="react">
const { useState, useEffect, useCallback, useRef } = React;
"""

TAIL = """
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<FishGame />);
</script>
</body>
</html>
"""


def main():
    with open(SRC, "r", encoding="utf-8") as f:
        src = f.read()

    src = re.sub(r"^import.*\n", "", src, flags=re.MULTILINE)
    src = src.replace("export default function FishGame", "function FishGame")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write(HEAD + src + TAIL)

    print(f"OK: {OUT} gerado a partir de {SRC}")


if __name__ == "__main__":
    main()
