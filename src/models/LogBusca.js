const mongoose = require('mongoose')

const LogBuscaSchema = new mongoose.Schema({
    termo: String,
    data: { type: Date, default: Date.now }
})

module.exports = mongoose.model('LogBusca', LogBuscaSchema)