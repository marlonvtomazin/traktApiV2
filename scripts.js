const generateSpreadsheetButton = document.getElementById("generateSpreadsheet");
const usernameInput = document.getElementById("username");
const clientIDInput = document.getElementById("clientID");
const radioButtons = document.getElementsByName('radio');
const langPTButton = document.getElementById('lang-pt');
const langENButton = document.getElementById('lang-en');

const translations = {
    'pt': {
        'title': 'Gerador de Planilhas Trakt',
        'h4-title': 'Baixe uma lista com seus filmes ou séries',
        'username-label': 'Username',
        'client-id-label': 'Client ID',
        'username-placeholder': 'Digite seu nome de usuário',
        'client-id-placeholder': 'Digite seu Client ID',
        'download-type-label': 'Selecione o tipo de download:',
        'movies-label': 'Filmes',
        'series-label': 'Séries',
        'generate-button': 'Gerar Planilha',
        'error-message': 'Por favor, preencha todos os campos.'
    },
    'en': {
        'title': 'Trakt Spreadsheet Generator',
        'h4-title': 'Download a list with your movies or tv shows',
        'username-label': 'Username',
        'client-id-label': 'Client ID',
        'username-placeholder': 'Enter your username',
        'client-id-placeholder': 'Enter your Client ID',
        'download-type-label': 'Select your download type:',
        'movies-label': 'Movies',
        'series-label': 'TV Show',
        'generate-button': 'Generate Spreadsheet',
        'error-message': 'Please fill in all fields.'
    }
};

let currentLang = 'pt';

function setLanguage(lang) {
    const t = translations[lang];

    document.getElementById('title').innerText = t['title'];
    document.getElementById('h4-title').innerText = t['h4-title'];
    document.getElementById('username-label').innerText = t['username-label'];
    document.getElementById('client-id-label').innerText = t['client-id-label'];
    document.getElementById('username').placeholder = t['username-placeholder'];
    document.getElementById('clientID').placeholder = t['client-id-placeholder'];
    document.getElementById('download-type-label').innerText = t['download-type-label'];
    document.querySelector('label[for="movies"]').innerText = t['movies-label'];
    document.querySelector('label[for="series"]').innerText = t['series-label'];
    document.getElementById('generateSpreadsheet').innerText = t['generate-button'];

    // Lógica para ativar o botão de idioma
    if (lang === 'pt') {
        langPTButton.classList.add('active-lang');
        langENButton.classList.remove('active-lang');
    } else {
        langENButton.classList.add('active-lang');
        langPTButton.classList.remove('active-lang');
    }
}

langPTButton.addEventListener('click', () => {
    currentLang = 'pt';
    setLanguage(currentLang);
});

langENButton.addEventListener('click', () => {
    currentLang = 'en';
    setLanguage(currentLang);
});


generateSpreadsheetButton.addEventListener("click", function() {
    const username = usernameInput.value;
    const clientID = clientIDInput.value;
    const tipoSelecionado = document.querySelector('input[name="radio"]:checked');

    if (!username || !tipoSelecionado || !clientID) {
        alert(translations[currentLang]['error-message']);
        return;
    }

    const downloadType = tipoSelecionado.value;
    const downloadUrl = `/api/create-spreadsheet`;

    const requestBody = {
        username: username,
        downloadType: downloadType,
        clientID: clientID
    };

    axios.post(downloadUrl, requestBody, {
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
        
        const reader = new FileReader();
        reader.onload = function() {
            try {
                const errorData = JSON.parse(reader.result);
                alert(`Erro: ${errorData.error}`);
            } catch (e) {
                alert("Ocorreu um erro desconhecido no servidor.");
            }
        };
        if (error.response && error.response.data) {
             reader.readAsText(error.response.data);
        } else {
            alert("Não foi possível gerar o download. Verifique o nome de usuário e as credenciais.");
        }
    });
});