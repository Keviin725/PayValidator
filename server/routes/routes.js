const express = require('express')
const router = express.Router()
const multer = require('multer')
const Tesseract = require('tesseract.js')
const Pagamento = require('../models/Pagamento')

const upload = multer({ dest: 'uploads/' })

router.post('/extrair_dados', upload.single('file'), (req, res) => {
  const { path: filePath } = req.file

  Tesseract.recognize(filePath, 'eng', { logger: m => console.log(m) })
    .then(({ data: { text } }) => {
      const dadosTalao = parseDadosTalao(text)
      res.json(dadosTalao)
    })
    .catch(error => {
      console.error(error)
      res.status(500).json({ error: 'Erro ao processar a imagem.' })
    })
})

router.post('/validar_pagamento', async (req, res) => {
  const dadosTalao = req.body
  const dadosSistema = await Pagamento.findOne({ referencia: dadosTalao.referencia })

  if (!dadosSistema) {
    return res.status(404).json({ status: "error", message: "Referência não encontrada no sistema." })
  }

  const discrepancias = []
  if (dadosSistema.valor !== dadosTalao.valor) {
    discrepancias.push("Valor não coincide.")
  }
  if (dadosSistema.data !== dadosTalao.data) {
    discrepancias.push("Data não coincide.")
  }
  if (dadosSistema.referencia !== dadosTalao.referencia) {
    discrepancias.push("Referência não coincide.")
  }

  if (discrepancias.length === 0) {
    res.json({ status: "success", message: "Pagamento validado com sucesso!" })
  } else {
    res.json({ status: "error", message: "Discrepâncias encontradas", detalhes: discrepancias })
  }
})

router.post('/inserir_pagamento', async (req, res) => {
  const { valor, data, referencia } = req.body
  
  const novoPagamento = new Pagamento({
    valor,
    data,
    referencia
  })

  try {
    await novoPagamento.save()
    res.json({ status: "success", message: "Pagamento inserido com sucesso!" })
  } catch (error) {
    res.status(500).json({ status: "error", message: "Erro ao inserir pagamento.", error })
  }
})

function parseDadosTalao(texto) {
  const dados = {}
  const valorMatch = texto.match(/Valor:\s*(\d+\.\d{2})/)
  const dataMatch = texto.match(/Data:\s*(\d{2}\/\d{2}\/\d{4})/)
  const referenciaMatch = texto.match(/Referência:\s*(\w+)/)

  if (valorMatch) {
    dados.valor = parseFloat(valorMatch[1])
  }
  if (dataMatch) {
    dados.data = dataMatch[1]
  }
  if (referenciaMatch) {
    dados.referencia = (referenciaMatch[1])
  }

  return dados
}

module.exports = router
