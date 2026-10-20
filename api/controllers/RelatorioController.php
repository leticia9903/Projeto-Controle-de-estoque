
<?php

class RelatorioController
{
    private PDO $conexao;

    public function __construct(PDO $conexao)
    {
        $this->conexao = $conexao;
    }

    public function consultar(): void
    {
        try {
            // VALIDAR AS DATAS DO FILTRO
            $inicio = $_GET['inicio'] ?? '';
            $fim = $_GET['fim'] ?? '';

            foreach (['inicio' => $inicio, 'fim' => $fim] as $campo => $data) {
                if ($data !== '') {
                    $dataValida = DateTime::createFromFormat('!Y-m-d', $data);

                    if (
                        !$dataValida ||
                        $dataValida->format('Y-m-d') !== $data
                    ) {
                        http_response_code(400);
                        echo json_encode([
                            'sucesso' => false,
                            'mensagem' => "A data {$campo} é inválida. Use AAAA-MM-DD."
                        ], JSON_UNESCAPED_UNICODE);
                        return;
                    }
                }
            }

            if ($inicio !== '' && $fim !== '' && $inicio > $fim) {
                http_response_code(400);
                echo json_encode([
                    'sucesso' => false,
                    'mensagem' => 'A data inicial não pode ser posterior à data final.'
                ], JSON_UNESCAPED_UNICODE);
                return;
            }

            // RESUMO GERAL DO ESTOQUE
            $sqlEstoque = "
                SELECT
                    COUNT(*) AS total_produtos,
                    COALESCE(SUM(quantidade), 0) AS total_unidades,
                    COALESCE(SUM(
                        CASE WHEN quantidade = 0 THEN 1 ELSE 0 END
                    ), 0) AS produtos_sem_estoque
                FROM produtos
            ";

            $estoque = $this->conexao
                ->query($sqlEstoque)
                ->fetch(PDO::FETCH_ASSOC);

            // PRODUTOS VENCIDOS
            $sqlVencidos = "
                SELECT id, nome, quantidade, validade
                FROM produtos
                WHERE validade IS NOT NULL
                  AND validade <> '0000-00-00'
                  AND validade < CURDATE()
                  AND quantidade > 0
                ORDER BY validade ASC
            ";

            $vencidos = $this->conexao
                ->query($sqlVencidos)
                ->fetchAll(PDO::FETCH_ASSOC);

            // PRODUTOS QUE VENCEM NOS PRÓXIMOS 30 DIAS
            $sqlProximos = "
                SELECT id, nome, quantidade, validade
                FROM produtos
                WHERE validade IS NOT NULL
                  AND validade <> '0000-00-00'
                  AND validade >= CURDATE()
                  AND validade <= DATE_ADD(CURDATE(), INTERVAL 30 DAY)
                  AND quantidade > 0
                ORDER BY validade ASC
            ";

            $proximos = $this->conexao
                ->query($sqlProximos)
                ->fetchAll(PDO::FETCH_ASSOC);

            
            // FILTRO DE PERÍODO PARA AS MOVIMENTAÇÕES
            $filtroEntrada = '';
            $filtroRetirada = '';
            $parametros = [];

            if ($inicio !== '') {
                $filtroEntrada .= ' AND e.data_entrada >= :inicioEntrada';
                $filtroRetirada .= ' AND r.data_retirada >= :inicioRetirada';

                $parametros[':inicioEntrada'] = $inicio . ' 00:00:00';
                $parametros[':inicioRetirada'] = $inicio . ' 00:00:00';
            }

            if ($fim !== '') {
                $fimExclusivo = date(
                    'Y-m-d',
                    strtotime($fim . ' +1 day')
                ) . ' 00:00:00';

                $filtroEntrada .= ' AND e.data_entrada < :fimEntrada';
                $filtroRetirada .= ' AND r.data_retirada < :fimRetirada';

                $parametros[':fimEntrada'] = $fimExclusivo;
                $parametros[':fimRetirada'] = $fimExclusivo;
            }

            // LISTAR ENTRADAS E RETIRADAS
            $sqlMovimentacoes = "
                SELECT
                    e.id AS id,
                    'Entrada' AS tipo,
                    p.nome AS produto,
                    e.quantidade AS quantidade,
                    e.responsavel AS responsavel,
                    e.observacao AS observacao,
                    e.data_entrada AS data_movimentacao
                FROM entradas e
                INNER JOIN produtos p ON p.id = e.produto_id
                WHERE 1=1 {$filtroEntrada}

                UNION ALL

                SELECT
                    r.id AS id,
                    'Retirada' AS tipo,
                    p.nome AS produto,
                    r.quantidade AS quantidade,
                    r.responsavel AS responsavel,
                    r.observacao AS observacao,
                    r.data_retirada AS data_movimentacao
                FROM retiradas r
                INNER JOIN produtos p ON p.id = r.produto_id
                WHERE 1=1 {$filtroRetirada}

                ORDER BY data_movimentacao DESC
            ";

            $consulta = $this->conexao->prepare($sqlMovimentacoes);
            $consulta->execute($parametros);
            $movimentacoes = $consulta->fetchAll(PDO::FETCH_ASSOC);

            // TOTAIS DE MOVIMENTAÇÕES NO PERÍODO SELECIONADO
            $totalEntradas = 0;
            $totalRetiradas = 0;

            foreach ($movimentacoes as $movimentacao) {
                if ($movimentacao['tipo'] === 'Entrada') {
                    $totalEntradas++;
                } else {
                    $totalRetiradas++;
                }
            }

            http_response_code(200);

            echo json_encode([
                'sucesso' => true,

                'periodo' => [
                    'inicio' => $inicio !== '' ? $inicio : null,
                    'fim' => $fim !== '' ? $fim : null
                ],

                'estoque' => [
                    'total_produtos' => (int) $estoque['total_produtos'],
                    'total_unidades' => (int) $estoque['total_unidades'],
                    'produtos_sem_estoque' =>
                        (int) $estoque['produtos_sem_estoque']
                ],

                'validade' => [
                    'produtos_vencidos' => $vencidos,
                    'proximos_vencimento' => $proximos
                ],

                'movimentacoes' => [
                    'total_entradas' => $totalEntradas,
                    'total_retiradas' => $totalRetiradas,
                    'total_movimentacoes' => count($movimentacoes),
                    'registros' => $movimentacoes
                ]

            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $erro) {
            error_log(
                'Erro ao consultar relatórios: ' . $erro->getMessage()
            );

            http_response_code(500);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Não foi possível carregar os relatórios.'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
