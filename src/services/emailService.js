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
async function enviarEmailAtivacao(email, token) {
    const link = `${process.env.FRONTEND_URL}/ativar-conta?token=${token}`

    const html = `
    <div style="background:#f4f6f8;padding:40px 0;font-family:Arial;">
        <div style="max-width:500px;margin:0 auto;background:#ffffff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.08);">

            <h2 style="color:#1976d2;text-align:center;margin-bottom:10px;">
                Ativação de Conta
            </h2>

            <p style="font-size:14px;color:#555;text-align:center;">
                Seja bem-vindo ao <strong>Onde fica?</strong> 🎉<br/>
                Para começar, confirme sua conta clicando no botão abaixo.
            </p>

            <div style="text-align:center;margin:30px 0;">
                <a href="${link}"
                   style="background:#1976d2;color:#fff;padding:12px 20px;text-decoration:none;border-radius:6px;display:inline-block;font-weight:bold;">
                   Ativar minha conta
                </a>
            </div>

            <p style="font-size:12px;color:#888;text-align:center;">
                Se o botão não funcionar, copie e cole este link no navegador:
            </p>

            <p style="font-size:12px;color:#1976d2;text-align:center;word-break:break-all;">
                ${link}
            </p>

        </div>
    </div>
    `

    return sendEmail(email, 'Ativação da conta - Onde fica?', html, true)
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
    enviarEmailAtivacao,
    enviarEmailReset
}