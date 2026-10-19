
"use strict";

import { initializeAuth, hasActiveSession, getProfile } from "./modules/auth.js";
import { initializeProfile, updateProfileUI } from "./modules/profile.js";
import { initializeNavigation, loadPage, getCurrentPage } from "./modules/navigation.js";
import { initializeDashboard } from "./modules/dashboard.js";
import { initializeProducts } from "./modules/products.js";
import { initializeInventory } from "./modules/inventory.js";
import { initializeSales } from "./modules/sales.js";
import { initializeReports } from "./modules/reports.js";

const $ = (selector) => document.querySelector(selector);

let navigationInitialized = false;

// إظهار واجهة تسجيل الدخول
function showAuthScreen() {
    const authScreen = $("#auth-screen");
    const appScreen = $("#app-screen");

    if (authScreen) authScreen.hidden = false;
    if (appScreen) appScreen.hidden = true;
}

// إظهار واجهة التطبيق
function showAppScreen() {
    const authScreen = $("#auth-screen");
    const appScreen = $("#app-screen");

    if (authScreen) authScreen.hidden = true;
    if (appScreen) appScreen.hidden = false;

    updateProfileUI(getProfile());

    // تهيئة التنقل مرة واحدة فقط
    if (!navigationInitialized) {
        initializeNavigation();
        navigationInitialized = true;
    } else {
        loadPage(getCurrentPage() || "dashboard");
    }
}

// تحديث التواريخ في الواجهة
function initializeDates() {
    const year = String(new Date().getFullYear());

    const authYear = $("#auth-year");
    const footerYear = $("#footer-year");

    if (authYear) authYear.textContent = year;
    if (footerYear) footerYear.textContent = year;

    const today = $("#today-date");

    if (today) {
        today.textContent = new Date().toLocaleDateString("ar", {
            year: "numeric",
            month: "long",
            day: "numeric"
        });
    }
}

// تشغيل المشروع
function initializeApp() {
    initializeDates();

    // تجهيز الوحدات وأحداثها
    initializeAuth();
    initializeProfile();
    initializeDashboard();
    initializeProducts();
    initializeInventory();
    initializeSales();
    initializeReports();

    // الاستجابة لنجاح تسجيل الدخول
    window.addEventListener("smartstore:login", () => {
        showAppScreen();
    });

    // الاستجابة لتسجيل الخروج
    window.addEventListener("smartstore:logout", () => {
        showAuthScreen();
    });

    // زر الانتقال إلى شاشة البيع
    $("#quick-sale-btn")?.addEventListener("click", () => {
        loadPage("sales");
    });

    // إعادة محاولة تحميل الصفحة
    $("#retry-page-btn")?.addEventListener("click", () => {
        loadPage(getCurrentPage() || "dashboard");
    });

    // إظهار الواجهة المناسبة عند تشغيل الموقع
    if (hasActiveSession() && getProfile()) {
        showAppScreen();
    } else {
        showAuthScreen();
    }
}

// تشغيل الكود بعد تجهيز HTML
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeApp);
} else {
    initializeApp();
}
