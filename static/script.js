// URL base para a API
const API_URL = '';

// Objeto para armazenar as leituras atuais
let leituras = [];
let apartamentos = [];
let mesAtual = new Date().getMonth() + 1;
let anoAtual = new Date().getFullYear();
let valorKg = 0;
let isMobile = false; // Flag para detectar dispositivos móveis

// Inicializar a aplicação
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Inicializando aplicação...');
    
    // Detectar se é um dispositivo móvel
    isMobile = window.innerWidth < 768;
    console.log('Dispositivo móvel?', isMobile);
    
    // Definir mês e ano atuais nos campos
    document.getElementById('mes-atual').value = mesAtual;
    document.getElementById('ano-atual').value = anoAtual;
    
    // Definir um valor padrão para o valor do kg (pode ser ajustado depois)
    document.getElementById('valor-kg-atual').value = '15.00';
    valorKg = 15.00;
    
    // Carregar apartamentos
    await carregarApartamentos();
    
    // Carregar leituras iniciais
    await carregarLeituras();
    
    // Inicializar o formulário de cadastro de apartamento
    document.getElementById('form-apartamento').addEventListener('submit', cadastrarApartamento);
    
    // Adicionar ouvinte para orientação de tela
    window.addEventListener('resize', () => {
        isMobile = window.innerWidth < 768;
        console.log('Tamanho de tela alterado. Dispositivo móvel?', isMobile);
    });
});

// Função para cadastrar um novo apartamento
async function cadastrarApartamento(e) {
    e.preventDefault();
    const numero = document.getElementById('numero-apartamento').value;
    
    console.log('Cadastrando apartamento:', numero);
    
    if (!numero || numero.trim() === '') {
        alert('Por favor, informe o número do apartamento');
        return;
    }
    
    const dados = { numero: numero };
    
    try {
        console.log('Enviando dados:', JSON.stringify(dados));
        
        const response = await fetch(`${API_URL}/apartamentos`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dados)
        });
        
        let responseData;
        try {
            responseData = await response.json();
            console.log('Resposta recebida:', responseData);
        } catch (e) {
            console.error('Erro ao processar resposta JSON:', e);
            responseData = {};
        }
        
        if (response.ok) {
            alert('Apartamento cadastrado com sucesso!');
            document.getElementById('numero-apartamento').value = '';
            await carregarApartamentos();
            await carregarLeituras();
        } else if (response.status === 409) {
            // Apartamento já existe
            if (confirm(`${responseData.error}. Deseja carregar os dados existentes?`)) {
                document.getElementById('numero-apartamento').value = '';
                await carregarApartamentos();
                await carregarLeituras();
            }
        } else {
            alert(`Erro ao cadastrar apartamento: ${responseData.error || 'Erro desconhecido'}`);
        }
    } catch (error) {
        console.error('Erro completo:', error);
        alert(`Erro ao cadastrar apartamento: ${error.message || error}`);
    }
}

// Função para carregar todos os apartamentos
async function carregarApartamentos() {
    try {
        const response = await fetch(`${API_URL}/apartamentos`);
        apartamentos = await response.json();
        
        // Ordenar apartamentos numericamente
        apartamentos.sort((a, b) => {
            // Tentar fazer ordenação numérica se possível
            const numA = parseInt(a.numero.replace(/\D/g, ''));
            const numB = parseInt(b.numero.replace(/\D/g, ''));
            
            if (!isNaN(numA) && !isNaN(numB)) {
                return numA - numB;
            }
            
            // Caso contrário, ordenação alfabética
            return a.numero.localeCompare(b.numero);
        });
        
        console.log(`${apartamentos.length} apartamentos carregados`);
        return apartamentos;
    } catch (error) {
        console.error('Erro ao carregar apartamentos:', error);
        return [];
    }
}

// Função para carregar leituras do mês anterior
async function carregarLeituraAnterior(apartamentoId, mes, ano) {
    let mesAnterior = mes - 1;
    let anoAnterior = ano;
    
    if (mesAnterior === 0) {
        mesAnterior = 12;
        anoAnterior = ano - 1;
    }
    
    try {
        const response = await fetch(`${API_URL}/leituras/${mesAnterior}/${anoAnterior}`);
        const leituras = await response.json();
        const leituraAnt = leituras.find(l => l.apartamento_id == apartamentoId);
        return leituraAnt ? leituraAnt.leitura_atual : 0;
    } catch (error) {
        console.error('Erro ao carregar leitura anterior:', error);
        return 0;
    }
}

// Função para carregar todas as leituras do mês atual
async function carregarLeituras() {
    mesAtual = parseInt(document.getElementById('mes-atual').value);
    anoAtual = parseInt(document.getElementById('ano-atual').value);
    valorKg = parseFloat(document.getElementById('valor-kg-atual').value || 0);
    
    if (!valorKg) {
        alert('Por favor, informe o valor do KG');
        document.getElementById('valor-kg-atual').focus();
        return;
    }
    
    // Carregar apartamentos caso ainda não tenha feito
    if (apartamentos.length === 0) {
        apartamentos = await carregarApartamentos();
    }
    
    if (apartamentos.length === 0) {
        const tbody = document.querySelector('#tabela-leituras tbody');
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum apartamento cadastrado. Cadastre apartamentos primeiro.</td></tr>';
        return;
    }
    
    // Mostrar indicador de carregamento
    const tbody = document.querySelector('#tabela-leituras tbody');
    tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregando dados...</td></tr>';
    
    // Carregar leituras existentes para o mês
    try {
        const response = await fetch(`${API_URL}/leituras/${mesAtual}/${anoAtual}`);
        leituras = await response.json();
        
        // Limpar tabela
        tbody.innerHTML = '';
        
        // Para cada apartamento, mostrar os dados
        for (const apt of apartamentos) {
            // Verificar se já existe leitura para este apartamento
            const leitura = leituras.find(l => l.apartamento_id == apt.id);
            
            // Buscar leitura anterior
            const leituraAnterior = await carregarLeituraAnterior(apt.id, mesAtual, anoAtual);
            
            // Criar linha na tabela
            const tr = document.createElement('tr');
            tr.dataset.id = apt.id;
            
            if (leitura) {
                // Se já existe leitura
                const consumo = leitura.leitura_atual - leitura.leitura_anterior;
                
                tr.innerHTML = `
                    <td><strong>${apt.numero}</strong></td>
                    <td class="leitura-anterior-cell">${leitura.leitura_anterior} m³</td>
                    <td class="leitura-atual-cell" onclick="editarLeitura(this)">${leitura.leitura_atual} m³</td>
                    <td class="consumo">${consumo.toFixed(2)} m³</td>
                    <td class="valor">R$ ${leitura.valor_total.toFixed(2)}</td>
                `;
            } else {
                // Se não existe leitura, criar uma nova entrada
                tr.innerHTML = `
                    <td><strong>${apt.numero}</strong></td>
                    <td class="leitura-anterior-cell">${leituraAnterior.toFixed(2)} m³</td>
                    <td class="leitura-atual-cell" onclick="editarLeitura(this)">0.00 m³</td>
                    <td class="consumo">0.00 m³</td>
                    <td class="valor">R$ 0.00</td>
                `;
            }
            
            tbody.appendChild(tr);
        }
    } catch (error) {
        console.error('Erro ao carregar leituras:', error);
        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Erro ao carregar leituras. Tente novamente.</td></tr>';
    }
}

// Função para editar a leitura diretamente na tabela
function editarLeitura(cell) {
    // Extrair o valor numérico da célula (remover a unidade m³)
    const texto = cell.textContent.trim();
    const valorAtual = parseFloat(texto);
    
    console.log('Editando célula:', texto, 'Valor extraído:', valorAtual);
    
    // Verificar se a célula já está em modo de edição
    if (cell.querySelector('input')) {
        console.log('Célula já está em modo de edição');
        return;
    }
    
    // Se for um dispositivo móvel, usar interface específica
    if (isMobile) {
        editarLeituraMobile(cell, valorAtual);
        return;
    }
    
    // Criar o campo de edição para desktop
    const input = document.createElement('input');
    input.type = 'number';
    input.step = '0.01';
    input.value = valorAtual;
    input.style.width = '100%';
    
    // Substituir a célula pelo campo de edição
    cell.textContent = '';
    cell.appendChild(input);
    input.focus();
    
    // Adicionar botões de salvar e cancelar
    const acoes = document.createElement('div');
    acoes.className = 'edit-actions';
    
    const btnSalvar = document.createElement('button');
    btnSalvar.textContent = '✓';
    btnSalvar.className = 'btn-save';
    btnSalvar.onclick = (e) => {
        e.stopPropagation();  // Impedir que o clique se propague
        salvarLeitura(cell, input.value);
    };
    
    const btnCancelar = document.createElement('button');
    btnCancelar.textContent = '✕';
    btnCancelar.className = 'btn-cancel';
    btnCancelar.onclick = (e) => {
        e.stopPropagation();  // Impedir que o clique se propague
        cancelarEdicao(cell, valorAtual);
    };
    
    acoes.appendChild(btnSalvar);
    acoes.appendChild(btnCancelar);
    
    cell.appendChild(acoes);
    
    // Pressionar Enter para salvar ou Escape para cancelar
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            salvarLeitura(cell, input.value);
        } else if (e.key === 'Escape') {
            cancelarEdicao(cell, valorAtual);
        }
    });
    
    // Clicar fora para cancelar
    const clickOutsideHandler = (e) => {
        if (!cell.contains(e.target)) {
            cancelarEdicao(cell, valorAtual);
            document.removeEventListener('click', window.clickOutsideHandler);
        }
    };
    
    // Armazenar o manipulador de eventos em uma propriedade global para poder removê-lo depois
    window.clickOutsideHandler = clickOutsideHandler;
    
    // Adicionar um pequeno atraso para evitar que o evento seja acionado imediatamente
    setTimeout(() => {
        document.addEventListener('click', window.clickOutsideHandler);
    }, 100);
}

// Função específica para edição em dispositivos móveis
function editarLeituraMobile(cell, valorAtual) {
    // Obter informações sobre a linha e o apartamento
    const row = cell.parentElement;
    const apartamentoNumero = row.cells[0].textContent;
    const leituraAnterior = row.cells[1].textContent;
    
    // Criar o modal de edição
    const modal = document.createElement('div');
    modal.className = 'edit-mode-mobile';
    
    // Criar o conteúdo do modal
    modal.innerHTML = `
        <div class="edit-container">
            <h3>Editar Leitura do Ap. ${apartamentoNumero}</h3>
            <p>Leitura Anterior: ${leituraAnterior}</p>
            <input type="number" id="mobile-input" step="0.01" value="${valorAtual}" />
            <div class="buttons">
                <button class="btn-cancel">Cancelar</button>
                <button class="btn-save">Salvar</button>
            </div>
        </div>
    `;
    
    // Adicionar o modal ao DOM
    document.body.appendChild(modal);
    
    // Focar no campo de entrada
    const input = modal.querySelector('#mobile-input');
    setTimeout(() => {
        input.focus();
    }, 100);
    
    // Configurar os botões
    modal.querySelector('.btn-save').addEventListener('click', () => {
        salvarLeitura(cell, input.value);
        document.body.removeChild(modal);
    });
    
    modal.querySelector('.btn-cancel').addEventListener('click', () => {
        document.body.removeChild(modal);
    });
    
    // Pressionar Enter para salvar ou Escape para cancelar
    input.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') {
            salvarLeitura(cell, input.value);
            document.body.removeChild(modal);
        } else if (e.key === 'Escape') {
            document.body.removeChild(modal);
        }
    });
}

// Função para cancelar a edição
function cancelarEdicao(cell, valorOriginal) {
    console.log('Cancelando edição. Valor original:', valorOriginal);
    
    // Remover qualquer evento de clique fora que possa ter sido adicionado
    document.removeEventListener('click', window.clickOutsideHandler);
    
    // Verificar se o valor é um número antes de formatar
    let valorFormatado = valorOriginal;
    if (!isNaN(valorOriginal)) {
        valorFormatado = parseFloat(valorOriginal).toFixed(2);
    }
    
    // Limpar conteúdo da célula e restaurar valor formatado
    cell.innerHTML = '';
    cell.textContent = `${valorFormatado} m³`;
    cell.className = 'leitura-atual-cell';  // Restaurar classe original
    
    console.log('Edição cancelada, valor restaurado:', cell.textContent);
}

// Função para salvar a leitura
async function salvarLeitura(cell, novoValor) {
    // Obter dados da linha
    const row = cell.parentElement;
    const apartamentoId = row.dataset.id;
    const leituraAnteriorCell = row.cells[1];
    const leituraAnterior = parseFloat(leituraAnteriorCell.textContent);
    const leituraAtual = parseFloat(novoValor);
    
    // Calcular consumo
    const consumo = leituraAtual - leituraAnterior;
    
    // Validar se a leitura faz sentido
    if (consumo < 0) {
        const confirmaValor = confirm('A leitura atual é menor que a anterior. Isso está correto?');
        if (!confirmaValor) {
            console.log('Usuário cancelou a operação. Restaurando valor original.');
            // Restaurar o valor original na célula
            const valorAtual = parseFloat(cell.querySelector('input').value);
            cancelarEdicao(cell, valorAtual);
            return; // Sair da função sem salvar
        }
    }
    
    // Continuar apenas se passou na validação ou o usuário confirmou
    try {
        const response = await fetch(`${API_URL}/leituras`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                apartamento_id: apartamentoId,
                mes: mesAtual,
                ano: anoAtual,
                leitura_atual: leituraAtual,
                leitura_anterior: leituraAnterior,
                valor_kg: valorKg
            })
        });
        
        if (response.ok) {
            // Atualizar a interface
            cell.innerHTML = `${leituraAtual.toFixed(2)} m³`;
            
            // Buscar a leitura atualizada para obter o valor correto calculado pelo servidor
            await carregarLeituras();
        } else {
            alert('Erro ao salvar leitura');
            cancelarEdicao(cell, leituraAtual);
        }
    } catch (error) {
        console.error('Erro:', error);
        alert('Erro ao salvar leitura');
        cancelarEdicao(cell, leituraAtual);
    }
}

// Função para imprimir a lista
function imprimirLista() {
    window.print();
}

// Função para mostrar apartamentos existentes
async function mostrarApartamentosExistentes() {
    try {
        const apts = await carregarApartamentos();
        const listaDiv = document.getElementById('lista-apartamentos');
        const listaUl = document.getElementById('apartamentos-existentes');
        
        listaUl.innerHTML = '';
        
        if (apts.length === 0) {
            listaUl.innerHTML = '<li>Nenhum apartamento cadastrado</li>';
        } else {
            apts.sort((a, b) => {
                // Tentar fazer ordenação numérica se possível
                const numA = parseInt(a.numero.replace(/\D/g, ''));
                const numB = parseInt(b.numero.replace(/\D/g, ''));
                
                if (!isNaN(numA) && !isNaN(numB)) {
                    return numA - numB;
                }
                
                // Caso contrário, ordenação alfabética
                return a.numero.localeCompare(b.numero);
            });
            
            apts.forEach(apt => {
                const li = document.createElement('li');
                li.textContent = `Apartamento ${apt.numero}`;
                listaUl.appendChild(li);
            });
        }
        
        listaDiv.style.display = 'block';
    } catch (error) {
        console.error('Erro ao listar apartamentos existentes:', error);
        alert('Erro ao listar apartamentos existentes');
    }
} 