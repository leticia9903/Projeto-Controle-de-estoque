
const API_URL = "http://localhost:8000";

const usuarioId = sessionStorage.getItem("usuarioId");
const usuarioNome = sessionStorage.getItem("usuarioNome");

const nomeUsuario = document.getElementById("nomeUsuario");
const saudacaoUsuario = document.getElementById("saudacaoUsuario");
const avatarUsuario = document.getElementById("avatarUsuario");
const listaProdutos = document.getElementById("listaProdutos");
const mensagem = document.getElementById("mensagem");

// Verifica se existe um usuário que passou pela tela de login.
if (!usuarioId) {
    window.location.href = "index.html";
} else {
    const nome = usuarioNome || "Usuário";

    nomeUsuario.textContent = nome;
    saudacaoUsuario.textContent = nome.split(" ")[0];
    avatarUsuario.textContent = nome.charAt(0).toUpperCase();

    carregarProdutos();
}

// Busca os produtos cadastrados na API.
async function carregarProdutos() {
    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar os produtos."
            );
        }

        const produtos = dados.produtos || [];

        document.getElementById("totalProdutos").textContent =
            produtos.length;

        document.getElementById("estoqueBaixo").textContent =
            produtos.filter(produto => Number(produto.quantidade) <= 1).length;

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        const limite = new Date(hoje);
        limite.setMonth(limite.getMonth() + 3);

        document.getElementById("proximosVencimento").textContent =
            produtos.filter(produto => {
                if (!produto.validade) {
                    return false;
                }

                const partes = produto.validade.split("-").map(Number);
                const validade = new Date(
                    partes[0],
                    partes[1] - 1,
                    partes[2]
                );

                return validade >= hoje && validade <= limite;
            }).length;

        if (produtos.length === 0) {
            listaProdutos.innerHTML = `
                <tr>
                    <td colspan="5">Nenhum produto cadastrado.</td>
                </tr>
            `;
            return;
        }

        listaProdutos.innerHTML = produtos.map(produto => `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${escaparHTML(produto.categoria || "—")}</td>
                <td>${escaparHTML(produto.marca || "—")}</td>
                <td>${Number(produto.quantidade)}</td>
                <td>${formatarData(produto.validade)}</td>
            </tr>
        `).join("");

    } catch (erro) {
        mensagem.textContent =
            "Não foi possível carregar os produtos. Verifique se a API está funcionando.";

        listaProdutos.innerHTML = `
            <tr>
                <td colspan="5">Erro ao carregar os produtos.</td>
            </tr>
        `;

        console.error("Erro ao carregar produtos:", erro);
    }
}

// Formata a data para o padrão brasileiro.
function formatarData(data) {
    if (!data) {
        return "—";
    }

    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

// Evita inserir conteúdo HTML vindo dos dados do banco.
function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

// Sai do painel e limpa os dados locais do usuário.
document.getElementById("btnSair").addEventListener("click", function () {
    sessionStorage.clear();
    window.location.href = "index.html";
});
