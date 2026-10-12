
<?php

class Database
{
    private string $host = '127.0.0.1';
    private string $port = '3306';
    private string $dbname = 'estoque_escolar';
    private string $username = 'root';
    private string $password = '';

    public function conectar(): PDO
    {
        try {
            return new PDO(
                "mysql:host={$this->host};port={$this->port};dbname={$this->dbname};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false
                ]
            );
        } catch (PDOException $erro) {
            error_log('Erro MySQL: ' . $erro->getMessage());

            throw new RuntimeException(
                'Não foi possível conectar ao banco de dados.'
            );
        }
    }
}
