const API_URL = "https://controleestoqueescolar.ifree.page/api";

const formProduto = document.getElementById("formProduto");
const produtoId = document.getElementById("produtoId");
const campoNome = document.getElementById("nome");
const campoCategoria = document.getElementById("categoria");
const campoMarca = document.getElementById("marca");
const campoQuantidade = document.getElementById("quantidade");
const campoValidade = document.getElementById("validade");

const tituloFormulario = document.getElementById("tituloFormulario");
const btnSalvar = document.getElementById("btnSalvar");
const btnCancelar = document.getElementById("btnCancelar");
const btnAtualizar = document.getElementById("btnAtualizar");

const mensagemFormulario =
    document.getElementById("mensagemFormulario");

const mensagemLista = document.getElementById("mensagemLista");
const listaProdutos = document.getElementById("listaProdutos");
const busca = document.getElementById("busca");

let produtos = [];

// Verifica se o usuário passou pela tela de login.
const usuarioId = sessionStorage.getItem("usuarioId");
const token = sessionStorage.getItem("token");

if (!usuarioId || !token) {
    sessionStorage.clear();
    window.location.href = "index.html";
} else {
    const nome = sessionStorage.getItem("usuarioNome") || "Usuário";

    document.getElementById("nomeUsuario").textContent = nome;
    document.getElementById("avatarUsuario").textContent =
        nome.charAt(0).toUpperCase();

    carregarProdutos();
}

// CADASTRAR OU EDITAR PRODUTO
formProduto.addEventListener("submit", async function (evento) {
    evento.preventDefault();

    limparMensagem(mensagemFormulario);

    const editando = produtoId.value !== "";

    const nome = campoNome.value.trim();
    const categoria = campoCategoria.value.trim();
    const marca = campoMarca.value.trim();
    const validade = campoValidade.value || null;

    if (!nome) {
        mostrarMensagem(
            mensagemFormulario,
            "Informe o nome do produto.",
            "erro"
        );
        return;
    }

    const dados = {
        nome,
        categoria,
        marca,
        validade
    };

    // A quantidade só é enviada no cadastro inicial.
    if (!editando) {
        const quantidadeTexto = campoQuantidade.value;
        const quantidade = Number(quantidadeTexto);

        if (
            quantidadeTexto.trim() === "" ||
            !Number.isInteger(quantidade) ||
            quantidade < 0
        ) {
            mostrarMensagem(
                mensagemFormulario,
                "Informe uma quantidade inteira igual ou maior que zero.",
                "erro"
            );
            return;
        }

        dados.quantidade = quantidade;
    }

    btnSalvar.disabled = true;
    btnSalvar.textContent = editando ? "Salvando..." : "Cadastrando...";

    try {
        const url = editando
            ? `${API_URL}/produtos/${produtoId.value}`
            : `${API_URL}/produtos`;

        const resposta = await fetch(url, {
    method: editando ? "PUT" : "POST",
    headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    },
    body: JSON.stringify(dados)
});

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível salvar o produto."
            );
        }

        mostrarMensagem(
            mensagemFormulario,
            resultado.mensagem ||
                (editando
                    ? "Produto atualizado com sucesso."
                    : "Produto cadastrado com sucesso."),
            "sucesso"
        );

        limparFormulario();
        await carregarProdutos();

    } catch (erro) {
        mostrarMensagem(
            mensagemFormulario,
            erro.message || "Não foi possível conectar à API.",
            "erro"
        );

        console.error("Erro ao salvar produto:", erro);

    } finally {
        btnSalvar.disabled = false;
        btnSalvar.textContent = produtoId.value
            ? "Salvar alterações"
            : "Cadastrar produto";
    }
});

// BUSCAR PRODUTOS NA API
async function carregarProdutos() {
    listaProdutos.innerHTML = `
        <tr>
            <td colspan="7">Carregando produtos...</td>
        </tr>
    `;

    limparMensagem(mensagemLista);

    try {
        const resposta = await fetch(`${API_URL}/produtos`, {
    method: "GET",
    headers: {
        "Authorization": `Bearer ${token}`
    }
});
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível listar os produtos."
            );
        }

        produtos = resultado.produtos || [];
        renderizarProdutos();

    } catch (erro) {
        listaProdutos.innerHTML = `
            <tr>
                <td colspan="7">Erro ao carregar os produtos.</td>
            </tr>
        `;

        mostrarMensagem(
            mensagemLista,
            "Não foi possível carregar os produtos. Verifique se a API está funcionando.",
            "erro"
        );

        console.error("Erro ao listar produtos:", erro);
    }
}

// EXIBIR E FILTRAR PRODUTOS
function renderizarProdutos() {
    const termo = busca.value.trim().toLocaleLowerCase("pt-BR");

    const filtrados = produtos.filter(produto => {
        const texto = [
            produto.nome,
            produto.categoria,
            produto.marca
        ].join(" ").toLocaleLowerCase("pt-BR");

        return texto.includes(termo);
    });

    if (filtrados.length === 0) {
        listaProdutos.innerHTML = `
            <tr>
                <td colspan="7">
                    ${produtos.length === 0
                        ? "Nenhum produto cadastrado."
                        : "Nenhum produto corresponde à busca."}
                </td>
            </tr>
        `;
        return;
    }

    listaProdutos.innerHTML = filtrados.map(produto => {
        const quantidade = Number(produto.quantidade);
        const situacao = obterSituacao(produto);

        return `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${escaparHTML(produto.categoria || "—")}</td>
                <td>${escaparHTML(produto.marca || "—")}</td>
                <td>${quantidade}</td>
                <td>${formatarData(produto.validade)}</td>
                
<td class="acoes-tabela">
    <button
        type="button"
        data-editar="${Number(produto.id)}"
    >
        Editar
    </button>

    <button
        type="button"
        class="btn-excluir"
        data-excluir="${Number(produto.id)}"
    >
        Excluir
    </button>
</td>

            </tr>
        `;
    }).join("");
}

// DETERMINAR A SITUAÇÃO DO PRODUTO
function obterSituacao(produto) {
    if (produto.validade) {
        const partes = produto.validade.split("-").map(Number);

        const validade = new Date(
            partes[0],
            partes[1] - 1,
            partes[2]
        );

        const hoje = new Date();
        hoje.setHours(0, 0, 0, 0);

        if (validade < hoje) {
            return {
                texto: "Vencido",
                classe: "vencido"
            };
        }
    }

    if (Number(produto.quantidade) <= 1) {
        return {
            texto: "Estoque baixo",
            classe: "baixo"
        };
    }

    return {
        texto: "Normal",
        classe: "normal"
    };
}

// ABRIR FORMULÁRIO DE EDIÇÃO

 // BOTÕES DE EDIÇÃO E EXCLUSÃO
listaProdutos.addEventListener("click", function (evento) {
    const botaoExcluir = evento.target.closest("[data-excluir]");

    if (botaoExcluir) {
        excluirProduto(Number(botaoExcluir.dataset.excluir));
        return;
    }

    const botao = evento.target.closest("[data-editar]");

    if (!botao) {
        return;
    }

    const id = Number(botao.dataset.editar);
    const produto = produtos.find(
        item => Number(item.id) === id
    );

    if (!produto) {
        return;
    }

    produtoId.value = produto.id;
    campoNome.value = produto.nome || "";
    campoCategoria.value = produto.categoria || "";
    campoMarca.value = produto.marca || "";
    campoValidade.value = produto.validade || "";

    campoQuantidade.value = produto.quantidade;
    campoQuantidade.disabled = true;

    document.getElementById("ajudaQuantidade").textContent =
        "A quantidade não é alterada durante a edição.";

    tituloFormulario.textContent = "Editar produto";
    btnSalvar.textContent = "Salvar alterações";
    btnCancelar.hidden = false;

    limparMensagem(mensagemFormulario);

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
});



 // EXCLUIR PRODUTO
async function excluirProduto(id) {
    const produto = produtos.find(
        item => Number(item.id) === Number(id)
    );

    if (!produto) {
        mostrarMensagem(
            mensagemLista,
            "Produto não encontrado na lista.",
            "erro"
        );
        return;
    }

    const confirmar = window.confirm(
        `Tem certeza de que deseja excluir o produto "${produto.nome}"?\n\nEssa ação não poderá ser desfeita.`
    );

    if (!confirmar) {
        return;
    }

    limparMensagem(mensagemLista);

    try {
        const resposta = await fetch(
    `${API_URL}/produtos/${id}`,
    {
        method: "DELETE",
        headers: {
            "Authorization": `Bearer ${token}`
        }
    }
);

        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem ||
                "Não foi possível excluir o produto."
            );
        }

        mostrarMensagem(
            mensagemLista,
            resultado.mensagem ||
            "Produto excluído com sucesso.",
            "sucesso"
        );

        await carregarProdutos();

    } catch (erro) {
        mostrarMensagem(
            mensagemLista,
            erro.message ||
            "Não foi possível conectar à API.",
            "erro"
        );

        console.error("Erro ao excluir produto:", erro);
    }
}


// CANCELAR EDIÇÃO
btnCancelar.addEventListener("click", limparFormulario);

// LIMPAR FORMULÁRIO
function limparFormulario() {
    formProduto.reset();

    produtoId.value = "";
    campoQuantidade.disabled = false;
    campoQuantidade.value = 0;

    document.getElementById("ajudaQuantidade").textContent =
        "Informe a quantidade disponível no cadastro inicial.";

    tituloFormulario.textContent = "Cadastrar produto";
    btnSalvar.textContent = "Cadastrar produto";
    btnCancelar.hidden = true;
}

// PESQUISAR ENQUANTO DIGITA
busca.addEventListener("input", renderizarProdutos);

// ATUALIZAR LISTA
btnAtualizar.addEventListener("click", carregarProdutos);

// SAIR DO SISTEMA
document.getElementById("btnSair").addEventListener("click", function () {
    sessionStorage.clear();
    window.location.href = "index.html";
});

// FUNÇÕES AUXILIARES
function mostrarMensagem(elemento, texto, tipo) {
    elemento.textContent = texto;
    elemento.className = `mensagem ${tipo}`;
}

function limparMensagem(elemento) {
    elemento.textContent = "";
    elemento.className = "mensagem";
}

function formatarData(data) {
    if (!data) {
        return "—";
    }

    const partes = data.split("-");
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}

function escaparHTML(valor) {
    return String(valor).replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}
