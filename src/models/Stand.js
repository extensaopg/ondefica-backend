const mongoose = require('mongoose')

const StandSchema = new mongoose.Schema({
    nome: {
        type: String,
        required: true,
        trim: true
    },
    imagem: { 
        type: String, 
        default: "" 
    },
    descricao: {
        type: String,
        trim: true
    },
    data_inicio: {
        type: Date,
        required: true
    },
    data_fim: {
        type: Date,
        required: true
    },
    latitude: {
        type: Number,
        required: true
    },
    longitude: {
        type: Number,
        required: true
    },
    cor_icone: {
        type: String,
        default: '#1976d2'
    },
    eventoId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Evento',
        required: true
    }
}, {
    timestamps: true
})

// Índice de texto para busca por nome e descrição
StandSchema.index({ nome: 'text', descricao: 'text' })

module.exports = mongoose.model('Stand', StandSchema)
