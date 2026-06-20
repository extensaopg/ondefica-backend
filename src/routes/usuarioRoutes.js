const express = require('express')
const router = express.Router()
const auth = require('../../middlewares/auth')
const {
    criarUsuario,
    ativarConta,
    login,
    esqueciSenha,
    resetSenha,
    me,
    validarTokenReset,
    validarEmail
} = require('../controllers/usuarioController')

router.post('/', criarUsuario)
router.get('/ativar/:token', ativarConta)
router.post('/login', login)
router.post('/esqueci-senha', esqueciSenha)
router.post('/reset-senha/:token', resetSenha)
router.get('/me', auth, me)
router.get('/reset/:token/validar', validarTokenReset)
router.get('/validar-email/:email', validarEmail)
module.exports = router