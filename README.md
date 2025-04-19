# Sistema de Controle de Leitura de Gás

Este é um sistema para gerenciar as leituras de gás de um prédio, permitindo o cadastro de apartamentos, registro de leituras e cálculo automático dos valores.

## Funcionalidades

- Cadastro de apartamentos
- Registro de leituras mensais
- Cálculo automático do consumo e valor
- Visualização de leituras por mês/ano
- Interface responsiva para desktop e mobile

## Requisitos

- Python 3.8 ou superior
- pip (gerenciador de pacotes Python)

## Instalação

1. Clone este repositório
2. Instale as dependências:
```bash
pip install -r requirements.txt
```

## Executando a Aplicação

1. Inicie o servidor Flask:
```bash
python app.py
```

2. Acesse a aplicação no navegador:
```
http://localhost:5000
```

## Como Usar

1. **Cadastrar Apartamento**
   - Digite o número do apartamento no campo correspondente
   - Clique em "Cadastrar"

2. **Registrar Leitura**
   - Selecione o apartamento
   - Informe o mês e ano da leitura
   - Digite a leitura atual e anterior em m³
   - Informe o valor do kg de gás
   - Clique em "Registrar"

3. **Visualizar Leituras**
   - Selecione o mês e ano desejados
   - Clique em "Filtrar"
   - A tabela mostrará todas as leituras do período

## Cálculo do Valor

O sistema calcula automaticamente o valor a ser pago usando a fórmula:
- Consumo m³ = Leitura Atual - Leitura Anterior
- Consumo kg = Consumo m³ × 2,4
- Valor Total = Consumo kg × Valor por kg
- O valor é arredondado para cima

## Próximos Passos

- Implementação de autenticação de usuários
- Versão mobile nativa
- Integração com banco de dados remoto
- Exportação de relatórios em PDF 