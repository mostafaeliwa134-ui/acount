
"use strict";

import { loadData, money, todayString, escapeHTML } from "./storage.js";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

// قراءة بيانات المتجر
function getDashboardData() {
    return {
        products: loadData("smartstore_products", []),
        sales: loadData("smartstore_sales", []),
        expenses: loadData("smartstore_expenses", []),
        currency: localStorage.getItem("smartstore_currency") || "₪"
    };
}

// حساب مجموع المبيعات
function calculateSales(sales, todayOnly = false) {
    const today = todayString();

    return sales.reduce((total, sale) => {
        const saleDate = String(
            sale.date || sale.createdAt || ""
        ).slice(0, 10);

        if (todayOnly && saleDate !== today) {
            return total;
        }

        return total + (Number(sale.total) || 0);
    }, 0);
}

// حساب المصروفات
function calculateExpenses(expenses, todayOnly = false) {
    const today = todayString();

    return expenses.reduce((total, expense) => {
        const expenseDate = String(
            expense.date || expense.createdAt || ""
        ).slice(0, 10);

        if (todayOnly && expenseDate !== today) {
            return total;
        }

        return total + (Number(expense.amount) || 0);
    }, 0);
}

// تحديث النص عند وجود العنصر
function setText(selector, value, parent = document) {
    const element = $(selector, parent);

    if (element) {
        element.textContent = value;
    }
}

// عرض تاريخ اليوم في لوحة التحكم
function renderDashboardDate() {
    const dateElement = $("#dashboard-today-date");

    if (!dateElement) {
        return;
    }

    dateElement.textContent = new Date().toLocaleDateString("ar", {
        year: "numeric",
        month: "long",
        day: "numeric"
    });
}


// إنشاء صفوف جدول آخر المبيعات
function renderRecentSales(sales, currency) {
    const tableBody = $("#recent-sales-table");

    if (!tableBody) {
        return;
    }

    const recentSales = [...sales]
        .sort((a, b) => {
            const dateA = new Date(
                a.date || a.createdAt || 0
            ).getTime();

            const dateB = new Date(
                b.date || b.createdAt || 0
            ).getTime();

            return dateB - dateA;
        })
        .slice(0, 5);

    if (recentSales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="4">لا توجد مبيعات حتى الآن.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = recentSales.map((sale) => `
        <tr>
            <td>${escapeHTML(sale.invoice || sale.id || "—")}</td>
            <td>${escapeHTML(sale.customerName || sale.customer || "عميل نقدي")}</td>
            <td>${escapeHTML(sale.date || sale.createdAt || "—")}</td>
            <td>${escapeHTML(money(sale.total, currency))}</td>
        </tr>
    `).join("");
}

// عرض تنبيهات انخفاض المخزون
function renderStockAlerts(products) {
    const container = $("#stock-alerts");

    if (!container) {
        return;
    }

    const lowStockProducts = products.filter((product) => {
        const quantity = Number(product.quantity) || 0;
        const minimum = Number(
            product.minQuantity ?? product.min_quantity ?? 5
        );

        return quantity <= minimum;
    }).slice(0, 5);

    if (lowStockProducts.length === 0) {
        container.textContent = "لا توجد تنبيهات للمخزون حاليًا.";
        return;
    }

    container.innerHTML = lowStockProducts.map((product) => `
        <div class="stock-alert-item">
            <span>${escapeHTML(product.name || "منتج بدون اسم")}</span>
            <strong>الكمية: ${Number(product.quantity) || 0}</strong>
        </div>
    `).join("");
}

// تحديث لوحة التحكم
export function renderDashboard() {
    const {
        products,
        sales,
        expenses,
        currency
    } = getDashboardData();

    const todaySales = calculateSales(sales, true);
    const todayExpenses = calculateExpenses(expenses, true);

    const lowStockCount = products.filter((product) => {
        const quantity = Number(product.quantity) || 0;
        const minimum = Number(
            product.minQuantity ?? product.min_quantity ?? 5
        );

        return quantity <= minimum;
    }).length;

    renderDashboardDate();

    setText("#stat-sales", money(todaySales, currency));
    setText(
        "#stat-products",
        products.length.toLocaleString("en-US")
    );
    setText(
        "#stat-low-stock",
        lowStockCount.toLocaleString("en-US")
    );
    setText("#stat-expenses", money(todayExpenses, currency));

    renderRecentSales(sales, currency);
    renderStockAlerts(products);
}

// تحديث لوحة التحكم عند فتح الصفحة
export function initializeDashboard() {
    window.addEventListener("smartstore:page-loaded", (event) => {
        if (event.detail?.page === "dashboard") {
            renderDashboard();
        }
    });

    window.addEventListener("smartstore:data-updated", () => {
        renderDashboard();
    });
}
