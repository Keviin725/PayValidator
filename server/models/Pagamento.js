const mongoose = require('mongoose')

const pagamentoSchema = new mongoose.Schema({
  valor: Number,
  data: String,
  referencia: String,
})

const Pagamento = mongoose.model('Pagamento', pagamentoSchema)

module.exports = Pagamento
