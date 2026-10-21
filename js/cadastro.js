
const API_URL = "https://controleestoqueescolar.ifree.page/api";

const formCadastro = document.getElementById("formCadastro");
const mensagem = document.getElementById("mensagem");
const botaoCadastrar = document.getElementById("btnCadastrar");

formCadastro.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    mensagem.textContent = "";
    mensagem.className = "mensagem";

    const nome = document.getElementById("nome").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value;
    const confirmarSenha = document.getElementById("confirmarSenha").value;

    if (senha.length < 8) {
        mensagem.textContent = "A senha deve ter pelo menos 8 caracteres.";
        return;
    }

    if (senha !== confirmarSenha) {
        mensagem.textContent = "As senhas não coincidem.";
        return;
    }

    botaoCadastrar.disabled = true;
    botaoCadastrar.textContent = "Cadastrando...";

    try {
        const resposta = await fetch(`${API_URL}/usuarios`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                nome: nome,
                email: email,
                senha: senha
            })
        });

        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            mensagem.textContent =
                dados.mensagem || "Não foi possível realizar o cadastro.";
            return;
        }

        mensagem.textContent =
            dados.mensagem || "Cadastro realizado com sucesso!";

        formCadastro.reset();

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível conectar à API. Tente novamente.";

        console.error("Erro no cadastro:", erro);

    } finally {
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Criar conta";
    }
});
