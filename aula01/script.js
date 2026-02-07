let budgets = JSON.parse(localStorage.getItem('budgets')) || {};
// Configurações e Estado Inicial
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let myChart = null;
let editId = null; // Controla se estamos editando

// Elementos do DOM
const form = document.getElementById('finance-form');
const monthFilter = document.getElementById('month-filter');
const typeSelect = document.getElementById('type');
const categorySelect = document.getElementById('category');

// Categorias Padrão
const categories = {
    expense: ['Alimentação', 'Transporte', 'Moradia', 'Lazer', 'Saúde', 'Educação', 'Outros'],
    income: ['Salário', 'Freelance', 'Investimentos', 'Presente', 'Outros']
};

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    // Define o mês atual no filtro
    const now = new Date();
    monthFilter.value = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    
    // Define data de hoje no input do formulário
    document.getElementById('date').valueAsDate = new Date();

    toggleCategories(); // Carrega categorias iniciais
    updateApp(); // Renderiza tudo
});

// Event Listeners
monthFilter.addEventListener('change', updateApp);
document.getElementById('theme-toggle').addEventListener('click', () => document.body.classList.toggle('dark-mode'));

// 1. Lógica de Categorias Dinâmicas
function toggleCategories() {
    const type = typeSelect.value;
    categorySelect.innerHTML = '';
    categories[type].forEach(cat => {
        const option = document.createElement('option');
        option.value = cat;
        option.textContent = cat;
        categorySelect.appendChild(option);
    });
}

// 2. Adicionar ou Editar Transação
// --- MODIFICAÇÃO NO FORMULÁRIO PRINCIPAL (Suporte a Parcelas) ---
form.addEventListener('submit', (e) => {
    e.preventDefault();
    
    const amount = parseFloat(document.getElementById('amount').value);
    const dateInput = document.getElementById('date').value; // YYYY-MM-DD
    const desc = document.getElementById('description').value;
    const cat = categorySelect.value;
    const type = typeSelect.value;
    
    // Verifica Parcelamento
    const isInstallment = document.getElementById('is-installment').checked;
    const installments = parseInt(document.getElementById('installment-count').value) || 1;

    if (editId) {
        // Edição simples (não suporta transformar em parcelado na edição por segurança)
        const index = transactions.findIndex(t => t.id === editId);
        if (index !== -1) {
            transactions[index] = { id: editId, type, category: cat, amount, description: desc, date: dateInput };
        }
        resetForm();
    } else {
        // Criação (Com suporte a parcelas)
        if (isInstallment && installments > 1) {
            // Loop para criar várias transações
            let baseDate = new Date(dateInput + 'T12:00:00'); // Fuso horário seguro
            const parcelValue = parseFloat((amount / installments).toFixed(2)); // Valor dividido

            for (let i = 0; i < installments; i++) {
                // Cria data para o mês corrente + i
                let futureDate = new Date(baseDate);
                futureDate.setMonth(baseDate.getMonth() + i);
                
                const transaction = {
                    id: Date.now() + i, // ID único sequencial
                    type,
                    category: cat,
                    amount: parcelValue,
                    description: `${desc} (${i + 1}/${installments})`, // Ex: TV (1/10)
                    date: futureDate.toISOString().split('T')[0]
                };
                transactions.push(transaction);
            }
        } else {
            // Transação Única Normal
            const transaction = {
                id: Date.now(),
                type, category: cat, amount, description: desc, date: dateInput
            };
            transactions.push(transaction);
        }
    }

    saveAndRefresh();
    if(!editId) form.reset();
    document.getElementById('date').valueAsDate = new Date();
    toggleCategories();
    
    // Reseta checkbox de parcela
    document.getElementById('is-installment').checked = false;
    toggleInstallmentInput();
});

function toggleInstallmentInput() {
    const isChecked = document.getElementById('is-installment').checked;
    const group = document.getElementById('installment-group');
    const amountInput = document.getElementById('amount');
    
    if (isChecked) {
        group.classList.remove('hidden');
        amountInput.placeholder = "Valor Total da Compra";
    } else {
        group.classList.add('hidden');
        amountInput.placeholder = "Valor (R$)";
    }
}

// 3. Funções de Core (Salvar e Filtrar)
function saveAndRefresh() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    updateApp();
}

function getFilteredTransactions() {
    const selectedMonth = monthFilter.value; // Formato "YYYY-MM"
    return transactions.filter(t => t.date.startsWith(selectedMonth));
}

function updateApp() {
    const filtered = getFilteredTransactions();
    renderTable(filtered);
    updateDashboard(filtered);
    updateChart(filtered);
    renderBudgets(filtered);
}

// 4. Renderização da Tabela com Edição/Exclusão
function renderTable(data) {
    const tbody = document.getElementById('table-body');
    tbody.innerHTML = '';

// NOVA LÓGICA DE EMPTY STATE
if (data.length === 0) {
    tbody.innerHTML = `
        <tr>
            <td colspan="6">
                <div class="empty-state">
                    <span class="material-icons-round empty-icon">assignment_late</span>
                    <p>Nenhum lançamento encontrado neste período.</p>
                </div>
            </td>
        </tr>
    `;
    return;
}

// Ordenar por data (mais recente primeiro)
data.sort((a, b) => new Date(b.date) - new Date(a.date));

data.forEach(t => {
        const formattedDate = new Date(t.date).toLocaleDateString('pt-BR');
        const formattedAmount = t.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const typeBadgeClass = t.type === 'income' ? 'type-income' : 'type-expense';
        const typeIcon = t.type === 'income' ? 'arrow_upward' : 'arrow_downward';

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${formattedDate}</td>
            <td><span class="type-badge ${typeBadgeClass}"><span class="material-icons-round" style="font-size:14px;">${typeIcon}</span> ${t.type === 'income' ? 'Receita' : 'Despesa'}</span></td>
            <td>${t.category}</td>
            <td>${t.description}</td>
            <td style="font-weight:600; color: var(--${t.type === 'income' ? 'success' : 'danger'})">${formattedAmount}</td>
            <td>
                <button onclick="loadEdit(${t.id})" class="btn-icon" title="Editar"><span class="material-icons-round">edit</span></button>
                <button onclick="deleteTransaction(${t.id})" class="btn-icon" title="Excluir" style="color:var(--danger)"><span class="material-icons-round">delete</span></button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// 5. Dashboard (Cálculos)
function updateDashboard(data) {
    const income = data.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = data.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    const balance = income - expense;

    document.getElementById('total-income').innerText = income.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-expense').innerText = expense.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    document.getElementById('total-balance').innerText = balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// 6. Gráfico (Apenas Despesas do Mês)
function updateChart(data) {
    const expenseData = data.filter(t => t.type === 'expense');
    const categoriesMap = {};

    expenseData.forEach(t => {
        categoriesMap[t.category] = (categoriesMap[t.category] || 0) + t.amount;
    });

    const labels = Object.keys(categoriesMap);
    const values = Object.values(categoriesMap);

    const ctx = document.getElementById('expenseChart').getContext('2d');
    
    if (myChart) myChart.destroy();

    if (labels.length === 0) {
        // Se não houver dados, mostre um gráfico vazio ou mensagem (opcional)
        return; 
    }

    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: ['#e74c3c', '#3498db', '#9b59b6', '#f1c40f', '#e67e22', '#2ecc71', '#95a5a6'],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { position: 'right' },
                title: { display: true, text: 'Distribuição de Despesas' }
            }
        }
    });
}

// 7. Utilitários (Edição e Delete)
function deleteTransaction(id) {
    if(confirm('Tem certeza que deseja excluir?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveAndRefresh();
    }
}

function loadEdit(id) {
    const t = transactions.find(t => t.id === id);
    if (!t) return;

    editId = id;
    document.getElementById('type').value = t.type;
    toggleCategories(); // Atualiza lista de categorias
    document.getElementById('category').value = t.category;
    document.getElementById('amount').value = t.amount;
    document.getElementById('date').value = t.date;
    document.getElementById('description').value = t.description;

    // Muda UI para modo edição
    document.getElementById('submit-btn').textContent = "Atualizar Transação";
    document.getElementById('form-title').textContent = "Editar Lançamento";
    document.getElementById('cancel-edit').classList.remove('hidden');
    
    // Rola até o topo para ver o formulário
    document.querySelector('.container').scrollIntoView({ behavior: 'smooth' });
}

function resetForm() {
    editId = null;
    form.reset();
    document.getElementById('submit-btn').textContent = "Adicionar";
    document.getElementById('form-title').textContent = "Novo Lançamento";
    document.getElementById('cancel-edit').classList.add('hidden');
    document.getElementById('date').valueAsDate = new Date();
}

// 8. Exportação para Excel (CSV)
function exportToCSV() {
    const filtered = getFilteredTransactions();
    if (filtered.length === 0) {
        alert("Nenhum dado para exportar neste período.");
        return;
    }

    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data;Tipo;Categoria;Descricao;Valor\n";

    filtered.forEach(t => {
        const val = t.amount.toFixed(2).replace('.', ',');
        const tipo = t.type === 'income' ? 'Receita' : 'Despesa';
        csvContent += `${t.date};${tipo};${t.category};${t.description};${val}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `financas_${monthFilter.value}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

function showSection(id) {
    document.getElementById('dashboard').classList.toggle('hidden', id !== 'dashboard');
    document.getElementById('extrato').classList.toggle('hidden', id !== 'extrato');
}
// --- LÓGICA DE METAS (BUDGET) ---

function openBudgetModal() {
    const container = document.getElementById('budget-inputs');
    container.innerHTML = '';

    // Cria um input para cada categoria de DESPESA
    categories.expense.forEach(cat => {
        const currentLimit = budgets[cat] || 0;
        container.innerHTML += `
            <div style="margin-bottom:10px;">
                <label style="display:block; font-size:0.8rem; color:var(--text-color)">${cat}</label>
                <input type="number" id="budget-${cat}" value="${currentLimit}" placeholder="Sem limite" style="width:100%">
            </div>
        `;
    });

    document.getElementById('budget-modal').classList.remove('hidden');
}

function closeBudgetModal() {
    document.getElementById('budget-modal').classList.add('hidden');
}

function saveBudgets() {
    categories.expense.forEach(cat => {
        const val = parseFloat(document.getElementById(`budget-${cat}`).value);
        if (val > 0) {
            budgets[cat] = val;
        } else {
            delete budgets[cat]; // Remove meta se for 0 ou vazio
        }
    });

    localStorage.setItem('budgets', JSON.stringify(budgets));
    closeBudgetModal();
    updateApp(); // Recarrega a tela para mostrar as novas barras
}

function renderBudgets(currentTransactions) {
    const container = document.getElementById('budget-container');
    container.innerHTML = '';

    // Filtra apenas despesas
    const expenses = currentTransactions.filter(t => t.type === 'expense');
    
    // Agrupa gastos por categoria
    const spendingMap = {};
    expenses.forEach(t => {
        spendingMap[t.category] = (spendingMap[t.category] || 0) + t.amount;
    });

    // Se não houver metas configuradas
    if (Object.keys(budgets).length === 0) {
        container.innerHTML = '<p style="text-align:center; opacity:0.6; font-size:0.9rem">Nenhuma meta configurada. Clique em configurar.</p>';
        return;
    }

    // Gera as barras
    Object.keys(budgets).forEach(cat => {
        const limit = budgets[cat];
        const spent = spendingMap[cat] || 0;
        const percentage = Math.min((spent / limit) * 100, 100); // Trava em 100% visualmente
        
        // Define a cor baseada na porcentagem
        let colorClass = 'progress-green';
        if (percentage >= 70) colorClass = 'progress-yellow';
        if (percentage >= 90) colorClass = 'progress-red';

        container.innerHTML += `
            <div class="budget-item">
                <div class="budget-label">
                    <span>${cat}</span>
                    <span>R$ ${spent.toFixed(2)} / R$ ${limit.toFixed(2)} (${Math.floor(percentage)}%)</span>
                </div>
                <div class="progress-bg">
                    <div class="progress-bar ${colorClass}" style="width: ${percentage}%"></div>
                </div>
            </div>
        `;
    });
}
// --- SISTEMA DE PESQUISA (Busca em Tempo Real) ---
function filterTable() {
    const term = document.getElementById('search-input').value.toLowerCase();
    const rows = document.querySelectorAll('#finance-table tbody tr');

    rows.forEach(row => {
        const text = row.innerText.toLowerCase();
        // Se o termo existe na linha, mostra; senão, esconde.
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// --- SISTEMA DE CONFIGURAÇÕES E BACKUP ---

function openSettings() {
    document.getElementById('settings-modal').classList.remove('hidden');
}

function closeSettings() {
    document.getElementById('settings-modal').classList.add('hidden');
}

// 1. Criar Arquivo de Backup (JSON Completo)
function backupData() {
    const data = {
        transactions: transactions,
        budgets: budgets,
        version: "1.0",
        exportDate: new Date().toISOString()
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "finance_backup_" + new Date().toISOString().slice(0,10) + ".json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

// 2. Restaurar Backup
function restoreData(input) {
    const file = input.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            // Validação simples para ver se o arquivo é legítimo
            if (!data.transactions || !data.budgets) {
                alert("Erro: Arquivo de backup inválido.");
                return;
            }

            if(confirm(`Tem certeza? Isso substituirá seus dados atuais por um backup de ${data.exportDate.slice(0,10)}.`)) {
                transactions = data.transactions;
                budgets = data.budgets;
                saveAndRefresh(); // Salva no LocalStorage e atualiza a tela
                alert("Dados restaurados com sucesso!");
                closeSettings();
            }
        } catch (error) {
            alert("Erro ao ler o arquivo. Certifique-se de que é um JSON válido.");
            console.error(error);
        }
    };
    reader.readAsText(file);
    // Limpa o input para permitir carregar o mesmo arquivo novamente se necessário
    input.value = '';
}

// 3. Limpar Tudo (Reset de Fábrica)
function wipeData() {
    if(confirm("ATENÇÃO: Isso apagará TODOS os seus registros permanentemente. Tem certeza absoluta?")) {
        localStorage.clear();
        transactions = [];
        budgets = {};
        updateApp();
        closeSettings();
        alert("Sistema limpo com sucesso.");
    }
}
// --- SISTEMA DE GASTOS/GANHOS FIXOS (RECORRENTES) ---

let recurringItems = JSON.parse(localStorage.getItem('recurringItems')) || [];

// Inicialização: Verifica se precisa mostrar o alerta de fixos no Dashboard
function checkRecurringAlert() {
    const alertBox = document.getElementById('recurring-alert');
    if (recurringItems.length === 0) {
        alertBox.classList.add('hidden');
        return;
    }
    alertBox.classList.remove('hidden');
}

// Adicionar hook na função updateApp existente
const originalUpdateApp = updateApp;
updateApp = function() {
    originalUpdateApp(); // Chama a função original
    checkRecurringAlert(); // Verifica alerta
};

// Funções do Modal de Recorrência
function openRecurringModal() {
    document.getElementById('recurring-modal').classList.remove('hidden');
    renderRecurringList();
}

function closeRecurringModal() {
    document.getElementById('recurring-modal').classList.add('hidden');
}

function addRecurringItem() {
    const type = document.getElementById('rec-type').value;
    const day = document.getElementById('rec-day').value;
    const desc = document.getElementById('rec-desc').value;
    const amount = parseFloat(document.getElementById('rec-amount').value);

    if (!desc || !amount || !day) {
        alert("Preencha todos os campos!");
        return;
    }

    recurringItems.push({
        id: Date.now(),
        type,
        day,
        description: desc,
        amount,
        // Define categoria padrão baseada no tipo para simplificar
        category: type === 'income' ? 'Salário' : 'Moradia' 
    });

    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
    renderRecurringList();
    
    // Limpar campos
    document.getElementById('rec-desc').value = '';
    document.getElementById('rec-amount').value = '';
}

function renderRecurringList() {
    const tbody = document.getElementById('recurring-list');
    tbody.innerHTML = '';

    recurringItems.forEach(item => {
        const row = document.createElement('tr');
        const color = item.type === 'income' ? 'var(--success)' : 'var(--danger)';
        row.innerHTML = `
            <td>Dia ${item.day}</td>
            <td>${item.description}</td>
            <td style="color:${color}; font-weight:bold;">R$ ${item.amount.toFixed(2)}</td>
            <td>
                <button onclick="deleteRecurring(${item.id})" class="btn-icon" style="color:var(--danger)">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function deleteRecurring(id) {
    recurringItems = recurringItems.filter(i => i.id !== id);
    localStorage.setItem('recurringItems', JSON.stringify(recurringItems));
    renderRecurringList();
}

// A Mágica: Lançar os fixos no mês atual
function processRecurring() {
    const selectedMonth = monthFilter.value; // YYYY-MM
    let addedCount = 0;

    if(confirm(`Deseja lançar todos os itens fixos para o mês ${selectedMonth}?`)) {
        recurringItems.forEach(item => {
            // Cria a data: Mês Selecionado + Dia do Fixo
            const dateStr = `${selectedMonth}-${String(item.day).padStart(2, '0')}`;
            
            // Verifica duplicidade simples (mesma descrição, valor e data)
            const exists = transactions.some(t => 
                t.date === dateStr && 
                t.description === item.description && 
                t.amount === item.amount
            );

            if (!exists) {
                transactions.push({
                    id: Date.now() + Math.random(),
                    type: item.type,
                    category: item.category, // Usa a categoria salva ou padrão
                    amount: item.amount,
                    description: item.description,
                    date: dateStr
                });
                addedCount++;
            }
        });

        if (addedCount > 0) {
            saveAndRefresh();
            alert(`${addedCount} lançamentos fixos adicionados com sucesso!`);
        } else {
            alert("Os lançamentos fixos já constam neste mês.");
        }
    }
}