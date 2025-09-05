const axios = require('axios');
const Excel = require('excel4node');

//const traktClientSecret = process.env.TRAKT_CLIENT_SECRET;

exports.handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ error: 'Método não permitido.' }),
        };
    }

    try {
        const body = JSON.parse(event.body);
        const { username, downloadType, clientID } = body;

        if (!username || !downloadType || !clientID) {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Nome de usuário, tipo de download ou Client ID não fornecido.' }),
            };
        }
        
        if (!clientID) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: 'A chave da API da Trakt (clientID) não está sendo enviada.' }),
            };
        }

        const url = `https://api.trakt.tv/users/${username}/watched/${downloadType}`;
        
        let response;
        try {
            response = await axios.get(url, {
                headers: {
                    'trakt-api-version': '2',
                    'trakt-api-key': clientID, // Usa o Client ID enviado pelo usuário
                },
                timeout: 8000
            });
        } catch (axiosError) {
            console.error("Erro interno do Axios:", axiosError.message);
            if (axiosError.response) {
                console.error("Erro da API da Trakt:", axiosError.response.status, axiosError.response.data);
            }
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

        const headers = (downloadType === 'movies') ? ['Movies', 'Times Watched', 'Last Watched'] : ['Show', 'Times Watched', 'Last Watched'];
        headers.forEach((header, index) => {
            ws.cell(1, index + 1).string(header).style({
                font: {
                    bold: true
                }
            });
            ws.column(index + 1).setWidth(headers[index] === 'Movies' || headers[index] === 'Show' ? 50 : 20);
        });

        let count = 2;
        let totalPlays = 0;

        data.forEach(item => {
            const media = (downloadType === 'movies') ? item.movie : item.show;
            const title = media ? media.title : 'N/A';
            const plays = item.plays || 0;
            const lastWatched = item.last_watched_at ? new Date(item.last_watched_at).toLocaleDateString() : 'N/A';
            
            ws.cell(count, 1).string(title);
            ws.cell(count, 3).string(lastWatched);
            ws.cell(count, 2).number(plays);
            
            totalPlays += plays;
            count++;
        });
        
        const totalItems = count - 2;
        ws.cell(count + 1, 1).string(`Total de ${downloadType}: ${totalItems}`);
        ws.cell(count + 1, 2).string(`Total de ${downloadType === 'movies' ? 'filmes vistos' : 'episódios vistos'}: ${totalPlays}`);

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
        let statusCode = 500;
        let errorMessage = 'Erro de rede ou no servidor. Tente novamente.';

        if (error.response) {
            statusCode = error.response.status;
            errorMessage = JSON.stringify(error.response.data);
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