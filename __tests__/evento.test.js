require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const request = require('supertest');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const app = require('../src/app'); 
const Evento = require('../src/models/Evento');
const Usuario = require('../src/models/Usuario');

beforeAll(async () => {
    // Conecta ao banco de teste
    const urlTeste = 'mongodb://admin:admin123@localhost:27017/mapa_eventos_test?authSource=admin';
    await mongoose.connect(urlTeste);
});

afterEach(async () => {
    // Limpa ambas as coleções após cada teste
    await Evento.deleteMany();
    await Usuario.deleteMany();
});

afterAll(async () => {
    await mongoose.connection.close();
});

describe('Testes da API de Eventos', () => {
    
    it('Deve criar um novo evento com sucesso', async () => {
        const eventoMock = {
            descricao: "Feira de Tecnologia",
            data_inicio: "2026-05-10T00:00:00.000Z",
            data_fim: "2026-05-12T00:00:00.000Z",
            latitude: -11.2638,
            longitude: -38.9732
        };

        const response = await request(app)
            .post('/eventos')
            .send(eventoMock);

        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('message', 'Evento criado com sucesso');
        expect(response.body).toHaveProperty('id');
    });

    it('Deve listar todos os eventos na rota pública', async () => {
        await Evento.create({
            descricao: "Congresso de Engenharia",
            data_inicio: new Date(),
            data_fim: new Date(),
            latitude: -12.0,
            longitude: -38.0
        });

        const response = await request(app).get('/eventos');

        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(1);
    });

    // NOVO TESTE: Validação da Rota Protegida "Meus Eventos"
    it('Deve listar apenas os eventos do usuário logado', async () => {
        // 1. Cria um usuário ativo direto no banco de teste
        const senhaHash = await bcrypt.hash('senha123', 10);
        const usuarioLogado = await Usuario.create({
            nome: "Admin Teste",
            email: "admin@teste.com",
            senha: senhaHash,
            ativo: true // Ativo para permitir o login
        });

        // 2. Cria um "Agente" do Supertest. O agente guarda cookies (sessão) entre as requisições!
        const agente = request.agent(app);

        // 3. Faz o login para gerar a sessão
        await agente.post('/usuarios/login').send({
            email: "admin@teste.com",
            senha: "senha123"
        });

        // 4. Cria um evento que PERTENCE ao usuário logado
        await Evento.create({
            descricao: "Meu Evento Exclusivo",
            data_inicio: new Date(),
            data_fim: new Date(),
            latitude: -11.0,
            longitude: -38.0,
            administradores: [usuarioLogado._id]
        });

        // 5. Cria um evento que PERTENCE A OUTRA PESSOA (ID Falso)
        await Evento.create({
            descricao: "Evento do Concorrente",
            data_inicio: new Date(),
            data_fim: new Date(),
            latitude: -12.0,
            longitude: -39.0,
            administradores: [new mongoose.Types.ObjectId()] // ID aleatório
        });

        // 6. Faz a requisição usando o AGENTE (que já tem o cookie de login)
        const response = await agente.get('/eventos/meus');

        // 7. Validações
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        
        // Deve retornar apenas 1 evento (ignorando o do concorrente)
        expect(response.body.length).toBe(1); 
        expect(response.body[0].descricao).toBe("Meu Evento Exclusivo");
    });

    it('Deve bloquear acesso à rota "Meus Eventos" se não estiver logado', async () => {
        // Tenta acessar sem usar o "agente" (ou seja, sem cookie de sessão)
        const response = await request(app).get('/eventos/meus');
        
        expect(response.status).toBe(401);
        expect(response.body.error).toBe('Não autenticado');
    });
});