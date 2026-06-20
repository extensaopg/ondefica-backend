function auth(req, res, next) {
    if (!req.session.user) {
        return res.status(401).json({
            message: 'Não autenticado'
        })
    }

    next()
}

module.exports = auth