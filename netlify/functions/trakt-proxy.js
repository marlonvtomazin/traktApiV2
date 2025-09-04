const axios = require('axios');
const Excel = require('excel4node');

// Acessa a variável de ambiente com segurança
const traktApiKey = process.env.TRAKT_CLIENT_ID;

exports.handler = async (event) => {
    // Log de teste para confirmar que a função está sendo executada
    console.log("Função Netlify ativada.");
    console.log("Valor da TRAKT_CLIENT_ID:", traktApiKey);

    const { httpMethod, path, queryStringParameters, body } = event;

    // Rota GET para gerar e fazer o download da planilha
    if (httpMethod === 'GET' && path.endsWith('/download-spreadsheet')) {
        try {
            const { username, type } = queryStringParameters;
            try {
                const { username, type } = queryStringParameters;

                if (!username || !type || !traktApiKey) {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({ error: 'Dados incompletos ou chave da API ausente.' }),
                    };
                }

                const url = `https://api.trakt.tv/users/${username}/watched/${type}`;

                // Log de depuração para confirmar o ponto de execução
                console.log("Fazendo requisição para a Trakt API...");

                // **NOVO BLOCO DE ERRO: Isolando a chamada Axios**
                let response;
                try {
                    response = await axios.get(url, {
                        headers: {
                            'trakt-api-version': '2',
                            'trakt-api-key': traktApiKey,
                        },
                        timeout: 5000 // A requisição falhará se demorar mais de 5 segundos
                    });
                } catch (axiosError) {
                    // Se houver um erro, ele será capturado aqui
                    console.error("Erro interno do Axios:", axiosError.message);
                    console.error("Erro completo:", JSON.stringify(axiosError.toJSON()));

                    // Repasse o erro para o bloco catch principal
                    throw axiosError;
                }

                const data = response.data;
                if (data.length === 0) {
                    return {
                        statusCode: 404,
                        body: JSON.stringify({ error: 'Nenhum dado encontrado para o usuário ou tipo de download.' }),
                    };
                }

                const wb = new Excel.Workbook();
                const ws = wb.addWorksheet('Dados');

                const headers = ['Título', 'Ano', 'Visto em'];
                headers.forEach((header, index) => {
                    ws.cell(1, index + 1).string(header);
                });

                let row = 2;
                data.forEach(item => {
                    const media = type === 'movies' ? item.movie : item.show;
                    const title = media ? media.title : 'N/A';
                    const year = media ? media.year : 'N/A';
                    const lastWatched = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : 'N/A';

                    ws.cell(row, 1).string(title);
                    ws.cell(row, 2).number(year);
                    ws.cell(row, 3).string(lastWatched);
                    row++;
                });

                const buffer = await wb.writeToBuffer();
                const fileName = `${username}_${type}.xlsx`;

                return {
                    statusCode: 200,
                    headers: {
                        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                        'Content-Disposition': `attachment; filename="${fileName}"`,
                    },
                    body: buffer.toString('base64'),
                    isBase64Encoded: true,
                };

            } catch (error) {
                // Loga o erro completo para debug.
                console.error('Ocorreu um erro na requisição:', error);

                if (error.response) {
                    console.error('Erro da API da Trakt:', error.response.status, error.response.data);
                    return {
                        statusCode: error.response.status,
                        body: JSON.stringify(error.response.data)
                    };
                } else {
                    console.error('Erro de rede ou desconhecido:', error.message);
                    return {
                        statusCode: 500,
                        body: JSON.stringify({ error: 'Erro de rede ou no servidor. Tente novamente.' })
                    };
                }
            }
        }

    // Rota POST para obter o token de autenticação
    if (httpMethod === 'POST' && path.endsWith('/proxy')) {
            try {
                const body = JSON.parse(event.body);
                const response = await axios.post("https://api.trakt.tv/oauth/token", body, {
                    headers: { 'Content-Type': 'application/json' }
                });
                return {
                    statusCode: response.status,
                    body: JSON.stringify(response.data),
                };
            } catch (error) {
                console.error('Ocorreu um erro no proxy de autenticação:', error);
                return {
                    statusCode: error.response?.status || 500,
                    body: JSON.stringify({ error: 'Erro no proxy de autenticação.' }),
                };
            }
        }

        return {
            statusCode: 404,
            body: "Not Found",
        };
    };