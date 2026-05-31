// --- Configuration ---
const API_BASE_URL = 'http://127.0.0.1:8000';
const ENDPOINT = '/expenses/';

// --- DOM Elements ---
const form = document.getElementById('expense-form');
const filterCategory = document.getElementById('filter-category');
const listContainer = document.getElementById('expense-list-container');
const totalSpentElement = document.getElementById('total-spent');
const expenseCountElement = document.getElementById('expense-count');

// --- Helper Function for API Calls ---
async function apiFetch(url, method = 'GET', data = null) {
    try {
        const options = {
            method: method,
            headers: { 'Content-Type': 'application/json' },
        };
        if (data) {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const error = await response.json();
            throw new Error(`API Error: ${response.status} - ${error.detail || 'Request failed'}`);
        }

        if (response.status === 204) {
            return {};
        }

        return await response.json();
    } catch (error) {
        console.error('Network or API Error:', error);
        // Display a user-friendly message for failure to fetch
        if (error.message.includes('Failed to fetch')) {
             listContainer.innerHTML = `<p style="color: red; font-weight: bold;">Connection Error: Could not connect to the API server at ${API_BASE_URL}. Ensure your 'uvicorn api:app --reload' server is running.</p>`;
        } else {
             alert(`Operation Failed: ${error.message}`);
        }
        throw error; // Re-throw to stop subsequent operations
    }
}

// --- Render Functions ---

function updateSummary(expenses) {
    const total = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    totalSpentElement.textContent = `$${total.toFixed(2)}`;
    expenseCountElement.textContent = expenses.length;
}

function renderExpenses(expenses) {
    if (!listContainer) return;
    
    if (expenses.length === 0) {
        listContainer.innerHTML = '<p>No expenses found for this filter. Add one above!</p>';
        return;
    }

    let html = `
        <table class="expense-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Amount ($)</th>
                    <th>Description</th>
                    <th>Category</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
    `;

    expenses.forEach(exp => {
        // Use the category name as a CSS class for conditional styling
        const categoryClass = exp.category.replace(/\s/g, ''); 
        html += `
            <tr class="${categoryClass}">
                <td>${exp.date}</td>
                <td>$${exp.amount.toFixed(2)}</td>
                <td>${exp.description || 'N/A'}</td>
                <td>${exp.category}</td>
                <td>
                    <button class="delete-btn" onclick="deleteExpense(${exp.id})">Delete</button>
                </td>
            </tr>
        `;
    });

    html += '</tbody></table>';
    listContainer.innerHTML = html;
}

// --- CRUD Operations ---

// READ all and filter
async function fetchAndRenderExpenses() {
    listContainer.innerHTML = '<p>Loading expenses...</p>';
    
    try {
        const allExpenses = await apiFetch(API_BASE_URL + ENDPOINT);
        
        // 1. Get the current filter
        const selectedCategory = filterCategory.value;
        
        // 2. Filter the expenses
        const filteredExpenses = selectedCategory === 'all' 
            ? allExpenses
            : allExpenses.filter(exp => exp.category === selectedCategory);
            
        // 3. Sort by date (most recent first)
        filteredExpenses.sort((a, b) => new Date(b.date) - new Date(a.date));

        // 4. Update the summary and render the list
        updateSummary(allExpenses); // Summary is based on ALL expenses
        renderExpenses(filteredExpenses); // List is based on FILTERED expenses

    } catch (error) {
        // Error already handled in apiFetch and displayed to user
    }
}

// CREATE new expense
async function handleFormSubmit(event) {
    event.preventDefault();

    const amount = parseFloat(form.amount.value);
    const category = form.category.value;
    const description = form.description.value.trim();
    const date = form.date.value;

    if (!amount || !category || !date) {
        alert("Please fill in the amount, category, and date.");
        return;
    }

    const expenseData = { amount, category, description, date };

    try {
        await apiFetch(API_BASE_URL + ENDPOINT, 'POST', expenseData);
        form.reset();
        fetchAndRenderExpenses(); // Refresh the list
    } catch (error) {
        // Error handled in apiFetch
    }
}

// DELETE expense
async function deleteExpense(id) {
    const confirmation = window.confirm(`Are you sure you want to delete this expense (ID: ${id})?`);
    if (!confirmation) return;

    try {
        await apiFetch(API_BASE_URL + ENDPOINT + id, 'DELETE');
        fetchAndRenderExpenses(); // Refresh the list
    } catch (error) {
        // Error handled in apiFetch
    }
}

// Attach deleteExpense to the window so it can be called from onclick in renderExpenses
window.deleteExpense = deleteExpense;


// --- Initialization ---
document.addEventListener('DOMContentLoaded', () => {
    // Set today's date as max for date input
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('date').setAttribute('max', today);
    document.getElementById('date').value = today; // Set default value to today

    // Attach event listeners
    if (form) {
        form.addEventListener('submit', handleFormSubmit);
    }
    if (filterCategory) {
        filterCategory.addEventListener('change', fetchAndRenderExpenses);
    }
    
    // Initial data load
    fetchAndRenderExpenses();
});
