const mongoose = require('mongoose');

const PagamentoSchema = new mongoose.Schema({
  valor: {
    type: Number,
    required: true
  },
  data: {
    type: String,
    required: true
  },
  referencia: {
    type: String,
    required: true,
    unique: true
  },
  caixa: {
    type: String,
    required: true
  }
});

const Pagamento = mongoose.model('Pagamento', PagamentoSchema);

module.exports = Pagamento;
