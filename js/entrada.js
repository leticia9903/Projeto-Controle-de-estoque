const API_URL = "http://localhost:8000";

const formEntrada = document.getElementById("formEntrada");
const campoProduto = document.getElementById("produto");
const campoQuantidade = document.getElementById("quantidade");
const campoResponsavel = document.getElementById("responsavel");
const campoObservacao = document.getElementById("observacao");

const resumoEstoque = document.getElementById("resumoEstoque");
const estoqueAtual = document.getElementById("estoqueAtual");
const estoqueFinal = document.getElementById("estoqueFinal");

const mensagem = document.getElementById("mensagem");
const btnRegistrar = document.getElementById("btnRegistrar");

let produtos = [];

const usuarioId = sessionStorage.getItem("usuarioId");

if (!usuarioId) {
    window.location.href = "index.html";
} else {
    const nome = sessionStorage.getItem("usuarioNome") || "Usuário";

    document.getElementById("nomeUsuario").textContent = nome;
    document.getElementById("avatarUsuario").textContent =
        nome.charAt(0).toUpperCase();

    carregarProdutos();
}

// CARREGAR PRODUTOS DISPONÍVEIS
async function carregarProdutos() {
    campoProduto.innerHTML = '<option value="">Carregando produtos...</option>';

    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        const dados = await resposta.json();

        if (!resposta.ok || !dados.sucesso) {
            throw new Error(
                dados.mensagem || "Não foi possível carregar os produtos."
            );
        }

        produtos = dados.produtos || [];

        campoProduto.innerHTML =
            '<option value="">Selecione um produto</option>';

        produtos.forEach(produto => {
            const opcao = document.createElement("option");
            opcao.value = produto.id;
            opcao.textContent =
                `${produto.nome} — Estoque: ${produto.quantidade}`;

            campoProduto.appendChild(opcao);
        });

        if (produtos.length === 0) {
            campoProduto.innerHTML =
                '<option value="">Cadastre um produto primeiro</option>';
        }

        atualizarResumo();

    } catch (erro) {
        campoProduto.innerHTML =
            '<option value="">Erro ao carregar produtos</option>';

        mostrarMensagem(
            "Não foi possível carregar os produtos. Confira se a API está funcionando.",
            "erro"
        );

        console.error("Erro ao carregar produtos:", erro);
    }
}

// LOCALIZAR O PRODUTO SELECIONADO
function obterProdutoSelecionado() {
    return produtos.find(
        produto => Number(produto.id) === Number(campoProduto.value)
    );
}

// MOSTRAR ESTOQUE ATUAL E ESTOQUE PREVISTO
function atualizarResumo() {
    const produto = obterProdutoSelecionado();
    const quantidadeTexto = campoQuantidade.value;
    const quantidade = Number(quantidadeTexto);

    if (!produto) {
        resumoEstoque.hidden = true;
        return;
    }

    const atual = Number(produto.quantidade);

    estoqueAtual.textContent = atual;

    estoqueFinal.textContent =
        quantidadeTexto.trim() !== "" &&
        Number.isInteger(quantidade) &&
        quantidade > 0
            ? atual + quantidade
            : atual;

    resumoEstoque.hidden = false;
}

campoProduto.addEventListener("change", atualizarResumo);
campoQuantidade.addEventListener("input", atualizarResumo);

// REGISTRAR ENTRADA
formEntrada.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparMensagem();

    const produto = obterProdutoSelecionado();
    const quantidadeTexto = campoQuantidade.value;
    const quantidade = Number(quantidadeTexto);

    if (!produto) {
        mostrarMensagem("Selecione um produto.", "erro");
        return;
    }

    if (
        quantidadeTexto.trim() === "" ||
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        mostrarMensagem(
            "Informe uma quantidade inteira maior que zero.",
            "erro"
        );
        return;
    }

    const dados = {
        quantidade: quantidade,
        responsavel: campoResponsavel.value.trim(),
        observacao: campoObservacao.value.trim()
    };

    btnRegistrar.disabled = true;
    btnRegistrar.textContent = "Registrando...";

    try {
        const resposta = await fetch(
            `${API_URL}/produtos/${produto.id}/entrada`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(dados)
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível registrar a entrada."
            );
        }

        mostrarMensagem(
            `${resultado.mensagem} Estoque atualizado para ${resultado.quantidade_atual} unidades.`,
            "sucesso"
        );

        formEntrada.reset();

        await carregarProdutos();
        atualizarResumo();

    } catch (erro) {
        mostrarMensagem(
            erro.message || "Não foi possível conectar à API.",
            "erro"
        );

        console.error("Erro ao registrar entrada:", erro);

    } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "Registrar entrada";
    }
});

// LIMPAR CAMPOS
document.getElementById("btnLimpar").addEventListener("click", function () {
    limparMensagem();

    // O evento reset restaura o formulário antes desta atualização.
    setTimeout(atualizarResumo, 0);
});

// SAIR DO SISTEMA
document.getElementById("btnSair").addEventListener("click", function () {
    sessionStorage.clear();
    window.location.href = "index.html";
});

// MENSAGENS DA TELA
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}
