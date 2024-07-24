const express = require('express');
const multer = require('multer');
const Tesseract = require('tesseract.js');
const path = require('path');

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(express.json());

app.post('/extrair_dados', upload.single('file'), (req, res) => {
  const { path: filePath } = req.file;

  Tesseract.recognize(filePath, 'eng', { logger: m => console.log(m) })
    .then(({ data: { text } }) => {
      const dadosTalao = parseDadosTalao(text);
      res.json(dadosTalao);
    })
    .catch(error => {
      console.error(error);
      res.status(500).json({ error: 'Erro ao processar a imagem.' });
    });
});

app.post('/validar_pagamento', (req, res) => {
  const dadosTalao = req.body;
  const dadosSistema = obterDadosSistema(dadosTalao.referencia);

  const discrepancias = [];
  if (dadosSistema.valor !== dadosTalao.valor) {
    discrepancias.push("Valor não coincide.");
  }
  if (dadosSistema.data !== dadosTalao.data) {
    discrepancias.push("Data não coincide.");
  }
  if (dadosSistema.referencia !== dadosTalao.referencia) {
    discrepancias.push("Referência não coincide.");
  }

  if (discrepancias.length === 0) {
    res.json({ status: "success", message: "Pagamento validado com sucesso!" });
  } else {
    res.json({ status: "error", message: "Discrepâncias encontradas", detalhes: discrepancias });
  }
});

function parseDadosTalao(texto) {
  const dados = {};
  const valorMatch = texto.match(/Valor:\s*(\d+\.\d{2})/);
  const dataMatch = texto.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})/);
  const referenciaMatch = texto.match(/Referência:\s*(\w+)/);

  if (valorMatch) {
    dados.valor = parseFloat(valorMatch[1]);
  }
  if (dataMatch) {
    dados.data = dataMatch[1];
  }
  if (referenciaMatch) {
    dados.referencia = referenciaMatch[1];
  }

  return dados;
}

function obterDadosSistema(referencia) {
  // Simulação de consulta ao banco de dados
  return {
    valor: 100.00,
    data: "24/07/2024",
    referencia
  };
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
