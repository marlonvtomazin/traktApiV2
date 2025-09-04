const axios = require('axios');
const Excel = require('excel4node');

// Acessa a variável de ambiente com segurança
const traktApiKey = process.env.TRAKT_CLIENT_ID;

// A função 'handler' é o ponto de entrada da sua Netlify Function
exports.handler = async (event) => {
    const { httpMethod, path, queryStringParameters, body } = event;

    if (httpMethod === 'GET' && path.endsWith('/download-spreadsheet')) {
        try {
            const { username, type } = queryStringParameters;

            if (!username || !type) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ error: 'Nome de usuário ou tipo de download não fornecido.' }),
                };
            }

            const url = `https://api.trakt.tv/users/${username}/watched/${type}`;
            const response = await axios.get(url, {
                headers: {
                    'trakt-api-version': '2',
                    'trakt-api-key': traktApiKey,
                }
            });

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
            return {
                statusCode: error.response?.status || 500,
                body: JSON.stringify({ error: 'Erro ao gerar a planilha. Verifique o nome de usuário e a chave da API.' }),
            };
        }
    }

    if (httpMethod === 'POST' && path.endsWith('/proxy')) {
        // Lógica para obter o token de autenticação
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