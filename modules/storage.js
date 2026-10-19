
"use strict";

// قراءة البيانات المحفوظة محليًا
export function loadData(key, defaultValue = []) {
    try {
        const savedData = localStorage.getItem(key);

        if (savedData === null) {
            return defaultValue;
        }

        return JSON.parse(savedData);
    } catch (error) {
        console.error(`خطأ في قراءة البيانات (${key}):`, error);
        return defaultValue;
    }
}

// حفظ البيانات محليًا
export function saveData(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
        return true;
    } catch (error) {
        console.error(`خطأ في حفظ البيانات (${key}):`, error);
        return false;
    }
}

// إنشاء معرّف فريد
export function createId() {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

// تنسيق المبالغ المالية
export function money(amount, currency = "₪") {
    const value = Number(amount) || 0;

    return `${value.toLocaleString("en-US", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })} ${currency}`;
}

// حماية النصوص قبل عرضها داخل HTML
export function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, character => {
        const entities = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return entities[character];
    });
}

// إرجاع تاريخ اليوم بصيغة YYYY-MM-DD
export function todayString() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}
