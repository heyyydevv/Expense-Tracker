// script.js

// Global Variables
let transactions = JSON.parse(localStorage.getItem('transactions')) || [];
let budgets = JSON.parse(localStorage.getItem('budgets')) || [];
let settings = JSON.parse(localStorage.getItem('settings')) || { autoSave: true, budgetAlerts: false };

// DOM Elements
const descriptionEl = document.getElementById('description');
const amountEl = document.getElementById('amount');
const categoryEl = document.getElementById('category');
const typeEl = document.getElementById('type');
const addTransactionBtn = document.getElementById('addTransaction');
const transactionsBody = document.getElementById('transactionsBody');

const totalIncomeEl = document.getElementById('totalIncome');
const totalExpensesEl = document.getElementById('totalExpenses');
const balanceEl = document.getElementById('balance');

const budgetAmountEl = document.getElementById('budgetAmount');
const budgetCategoryEl = document.getElementById('budgetCategory');
const setBudgetBtn = document.getElementById('setBudget');
const budgetSummaryEl = document.getElementById('budgetSummary');

const saveSettingsBtn = document.getElementById('saveSettings');
const autoSaveEl = document.getElementById('autoSave');
const budgetAlertsEl = document.getElementById('budgetAlerts');

const expenseChartCtx = document.getElementById('expenseChart').getContext('2d');
const monthlyReportChartCtx = document.getElementById('monthlyReportChart').getContext('2d');
const yearlyReportChartCtx = document.getElementById('yearlyReportChart').getContext('2d');

let expenseChart, monthlyReportChart, yearlyReportChart;

document.addEventListener('DOMContentLoaded', () => {
  // Initialize controls with saved settings
  autoSaveEl.checked = settings.autoSave;
  budgetAlertsEl.checked = settings.budgetAlerts;

  renderTransactions();
  renderSummary();
  renderBudgetSummary();
  initializeCharts();
});

// Add Transaction Event
addTransactionBtn.addEventListener('click', e => {
  e.preventDefault();
  addTransaction();
});

// Set Budget Event
setBudgetBtn.addEventListener('click', e => {
  e.preventDefault();
  setBudget();
});

// Save Settings Event
saveSettingsBtn.addEventListener('click', e => {
  e.preventDefault();
  saveSettings();
});

// Add a new transaction
function addTransaction() {
  const description = descriptionEl.value.trim();
  const amount = parseFloat(amountEl.value);
  const category = categoryEl.value;
  const type = typeEl.value;

  if (!description) {
    alert('Please enter a description.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Please enter a valid amount greater than 0.');
    return;
  }
  if (!category) {
    alert('Please select a category.');
    return;
  }

  const transaction = {
    id: Date.now(),
    description,
    amount,
    category,
    type,
    date: new Date().toISOString()
  };

  transactions.push(transaction);
  saveData();
  clearTransactionForm();
  renderTransactions();
  renderSummary();
  updateCharts();
  checkBudgetAlerts();
}

// Render all transactions into table
function renderTransactions() {
  transactionsBody.innerHTML = '';

  if (transactions.length === 0) {
    transactionsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions added.</td></tr>';
    return;
  }

  transactions.forEach(t => {
    const tr = document.createElement('tr');

    const descTd = document.createElement('td');
    descTd.textContent = t.description;
    tr.appendChild(descTd);

    const amountTd = document.createElement('td');
    amountTd.textContent = t.amount.toFixed(2);
    amountTd.className = t.type === 'income' ? 'income' : 'expense';
    tr.appendChild(amountTd);

    const categoryTd = document.createElement('td');
    categoryTd.textContent = capitalizeFirstLetter(t.category);
    tr.appendChild(categoryTd);

    const typeTd = document.createElement('td');
    typeTd.textContent = capitalizeFirstLetter(t.type);
    tr.appendChild(typeTd);

    const dateTd = document.createElement('td');
    dateTd.textContent = new Date(t.date).toLocaleDateString();
    tr.appendChild(dateTd);

    const actionTd = document.createElement('td');
    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = 'Delete';
    deleteBtn.className = 'delete-btn';
    deleteBtn.onclick = () => deleteTransaction(t.id);
    actionTd.appendChild(deleteBtn);
    tr.appendChild(actionTd);

    transactionsBody.appendChild(tr);
  });
}

// Delete transaction
function deleteTransaction(id) {
  if (!confirm('Are you sure you want to delete this transaction?')) return;
  transactions = transactions.filter(t => t.id !== id);
  saveData();
  renderTransactions();
  renderSummary();
  updateCharts();
}

// Render income, expense and balance summary
function renderSummary() {
  const totalIncome = transactions
    .filter(t => t.type === 'income')
    .reduce((acc, cur) => acc + cur.amount, 0);
  const totalExpenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((acc, cur) => acc + cur.amount, 0);
  const balance = totalIncome - totalExpenses;

  totalIncomeEl.textContent = totalIncome.toFixed(2);
  totalExpensesEl.textContent = totalExpenses.toFixed(2);
  balanceEl.textContent = balance.toFixed(2);
}

// Clear transaction form inputs
function clearTransactionForm() {
  descriptionEl.value = '';
  amountEl.value = '';
  categoryEl.selectedIndex = 0;
  typeEl.selectedIndex = 0;
}

// Set a budget for category
function setBudget() {
  const budgetAmount = parseFloat(budgetAmountEl.value);
  const budgetCategory = budgetCategoryEl.value;

  if (isNaN(budgetAmount) || budgetAmount <= 0) {
    alert('Please enter a valid budget amount greater than 0.');
    return;
  }
  if (!budgetCategory) {
    alert('Please select a category for the budget.');
    return;
  }

  const existingBudgetIndex = budgets.findIndex(b => b.category === budgetCategory);
  if (existingBudgetIndex !== -1) {
    budgets[existingBudgetIndex].amount = budgetAmount;
  } else {
    budgets.push({category: budgetCategory, amount: budgetAmount});
  }

  saveData();
  renderBudgetSummary();
  updateCharts();
  checkBudgetAlerts();
  budgetAmountEl.value = '';
  budgetCategoryEl.selectedIndex = 0;
}

// Render budget info
function renderBudgetSummary() {
  if (budgets.length === 0) {
    budgetSummaryEl.textContent = 'No budgets set.';
    return;
  }
  let summaryText = 'Budgets: ';
  budgets.forEach((b, i) => {
    summaryText += `${capitalizeFirstLetter(b.category)}: ₹${b.amount.toFixed(2)}`;
    if (i < budgets.length - 1) summaryText += ', ';
  });
  budgetSummaryEl.textContent = summaryText;
}

// Save data to localStorage
function saveData() {
  if (settings.autoSave) {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }
}

// Capitalize first letter utility
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Check for budget overspending alert
function checkBudgetAlerts() {
  if (!settings.budgetAlerts) return;
  let overspentCategories = [];

  budgets.forEach(budget => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === budget.category)
      .reduce((acc, t) => acc + t.amount, 0);
    if (spent > budget.amount) {
      overspentCategories.push(budget.category);
    }
  });

  if (overspentCategories.length) {
    alert('Warning! Overspending in categories: ' + overspentCategories.map(capitalizeFirstLetter).join(', '));
  }
}

// Save settings
saveSettings.addEventListener('click', () => {
  settings.autoSave = autoSaveEl.checked;
  settings.budgetAlerts = budgetAlertsEl.checked;
  localStorage.setItem('settings', JSON.stringify(settings));
  alert('Settings saved!');
});

// Initialize the charts with Chart.js
function initializeCharts() {
  updateCharts();
}

function updateCharts() {
  const monthlyData = {};
  const yearlyData = {};

  transactions.forEach(t => {
    let dt = new Date(t.date);
    let keyMonth = `${dt.getFullYear()}-${(dt.getMonth()+1).toString().padStart(2,'0')}`;
    let keyYear = dt.getFullYear();

    if (!monthlyData[keyMonth]) monthlyData[keyMonth] = 0;
    if (!yearlyData[keyYear]) yearlyData[keyYear] = 0;

    if (t.type === 'income') {
      monthlyData[keyMonth] += t.amount;
      yearlyData[keyYear] += t.amount;
    } else if (t.type === 'expense') {
      monthlyData[keyMonth] -= t.amount;
      yearlyData[keyYear] -= t.amount;
    }
  });

  // Prepare data for monthly report chart (last 12 months)
  const sortedMonths = Object.keys(monthlyData).sort();
  const last12 = sortedMonths.slice(-12);
  const monthLabels = last12.map(m => {
    const [y, mon] = m.split('-');
    return new Date(y, mon - 1).toLocaleString('default', { month: 'short', year: '2-digit' });
  });
  const monthValues = last12.map(m => monthlyData[m].toFixed(2));

  // Prepare data for yearly report chart
  const sortedYears = Object.keys(yearlyData).sort();
  const yearLabels = sortedYears;
  const yearValues = sortedYears.map(y => yearlyData[y].toFixed(2));

  // Destroy old charts if exist
  if (window.monthlyReportChartInstance) window.monthlyReportChartInstance.destroy();
  if (window.yearlyReportChartInstance) window.yearlyReportChartInstance.destroy();

  // Monthly report chart
  window.monthlyReportChartInstance = new Chart(monthlyReportChartCtx, {
    type: 'bar',
    data: {
      labels: monthLabels,
      datasets: [{
        label: 'Net Income',
        data: monthValues,
        backgroundColor: monthValues.map(v => v >= 0 ? 'rgba(40,167,69,0.7)' : 'rgba(220,53,69,0.7)')
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });

  // Yearly report chart
  window.yearlyReportChartInstance = new Chart(yearlyReportChartCtx, {
    type: 'line',
    data: {
      labels: yearLabels,
      datasets: [{
        label: 'Net Income',
        data: yearValues,
        borderColor: 'rgba(40,167,69,1)',
        backgroundColor: 'rgba(40,167,69,0.3)',
        fill: true,
        tension: 0.2,
      }]
    },
    options: {
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } }
    }
  });
}

// Initial load
document.addEventListener('DOMContentLoaded', () => {
  renderTransactions();
  renderSummary();
  renderBudgetSummary();
  initializeCharts();
});

// Helper functions to refresh UI after transactions update
function renderTransactions() {
  transactionsBody.innerHTML = '';
  if (transactions.length === 0) {
    transactionsBody.innerHTML = '<tr><td colspan="6" style="text-align:center;">No transactions recorded.</td></tr>';
    return;
  }
  transactions.forEach(t => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${t.description}</td>
      <td class="${t.type}">${t.amount.toFixed(2)}</td>
      <td>${capitalizeFirstLetter(t.category)}</td>
      <td>${capitalizeFirstLetter(t.type)}</td>
      <td>${new Date(t.date).toLocaleDateString()}</td>
      <td><button class="delete-btn" data-id="${t.id}">Delete</button></td>
    `;
    transactionsBody.appendChild(tr);
  });

  // Add delete button handlers
  document.querySelectorAll('.delete-btn').forEach(btn =>
    btn.addEventListener('click', () => {
      const id = Number(btn.dataset.id);
      if (confirm('Delete this transaction?')) {
        transactions = transactions.filter(t => t.id !== id);
        saveData();
        renderTransactions();
        renderSummary();
        updateCharts();
        renderBudgetSummary();
      }
    })
  );
}

function renderBudgetSummary() {
  if (budgets.length === 0) {
    budgetSummaryEl.textContent = 'No budgets set.';
    return;
  }
  const items = budgets.map(b => {
    const spent = transactions
      .filter(t => t.type === 'expense' && t.category === b.category)
      .reduce((sum, t) => sum + t.amount, 0);
    const percent = ((spent / b.amount) * 100).toFixed(1);
    return `<div><strong>${capitalizeFirstLetter(b.category)}:</strong> Budget ₹${b.amount.toFixed(2)} - Spent ₹${spent.toFixed(2)} (${percent}%)</div>`;
  });
  budgetSummaryEl.innerHTML = items.join('');
}

// Save all data in localStorage when appropriate
function saveData() {
  localStorage.setItem('transactions', JSON.stringify(transactions));
  localStorage.setItem('budgets', JSON.stringify(budgets));
  localStorage.setItem('settings', JSON.stringify(settings));
}

// Add budget event handler
setBudgetBtn.addEventListener('click', e => {
  e.preventDefault();
  const amount = parseFloat(budgetAmountEl.value);
  const category = budgetCategoryEl.value;
  if (!category) {
    alert('Please select a category.');
    return;
  }
  if (isNaN(amount) || amount <= 0) {
    alert('Enter a valid budget amount.');
    return;
  }
  const existing = budgets.find(b => b.category === category);
  if (existing) {
    existing.amount = amount;
  } else {
    budgets.push({ category, amount });
  }
  saveData();
  renderBudgetSummary();
  updateCharts();
  budgetAmountEl.value = '';
  budgetCategoryEl.value = '';
});

// Add transaction event handler
document.getElementById('transactionForm').addEventListener('submit', e => {
  e.preventDefault();
  addTransaction();
});