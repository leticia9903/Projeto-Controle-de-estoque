```php
<?php

class ProdutoController
{
    private PDO $conexao;

    public function __construct(PDO $conexao)
    {
        $this->conexao = $conexao;
    }

    // CADASTRAR PRODUTO
    public function cadastrar(): void
    {
        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $nome = trim($dados['nome'] ?? '');
        $categoria = trim($dados['categoria'] ?? '');
        $marca = trim($dados['marca'] ?? '');
        $quantidade = $dados['quantidade'] ?? null;
        $validade = $dados['validade'] ?? null;

        if ($nome === '') {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'O nome do produto é obrigatório.'
            ]);
            return;
        }

        if (
            filter_var($quantidade, FILTER_VALIDATE_INT) === false ||
            $quantidade < 0
        ) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'A quantidade deve ser um número inteiro igual ou maior que zero.'
            ]);
            return;
        }

        if ($validade === '') {
            $validade = null;
        }

        if ($validade !== null) {
            $data = is_string($validade)
                ? DateTime::createFromFormat('!Y-m-d', $validade)
                : false;

            if (!$data || $data->format('Y-m-d') !== $validade) {
                $this->responder(400, [
                    'sucesso' => false,
                    'mensagem' => 'Informe uma validade válida no formato AAAA-MM-DD.'
                ]);
                return;
            }
        }

        try {
            $sql = 'INSERT INTO produtos
                    (nome, categoria, marca, quantidade, validade)
                    VALUES (:nome, :categoria, :marca, :quantidade, :validade)';

            $consulta = $this->conexao->prepare($sql);
            $consulta->execute([
                ':nome' => $nome,
                ':categoria' => $categoria !== '' ? $categoria : null,
                ':marca' => $marca !== '' ? $marca : null,
                ':quantidade' => (int) $quantidade,
                ':validade' => $validade
            ]);

            $this->responder(201, [
                'sucesso' => true,
                'mensagem' => 'Produto cadastrado com sucesso.',
                'id' => (int) $this->conexao->lastInsertId()
            ]);

        } catch (PDOException $erro) {
            error_log('Erro ao cadastrar produto: ' . $erro->getMessage());

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível cadastrar o produto.'
            ]);
        }
    }

    // LISTAR PRODUTOS
    public function listar(): void
    {
        try {
            $sql = 'SELECT id, nome, categoria, marca, quantidade,
                           validade, criado_em, atualizado_em
                    FROM produtos
                    ORDER BY nome ASC';

            $consulta = $this->conexao->query($sql);

            $this->responder(200, [
                'sucesso' => true,
                'produtos' => $consulta->fetchAll(PDO::FETCH_ASSOC)
            ]);

        } catch (PDOException $erro) {
            error_log('Erro ao listar produtos: ' . $erro->getMessage());

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível listar os produtos.'
            ]);
        }
    }

    // EDITAR PRODUTO
    public function editar(int $id): void
    {
        if ($id <= 0) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Identificador do produto inválido.'
            ]);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $nome = trim($dados['nome'] ?? '');
        $categoria = trim($dados['categoria'] ?? '');
        $marca = trim($dados['marca'] ?? '');
        $validade = $dados['validade'] ?? null;

        if ($nome === '') {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'O nome do produto é obrigatório.'
            ]);
            return;
        }

        if ($validade === '') {
            $validade = null;
        }

        if ($validade !== null) {
            $data = is_string($validade)
                ? DateTime::createFromFormat('!Y-m-d', $validade)
                : false;

            if (!$data || $data->format('Y-m-d') !== $validade) {
                $this->responder(400, [
                    'sucesso' => false,
                    'mensagem' => 'Informe uma validade válida no formato AAAA-MM-DD.'
                ]);
                return;
            }
        }

        try {
            // Verifica se o produto existe
            $verificar = $this->conexao->prepare(
                'SELECT id FROM produtos WHERE id = :id'
            );
            $verificar->execute([':id' => $id]);

            if (!$verificar->fetch()) {
                $this->responder(404, [
                    'sucesso' => false,
                    'mensagem' => 'Produto não encontrado.'
                ]);
                return;
            }

            // Atualiza os dados sem alterar a quantidade do estoque
            $sql = 'UPDATE produtos
                    SET nome = :nome,
                        categoria = :categoria,
                        marca = :marca,
                        validade = :validade
                    WHERE id = :id';

            $consulta = $this->conexao->prepare($sql);
            $consulta->execute([
                ':nome' => $nome,
                ':categoria' => $categoria !== '' ? $categoria : null,
                ':marca' => $marca !== '' ? $marca : null,
                ':validade' => $validade,
                ':id' => $id
            ]);

            $this->responder(200, [
                'sucesso' => true,
                'mensagem' => 'Produto atualizado com sucesso.'
            ]);

        } catch (PDOException $erro) {
            error_log('Erro ao editar produto: ' . $erro->getMessage());

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível editar o produto.'
            ]);
        }
    }

    // REGISTRAR ENTRADA DE PRODUTOS
    public function entrada(int $id): void
    {
        if ($id <= 0) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Identificador do produto inválido.'
            ]);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $quantidade = $dados['quantidade'] ?? null;
        $responsavel = trim($dados['responsavel'] ?? '');
        $observacao = trim($dados['observacao'] ?? '');

        if (
            filter_var($quantidade, FILTER_VALIDATE_INT) === false ||
            (int) $quantidade <= 0
        ) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'A quantidade de entrada deve ser um número inteiro maior que zero.'
            ]);
            return;
        }

        try {
            $this->conexao->beginTransaction();

            // Localiza e bloqueia o produto durante a movimentação
            $consulta = $this->conexao->prepare(
                'SELECT id, quantidade
                 FROM produtos
                 WHERE id = :id
                 FOR UPDATE'
            );
            $consulta->execute([':id' => $id]);
            $produto = $consulta->fetch(PDO::FETCH_ASSOC);

            if (!$produto) {
                $this->conexao->rollBack();

                $this->responder(404, [
                    'sucesso' => false,
                    'mensagem' => 'Produto não encontrado.'
                ]);
                return;
            }

            // Soma a entrada ao estoque atual
            $atualizar = $this->conexao->prepare(
                'UPDATE produtos
                 SET quantidade = quantidade + :quantidade
                 WHERE id = :id'
            );
            $atualizar->execute([
                ':quantidade' => (int) $quantidade,
                ':id' => $id
            ]);

            // Registra a movimentação na tabela entradas
            $registrar = $this->conexao->prepare(
                'INSERT INTO entradas
                 (produto_id, quantidade, responsavel, observacao)
                 VALUES (:produto_id, :quantidade, :responsavel, :observacao)'
            );
            $registrar->execute([
                ':produto_id' => $id,
                ':quantidade' => (int) $quantidade,
                ':responsavel' => $responsavel !== '' ? $responsavel : null,
                ':observacao' => $observacao !== '' ? $observacao : null
            ]);

            // Consulta a quantidade atualizada
            $consultaAtual = $this->conexao->prepare(
                'SELECT quantidade FROM produtos WHERE id = :id'
            );
            $consultaAtual->execute([':id' => $id]);
            $quantidadeAtual = (int) $consultaAtual->fetchColumn();

            $this->conexao->commit();

            $this->responder(200, [
                'sucesso' => true,
                'mensagem' => 'Entrada registrada com sucesso.',
                'produto_id' => $id,
                'quantidade_adicionada' => (int) $quantidade,
                'quantidade_atual' => $quantidadeAtual
            ]);

        } catch (Throwable $erro) {
            if ($this->conexao->inTransaction()) {
                $this->conexao->rollBack();
            }

            error_log('Erro ao registrar entrada: ' . $erro->getMessage());

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível registrar a entrada do produto.'
            ]);
        }
    }

    // REGISTRAR RETIRADA DE PRODUTOS
    public function retirar(int $id): void
    {
        if ($id <= 0) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Identificador do produto inválido.'
            ]);
            return;
        }

        $dados = json_decode(file_get_contents('php://input'), true);

        if (!is_array($dados)) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'Envie os dados em formato JSON válido.'
            ]);
            return;
        }

        $quantidade = $dados['quantidade'] ?? null;
        $responsavel = trim($dados['responsavel'] ?? '');
        $observacao = trim($dados['observacao'] ?? '');

        if (
            filter_var($quantidade, FILTER_VALIDATE_INT) === false ||
            (int) $quantidade <= 0
        ) {
            $this->responder(400, [
                'sucesso' => false,
                'mensagem' => 'A quantidade de retirada deve ser um número inteiro maior que zero.'
            ]);
            return;
        }

        try {
            $this->conexao->beginTransaction();

            // Localiza e bloqueia o produto durante a movimentação
            $consulta = $this->conexao->prepare(
                'SELECT id, quantidade
                 FROM produtos
                 WHERE id = :id
                 FOR UPDATE'
            );
            $consulta->execute([':id' => $id]);
            $produto = $consulta->fetch(PDO::FETCH_ASSOC);

            if (!$produto) {
                $this->conexao->rollBack();

                $this->responder(404, [
                    'sucesso' => false,
                    'mensagem' => 'Produto não encontrado.'
                ]);
                return;
            }

            $quantidadeAtual = (int) $produto['quantidade'];
            $quantidadeRetirada = (int) $quantidade;

            // Impede a retirada de uma quantidade maior que o estoque
            if ($quantidadeAtual < $quantidadeRetirada) {
                $this->conexao->rollBack();

                $this->responder(409, [
                    'sucesso' => false,
                    'mensagem' => 'Estoque insuficiente para realizar essa retirada.',
                    'quantidade_disponivel' => $quantidadeAtual
                ]);
                return;
            }

            // Subtrai a retirada do estoque atual
            $atualizar = $this->conexao->prepare(
                'UPDATE produtos
                 SET quantidade = quantidade - :quantidade
                 WHERE id = :id'
            );
            $atualizar->execute([
                ':quantidade' => $quantidadeRetirada,
                ':id' => $id
            ]);

            // Registra a movimentação na tabela retiradas
            $registrar = $this->conexao->prepare(
                'INSERT INTO retiradas
                 (produto_id, quantidade, responsavel, observacao)
                 VALUES (:produto_id, :quantidade, :responsavel, :observacao)'
            );
            $registrar->execute([
                ':produto_id' => $id,
                ':quantidade' => $quantidadeRetirada,
                ':responsavel' => $responsavel !== '' ? $responsavel : null,
                ':observacao' => $observacao !== '' ? $observacao : null
            ]);

            // Consulta a quantidade atualizada
            $consultaAtual = $this->conexao->prepare(
                'SELECT quantidade FROM produtos WHERE id = :id'
            );
            $consultaAtual->execute([':id' => $id]);
            $novaQuantidade = (int) $consultaAtual->fetchColumn();

            $this->conexao->commit();

            $this->responder(200, [
                'sucesso' => true,
                'mensagem' => 'Retirada registrada com sucesso.',
                'produto_id' => $id,
                'quantidade_retirada' => $quantidadeRetirada,
                'quantidade_atual' => $novaQuantidade
            ]);

        } catch (Throwable $erro) {
            if ($this->conexao->inTransaction()) {
                $this->conexao->rollBack();
            }

            error_log('Erro ao registrar retirada: ' . $erro->getMessage());

            $this->responder(500, [
                'sucesso' => false,
                'mensagem' => 'Não foi possível registrar a retirada do produto.'
            ]);
        }
    }

    // PADRONIZAR RESPOSTAS
    private function responder(int $status, array $dados): void
    {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');

        echo json_encode($dados, JSON_UNESCAPED_UNICODE);
    }
}