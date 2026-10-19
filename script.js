"use strict";

// =====================================
// إعدادات تطبيق مشترواتي
// =====================================

const OWNER_WHATSAPP = "201289733313";

const SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz6iO8zlhbaq8B85gGuK8iH7N3ewrS241nEZa5ZTSNQfriECPTVG6zDYEKayyTgoI0yew/exec";

const ORDERS_KEY = "moshtrawaty_orders";
const DRAFT_KEY = "moshtrawaty_draft";

// =====================================
// عناصر الصفحة
// =====================================

const orderForm = document.getElementById("orderForm");

const customerNameInput = document.getElementById("customerName");
const phoneInput = document.getElementById("phone");
const projectNameInput = document.getElementById("projectName");
const buildingNumberInput = document.getElementById("buildingNumber");
const orderDetailsInput = document.getElementById("orderDetails");

const messageElement = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const ordersTableBody = document.getElementById("ordersTableBody");
const ordersCount = document.getElementById("ordersCount");

// =====================================
// التخزين المحلي
// =====================================

function getOrders() {
    try {
        const savedOrders = localStorage.getItem(ORDERS_KEY);

        if (!savedOrders) return [];

        const parsedOrders = JSON.parse(savedOrders);

        return Array.isArray(parsedOrders) ? parsedOrders : [];
    } catch (error) {
        console.error("تعذر قراءة الطلبات:", error);
        return [];
    }
}

function saveOrders(orders) {
    try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        return true;
    } catch (error) {
        console.error("تعذر حفظ الطلبات:", error);
        return false;
    }
}

// =====================================
// رسائل الحالة
// =====================================

function showMessage(text, type) {
    if (!messageElement) return;

    messageElement.textContent = text;
    messageElement.classList.remove("success", "error");

    if (type) {
        messageElement.classList.add(type);
    }
}

// =====================================
// التحقق من رقم التليفون المصري
// =====================================

function normalizeEgyptianPhone(phone) {
    let value = phone.replace(/[\s\-()]/g, "");

    if (value.startsWith("+20")) {
        value = "0" + value.slice(3);
    } else if (value.startsWith("0020")) {
        value = "0" + value.slice(4);
    } else if (value.startsWith("20") && value.length === 12) {
        value = "0" + value.slice(2);
    }

    return value;
}

function isValidEgyptianPhone(phone) {
    return /^01[0125][0-9]{8}$/.test(
        normalizeEgyptianPhone(phone)
    );
}

// =====================================
// حفظ واسترجاع مسودة النموذج
// =====================================

function saveDraft() {
    const draft = {
        customerName: customerNameInput.value,
        phone: phoneInput.value,
        projectName: projectNameInput.value,
        buildingNumber: buildingNumberInput.value,
        orderDetails: orderDetailsInput.value
    };

    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
        console.warn("تعذر حفظ المسودة:", error);
    }
}

function restoreDraft() {
    try {
        const savedDraft = localStorage.getItem(DRAFT_KEY);

        if (!savedDraft) return;

        const draft = JSON.parse(savedDraft);

        customerNameInput.value = draft.customerName || "";
        phoneInput.value = draft.phone || "";
        projectNameInput.value = draft.projectName || "";
        buildingNumberInput.value = draft.buildingNumber || "";
        orderDetailsInput.value = draft.orderDetails || "";
    } catch (error) {
        console.warn("تعذر استرجاع المسودة:", error);
    }
}

orderForm.addEventListener("input", saveDraft);

// =====================================
// إنشاء رقم الطلب
// =====================================

function createOrderId() {
    const now = new Date();

    const datePart = [
        now.getFullYear(),
        String(now.getMonth() + 1).padStart(2, "0"),
        String(now.getDate()).padStart(2, "0")
    ].join("");

    const timePart = [
        String(now.getHours()).padStart(2, "0"),
        String(now.getMinutes()).padStart(2, "0"),
        String(now.getSeconds()).padStart(2, "0")
    ].join("");

    const randomPart = Math.floor(100 + Math.random() * 900);

    return `MS-${datePart}-${timePart}-${randomPart}`;
}

// =====================================
// تنسيق التاريخ
// =====================================

function formatDate(dateString) {
    const date = new Date(dateString);

    if (Number.isNaN(date.getTime())) {
        return "غير معروف";
    }

    return date.toLocaleString("ar-EG", {
        dateStyle: "short",
        timeStyle: "short"
    });
}

// =====================================
// حماية النصوص
// =====================================

function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, function (character) {
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

// =====================================
// رسائل واتساب
// =====================================

function createWhatsAppMessage(order) {
    return [
        "🛍️ *طلب جديد من تطبيق مشترواتي*",
        "",
        `رقم الطلب: ${order.id}`,
        `اسم العميل: ${order.customerName}`,
        `رقم التليفون: ${order.phone}`,
        `اسم المشروع: ${order.projectName}`,
        `رقم العمارة: ${order.buildingNumber}`,
        "",
        "📝 *المشتريات المطلوبة:*",
        order.orderDetails,
        "",
        `وقت التسجيل: ${formatDate(order.createdAt)}`
    ].join("\n");
}

function createWhatsAppLink(order) {
    return `https://wa.me/${OWNER_WHATSAPP}?text=${
        encodeURIComponent(createWhatsAppMessage(order))
    }`;
}

// =====================================
// عرض الطلبات
// =====================================

function renderOrders() {
    const orders = getOrders();

    if (!ordersTableBody || !ordersCount) return;

    ordersCount.textContent = `${orders.length} طلب`;

    if (orders.length === 0) {
        ordersTableBody.innerHTML = `
            <tr>
                <td colspan="8" class="empty-orders">
                    لسه مفيش طلبات مسجلة
                </td>
            </tr>
        `;
        return;
    }

    ordersTableBody.innerHTML = "";

    [...orders].reverse().forEach(function (order) {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(order.id)}</td>
            <td>${escapeHTML(order.customerName)}</td>
            <td>${escapeHTML(order.phone)}</td>
            <td>${escapeHTML(order.projectName)}</td>
            <td>${escapeHTML(order.buildingNumber)}</td>
            <td class="order-details-cell">${escapeHTML(order.orderDetails)}</td>
            <td>
                <span class="status-badge">
                    ${escapeHTML(order.status || "جديد")}
                </span>
            </td>
            <td>
                <a
                    class="whatsapp-order-button"
                    href="${createWhatsAppLink(order)}"
                    target="_blank"
                    rel="noopener noreferrer">
                    تأكيد واتساب
                </a>
            </td>
        `;

        ordersTableBody.appendChild(row);
    });
}

// =====================================
// إرسال الطلب إلى Google Sheets
// =====================================

async function sendOrderToGoogleSheets(order) {
    const formData = new URLSearchParams();

    formData.append("id", order.id);
    formData.append("customerName", order.customerName);
    formData.append("phone", order.phone);
    formData.append("projectName", order.projectName);
    formData.append("buildingNumber", order.buildingNumber);
    formData.append("orderDetails", order.orderDetails);
    formData.append("createdAt", order.createdAt);
    formData.append("status", order.status);

    // Apps Script قد لا يسمح للمتصفح بقراءة الرد بسبب CORS.
    // لذلك لا نعتبر نجاح fetch وحده تأكيدًا على التسجيل.
    await fetch(SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        body: formData
    });
}

// =====================================
// تسجيل طلب جديد
// =====================================

orderForm.addEventListener("submit", async function (event) {
    event.preventDefault();

    if (submitButton && submitButton.disabled) return;

    const customerName = customerNameInput.value.trim();
    const phone = normalizeEgyptianPhone(phoneInput.value.trim());
    const projectName = projectNameInput.value.trim();
    const buildingNumber = buildingNumberInput.value.trim();
    const orderDetails = orderDetailsInput.value.trim();

    if (
        !customerName ||
        !phone ||
        !projectName ||
        !buildingNumber ||
        !orderDetails
    ) {
        showMessage("من فضلك املا كل البيانات المطلوبة.", "error");
        return;
    }

    if (!isValidEgyptianPhone(phone)) {
        showMessage(
            "رقم التليفون المصري غير صحيح. راجع الرقم وحاول تاني.",
            "error"
        );

        phoneInput.focus();
        return;
    }

    const order = {
        id: createOrderId(),
        customerName,
        phone,
        projectName,
        buildingNumber,
        orderDetails,
        createdAt: new Date().toISOString(),
        status: "جديد"
    };

    // نحفظ الطلب محليًا أولًا
    const orders = getOrders();
    orders.push(order);

    if (!saveOrders(orders)) {
        showMessage(
            "حصلت مشكلة في حفظ الطلب على الجهاز. جرب تاني.",
            "error"
        );
        return;
    }

    if (submitButton) {
        submitButton.disabled = true;
        submitButton.textContent = "جاري إرسال الطلب...";
    }

    try {
        await sendOrderToGoogleSheets(order);

        // تنبيه مهم: no-cors لا يؤكد أن Google Sheets سجّل الطلب.
        showMessage(
            "تم إرسال محاولة تسجيل الطلب. افتح Google Sheets وتأكد إن الطلب ظهر في صف جديد.",
            "success"
        );

        orderForm.reset();

        try {
            localStorage.removeItem(DRAFT_KEY);
        } catch (error) {
            console.warn("تعذر حذف المسودة:", error);
        }

        renderOrders();

        document.querySelector(".orders-section")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });

    } catch (error) {
        console.error("تعذر إرسال الطلب إلى Google Sheets:", error);

        showMessage(
            "تم حفظ الطلب على الجهاز، لكن تعذر إرسال الطلب. راجع الاتصال وحاول مرة أخرى.",
            "error"
        );
    } finally {
        if (submitButton) {
            submitButton.disabled = false;
            submitButton.textContent = "تسجيل الطلب";
        }
    }
});

// =====================================
// بدء تشغيل التطبيق
// =====================================

restoreDraft();
renderOrders();
