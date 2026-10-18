"use strict";

// =====================================
// إعدادات تطبيق مشترواتي
// =====================================

// رقم واتساب صاحب التطبيق بصيغة دولية من غير +
const OWNER_WHATSAPP = "201289733313";

// مفاتيح التخزين المحلي
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
// التعامل مع التخزين المحلي
// =====================================

function getOrders() {
    try {
        const savedOrders = localStorage.getItem(ORDERS_KEY);

        if (!savedOrders) {
            return [];
        }

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
    const normalized = normalizeEgyptianPhone(phone);

    return /^01[0125][0-9]{8}$/.test(normalized);
}


// =====================================
// حفظ مسودة النموذج
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

        if (!savedDraft) {
            return;
        }

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
// إنشاء رقم للطلب
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
// حماية عرض النصوص داخل HTML
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
// تجهيز رسالة واتساب للطلب
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
    const message = createWhatsAppMessage(order);

    return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
}


// =====================================
// عرض الطلبات في الجدول
// =====================================

function renderOrders() {
    const orders = getOrders();

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

    // عرض أحدث طلب أولًا
    const newestFirst = [...orders].reverse();

    newestFirst.forEach(function (order) {
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
// تسجيل طلب جديد
// =====================================

orderForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const customerName = customerNameInput.value.trim();
    const phone = normalizeEgyptianPhone(phoneInput.value.trim());
    const projectName = projectNameInput.value.trim();
    const buildingNumber = buildingNumberInput.value.trim();
    const orderDetails = orderDetailsInput.value.trim();


    // التأكد من الحقول المطلوبة
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


    // التأكد من رقم التليفون
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
        customerName: customerName,
        phone: phone,
        projectName: projectName,
        buildingNumber: buildingNumber,
        orderDetails: orderDetails,
        createdAt: new Date().toISOString(),
        status: "جديد"
    };


    // حفظ الطلب
    const orders = getOrders();

    orders.push(order);

    const saved = saveOrders(orders);

    if (!saved) {
        showMessage(
            "حصلت مشكلة في حفظ الطلب على الجهاز. جرب تاني.",
            "error"
        );

        return;
    }


    // تحديث الجدول
    renderOrders();


    // تفريغ النموذج
    orderForm.reset();

    try {
        localStorage.removeItem(DRAFT_KEY);
    } catch (error) {
        console.warn("تعذر حذف المسودة:", error);
    }


    // إظهار رسالة نجاح
    showMessage(
        "تم تسجيل الطلب على الجهاز بنجاح. اضغط على زر تأكيد واتساب من الجدول لإرسال تفاصيله.",
        "success"
    );


    // الانتقال للجدول حتى يظهر الطلب الجديد
    document.querySelector(".orders-section").scrollIntoView({
        behavior: "smooth",
        block: "start"
    });
});


// =====================================
// بدء تشغيل التطبيق
// =====================================

restoreDraft();
renderOrders();