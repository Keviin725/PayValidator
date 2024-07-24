const express = require('express');
const router = express.Router();
const multer = require('multer');
const Tesseract = require('tesseract.js');
const Pagamento = require('../models/Pagamento');
const fs = require('fs');
const path = require('path');

// Configuração do multer para armazenamento dos arquivos
const upload = multer({ dest: 'uploads/' });

// Função para extrair dados do texto do talão
function parseDadosTalao(texto) {
  const dados = {};

  // Expressões regulares para encontrar o número de caixa, data e hora
  const valorMatch = texto.match(/valor:\s*([\d,]+(?:\.\d{2})?)/i);
  const caixaMatch = texto.match(/Nr de Caixa:\s*(\w+)/i);
  const dataHoraMatch = texto.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})\s*Hora:\s*(\d{2}:\d{2}:\d{2})/i);

  if (valorMatch) {
    dados.valor = parseFloat(valorMatch[1].replace(',', '.'));
  }
  if (caixaMatch) {
    dados.caixa = caixaMatch[1];
  }
  if (dataHoraMatch) {
    dados.data = dataHoraMatch[1];
    dados.hora = dataHoraMatch[2];
  }

  // Concatena Nr de Caixa, Data e Hora para formar a referência
  if (dados.caixa && dados.data && dados.hora) {
    dados.referencia = `${dados.caixa}${dados.data.replace(/\//g, '')}${dados.hora.replace(/:/g, '')}`;
  }

  return dados;
}

// Endpoint para extrair dados do talão
router.post('/extrair_dados', upload.single('file'), (req, res) => {
  try {
    const { path: filePath } = req.file;

    if (!filePath) {
      return res.status(400).json({ error: 'Imagem não fornecida.' });
    }

    // Processa a imagem com Tesseract
    Tesseract.recognize(filePath, 'por', { logger: m => console.log(m) })
      .then(({ data: { text } }) => {
        console.log('Texto extraído:', text);
        const dadosTalao = parseDadosTalao(text);
        console.log('Dados extraídos:', dadosTalao);
        // Valida o pagamento diretamente após a extração
        validarPagamento(dadosTalao, res);
      })
      .catch(error => {
        console.error('Erro ao processar a imagem com Tesseract:', error);
        res.status(500).json({ error: 'Erro ao processar a imagem.' });
      })
      .finally(() => {
        // Remove arquivos temporários
        fs.unlink(filePath, (err) => {
          if (err) console.error('Erro ao remover o arquivo:', err);
        });
      });
  } catch (error) {
    console.error('Erro ao processar o arquivo:', error);
    res.status(500).json({ error: 'Erro ao processar o arquivo.' });
  }
});

// Função para validar o pagamento com os dados extraídos
const validarPagamento = async (dadosTalao, res) => {
  console.log('Dados recebidos para validação:', dadosTalao);

  const dadosSistema = await Pagamento.findOne({ referencia: dadosTalao.referencia });
  console.log('Dados do sistema:', dadosSistema);

  if (!dadosSistema) {
    return res.status(404).json({ status: "error", message: "Dados não encontrados no sistema." });
  }

  const discrepancias = [];
  if (dadosSistema.valor !== dadosTalao.valor) {
    discrepancias.push("Valor não coincide.");
  }
  if (dadosSistema.data !== dadosTalao.data) {
    discrepancias.push("Data não coincide.");
  }
  if (dadosSistema.caixa !== dadosTalao.caixa) {
    discrepancias.push("Número de Caixa não coincide.");
  }

  if (discrepancias.length === 0) {
    res.json({ status: "success", message: "Pagamento validado com sucesso!" });
  } else {
    res.json({ status: "error", message: "Discrepâncias encontradas", detalhes: discrepancias });
  }
};

// Endpoint para inserir pagamento
router.post('/inserir_pagamento', async (req, res) => {
  const { valor, data, referencia, caixa } = req.body;
  
  const novoPagamento = new Pagamento({
    valor,
    data,
    referencia,
    caixa
  });

  try {
    await novoPagamento.save();
    res.json({ status: "success", message: "Pagamento inserido com sucesso!" });
  } catch (error) {
    res.status(500).json({ status: "error", message: "Erro ao inserir pagamento.", error });
  }
});

module.exports = router;
