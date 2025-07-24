/**
 * @file script.js
 * @description Implementação sem perdas do RLE usando um sistema de escape para garantir a integridade dos dados.
*/

const ui = {
  compress: {
    fileInput: document.getElementById("fileInputCompress"),
    button: document.getElementById("compressButton"),
    info: document.getElementById("compressInfo"),
  },
  decompress: {
    fileInput: document.getElementById("fileInputDecompress"),
    button: document.getElementById("decompressButton"),
    info: document.getElementById("decompressInfo"),
  },
};

// --- ALGORITMOS RLE SEM PERDAS (COM ESCAPE) ---

const compressRLE = (text) => {
  if (!text) return "";
  return text.replace(/([\s\S])\1*/g, (match) => {
    const count = match.length;
    const char = match[0];
    if (!isNaN(parseInt(char)) || char === "\\") {
      return `${count}\\${char}`;
    } else {
      return `${count}${char}`;
    }
  });
};

const decompressRLE = (compressedText) => {
  if (!compressedText) return "";
  let decompressedText = "";
  let i = 0;
  while (i < compressedText.length) {
    let countStr = "";
    while (i < compressedText.length && !isNaN(parseInt(compressedText[i]))) {
      countStr += compressedText[i];
      i++;
    }
    if (countStr === "")
      throw new Error(
        `Formato inválido: esperado um número de contagem na posição ${i}.`
      );
    if (i >= compressedText.length)
      throw new Error(
        "Formato inválido: contagem não é seguida por um caractere."
      );

    let char = compressedText[i];
    i++;

    if (char === "\\") {
      if (i >= compressedText.length)
        throw new Error(
          "Formato inválido: caractere de escape no final do arquivo."
        );
      char = compressedText[i];
      i++;
    }

    const count = parseInt(countStr, 10);
    decompressedText += char.repeat(count);
  }
  return decompressedText;
};

// --- FUNÇÕES AUXILIARES E EVENTOS ---

const readFileAsText = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "UTF-8");
  });
};

const downloadFile = (content, filename) => {
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
};

// Event Listener para COMPRESSÃO
ui.compress.button.addEventListener("click", async () => {
  const file = ui.compress.fileInput.files[0];
  if (!file) {
    ui.compress.info.textContent = "Erro: Nenhum arquivo selecionado.";
    return;
  }
  try {
    ui.compress.info.textContent = "Processando...";
    const originalContent = await readFileAsText(file);
    const compressedContent = compressRLE(originalContent);

    // --- LÓGICA DE INFORMAÇÃO RESTAURADA ---
    const originalSize = new Blob([originalContent]).size;
    const compressedSize = new Blob([compressedContent]).size;

    if (originalSize === 0) {
      ui.compress.info.textContent = "Arquivo vazio, nada a comprimir.";
      return;
    }

    const reduction = 100 - (compressedSize / originalSize) * 100;
    ui.compress.info.textContent = `Compressão: ${originalSize} bytes -> ${compressedSize} bytes. Redução de ${reduction.toFixed(
      2
    )}%.`;
    // --- FIM DA LÓGICA RESTAURADA ---

    downloadFile(compressedContent, `${file.name}.rle.txt`);
  } catch (error) {
    ui.compress.info.textContent = `Falha na compressão: ${error.message}`;
    console.error("Compressão falhou:", error);
  }
});

// Event Listener para DESCOMPRESSÃO
ui.decompress.button.addEventListener("click", async () => {
  const file = ui.decompress.fileInput.files[0];
  if (!file) {
    ui.decompress.info.textContent = "Erro: Nenhum arquivo selecionado.";
    return;
  }
  try {
    ui.decompress.info.textContent = "Processando...";
    const compressedContent = await readFileAsText(file);
    const decompressedContent = decompressRLE(compressedContent);
    ui.decompress.info.textContent = "Arquivo descomprimido com sucesso!";
    const originalFilename =
      file.name.replace(/\.rle\.txt$|\.txt$/i, "") || "descomprimido";
    downloadFile(decompressedContent, `${originalFilename}.descomprimido.txt`);
  } catch (error) {
    ui.decompress.info.textContent = `Erro: ${error.message}`;
    console.error("Descompressão falhou:", error);
  }
});
