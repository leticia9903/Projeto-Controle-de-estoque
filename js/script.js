const API_URL = "http://localhost:8000";

const formLogin = document.getElementById("formLogin");
const mensagem = document.getElementById("mensagem");
const botaoEntrar = document.getElementById("botaoEntrar");

formLogin.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    mensagem.textContent = "";

    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;

    botaoEntrar.disabled = true;
    botaoEntrar.textContent = "Entrando...";

    try {
        const resposta = await fetch(`${API_URL}/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ email, senha })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mensagem.textContent =
                dados.mensagem || "Não foi possível realizar o login.";
            return;
        }

        const usuario = dados.usuario;

        sessionStorage.setItem("usuarioId", usuario.id);
        sessionStorage.setItem("usuarioNome", usuario.nome);
        sessionStorage.setItem("usuarioEmail", usuario.email);

        window.location.href = "painel.html";

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível conectar à API. Verifique se o servidor está aberto.";
        console.error("Erro no login:", erro);

    } finally {
        botaoEntrar.disabled = false;
        botaoEntrar.textContent = "Entrar no sistema";
    }
});