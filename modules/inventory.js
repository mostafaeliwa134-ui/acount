
"use strict";

import { loadData, money, escapeHTML } from "./storage.js";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

export function renderInventory() {
    const tableBody = $("#inventory-table");

    if (!tableBody) return;

    const products = loadData("smartstore_products", []);
    const currency = localStorage.getItem("smartstore_currency") || "₪";

    if (products.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">لا توجد منتجات في المخزون حاليًا.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = products.map((product) => {
        const quantity = Number(product.quantity) || 0;
        const minimum = Number(product.minQuantity ?? 5);
        const status = quantity === 0
            ? "نفد المخزون"
            : quantity <= minimum
                ? "مخزون منخفض"
                : "متوفر";

        return `
            <tr>
                <td>${escapeHTML(product.code || "—")}</td>
                <td>${escapeHTML(product.name || "بدون اسم")}</td>
                <td>${quantity}</td>
                <td>${minimum}</td>
                <td>${escapeHTML(status)}</td>
                <td>${escapeHTML(money(
            quantity * (Number(product.buyPrice) || 0),
            currency
        ))}</td>
            </tr>
        `;
    }).join("");
}

export function initializeInventory() {
    window.addEventListener("smartstore:page-loaded", (event) => {
        if (event.detail?.page === "inventory") {
            renderInventory();
        }
    });

    window.addEventListener("smartstore:data-updated", renderInventory);
}
