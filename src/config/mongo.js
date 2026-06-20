const mongoose = require('mongoose')

async function connectMongo() {
    try {
        await mongoose.connect(process.env.MONGO_URL)

        console.log('MongoDB conectado')
    } catch (error) {
        console.error('Erro ao conectar MongoDB:', error)
        process.exit(1)
    }
}

module.exports = connectMongo