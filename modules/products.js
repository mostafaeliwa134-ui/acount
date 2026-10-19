
"use strict";

import {
    loadData,
    saveData,
    createId,
    money,
    escapeHTML
} from "./storage.js";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const PRODUCTS_KEY = "smartstore_products";
const SALES_KEY = "smartstore_sales";

function getProducts() {
    return loadData(PRODUCTS_KEY, []);
}

function saveProducts(products) {
    const saved = saveData(PRODUCTS_KEY, products);

    if (saved) {
        window.dispatchEvent(
            new CustomEvent("smartstore:data-updated")
        );
    }

    return saved;
}

function showMessage(message) {
    const toastMessage = $("#toast-message");
    const toast = $("#toast");

    if (toastMessage) {
        toastMessage.textContent = message;
    } else if (toast) {
        toast.textContent = message;
    } else {
        alert(message);
    }

    if (toast) {
        toast.classList.add("visible");

        // إخفاء الرسالة تلقائياً بعد 3 ثواني
        clearTimeout(toast._hideTimer);
        toast._hideTimer = setTimeout(() => {
            toast.classList.remove("visible");
        }, 3000);
    }
}

// عرض المنتجات داخل الجدول
export function renderProducts() {
    const tableBody = $("#products-table");

    if (!tableBody) {
        return;
    }

    const products = getProducts();
    const search = ($("#product-search")?.value || "")
        .trim()
        .toLowerCase();

    const category = $("#product-category-filter")?.value || "";

    const filtered = products.filter((product) => {
        const name = String(product.name || "").toLowerCase();
        const code = String(product.code || "").toLowerCase();
        const matchesSearch =
            name.includes(search) || code.includes(search);

        const matchesCategory =
            !category || product.category === category;

        return matchesSearch && matchesCategory;
    });

    if (filtered.length === 0) {
        tableBody.innerHTML = `
            <tr>
                <td colspan="8">لا توجد منتجات مطابقة.</td>
            </tr>
        `;
        return;
    }

    const currency =
        localStorage.getItem("smartstore_currency") || "₪";

    tableBody.innerHTML = filtered.map((product) => `
        <tr>
            <td>${escapeHTML(product.code || "—")}</td>
            <td>${escapeHTML(product.name || "بدون اسم")}</td>
            <td>${escapeHTML(product.category || "عام")}</td>
            <td>${escapeHTML(money(product.buyPrice, currency))}</td>
            <td>${escapeHTML(money(product.sellPrice, currency))}</td>
            <td>${Number(product.quantity) || 0}</td>
            <td>${Number(product.minQuantity) || 0}</td>
            <td>
                <button type="button"
                    data-product-edit="${escapeHTML(product.id)}">
                    تعديل
                </button>
                <button type="button"
                    data-product-delete="${escapeHTML(product.id)}">
                    حذف
                </button>
            </td>
        </tr>
    `).join("");
}

// تفريغ نموذج المنتج
function resetProductForm() {
    const form = $("#product-form");

    form?.reset();

    const idField = $("#product-id");
    if (idField) idField.value = "";

    const title = $("#product-form-title");
    if (title) title.textContent = "إضافة منتج";

    const submitButton = $("#add-product-btn");
    if (submitButton) submitButton.textContent = "إضافة المنتج";
}

// تعبئة النموذج ببيانات المنتج المراد تعديله
function editProduct(productId) {
    const product = getProducts().find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) {
        showMessage("لم يتم العثور على المنتج.");
        return;
    }

    const fields = {
        "#product-id": product.id,
        "#product-name": product.name,
        "#product-code": product.code,
        "#product-category": product.category,
        "#product-buy-price": product.buyPrice,
        "#product-sell-price": product.sellPrice,
        "#product-quantity": product.quantity,
        "#product-min-quantity": product.minQuantity,
        "#product-description": product.description
    };

    Object.entries(fields).forEach(([selector, value]) => {
        const element = $(selector);

        if (element) {
            element.value = value ?? "";
        }
    });

    const title = $("#product-form-title");
    if (title) title.textContent = "تعديل المنتج";

    const submitButton = $("#add-product-btn");
    if (submitButton) submitButton.textContent = "حفظ التعديلات";

    $("#product-form")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
}

// حذف منتج لا توجد له مبيعات مرتبطة
function deleteProduct(productId) {
    const products = getProducts();

    const product = products.find(
        (item) => String(item.id) === String(productId)
    );

    if (!product) {
        showMessage("لم يتم العثور على المنتج.");
        return;
    }

    const sales = loadData(SALES_KEY, []);

    const hasSales = sales.some((sale) =>
        Array.isArray(sale.items) &&
        sale.items.some(
            (item) => String(item.productId) === String(productId)
        )
    );

    if (hasSales) {
        showMessage(
            "لا يمكن حذف منتج مرتبط بمبيعات سابقة. احتفظ به في السجلات."
        );
        return;
    }

    const confirmed = confirm(
        `هل تريد حذف المنتج "${product.name}"؟`
    );

    if (!confirmed) {
        return;
    }

    const updatedProducts = products.filter(
        (item) => String(item.id) !== String(productId)
    );

    if (saveProducts(updatedProducts)) {
        renderProducts();
        showMessage("تم حذف المنتج.");
    } else {
        showMessage("تعذر حفظ التغييرات.");
    }
}

// إضافة منتج جديد أو حفظ تعديل
function handleProductSubmit(event) {
    event.preventDefault();

    const name = $("#product-name")?.value.trim();
    const code = $("#product-code")?.value.trim();
    const category = $("#product-category")?.value.trim();

    const buyPrice = Number($("#product-buy-price")?.value);
    const sellPrice = Number($("#product-sell-price")?.value);
    const quantity = Number($("#product-quantity")?.value);
    const minQuantity = Number($("#product-min-quantity")?.value || 0);

    const description =
        $("#product-description")?.value.trim() || "";

    const id = $("#product-id")?.value;

    if (!name) {
        showMessage("يرجى إدخال اسم المنتج.");
        return;
    }

    if (
        !Number.isFinite(buyPrice) ||
        !Number.isFinite(sellPrice) ||
        buyPrice < 0 ||
        sellPrice < 0
    ) {
        showMessage("يرجى إدخال أسعار صحيحة.");
        return;
    }

    if (
        !Number.isInteger(quantity) ||
        quantity < 0 ||
        !Number.isInteger(minQuantity) ||
        minQuantity < 0
    ) {
        showMessage("يجب أن تكون الكميات أعدادًا صحيحة غير سالبة.");
        return;
    }

    const products = getProducts();

    const duplicateCode = code && products.some((product) =>
        product.code === code && String(product.id) !== String(id)
    );

    if (duplicateCode) {
        showMessage("رمز المنتج مستخدم بالفعل.");
        return;
    }

    if (id) {
        const index = products.findIndex(
            (product) => String(product.id) === String(id)
        );

        if (index === -1) {
            showMessage("تعذر العثور على المنتج لتعديله.");
            return;
        }

        products[index] = {
            ...products[index],
            name,
            code,
            category,
            buyPrice,
            sellPrice,
            quantity,
            minQuantity,
            description,
            updatedAt: new Date().toISOString()
        };
    } else {
        products.push({
            id: createId(),
            name,
            code,
            category,
            buyPrice,
            sellPrice,
            quantity,
            minQuantity,
            description,
            createdAt: new Date().toISOString()
        });
    }

    if (saveProducts(products)) {
        resetProductForm();
        renderProducts();
        showMessage(id ? "تم تعديل المنتج بنجاح." : "تمت إضافة المنتج بنجاح.");
    } else {
        showMessage("تعذر حفظ المنتج. تحقق من مساحة التخزين.");
    }
}

// تجهيز أحداث صفحة المنتجات
export function initializeProducts() {
    document.addEventListener("submit", (event) => {
        if (event.target.matches("#product-form")) {
            handleProductSubmit(event);
        }
    });

    document.addEventListener("input", (event) => {
        if (event.target.matches("#product-search")) {
            renderProducts();
        }
    });

    document.addEventListener("change", (event) => {
        if (event.target.matches("#product-category-filter")) {
            renderProducts();
        }
    });

    document.addEventListener("click", (event) => {
        const editButton = event.target.closest("[data-product-edit]");
        const deleteButton = event.target.closest("[data-product-delete]");

        if (editButton) {
            editProduct(editButton.dataset.productEdit);
        }

        if (deleteButton) {
            deleteProduct(deleteButton.dataset.productDelete);
        }
    });

    window.addEventListener("smartstore:page-loaded", (event) => {
        if (event.detail?.page === "products") {
            renderProducts();
        }
    });
}
