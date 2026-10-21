
const API_URL = "https://controleestoqueescolar.ifree.page/api";

const dataInicio = document.getElementById("dataInicio");
const dataFim = document.getElementById("dataFim");
const btnFiltrar = document.getElementById("btnFiltrar");
const btnLimpar = document.getElementById("btnLimpar");
const btnImprimir = document.getElementById("btnImprimir");
const mensagem = document.getElementById("mensagem");

let dadosRelatorio = null;

// VERIFICAR LOGIN
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

    carregarRelatorio();
}

// CARREGAR RELATÓRIOS
async function carregarRelatorio(inicio = "", fim = "") {
    btnFiltrar.disabled = true;
    btnLimpar.disabled = true;
    btnFiltrar.textContent = "Consultando...";

    limparMensagem();

    try {
        const parametros = new URLSearchParams();

        if (inicio) parametros.set("inicio", inicio);
        if (fim) parametros.set("fim", fim);

        const query = parametros.toString();
        const url = `${API_URL}/relatorios${query ? `?${query}` : ""}`;

        const resposta = await fetch(url, {
    headers: {
        "Authorization": `Bearer ${token}`
    }
});
        const resultado = await resposta.json();

        if (!resposta.ok || !resultado.sucesso) {
            throw new Error(
                resultado.mensagem || "Não foi possível carregar os relatórios."
            );
        }

        dadosRelatorio = resultado;

        renderizarEstoque(resultado.estoque);
        renderizarValidade(resultado.validade);
        renderizarMovimentacoes(resultado.movimentacoes);

    } catch (erro) {
        mostrarMensagem(
            erro.message || "Não foi possível conectar à API.",
            "erro"
        );

        document.getElementById("totalProdutos").textContent = "—";
        document.getElementById("totalUnidades").textContent = "—";
        document.getElementById("produtosSemEstoque").textContent = "—";
        document.getElementById("totalMovimentacoes").textContent = "—";
        document.getElementById("totalEntradas").textContent = "—";
        document.getElementById("totalRetiradas").textContent = "—";

        document.getElementById("listaMovimentacoes").innerHTML = `
            <tr><td colspan="6" class="vazio">
                Não foi possível carregar as movimentações.
            </td></tr>
        `;

        document.getElementById("listaVencidos").innerHTML = `
            <tr><td colspan="3" class="vazio">
                Não foi possível carregar os produtos vencidos.
            </td></tr>
        `;

        document.getElementById("listaProximos").innerHTML = `
            <tr><td colspan="3" class="vazio">
                Não foi possível carregar os produtos próximos do vencimento.
            </td></tr>
        `;
    } finally {
        btnFiltrar.disabled = false;
        btnLimpar.disabled = false;
        btnFiltrar.textContent = "Consultar período";
    }
}

// RESUMO DO ESTOQUE
function renderizarEstoque(estoque) {
    document.getElementById("totalProdutos").textContent =
        estoque.total_produtos ?? 0;

    document.getElementById("totalUnidades").textContent =
        estoque.total_unidades ?? 0;

    document.getElementById("produtosSemEstoque").textContent =
        estoque.produtos_sem_estoque ?? 0;
}

// RELATÓRIO DE VALIDADE
function renderizarValidade(validade) {
    const vencidos = validade.produtos_vencidos || [];
    const proximos = validade.proximos_vencimento || [];

    const listaVencidos = document.getElementById("listaVencidos");
    const listaProximos = document.getElementById("listaProximos");

    if (vencidos.length === 0) {
        listaVencidos.innerHTML = `
            <tr><td colspan="3" class="vazio">
                Nenhum produto vencido com estoque disponível.
            </td></tr>
        `;
    } else {
        listaVencidos.innerHTML = vencidos.map(produto => `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${Number(produto.quantidade)} un.</td>
                <td>${formatarData(produto.validade)}</td>
            </tr>
        `).join("");
    }

    if (proximos.length === 0) {
        listaProximos.innerHTML = `
            <tr><td colspan="3" class="vazio">
                Nenhum produto próximo do vencimento com estoque disponível.
            </td></tr>
        `;
    } else {
        listaProximos.innerHTML = proximos.map(produto => `
            <tr>
                <td>${escaparHTML(produto.nome)}</td>
                <td>${Number(produto.quantidade)} un.</td>
                <td>${formatarData(produto.validade)}</td>
            </tr>
        `).join("");
    }
}

// HISTÓRICO E TOTAIS DE MOVIMENTAÇÕES
function renderizarMovimentacoes(movimentacoes) {
    const registros = movimentacoes.registros || [];
    const lista = document.getElementById("listaMovimentacoes");

    document.getElementById("totalMovimentacoes").textContent =
        movimentacoes.total_movimentacoes ?? registros.length;

    document.getElementById("totalEntradas").textContent =
        movimentacoes.total_entradas ?? 0;

    document.getElementById("totalRetiradas").textContent =
        movimentacoes.total_retiradas ?? 0;

    if (registros.length === 0) {
        lista.innerHTML = `
            <tr><td colspan="6" class="vazio">
                Nenhuma movimentação encontrada nesse período.
            </td></tr>
        `;
    } else {
        lista.innerHTML = registros.map(item => {
            const tipoClasse =
                item.tipo === "Entrada" ? "entrada" : "retirada";

            return `
                <tr>
                    <td>${escaparHTML(formatarDataHora(item.data_movimentacao))}</td>
                    <td>
                        <span class="tipo ${tipoClasse}">
                            ${escaparHTML(item.tipo)}
                        </span>
                    </td>
                    <td>${escaparHTML(item.produto)}</td>
                    <td class="quantidade">${Number(item.quantidade)} un.</td>
                    <td>${escaparHTML(item.responsavel || "Não informado")}</td>
                    <td>${escaparHTML(item.observacao || "—")}</td>
                </tr>
            `;
        }).join("");
    }

    document.getElementById("contadorMovimentacoes").textContent =
        `Exibindo ${registros.length} movimentação(ões).`;
}

// CONSULTAR PERÍODO
btnFiltrar.addEventListener("click", () => {
    const inicio = dataInicio.value;
    const fim = dataFim.value;

    if (!inicio && !fim) {
        mostrarMensagem(
            "Informe pelo menos uma data para filtrar ou escolha Histórico completo.",
            "erro"
        );
        return;
    }

    if (inicio && fim && inicio > fim) {
        mostrarMensagem(
            "A data inicial não pode ser posterior à data final.",
            "erro"
        );
        return;
    }

    carregarRelatorio(inicio, fim);
});

// VOLTAR AO HISTÓRICO COMPLETO
btnLimpar.addEventListener("click", () => {
    dataInicio.value = "";
    dataFim.value = "";
    carregarRelatorio();
});

// IMPRIMIR
btnImprimir.addEventListener("click", () => {
    window.print();
});

// FORMATAR DATA
function formatarData(valor) {
    if (!valor) return "—";

    const partes = String(valor).split("-");

    if (partes.length !== 3) return escaparHTML(valor);

    return `${partes[2].substring(0, 2)}/${partes[1]}/${partes[0]}`;
}

function formatarDataHora(valor) {
    if (!valor) return "—";

    const partes = String(valor).split(" ");
    const dataFormatada = formatarData(partes[0]);
    const hora = partes[1] || "";

    return hora
        ? `${dataFormatada} ${hora.substring(0, 5)}`
        : dataFormatada;
}

// EVITAR INTERPRETAÇÃO DE TEXTO COMO HTML
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

// MENSAGENS
function mostrarMensagem(texto, tipo) {
    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

function limparMensagem() {
    mensagem.textContent = "";
    mensagem.className = "mensagem";
}

// SAIR DO SISTEMA
document.getElementById("btnSair").addEventListener("click", () => {
    sessionStorage.clear();
    window.location.href = "index.html";
});
