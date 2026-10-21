
const API_URL = "https://controleestoqueescolar.ifree.page/api";

const listaHistorico = document.getElementById("listaHistorico");
const campoPesquisa = document.getElementById("pesquisa");
const filtroTipo = document.getElementById("filtroTipo");
const mensagem = document.getElementById("mensagem");
const btnAtualizar = document.getElementById("btnAtualizar");

let movimentacoes = [];

const usuarioId = sessionStorage.getItem("usuarioId");
const token = sessionStorage.getItem("token");

if (!usuarioId || !token) {
    sessionStorage.clear();
    window.location.href = "index.html";
} else {
    const nomeUsuario = sessionStorage.getItem("usuarioNome") || "Usuário";

    document.getElementById("nomeUsuario").textContent = nomeUsuario;
    document.getElementById("avatarUsuario").textContent =
        nomeUsuario.charAt(0).toUpperCase();

    carregarHistorico();
}

async function carregarHistorico() {
    btnAtualizar.disabled = true;
    btnAtualizar.textContent = "Carregando...";

    mensagem.textContent = "";
    mensagem.className = "mensagem";

    listaHistorico.innerHTML = `
        <tr>
            <td colspan="6" class="vazio">Carregando movimentações...</td>
        </tr>
    `;

    try {
        const resposta = await fetch(`${API_URL}/historico`, {
    headers: {
        "Authorization": `Bearer ${token}`
    }
});
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível carregar o histórico."
            );
        }

        movimentacoes = resultado.movimentacoes || [];

        atualizarResumo();
        renderizarHistorico();

    } catch (erro) {
        listaHistorico.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Não foi possível carregar as movimentações.
                </td>
            </tr>
        `;

        mensagem.textContent =
            erro.message || "Verifique se o servidor da API está aberto.";

        mensagem.className = "mensagem erro";

        document.getElementById("totalMovimentacoes").textContent = "—";
        document.getElementById("totalEntradas").textContent = "—";
        document.getElementById("totalRetiradas").textContent = "—";

        document.getElementById("contadorResultados").textContent =
            "Não foi possível consultar os registros.";

    } finally {
        btnAtualizar.disabled = false;
        btnAtualizar.textContent = "Atualizar";
    }
}

function atualizarResumo() {
    const entradas = movimentacoes.filter(
        item => item.tipo === "Entrada"
    ).length;

    const retiradas = movimentacoes.filter(
        item => item.tipo === "Retirada"
    ).length;

    document.getElementById("totalMovimentacoes").textContent =
        movimentacoes.length;

    document.getElementById("totalEntradas").textContent = entradas;
    document.getElementById("totalRetiradas").textContent = retiradas;
}

function renderizarHistorico() {
    const termo = campoPesquisa.value.trim().toLocaleLowerCase("pt-BR");
    const tipoSelecionado = filtroTipo.value;

    const filtradas = movimentacoes.filter(item => {
        const produto = String(item.produto || "").toLocaleLowerCase("pt-BR");
        const responsavel = String(item.responsavel || "")
            .toLocaleLowerCase("pt-BR");

        const correspondePesquisa =
            produto.includes(termo) || responsavel.includes(termo);

        const correspondeTipo =
            !tipoSelecionado || item.tipo === tipoSelecionado;

        return correspondePesquisa && correspondeTipo;
    });

    if (filtradas.length === 0) {
        listaHistorico.innerHTML = `
            <tr>
                <td colspan="6" class="vazio">
                    Nenhuma movimentação encontrada.
                </td>
            </tr>
        `;

        document.getElementById("contadorResultados").textContent =
            `Nenhum registro encontrado. Total cadastrado: ${movimentacoes.length}.`;

        return;
    }

    listaHistorico.innerHTML = filtradas.map(item => {
        const tipoClasse =
            item.tipo === "Entrada" ? "entrada" : "retirada";

        const quantidade = Number(item.quantidade);

        return `
            <tr>
                <td>${escaparHTML(formatarData(item.data_movimentacao))}</td>

                <td>
                    <span class="tipo ${tipoClasse}">
                        ${escaparHTML(item.tipo)}
                    </span>
                </td>

                <td>${escaparHTML(item.produto)}</td>

                <td class="quantidade">${quantidade} un.</td>

                <td>${escaparHTML(item.responsavel || "Não informado")}</td>

                <td>${escaparHTML(item.observacao || "—")}</td>
            </tr>
        `;
    }).join("");

    document.getElementById("contadorResultados").textContent =
        `Exibindo ${filtradas.length} de ${movimentacoes.length} movimentação(ões).`;
}

function formatarData(valor) {
    if (!valor) return "—";

    const partes = String(valor).split(" ");
    const data = partes[0];
    const hora = partes[1] || "";

    const componentes = data.split("-");

    if (componentes.length !== 3) return valor;

    const dataFormatada =
        `${componentes[2]}/${componentes[1]}/${componentes[0]}`;

    return hora
        ? `${dataFormatada} ${hora.substring(0, 5)}`
        : dataFormatada;
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => {
        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caractere];
    });
}

campoPesquisa.addEventListener("input", renderizarHistorico);
filtroTipo.addEventListener("change", renderizarHistorico);
btnAtualizar.addEventListener("click", carregarHistorico);

document.getElementById("btnSair").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
});
