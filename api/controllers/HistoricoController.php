
<?php

class HistoricoController
{
    private PDO $conexao;

    public function __construct(PDO $conexao)
    {
        $this->conexao = $conexao;
    }

    // LISTAR TODAS AS MOVIMENTAÇÕES
    public function listar(): void
    {
        try {
            $sql = "
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

                ORDER BY data_movimentacao DESC
            ";

            $consulta = $this->conexao->prepare($sql);
            $consulta->execute();

            $movimentacoes = $consulta->fetchAll(PDO::FETCH_ASSOC);

            http_response_code(200);

            echo json_encode([
                'sucesso' => true,
                'movimentacoes' => $movimentacoes
            ], JSON_UNESCAPED_UNICODE);

        } catch (PDOException $erro) {
            error_log('Erro ao consultar histórico: ' . $erro->getMessage());

            http_response_code(500);

            echo json_encode([
                'sucesso' => false,
                'mensagem' => 'Não foi possível carregar o histórico de movimentações.'
            ], JSON_UNESCAPED_UNICODE);
        }
    }
}
