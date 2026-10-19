
"use strict";

const $ = (selector, parent = document) =>
    parent.querySelector(selector);

const $$ = (selector, parent = document) =>
    [...parent.querySelectorAll(selector)];

const pageInfo = {
    dashboard: {
        title: "لوحة التحكم",
        subtitle: "نظرة عامة على أداء متجرك."
    },
    products: {
        title: "المنتجات",
        subtitle: "إدارة المنتجات والأسعار والكميات."
    },
    sales: {
        title: "المبيعات",
        subtitle: "متابعة فواتير وعمليات البيع."
    },
    customers: {
        title: "العملاء",
        subtitle: "إدارة بيانات العملاء."
    },
    debts: {
        title: "الديون",
        subtitle: "متابعة المبالغ المستحقة والمدفوعات."
    },
    inventory: {
        title: "المخزون",
        subtitle: "متابعة الكميات وحالة المخزون."
    },
    purchases: {
        title: "المشتريات",
        subtitle: "متابعة مشتريات المتجر."
    },
    suppliers: {
        title: "الموردون",
        subtitle: "إدارة بيانات الموردين."
    },
    expenses: {
        title: "المصروفات",
        subtitle: "تسجيل ومتابعة مصروفات المتجر."
    },
    reports: {
        title: "التقارير",
        subtitle: "مراجعة الأداء المالي والتشغيلي."
    },
    employees: {
        title: "الموظفون",
        subtitle: "إدارة الموظفين وصلاحياتهم."
    },
    profile: {
        title: "الملف الشخصي",
        subtitle: "عرض بيانات حسابك."
    },
    settings: {
        title: "الإعدادات",
        subtitle: "تخصيص إعدادات المتجر."
    }
};

let currentPage = null;

export function getCurrentPage() {
    return currentPage;
}

// تحميل صفحة HTML داخل الحاوية الرئيسية
export async function loadPage(pageName) {
    const pageContainer = $("#page-container");

    if (!pageContainer) {
        console.error("لم يتم العثور على العنصر #page-container.");
        return;
    }

    if (!Object.hasOwn(pageInfo, pageName)) {
        console.error(`الصفحة غير معروفة: ${pageName}`);
        return;
    }

    const loading = $("#page-loading");
    const errorMessage = $("#page-load-error");

    if (loading) loading.hidden = false;
    if (errorMessage) errorMessage.hidden = true;

    try {
        const response = await fetch(`pages/${pageName}.html`);

        if (!response.ok) {
            throw new Error(`تعذر تحميل الصفحة (${response.status})`);
        }

        const html = await response.text();

        // تحميل محتوى الصفحة المطلوبة
        pageContainer.innerHTML = html;
        currentPage = pageName;

        updatePageHeading(pageName);
        updateActiveNavigation(pageName);

        window.dispatchEvent(new CustomEvent("smartstore:page-loaded", {
            detail: { page: pageName }
        }));
    } catch (error) {
        console.error("خطأ في تحميل الصفحة:", error);

        if (errorMessage) {
            errorMessage.hidden = false;
        } else {
            pageContainer.textContent =
                "تعذر تحميل الصفحة. تأكد من وجود ملفها داخل مجلد pages.";
        }
    } finally {
        if (loading) loading.hidden = true;
    }
}

// تحديث عنوان الصفحة
function updatePageHeading(pageName) {
    const info = pageInfo[pageName];

    const title = $("#page-title");
    const heading = $("#page-heading-title");
    const breadcrumb = $("#page-breadcrumb");
    const subtitle = $("#page-subtitle");

    if (title) title.textContent = info.title;
    if (heading) heading.textContent = info.title;
    if (breadcrumb) breadcrumb.textContent = info.title;
    if (subtitle) subtitle.textContent = info.subtitle;
}

// تحديد الصفحة النشطة في القائمة الجانبية
function updateActiveNavigation(pageName) {
    $$(".nav-item[data-page]").forEach((item) => {
        const isActive = item.dataset.page === pageName;

        item.classList.toggle("active", isActive);

        if (isActive) {
            item.setAttribute("aria-current", "page");
        } else {
            item.removeAttribute("aria-current");
        }
    });
}

// إغلاق القائمة الجانبية على الشاشات الصغيرة
function closeSidebar() {
    $("#sidebar")?.classList.remove("open");
    $("#sidebar-overlay")?.classList.remove("visible");
}

// إغلاق قائمة البروفايل المنسدلة
function closeProfileDropdown() {
    const dropdown = $("#profile-dropdown");
    const btn = $("#profile-menu-btn");

    if (dropdown) dropdown.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
}

// تجهيز أحداث التنقل
export function initializeNavigation() {
    document.addEventListener("click", (event) => {
        const navItem = event.target.closest(".nav-item[data-page]");

        if (navItem) {
            event.preventDefault();

            const pageName = navItem.dataset.page;

            loadPage(pageName);
            closeSidebar();
            closeProfileDropdown();
            return;
        }

        // عناصر القائمة المنسدلة للبروفايل
        const dropdownItem = event.target.closest(".profile-dropdown-item[data-page]");

        if (dropdownItem) {
            const pageName = dropdownItem.dataset.page;

            loadPage(pageName);
            closeProfileDropdown();
            return;
        }

        // فتح/إغلاق قائمة البروفايل
        if (event.target.closest("#profile-menu-btn")) {
            const dropdown = $("#profile-dropdown");
            const btn = $("#profile-menu-btn");

            if (!dropdown) return;

            const isOpen = !dropdown.hidden;

            dropdown.hidden = isOpen;
            btn?.setAttribute("aria-expanded", String(!isOpen));
            return;
        }

        // إغلاق قائمة البروفايل عند النقر خارجها
        if (!event.target.closest(".profile-menu-wrapper")) {
            closeProfileDropdown();
        }

        if (event.target.closest("#mobile-menu-btn")) {
            $("#sidebar")?.classList.add("open");
            $("#sidebar-overlay")?.classList.add("visible");
            return;
        }

        if (
            event.target.closest("#sidebar-close-btn") ||
            event.target.closest("#sidebar-overlay")
        ) {
            closeSidebar();
        }
    });

    // فتح لوحة التحكم أولًا
    loadPage("dashboard");
}
