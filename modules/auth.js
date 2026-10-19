
"use strict";

import { loadData, saveData } from "./storage.js";

const PROFILE_KEY = "smartstore_profile";
const SESSION_KEY = "smartstore_demo_session";

// تشفير بسيط لكلمة المرور قبل الحفظ
function hashPassword(password) {
    return btoa("ss_salt::" + password);
}

// قراءة عناصر الصفحة بأمان
function getElement(selector) {
    return document.querySelector(selector);
}

// عرض رسالة للمستخدم
function showAuthMessage(message, type = "error") {
    let messageElement = getElement("#auth-message");

    if (!messageElement) {
        messageElement = document.createElement("p");
        messageElement.id = "auth-message";
        messageElement.setAttribute("role", "status");

        const authCard = getElement("#auth-screen form");

        if (authCard) {
            authCard.prepend(messageElement);
        } else {
            getElement("#auth-screen")?.prepend(messageElement);
        }
    }

    messageElement.textContent = message;
    messageElement.dataset.type = type;
}

// الحصول على بيانات الحساب
export function getProfile() {
    return loadData(PROFILE_KEY, null);
}

// التحقق من وجود جلسة تجريبية
export function hasActiveSession() {
    return sessionStorage.getItem(SESSION_KEY) === "active";
}

// إنشاء جلسة تجريبية
function startSession() {
    sessionStorage.setItem(SESSION_KEY, "active");
}

// تسجيل الدخول التجريبي
function handleLogin(event) {
    event.preventDefault();

    const email = getElement("#login-email")?.value.trim();
    const password = getElement("#login-password")?.value;

    if (!email || !password) {
        showAuthMessage("يرجى إدخال البريد الإلكتروني وكلمة المرور.");
        return;
    }

    const profile = getProfile();

    if (!profile || profile.email?.toLowerCase() !== email.toLowerCase()) {
        showAuthMessage("لم يتم العثور على الحساب. أنشئ حسابًا تجريبيًا أولًا.");
        return;
    }

    // دعم كلمات المرور القديمة (نص عادي) والجديدة (مشفرة)
    const isHashedMatch = profile.password === hashPassword(password);
    const isPlainMatch = profile.password === password;

    if (!isHashedMatch && !isPlainMatch) {
        showAuthMessage("كلمة المرور غير صحيحة.");
        return;
    }

    // ترقية الحساب القديم تلقائياً إلى كلمة مرور مشفرة
    if (isPlainMatch && !isHashedMatch) {
        saveData(PROFILE_KEY, { ...profile, password: hashPassword(password) });
    }

    startSession();
    showAuthMessage("تم تسجيل الدخول بنجاح.", "success");

    window.dispatchEvent(new CustomEvent("smartstore:login", {
        detail: { profile }
    }));
}

// إنشاء حساب تجريبي
function handleRegister(event) {
    event.preventDefault();

    const ownerName = getElement("#owner-name")?.value.trim();
    const storeName = getElement("#store-name")?.value.trim();
    const email = getElement("#register-email")?.value.trim();
    const phone = getElement("#register-phone")?.value.trim();
    const password = getElement("#register-password")?.value;
    const confirmPassword = getElement("#confirm-password")?.value;

    if (!ownerName || !storeName || !email || !password || !confirmPassword) {
        showAuthMessage("يرجى تعبئة جميع الحقول المطلوبة.");
        return;
    }

    if (password.length < 8) {
        showAuthMessage("يجب أن تتكون كلمة المرور من 8 أحرف على الأقل.");
        return;
    }

    if (password !== confirmPassword) {
        showAuthMessage("كلمتا المرور غير متطابقتين.");
        return;
    }

    const existingProfile = getProfile();

    if (existingProfile?.email?.toLowerCase() === email.toLowerCase()) {
        showAuthMessage("هذا البريد مسجل مسبقًا. سجّل الدخول بدلًا من ذلك.");
        return;
    }

    const profile = {
        ownerName,
        storeName,
        email,
        phone,
        password: hashPassword(password),
        createdAt: new Date().toISOString()
    };

    if (!saveData(PROFILE_KEY, profile)) {
        showAuthMessage("تعذر حفظ الحساب. تحقق من مساحة التخزين في المتصفح.");
        return;
    }

    startSession();

    showAuthMessage("تم إنشاء الحساب بنجاح.", "success");

    window.dispatchEvent(new CustomEvent("smartstore:login", {
        detail: { profile }
    }));
}

// تسجيل الخروج
export function logout() {
    sessionStorage.removeItem(SESSION_KEY);

    window.dispatchEvent(new CustomEvent("smartstore:logout"));
}

// تهيئة أحداث تسجيل الدخول والتسجيل
export function initializeAuth() {
    const loginForm = getElement("#login-form");
    const registerForm = getElement("#register-form");

    loginForm?.addEventListener("submit", handleLogin);
    registerForm?.addEventListener("submit", handleRegister);

    getElement("#logout-btn")?.addEventListener("click", logout);
    getElement("#dropdown-logout-btn")?.addEventListener("click", logout);

    // إظهار/إخفاء كلمة المرور عند الضغط على زر العين
    document.addEventListener("click", (event) => {
        const toggleBtn = event.target.closest(".password-toggle");

        if (!toggleBtn) return;

        const inputId = toggleBtn.dataset.password;
        const input = getElement(`#${inputId}`);

        if (!input) return;

        const isHidden = input.type === "password";

        input.type = isHidden ? "text" : "password";

        const icon = toggleBtn.querySelector("i");

        if (icon) {
            icon.className = isHidden
                ? "fa-regular fa-eye-slash"
                : "fa-regular fa-eye";
        }

        toggleBtn.setAttribute(
            "aria-label",
            isHidden ? "إخفاء كلمة المرور" : "إظهار كلمة المرور"
        );
    });

    getElement("#auth-switch-button")?.addEventListener("click", () => {
        const loginForm = getElement("#login-form");
        const registerForm = getElement("#register-form");

        if (!loginForm || !registerForm) {
            return;
        }

        const showRegister = registerForm.hidden;

        loginForm.hidden = showRegister;
        registerForm.hidden = !showRegister;

        const title = getElement("#auth-title");
        const description = getElement("#auth-description");

        if (title) {
            title.textContent = showRegister ? "إنشاء حساب جديد" : "تسجيل الدخول";
        }

        if (description) {
            description.textContent = showRegister
                ? "أنشئ حسابك وابدأ بإدارة متجرك."
                : "سجّل الدخول للمتابعة إلى متجرك.";
        }

        const button = getElement("#auth-switch-button");

        if (button) {
            button.textContent = showRegister
                ? "لديك حساب؟ سجّل الدخول"
                : "ليس لديك حساب؟ أنشئ حسابًا";
        }

        const switchText = getElement("#auth-switch-text");

        if (switchText) {
            switchText.textContent = showRegister
                ? "لديك حساب بالفعل؟"
                : "ليس لديك حساب؟";
        }

        const message = getElement("#auth-message");

        if (message) {
            message.remove();
        }
    });
}
