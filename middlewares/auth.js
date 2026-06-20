const jwt = require('jsonwebtoken')

function auth(req, res, next) {
    const header = req.headers.authorization

    if (!header) {
        return res.status(401).json({ message: 'Token não enviado' })
    }

    const token = header.split(' ')[1]

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET)

        req.user = decoded
        next()
    } catch (err) {
        return res.status(401).json({ message: 'Token inválido' })
    }
}

module.exports = auth