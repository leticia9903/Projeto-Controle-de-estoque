
const API_URL = "http://localhost:8000";

const formRetirada = document.getElementById("formRetirada");
const produtoSelect = document.getElementById("produtoId");
const campoQuantidade = document.getElementById("quantidade");
const campoResponsavel = document.getElementById("responsavel");
const campoObservacao = document.getElementById("observacao");
const btnRegistrar = document.getElementById("btnRegistrar");
const mensagem = document.getElementById("mensagem");

const nomeProdutoResumo = document.getElementById("nomeProdutoResumo");
const estoqueDisponivel = document.getElementById("estoqueDisponivel");
const estoqueFinal = document.getElementById("estoqueFinal");

let produtos = [];

const usuarioId = sessionStorage.getItem("usuarioId");

if (!usuarioId) {
    window.location.href = "index.html";
} else {
    const nomeUsuario = sessionStorage.getItem("usuarioNome") || "Usuário";

    document.getElementById("nomeUsuario").textContent = nomeUsuario;
    document.getElementById("avatarUsuario").textContent =
        nomeUsuario.charAt(0).toUpperCase();

    carregarProdutos();
}

async function carregarProdutos() {
    produtoSelect.innerHTML =
        '<option value="">Carregando produtos...</option>';

    try {
        const resposta = await fetch(`${API_URL}/produtos`);
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível carregar os produtos."
            );
        }

        produtos = resultado.produtos || [];

        produtoSelect.innerHTML =
            '<option value="">Selecione um produto</option>';

        produtos.forEach(produto => {
            const opcao = document.createElement("option");
            opcao.value = produto.id;
            opcao.textContent =
                `${produto.nome} — Estoque: ${produto.quantidade}`;
            produtoSelect.appendChild(opcao);
        });

        if (produtos.length === 0) {
            produtoSelect.innerHTML =
                '<option value="">Nenhum produto cadastrado</option>';
        }

        atualizarResumo();

    } catch (erro) {
        produtoSelect.innerHTML =
            '<option value="">Erro ao carregar produtos</option>';

        mostrarMensagem(
            erro.message ||
            "Não foi possível conectar à API.",
            "erro"
        );
    }
}

function atualizarResumo() {
    const produto = produtos.find(
        item => Number(item.id) === Number(produtoSelect.value)
    );

    if (!produto) {
        nomeProdutoResumo.textContent = "Nenhum";
        estoqueDisponivel.textContent = "—";
        estoqueFinal.textContent = "—";
        return;
    }

    const quantidadeAtual = Number(produto.quantidade);
    const quantidadeRetirada = Number(campoQuantidade.value);

    nomeProdutoResumo.textContent = produto.nome;
    estoqueDisponivel.textContent = quantidadeAtual;

    if (
        campoQuantidade.value.trim() !== "" &&
        Number.isInteger(quantidadeRetirada) &&
        quantidadeRetirada > 0 &&
        quantidadeRetirada <= quantidadeAtual
    ) {
        estoqueFinal.textContent = quantidadeAtual - quantidadeRetirada;
    } else {
        estoqueFinal.textContent = "—";
    }

    campoQuantidade.max = quantidadeAtual > 0 ? quantidadeAtual : "";

    if (quantidadeAtual <= 0) {
        campoQuantidade.disabled = true;
        document.getElementById("ajudaQuantidade").textContent =
            "Este produto está sem estoque disponível.";
    } else {
        campoQuantidade.disabled = false;
        document.getElementById("ajudaQuantidade").textContent =
            `Quantidade máxima disponível: ${quantidadeAtual}.`;
    }
}

produtoSelect.addEventListener("change", atualizarResumo);
campoQuantidade.addEventListener("input", atualizarResumo);

formRetirada.addEventListener("submit", async function (evento) {
    evento.preventDefault();
    limparMensagem();

    const produtoId = Number(produtoSelect.value);
    const produto = produtos.find(
        item => Number(item.id) === produtoId
    );

    const quantidade = Number(campoQuantidade.value);
    const responsavel = campoResponsavel.value.trim();
    const observacao = campoObservacao.value.trim();

    if (!produto) {
        mostrarMensagem("Selecione um produto válido.", "erro");
        return;
    }

    if (
        !Number.isInteger(quantidade) ||
        quantidade <= 0
    ) {
        mostrarMensagem(
            "Informe uma quantidade inteira maior que zero.",
            "erro"
        );
        return;
    }

    if (quantidade > Number(produto.quantidade)) {
        mostrarMensagem(
            `Estoque insuficiente. Disponível: ${produto.quantidade} unidade(s).`,
            "erro"
        );
        return;
    }

    if (!responsavel) {
        mostrarMensagem(
            "Informe o responsável pela retirada.",
            "erro"
        );
        return;
    }

    btnRegistrar.disabled = true;
    btnRegistrar.textContent = "Registrando...";

    try {
        const resposta = await fetch(
            `${API_URL}/produtos/${produtoId}/retirada`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    quantidade,
                    responsavel,
                    observacao
                })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível registrar a retirada."
            );
        }

        mostrarMensagem(
            `${resultado.mensagem} Estoque atualizado: ${resultado.quantidade_atual} unidade(s).`,
            "sucesso"
        );

        formRetirada.reset();

        await carregarProdutos();
        atualizarResumo();

    } catch (erro) {
        mostrarMensagem(
            erro.message ||
            "Não foi possível conectar à API.",
            "erro"
        );

        await carregarProdutos();

    } finally {
        btnRegistrar.disabled = false;
        btnRegistrar.textContent = "Registrar retirada";
    }
});

formRetirada.addEventListener("reset", function () {
    setTimeout(atualizarResumo, 0);
});

function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}

document.getElementById("btnSair").addEventListener("click", function () {
    sessionStorage.clear();
    window.location.href = "index.html";
});
