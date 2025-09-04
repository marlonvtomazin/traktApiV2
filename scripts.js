const generateSpreadsheetButton = document.getElementById("generateSpreadsheet");
const usernameInput = document.getElementById("username");
const radioButtons = document.getElementsByName('radio');

generateSpreadsheetButton.addEventListener("click", function() {
    const username = usernameInput.value;
    const tipoSelecionado = document.querySelector('input[name="radio"]:checked');

    if (!username || !tipoSelecionado) {
        alert("Por favor, preencha o nome de usuário e selecione o tipo de download.");
        return;
    }

    const downloadType = tipoSelecionado.value;
    // O URL agora aponta para a sua função Netlify
    const downloadUrl = `/.netlify/functions/trakt-proxy?username=${username}&type=${downloadType}`;
    
    axios.get(downloadUrl, {
        responseType: 'blob'
    })
    .then(response => {
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
        alert("Não foi possível gerar o download. Verifique o nome de usuário e as credenciais.");
    });
});