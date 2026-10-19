
"use strict";

import { loadData, money, escapeHTML } from "./storage.js";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

function getCurrency() {
    return localStorage.getItem("smartstore_currency") || "₪";
}

function getDateRange() {
    const from = $("#report-from")?.value || "";
    const to = $("#report-to")?.value || "";

    return { from, to };
}

function isWithinRange(dateValue, from, to) {
    const date = String(dateValue || "").slice(0, 10);

    if (!date) return false;
    if (from && date < from) return false;
    if (to && date > to) return false;

    return true;
}

// حساب تقارير الفترة المحددة
export function calculateReport() {
    const products = loadData("smartstore_products", []);
    const sales = loadData("smartstore_sales", []);
    const expenses = loadData("smartstore_expenses", []);
    const { from, to } = getDateRange();

    const filteredSales = sales.filter((sale) =>
        isWithinRange(sale.date || sale.createdAt, from, to)
    );

    const filteredExpenses = expenses.filter((expense) =>
        isWithinRange(expense.date || expense.createdAt, from, to)
    );

    const revenue = filteredSales.reduce(
        (sum, sale) => sum + (Number(sale.total) || 0),
        0
    );

    const costOfGoods = filteredSales.reduce((sum, sale) => {
        const items = Array.isArray(sale.items) ? sale.items : [];

        return sum + items.reduce((itemSum, item) => {
            const product = products.find(
                (entry) => String(entry.id) === String(item.productId)
            );

            // نستخدم سعر الشراء المحفوظ داخل عنصر البيع إن توفر،
            // وإلا سعر الشراء الحالي للمنتج كتقدير تقريبي.
            const buyPrice = Number(
                item.buyPrice ?? product?.buyPrice ?? 0
            );

            return itemSum +
                buyPrice * (Number(item.quantity) || 0);
        }, 0);
    }, 0);

    const expenseTotal = filteredExpenses.reduce(
        (sum, expense) => sum + (Number(expense.amount) || 0),
        0
    );

    const grossProfit = revenue - costOfGoods;
    const netProfit = grossProfit - expenseTotal;

    const totalPaid = filteredSales.reduce(
        (sum, sale) =>
            sum + (Number(sale.amountPaid ?? sale.total) || 0),
        0
    );

    const totalDebt = filteredSales.reduce(
        (sum, sale) => sum + (Number(sale.debt) || 0),
        0
    );

    const cashSales = filteredSales
        .filter((sale) => sale.paymentMethod === "cash")
        .reduce((sum, sale) => sum + (Number(sale.amountPaid ?? sale.total) || 0), 0);

    const electronicSales = filteredSales
        .filter((sale) =>
            ["electronic", "card", "bank", "online"].includes(
                sale.paymentMethod
            )
        )
        .reduce((sum, sale) => sum + (Number(sale.amountPaid ?? sale.total) || 0), 0);

    return {
        salesCount: filteredSales.length,
        revenue,
        costOfGoods,
        grossProfit,
        expenseTotal,
        netProfit,
        totalPaid,
        totalDebt,
        cashSales,
        electronicSales
    };
}

// عرض قيمة التقرير داخل عنصر موجود
function setText(selector, value) {
    const element = $(selector);

    if (element) {
        element.textContent = value;
    }
}

// عرض التقارير
export function renderReports() {
    const report = calculateReport();
    const currency = getCurrency();

    setText("#report-sales-count", report.salesCount.toLocaleString("en-US"));
    setText("#report-revenue", money(report.revenue, currency));
    setText("#report-cost-of-goods", money(report.costOfGoods, currency));
    setText("#report-gross-profit", money(report.grossProfit, currency));
    setText("#report-expenses", money(report.expenseTotal, currency));
    setText("#report-net-profit", money(report.netProfit, currency));
    setText("#report-paid", money(report.totalPaid, currency));
    setText("#report-debt", money(report.totalDebt, currency));
    setText("#report-cash", money(report.cashSales, currency));
    setText("#report-electronic", money(report.electronicSales, currency));

    const profitElement = $("#report-net-profit");

    if (profitElement) {
        profitElement.dataset.status =
            report.netProfit < 0 ? "loss" : "profit";
    }
}

// تهيئة أحداث صفحة التقارير
export function initializeReports() {
    document.addEventListener("change", (event) => {
        if (
            event.target.matches("#report-from") ||
            event.target.matches("#report-to")
        ) {
            renderReports();
        }
    });

    window.addEventListener("smartstore:page-loaded", (event) => {
        if (event.detail?.page === "reports") {
            renderReports();
        }
    });

    window.addEventListener("smartstore:data-updated", renderReports);
}
