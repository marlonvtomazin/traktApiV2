const axios = require('axios');
const Excel = require('excel4node');

const traktApiKey = process.env.TRAKT_CLIENT_ID;

exports.handler = async (event) => {
    // Log de teste para confirmar que a função está sendo executada
    console.log("Função Netlify ativada.");

    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método não permitido.' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { username, downloadType } = body;

        if (!username || !downloadType) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nome de usuário ou tipo de download não fornecido.' }),
            };
        }
        
        if (!traktApiKey) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'A chave da API da Trakt (TRAKT_CLIENT_ID) não está configurada.' }),
            };
        }

        const url = `https://api.trakt.tv/users/${username}/watched/${downloadType}`;
        console.log(`Fazendo requisição para a Trakt API: ${url}`);

        const response = await axios.get(url, {
            headers: {
                'trakt-api-version': '2',
                'trakt-api-key': traktApiKey,
            },
            timeout: 8000
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
            const media = downloadType === 'movies' ? item.movie : item.show;
            const title = media ? media.title : 'N/A';
            const year = media ? media.year : 'N/A';
            const lastWatched = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : 'N/A';

            ws.cell(row, 1).string(title);
            ws.cell(row, 2).number(year);
            ws.cell(row, 3).string(lastWatched);
            row++;
        });

        const buffer = await wb.writeToBuffer();
        const fileName = `${username}_${downloadType}.xlsx`;

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
        console.error('Ocorreu um erro na requisição:', error);
        
        let statusCode = 500;
        let errorMessage = 'Erro de rede ou no servidor. Tente novamente.';

        if (error.response) {
            statusCode = error.response.status;
            errorMessage = JSON.stringify(error.response.data);
            console.error('Erro da API da Trakt:', statusCode, errorMessage);
        } else if (error.message.includes('timeout')) {
            statusCode = 408;
            errorMessage = "Tempo limite da requisição excedido.";
        } else {
            console.error('Erro desconhecido:', error.message);
        }

        return {
            statusCode: statusCode,
            body: JSON.stringify({ error: errorMessage }),
        };
    }
};