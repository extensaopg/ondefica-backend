const axios = require('axios')

const BREVO_URL = 'https://api.brevo.com/v3/smtp/email'

async function sendEmail(destination, subject, body) {
    try {
        await axios.post(
            BREVO_URL,
            {
                sender: {
                    name: "Onde fica?",
                    email: process.env.EMAIL_USER
                },
                to: [
                    { email: destination }
                ],
                subject,
                htmlContent: body
            },
            {
                headers: {
                    'api-key': process.env.BREVO_API_KEY,
                    'content-type': 'application/json'
                }
            }
        )

        console.log("EMAIL ENVIADO VIA BREVO API")
        return true

    } catch (err) {
        console.error("ERRO BREVO:", err.response?.data || err.message)
        throw new Error('Falha ao enviar email')
    }
}

async function enviarEmailNovoUsuarioPendente({ nome, email, token }) {

    const painelLink = `${process.env.FRONTEND_URL}/ativar-conta?token=${token}`

    const html = `
    <div style="background:#f4f6f8;padding:40px 0;font-family:Arial;">
        <div style="max-width:520px;margin:0 auto;background:#ffffff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

            <h2 style="color:#d32f2f;text-align:center;margin-bottom:10px;">
                Onde Fica? - Novo Usuário Pendente
            </h2>

            <p style="font-size:14px;color:#555;text-align:center;">
                Um novo usuário se cadastrou na plataforma <strong>Onde Fica?</strong> e aguarda sua aprovação.
            </p>

            <div style="background:#f9f9f9;padding:15px;border-radius:8px;margin:20px 0;">
                <p style="margin:5px 0;"><strong>Nome:</strong> ${nome}</p>
                <p style="margin:5px 0;"><strong>Email:</strong> ${email}</p>
            </div>

            <div style="text-align:center;margin:30px 0;">
                <a href="${painelLink}"
                   style="background:#1976d2;color:#fff;padding:12px 18px;text-decoration:none;border-radius:6px;font-weight:bold;">
                   Acessar painel de aprovação
                </a>
            </div>

            <p style="font-size:12px;color:#888;text-align:center;">
                Você está recebendo este email porque é administrador da plataforma <strong>Onde Fica?</strong>.
            </p>

        </div>
    </div>
    `

    return sendEmail(
        process.env.ADMIN_EMAIL,
        `Onde Fica? - Novo usuário aguardando aprovação  ${nome} (${email})`,
        html,
        true
    )
}

async function enviarEmailReset(email, token) {
    const link = `${process.env.FRONTEND_URL}/reset-senha?token=${token}`

    const html = `
    <div style="background:#f4f6f8;padding:40px 0;font-family:Arial;">
        <div style="max-width:500px;margin:0 auto;background:#ffffff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

            <h2 style="color:#d32f2f;text-align:center;margin-bottom:10px;">
                Redefinição de Senha
            </h2>

            <p style="font-size:14px;color:#555;text-align:center;">
                Recebemos uma solicitação para redefinir sua senha.
                <br/>Se não foi você, ignore este email.
            </p>

            <div style="text-align:center;margin:30px 0;">
                <a href="${link}"
                   style="background:#d32f2f;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                   Redefinir senha
                </a>
            </div>

            <p style="font-size:13px;color:#555;text-align:center;">
                ⏳ Este link expira em <strong>1 hora</strong>.
            </p>

            <p style="font-size:12px;color:#888;text-align:center;">
                Se o botão não funcionar, copie e cole:
            </p>

            <p style="font-size:12px;color:#d32f2f;text-align:center;word-break:break-all;">
                ${link}
            </p>

        </div>
    </div>
    `

    return sendEmail(email, 'Redefinição de Senha - Onde fica?', html, true)
}

module.exports = {
    enviarEmailNovoUsuarioPendente,
    enviarEmailReset
}