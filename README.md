# 💸 FinanceFlow Pro

> Um sistema de gestão financeira pessoal moderno, robusto e focado em privacidade, rodando 100% no navegador.

## 🖼️ Preview

## 📖 Sobre o Projeto

O **FinanceFlow Pro** é uma Single Page Application (SPA) desenvolvida para facilitar o controle de receitas e despesas. Diferente de planilhas complexas ou apps que exigem cadastro na nuvem, este sistema opera no modelo **Offline-First**, utilizando o `LocalStorage` do navegador para persistir os dados. Isso garante privacidade total e velocidade instantânea.

O projeto evoluiu de um simples rastreador de gastos para uma suíte completa com gestão de metas, parcelamentos inteligentes e design estilo "Fintech Moderna".

## ✨ Funcionalidades Principais

### 📊 Gestão Financeira
- **Dashboard Interativo:** Visão clara de Entradas, Saídas e Saldo Atual.
- **Gráficos Dinâmicos:** Visualização de despesas por categoria (via Chart.js).
- **Extrato Detalhado:** Tabela completa com identificação visual de receitas e despesas.
- **Filtros Temporais:** Navegue facilmente entre meses e anos.

### 🚀 Funcionalidades Avançadas (Pro)
- **🛍️ Compras Parceladas:** Lançamento automático de parcelas futuras (ex: "Compra 1/10", "Compra 2/10").
- **🔁 Recorrência:** Módulo para gerenciar contas fixas (Aluguel, Salário, Internet) e lançá-las com um clique.
- **🎯 Metas (Budgeting):** Defina tetos de gastos por categoria e acompanhe via barras de progresso (Verde/Amarelo/Vermelho).
- **🔍 Busca Rápida:** Filtre lançamentos por descrição em tempo real.

### 🛡️ Segurança e Dados
- **Backup & Restore:** Gere arquivos `.json` com seus dados para salvar em local seguro ou transferir de computador.
- **Exportação Excel:** Baixe seus relatórios em formato `.csv`.
- **Privacidade:** Nenhum dado é enviado para servidores externos.

### 🎨 UI / UX
- **Design Moderno:** Interface estilo "Glassmorphism" com sombras suaves e fontes modernas.
- **Dark Mode:** Alternância nativa entre Tema Claro e Escuro.
- **Responsivo:** Funciona bem em desktops e dispositivos móveis.

## 🛠️ Tecnologias Utilizadas

O projeto foi construído utilizando as tecnologias fundamentais da Web (Vanilla Stack), garantindo leveza e compatibilidade.

- **HTML5:** Estrutura semântica.
- **CSS3:** Variáveis CSS (Custom Properties), Flexbox, Grid e Design Responsivo.
- **JavaScript (ES6+):** Lógica completa de CRUD, manipulação de DOM e LocalStorage API.
- **Chart.js:** Biblioteca para renderização dos gráficos.
- **Google Fonts (Inter):** Tipografia moderna.
- **Material Icons:** Ícones de interface.

## 📂 Estrutura do Projeto

```text
FinanceFlow-Pro/
│
├── index.html          # Estrutura e Interface
├── style.css           # Estilização (Temas e Layout)
├── script.js           # Lógica de Negócios e Persistência
├── README.md           # Documentação
└── /docs               # Documentos de Planejamento (Roadmap, Changelog)
