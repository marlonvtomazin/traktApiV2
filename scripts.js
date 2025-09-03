const generateToken = document.getElementById("generateToken")
const usernameInput = document.getElementById("username")
const radioButtons = document.getElementsByName('radio');

const username = document.getElementById('username');
const authorizeCode = document.getElementById('authorizeCode');
const clientID = document.getElementById('clientID');
const clientSecret = document.getElementById('clientSecret');

//import * as axios from 'https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js';
//import userConfig from './userConfig.json' with { type: 'json' };

generateToken.onclick = function () {
    let authToken = getBearer()
    console.log("Token: " + authToken)
    alert(authToken)
}

// Adiciona um listener para cada botão, ou ao formulário
document.addEventListener('change', function () {
    // Seleciona o elemento de rádio que está checado no grupo 'radio'
    const radioSelecionado = document.querySelector('input[name="radio"]:checked');
    alert(radioSelecionado.value);
})



function getBearer() {
    console.log(username.value)
    console.log(authorizeCode.value)
    console.log(clientID.value)
    console.log(clientSecret.value)
    var jsonBody = {
        "code": authorizeCode.value,//userConfig.authorizeCode,
        "client_id": clientID.value,//userConfig.clientID,
        "client_secret": clientSecret.value,//userConfig.clientSecret,
        "redirect_uri": "urn:ietf:wg:oauth:2.0:oob",
        "grant_type": "authorization_code",
    }
    var headers = { 'content-type': 'application/json', "Access-Control-Allow-Origin": "*" }
    var response = axios.post("https://api.trakt.tv/oauth/token", jsonBody, { headers: headers })
        .then(response => {
            if (response.data.access_token && response.data.token_type) {
                console.log("authToken found: " + response.data.token_type + " " + response.data.access_token)
                userConfig.authToken = response.data.token_type + " " + response.data.access_token
                //fs.writeFileSync(filePath, JSON.stringify(userConfig));
                return userConfig.authToken
            } else if (response.data.error) {
                console.log("Error: " + response.data.error_description)
            }
        })
        .catch(err => {
            console.log('Error: ', err.message);
            return false
        });

}

