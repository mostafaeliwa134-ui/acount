"use strict";

import { loadData, saveData, escapeHTML } from "./storage.js";
import { loadPage } from "./navigation.js";

export function initializeNotifications() {
    const button = document.querySelector('#notifications-btn');
    const panel = document.querySelector('#notifications-panel');
    const list = document.querySelector('#notifications-list');
    const count = document.querySelector('#notification-count');
    const readButton = document.querySelector('#notifications-read');
    const status = document.querySelector('#notifications-status');
    if (!button || !panel || !list || !count || !readButton) return;
    let alerts = [];
    let seen = new Set(loadData('smartstore_notifications_read', []));

    function close(returnFocus = false) {
        panel.hidden = true;
        button.setAttribute('aria-expanded', 'false');
        if (returnFocus) button.focus();
    }

    function render() {
        const products = loadData('smartstore_products', []);
        alerts = products.filter(product => Number(product.quantity || 0) <= Number(product.minQuantity ?? product.min_quantity ?? 5))
            .map(product => ({
                key: JSON.stringify([product.id ?? product.code ?? product.name, Number(product.quantity || 0), Number(product.minQuantity ?? product.min_quantity ?? 5)]),
                name: product.name || 'منتج بدون اسم',
                quantity: Number(product.quantity) || 0
            }));
        const activeKeys = new Set(alerts.map(alert => alert.key));
        seen = new Set([...seen].filter(key => activeKeys.has(key)));
        saveData('smartstore_notifications_read', [...seen]);
        const unread = alerts.filter(alert => !seen.has(alert.key)).length;
        count.hidden = unread === 0;
        count.textContent = unread > 99 ? '99+' : String(unread);
        button.setAttribute('aria-label', unread ? `الإشعارات، ${unread} غير مقروءة` : 'الإشعارات');
        readButton.disabled = unread === 0;
        list.innerHTML = alerts.length ? alerts.map((alert, index) => `
            <button type="button" class="notification-item ${seen.has(alert.key) ? '' : 'unread'}" data-notification="${index}">
                <span class="notification-symbol" aria-hidden="true">${alert.quantity <= 0 ? '○' : '!'}</span>
                <span><strong>${alert.quantity <= 0 ? 'نفد المخزون' : 'مخزون منخفض'}: ${escapeHTML(alert.name)}</strong>
                <small>الكمية المتوفرة: ${alert.quantity} · عرض المخزون</small></span>
            </button>`).join('') : '<div class="notifications-empty"><strong>أنت متابع لكل شيء</strong>لا توجد تنبيهات للمخزون حاليًا.</div>';
    }

    button.addEventListener('click', () => {
        const opening = panel.hidden;
        panel.hidden = !opening;
        button.setAttribute('aria-expanded', String(opening));
        if (opening) {
            const profile = document.querySelector('#profile-dropdown');
            if (profile) profile.hidden = true;
            document.querySelector('#profile-menu-btn')?.setAttribute('aria-expanded', 'false');
            render();
        }
    });
    document.querySelector('#notifications-close')?.addEventListener('click', () => close(true));
    document.addEventListener('click', event => {
        if (!event.target.closest('.notifications-wrapper')) close();
    });
    document.addEventListener('keydown', event => {
        if (event.key === 'Escape' && !panel.hidden) close(true);
    });
    readButton.addEventListener('click', () => {
        seen = new Set(alerts.map(alert => alert.key));
        render();
        status.textContent = 'تم تحديد جميع الإشعارات كمقروءة';
    });
    list.addEventListener('click', event => {
        const item = event.target.closest('[data-notification]');
        if (!item) return;
        seen.add(alerts[Number(item.dataset.notification)].key);
        render();
        close(true);
        loadPage('inventory');
    });
    window.addEventListener('smartstore:data-updated', render);
    window.addEventListener('smartstore:login', render);
    window.addEventListener('smartstore:logout', () => close());
    window.addEventListener('storage', event => {
        if (event.key === 'smartstore_notifications_read') seen = new Set(loadData('smartstore_notifications_read', []));
        if (!event.key || ['smartstore_products', 'smartstore_notifications_read'].includes(event.key)) render();
    });
    render();
}
