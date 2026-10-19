
"use strict";

import { getProfile } from "./auth.js";

const $ = (selector) => document.querySelector(selector);

// تحديث بيانات الملف الشخصي في الواجهة
export function updateProfileUI(profile = getProfile()) {
    if (!profile) {
        return;
    }

    const ownerName = profile.ownerName || profile.name || "صاحب المتجر";
    const storeName = profile.storeName || "متجري";
    const email = profile.email || "";

    const initials = ownerName
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part.charAt(0))
        .join("")
        .toUpperCase() || "م";

    const elements = [
        ["#profile-name", ownerName],
        ["#dropdown-profile-name", ownerName],
        ["#dropdown-profile-email", email],
        ["#sidebar-store-name", storeName]
    ];

    elements.forEach(([selector, value]) => {
        const element = $(selector);

        if (element) {
            element.textContent = value;
        }
    });

    const avatar = $("#profile-avatar");

    if (avatar) {
        avatar.textContent = initials;
    }
}

// تجهيز واجهة الملف الشخصي
export function initializeProfile() {
    updateProfileUI();

    window.addEventListener("smartstore:login", (event) => {
        updateProfileUI(event.detail?.profile);
    });
}
