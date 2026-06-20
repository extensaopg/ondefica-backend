const bcrypt = require('bcrypt')
const crypto = require('crypto')
const Usuario = require('../models/Usuario')
const { enviarEmailAtivacao, enviarEmailReset } = require('../services/emailService')

function gerarTokenComExpiracao() {
    const token = crypto.randomBytes(32).toString('hex')

    const expira = new Date()
    expira.setHours(expira.getHours() + 1)

    return { token, expira }
}

async function processarContaNaoAtivada(user) {

    const tokenValido =
        user.token_ativacao &&
        user.token_ativacao_expira &&
        user.token_ativacao_expira > new Date()

    if (tokenValido) {
        return {
            novoEmailEnviado: false
        }
    }

    const { token, expira } = gerarTokenComExpiracao()

    await enviarEmailAtivacao(user.email, token)

    user.token_ativacao = token
    user.token_ativacao_expira = expira

    await user.save()

    return {
        novoEmailEnviado: true
    }
}





async function criarUsuario(req, res) {
    try {
        const { nome, email, senha } = req.body

        if (!nome || !email || !senha) {
            return res.status(400).json({
                message: 'Nome, email e senha são obrigatórios'
            })
        }

        const existente = await Usuario.findOne({ email })

        if (existente) {

            if (existente.ativo) {
                return res.status(409).json({
                    message: 'Email já cadastrado'
                })
            }

            try {
                const resultado = await processarContaNaoAtivada(existente)

                return res.status(
                    resultado.novoEmailEnviado ? 201 : 200
                ).json({
                    message: resultado.novoEmailEnviado
                        ? 'Novo email de ativação enviado.'
                        : 'Sua conta ainda não foi ativada. Verifique o email enviado anteriormente.'
                })
            } catch (err) {
                console.error(err)

                return res.status(502).json({
                    message: 'Erro ao enviar email de ativação. Tente novamente.'
                })
            }
        }

        const senhaHash = await bcrypt.hash(senha, 10)

        const { token, expira } = gerarTokenComExpiracao()

        try {
            await enviarEmailAtivacao(email, token)
        } catch (err) {
            console.error(err)

            return res.status(502).json({
                message: 'Erro ao enviar email de ativação. Tente novamente.'
            })
        }

        await Usuario.create({
            nome,
            email,
            senha: senhaHash,
            ativo: false,
            token_ativacao: token,
            token_ativacao_expira: expira
        })

        return res.status(201).json({
            message: 'Usuário criado! Verifique seu email para ativar a conta.'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao criar usuário'
        })
    }
}

async function ativarConta(req, res) {
    try {
        const { token } = req.params

        const user = await Usuario.findOne({ token_ativacao: token })

        if (!user) {
            return res.status(400).json({
                message: 'Token inválido'
            })
        }

        user.ativo = true
        user.token_ativacao = null
        user.token_ativacao_expira = null

        await user.save()

        return res.json({
            message: 'Conta ativada com sucesso'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao ativar conta'
        })
    }
}

async function login(req, res) {
    try {
        const { email, senha } = req.body

        if (!email || !senha) {
            return res.status(400).json({
                message: 'Email e senha são obrigatórios'
            })
        }

        const user = await Usuario.findOne({ email })

        if (!user) {
            return res.status(401).json({
                message: 'Usuário não encontrado'
            })
        }
        if (!user.ativo) {
            try {
                const resultado = await processarContaNaoAtivada(user)

                return res.status(401).json({
                    message: resultado.novoEmailEnviado
                        ? 'Conta não ativada. Um novo email de ativação foi enviado.'
                        : 'Conta não ativada. Verifique o email de ativação enviado anteriormente.'
                })
            } catch (err) {
                console.error(err)

                return res.status(502).json({
                    message: 'Erro ao enviar email de ativação'
                })
            }
        }

        const senhaOk = await bcrypt.compare(senha, user.senha)

        if (!senhaOk) {
            return res.status(401).json({
                message: 'Senha inválida'
            })
        }

        req.session.user = {
            id: user._id,
            nome: user.nome,
            email: user.email
        }

        return res.json({
            message: 'Login realizado com sucesso'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro no login'
        })
    }
}

async function esqueciSenha(req, res) {
    try {
        const { email } = req.body

        const user = await Usuario.findOne({ email })

        if (!user) {
            return res.status(400).json({
                message: 'Email não encontrado'
            })
        }

        if (!user.ativo) {
            try {
                const resultado = await processarContaNaoAtivada(user)

                return res.status(400).json({
                    message: resultado.novoEmailEnviado
                        ? 'Sua conta ainda não foi ativada. Um novo email de ativação foi enviado.'
                        : 'Sua conta ainda não foi ativada. Verifique o email de ativação enviado anteriormente.'
                })
            } catch (err) {
                console.error(err)

                return res.status(502).json({
                    message: 'Erro ao enviar email de ativação'
                })
            }
        }

        const { token, expira } = gerarTokenComExpiracao()

        try {
            await enviarEmailReset(email, token)
        } catch (err) {
            console.error(err)

            return res.status(502).json({
                message: 'Erro ao enviar email de recuperação'
            })
        }

        user.reset_token = token
        user.reset_expira = expira

        await user.save()

        return res.json({
            message: 'Email enviado com instruções de recuperação'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao processar solicitação'
        })
    }
}

async function resetSenha(req, res) {
    try {
        const { token } = req.params
        const { senha } = req.body

        const user = await Usuario.findOne({ reset_token: token })

        if (!user) {
            return res.status(400).json({
                message: 'Token inválido'
            })
        }

        if (new Date() > user.reset_expira) {
            return res.status(400).json({
                message: 'Token expirado'
            })
        }

        user.senha = await bcrypt.hash(senha, 10)
        user.reset_token = null
        user.reset_expira = null

        await user.save()

        return res.json({
            message: 'Senha alterada com sucesso'
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao redefinir senha'
        })
    }
}

async function me(req, res) {
    console.log("COOKIE RECEBIDO:", req.headers.cookie)
    console.log("SESSION:", req.session)
    try {
        if (!req.session.user) {
            return res.status(401).json({
                message: 'Não autenticado'
            })
        }

        return res.json(req.session.user)

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao buscar usuário'
        })
    }
}
async function logout(req, res) {
    try {
        req.session.destroy((err) => {
            if (err) {
                return res.status(500).json({
                    message: 'Erro ao fazer logout'
                })
            }

            res.clearCookie('connect.sid')

            return res.json({
                message: 'Logout realizado com sucesso'
            })
        })
    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao fazer logout'
        })
    }
}

async function validarTokenReset(req, res) {
    try {
        const { token } = req.params

        const user = await Usuario.findOne({
            reset_token: token
        })

        if (!user) {
            return res.status(404).json({
                valido: false,
                motivo: 'invalido'
            })
        }

        if (new Date() > user.reset_expira) {
            return res.status(410).json({
                valido: false,
                motivo: 'expirado'
            })
        }

        return res.json({
            valido: true
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            valido: false,
            motivo: 'erro'
        })
    }
}

async function validarEmail(req, res) {
    try {
        const { email } = req.params

        if (!email) {
            return res.status(400).json({
                message: 'Email é obrigatório'
            })
        }

        const usuario = await Usuario.findOne({ email })

        if (!usuario) {
            return res.json({
                existe: false,
                ativo: false
            })
        }

        return res.json({
            existe: true,
            ativo: usuario.ativo
        })

    } catch (error) {
        console.error(error)

        return res.status(500).json({
            message: 'Erro ao validar email'
        })
    }
}

module.exports = {
    criarUsuario,
    ativarConta,
    login,
    esqueciSenha,
    resetSenha,
    me,
    logout,
    validarTokenReset,
    validarEmail,
}