
"use strict";

import {
    loadData,
    saveData,
    createId,
    money,
    escapeHTML,
    todayString
} from "./storage.js";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const PRODUCTS_KEY = "smartstore_products";
const SALES_KEY = "smartstore_sales";

let saleItems = [];

function getProducts() {
    return loadData(PRODUCTS_KEY, []);
}

function getSales() {
    return loadData(SALES_KEY, []);
}

function getCurrency() {
    return localStorage.getItem("smartstore_currency") || "₪";
}

function notify(message) {
    const messageElement = $("#toast-message");
    const toast = $("#toast");

    if (messageElement) {
        messageElement.textContent = message;
    } else if (toast) {
        toast.textContent = message;
    } else {
        alert(message);
    }

    toast?.classList.add("visible");

    // إخفاء الرسالة تلقائياً بعد 3 ثواني
    clearTimeout(toast?._hideTimer);
    if (toast) {
        toast._hideTimer = setTimeout(() => {
            toast.classList.remove("visible");
        }, 3000);
    }
}

// تجهيز قائمة المنتجات المتاحة للبيع فقط
export function renderSaleOptions() {
    const select = $("#sale-product");

    if (!select) return;

    const products = getProducts();
    const previousValue = select.value;

    const availableProducts = products.filter(
        (product) => Number(product.quantity) > 0
    );

    select.innerHTML = `
        <option value="">اختر المنتج</option>
        ${availableProducts.map((product) => `
            <option value="${escapeHTML(product.id)}">
                ${escapeHTML(product.name)}
                — المتوفر: ${Number(product.quantity)}
                — ${escapeHTML(money(product.sellPrice, getCurrency()))}
            </option>
        `).join("")}
    `;

    if (availableProducts.some(
        (product) => String(product.id) === previousValue
    )) {
        select.value = previousValue;
    }
}

// عرض العناصر التي أضيفت إلى الفاتورة
function renderSaleItems() {
    const tableBody = $("#sale-items-table");

    if (!tableBody) return;

    if (saleItems.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="5">لم تتم إضافة منتجات إلى الفاتورة.</td>
            </tr>
        `;
    } else {
        tableBody.innerHTML = saleItems.map((item, index) => `
            <tr>
                <td>${escapeHTML(item.name)}</td>
                <td>${item.quantity}</td>
                <td>${escapeHTML(money(item.price, getCurrency()))}</td>
                <td>${escapeHTML(money(
            item.price * item.quantity,
            getCurrency()
        ))}</td>
                <td>
                    <button type="button" data-remove-sale-item="${index}">
                        إزالة
                    </button>
                </td>
            </tr>
        `).join("");
    }

    const total = saleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const totalElement = $("#sale-total");

    if (totalElement) {
        totalElement.textContent = money(total, getCurrency());
    }
}

// إضافة منتج إلى الفاتورة المؤقتة
function addSaleItem() {
    const productId = $("#sale-product")?.value;
    const quantity = Number($("#sale-quantity")?.value);

    if (!productId) {
        notify("يرجى اختيار منتج.");
        return;
    }

    if (!Number.isInteger(quantity) || quantity < 1) {
        notify("أدخل كمية صحيحة لا تقل عن 1.");
        return;
    }

    const product = getProducts().find(
        (item) => String(item.id) === String(productId)
    );

    if (!product || Number(product.quantity) < 1) {
        notify("هذا المنتج غير متوفر في المخزون.");
        renderSaleOptions();
        return;
    }

    const alreadyAdded = saleItems
        .filter((item) => String(item.productId) === String(productId))
        .reduce((sum, item) => sum + item.quantity, 0);

    if (alreadyAdded + quantity > Number(product.quantity)) {
        notify(`الكمية المتوفرة هي ${product.quantity} فقط.`);
        return;
    }

    const existingItem = saleItems.find(
        (item) => String(item.productId) === String(productId)
    );

    if (existingItem) {
        existingItem.quantity += quantity;
    } else {
        saleItems.push({
            productId: product.id,
            name: product.name,
            price: Number(product.sellPrice) || 0,
            buyPrice: Number(product.buyPrice) || 0,
            quantity
        });
    }

    renderSaleItems();

    const quantityInput = $("#sale-quantity");
    if (quantityInput) quantityInput.value = "1";
}

// إزالة عنصر من الفاتورة قبل حفظ البيع
function removeSaleItem(index) {
    if (index < 0 || index >= saleItems.length) return;

    saleItems.splice(index, 1);
    renderSaleItems();
}

// حفظ عملية البيع وخصم الكميات
function handleSaleSubmit(event) {
    event.preventDefault();

    if (saleItems.length === 0) {
        notify("أضف منتجًا واحدًا على الأقل قبل حفظ البيع.");
        return;
    }

    // إعادة التحقق من المخزون وقت الحفظ
    const products = getProducts();

    for (const item of saleItems) {
        const product = products.find(
            (entry) => String(entry.id) === String(item.productId)
        );

        if (!product || Number(product.quantity) < item.quantity) {
            notify(`الكمية المتوفرة من "${item.name}" لم تعد كافية.`);
            renderSaleOptions();
            return;
        }
    }

    const total = saleItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
    );

    const customerName =
        $("#sale-customer")?.value.trim() || "عميل نقدي";

    const paymentMethod =
        $("#sale-payment-method")?.value || "cash";

    const amountPaidField = $("#sale-amount-paid");

    const amountPaid = amountPaidField
        ? Number(amountPaidField.value)
        : total;

    if (
        !Number.isFinite(amountPaid) ||
        amountPaid < 0 ||
        amountPaid > total
    ) {
        notify("المبلغ المدفوع يجب أن يكون بين صفر وإجمالي الفاتورة.");
        return;
    }

    const debt = Math.max(0, total - amountPaid);

    const updatedProducts = products.map((product) => {
        const soldQuantity = saleItems
            .filter((item) =>
                String(item.productId) === String(product.id)
            )
            .reduce((sum, item) => sum + item.quantity, 0);

        if (soldQuantity === 0) return product;

        return {
            ...product,
            quantity: Number(product.quantity) - soldQuantity
        };
    });

    const sale = {
        id: createId(),
        invoice: `INV-${Date.now()}`,
        date: todayString(),
        createdAt: new Date().toISOString(),
        customerName,
        paymentMethod,
        items: saleItems.map((item) => ({ ...item })),
        total,
        amountPaid,
        debt
    };

    // حفظ السجل أولًا، ثم تحديث المخزون.
    // التخزين المحلي لا يضمن معاملة ذرية بين المفتاحين.
    const oldSales = getSales();

    if (!saveData(SALES_KEY, [...oldSales, sale])) {
        notify("تعذر حفظ عملية البيع.");
        return;
    }

    if (!saveData(PRODUCTS_KEY, updatedProducts)) {
        // محاولة التراجع عن إضافة سجل البيع إذا فشل تحديث المخزون
        saveData(SALES_KEY, oldSales);
        notify("تعذر تحديث المخزون، لم تكتمل عملية البيع.");
        return;
    }

    window.dispatchEvent(new CustomEvent("smartstore:data-updated"));

    saleItems = [];
    renderSaleItems();
    renderSaleOptions();

    event.target.reset();

    const quantityInput = $("#sale-quantity");
    if (quantityInput) quantityInput.value = "1";

    renderSales();
    notify(`تم حفظ الفاتورة بنجاح. المتبقي على العميل: ${money(debt, getCurrency())}`);
}

// عرض سجل المبيعات
export function renderSales() {
    const tableBody = $("#sales-table");

    if (!tableBody) return;

    const search = ($("#sales-search")?.value || "")
        .trim()
        .toLowerCase();

    const dateFilter = $("#sales-date-filter")?.value || "";

    const sales = getSales()
        .filter((sale) => {
            const searchableText = [
                sale.invoice,
                sale.customerName,
                sale.customer
            ].join(" ").toLowerCase();

            const saleDate = String(sale.date || "").slice(0, 10);

            return searchableText.includes(search) &&
                (!dateFilter || saleDate === dateFilter);
        })
        .sort((a, b) =>
            String(b.createdAt || b.date || "")
                .localeCompare(String(a.createdAt || a.date || ""))
        );

    if (sales.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="6">لا توجد مبيعات مطابقة.</td>
            </tr>
        `;
        return;
    }

    tableBody.innerHTML = sales.map((sale) => `
        <tr>
            <td>${escapeHTML(sale.invoice || sale.id)}</td>
            <td>${escapeHTML(sale.customerName || sale.customer || "عميل نقدي")}</td>
            <td>${escapeHTML(sale.date || "—")}</td>
            <td>${escapeHTML(money(sale.total, getCurrency()))}</td>
            <td>${escapeHTML(money(sale.amountPaid ?? sale.total, getCurrency()))}</td>
            <td>${escapeHTML(money(sale.debt ?? 0, getCurrency()))}</td>
        </tr>
    `).join("");
}

// تهيئة أحداث صفحات المبيعات
export function initializeSales() {
    document.addEventListener("click", (event) => {
        if (event.target.closest("#add-sale-item-btn")) {
            addSaleItem();
        }

        const removeButton = event.target.closest("[data-remove-sale-item]");

        if (removeButton) {
            removeSaleItem(Number(removeButton.dataset.removeSaleItem));
        }

        if (event.target.closest("#new-sale-btn")) {
            saleItems = [];
            renderSaleItems();
        }
    });

    document.addEventListener("submit", (event) => {
        if (event.target.matches("#sale-form")) {
            handleSaleSubmit(event);
        }
    });

    document.addEventListener("input", (event) => {
        if (
            event.target.matches("#sales-search") ||
            event.target.matches("#sales-date-filter")
        ) {
            renderSales();
        }
    });

    window.addEventListener("smartstore:page-loaded", (event) => {
        if (event.detail?.page === "sales") {
            renderSaleOptions();
            renderSaleItems();
            renderSales();
        }
    });

    window.addEventListener("smartstore:data-updated", () => {
        renderSaleOptions();
        renderSales();
    });
}
