const generateSpreadsheetButton = document.getElementById("generateSpreadsheet");
const usernameInput = document.getElementById("username");
const clientIDInput = document.getElementById("clientID");
const radioButtons = document.getElementsByName('radio');

generateSpreadsheetButton.addEventListener("click", function() {
    const username = usernameInput.value;
    const tipoSelecionado = document.querySelector('input[name="radio"]:checked');

    if (!username || !tipoSelecionado) {
        alert("Por favor, preencha o nome de usuário e selecione o tipo de download.");
        return;
    }

    const downloadType = tipoSelecionado.value;
    const clientID = clientIDInput.value;
    
    // A URL aponta para a nova rota POST
    const downloadUrl = `/api/create-spreadsheet`;

    // Dados são enviados no corpo da requisição
    const requestBody = {
        username: username,
        downloadType: downloadType,
        clientID: clientID
    };

    axios.post(downloadUrl, requestBody, {
        responseType: 'blob'
    })
    .then(response => {
        // A lógica de download permanece a mesma
        const blob = new Blob([response.data], { type: response.headers['content-type'] });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        
        const contentDispositionHeader = response.headers['content-disposition'];
        const filenameMatch = /filename="([^"]+)"/.exec(contentDispositionHeader);
        
        if (filenameMatch && filenameMatch.length > 1) {
            a.download = filenameMatch[1];
        } else {
            a.download = `${username}_${downloadType}.xlsx`;
        }
        
        document.body.appendChild(a);
        a.click();
        
        window.URL.revokeObjectURL(url);
        a.remove();
    })
    .catch(error => {
        console.error("Erro no download:", error);
        
        // Tenta ler a mensagem de erro da resposta do servidor
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const errorData = JSON.parse(reader.result);
                alert(`Erro: ${errorData.error}`);
            } catch (e) {
                alert("Ocorreu um erro desconhecido no servidor.");
            }
        };
        // A resposta de erro é um blob, então precisamos ler o conteúdo
        if (error.response && error.response.data) {
             reader.readAsText(error.response.data);
        } else {
            alert("Não foi possível gerar o download. Verifique o nome de usuário e a sua conexão.");
        }
    });
});