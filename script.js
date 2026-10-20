"use strict";

// رابط استقبال الطلبات
const SCRIPT_URL =
    "https://script.google.com/macros/s/AKfycbyCMtQ8EIANarYnmZEk16hgKg_fQNGGVwf8y8CL7GX9ichAlerRbqA6wm5Kfu8hhmS83g/exec";

// رقم واتساب صاحب التطبيق
const OWNER_WHATSAPP = "201289733313";

// عناصر الصفحة
const form = document.getElementById("orderForm");
const messageElement = document.getElementById("message");
const submitButton = document.getElementById("submitButton");

const ordersTableBody = document.getElementById("ordersTableBody");
const ordersCount = document.getElementById("ordersCount");

const ORDERS_KEY = "moshtrawaty_orders";
const DRAFT_KEY = "moshtrawaty_draft";


// قراءة الطلبات المحفوظة محليًا
function getOrders() {
    try {
        const orders = JSON.parse(
            localStorage.getItem(ORDERS_KEY) || "[]"
        );

        return Array.isArray(orders) ? orders : [];
    } catch {
        return [];
    }
}


// حفظ الطلبات محليًا
function saveOrders(orders) {
    try {
        localStorage.setItem(ORDERS_KEY, JSON.stringify(orders));
        return true;
    } catch {
        return false;
    }
}


// إظهار الرسائل
function showMessage(text, type) {
    if (!messageElement) {
        alert(text);
        return;
    }

    messageElement.textContent = text;
    messageElement.classList.remove("success", "error");

    if (type) {
        messageElement.classList.add(type);
    }
}


// التحقق من رقم التليفون المصري
function normalizePhone(phone) {
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


function isValidPhone(phone) {
    return /^01[0125][0-9]{8}$/.test(normalizePhone(phone));
}


// إنشاء رقم الطلب
function createOrderId() {
    return "MS-" + Date.now() + "-" +
        Math.floor(100 + Math.random() * 900);
}


// حماية النصوص عند عرضها في الجدول
function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    })[char]);
}


// إنشاء رسالة واتساب
function createWhatsAppLink(order) {
    const text = [
        "🛍️ طلب من تطبيق مشترواتي",
        "",
        "رقم الطلب: " + order.id,
        "اسم العميل: " + order.customerName,
        "رقم التليفون: " + order.phone,
        "اسم المشروع: " + order.projectName,
        "رقم العمارة: " + order.buildingNumber,
        "",
        "المشتريات المطلوبة:",
        order.orderDetails
    ].join("\n");

    return "https://wa.me/" + OWNER_WHATSAPP +
        "?text=" + encodeURIComponent(text);
}


// عرض الطلبات المحلية في الجدول
function renderOrders() {
    if (!ordersTableBody) return;

    const orders = getOrders();

    if (ordersCount) {
        ordersCount.textContent = orders.length + " طلب";
    }

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

    [...orders].reverse().forEach(order => {
        const row = document.createElement("tr");

        row.innerHTML = `
            <td>${escapeHTML(order.id)}</td>
            <td>${escapeHTML(order.customerName)}</td>
            <td>${escapeHTML(order.phone)}</td>
            <td>${escapeHTML(order.projectName)}</td>
            <td>${escapeHTML(order.buildingNumber)}</td>
            <td class="order-details-cell">${escapeHTML(order.orderDetails)}</td>
            <td><span class="status-badge">جديد</span></td>
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


// حفظ مسودة الطلب
function saveDraft() {
    if (!form) return;

    const draft = {
        customerName: form.customerName.value,
        phone: form.phone.value,
        projectName: form.projectName.value,
        buildingNumber: form.buildingNumber.value,
        orderDetails: form.orderDetails.value
    };

    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    } catch (error) {
        console.warn("تعذر حفظ المسودة", error);
    }
}


// استرجاع مسودة الطلب
function restoreDraft() {
    if (!form) return;

    try {
        const draft = JSON.parse(
            localStorage.getItem(DRAFT_KEY) || "null"
        );

        if (!draft) return;

        form.customerName.value = draft.customerName || "";
        form.phone.value = draft.phone || "";
        form.projectName.value = draft.projectName || "";
        form.buildingNumber.value = draft.buildingNumber || "";
        form.orderDetails.value = draft.orderDetails || "";
    } catch (error) {
        console.warn("تعذر استرجاع المسودة", error);
    }
}


// ربط النموذج
if (form) {
    form.addEventListener("input", saveDraft);

    form.addEventListener("submit", async function (event) {
        event.preventDefault();

        const customerName =
            form.customerName.value.trim();

        const phone =
            normalizePhone(form.phone.value.trim());

        const projectName =
            form.projectName.value.trim();

        const buildingNumber =
            form.buildingNumber.value.trim();

        const orderDetails =
            form.orderDetails.value.trim();


        // التحقق من البيانات
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

        if (!isValidPhone(phone)) {
            showMessage(
                "رقم التليفون غير صحيح. راجع الرقم وحاول تاني.",
                "error"
            );
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


        // منع الضغط المتكرر أثناء الإرسال
        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = "جاري إرسال الطلب...";
        }

        showMessage("جاري إرسال طلبك...", "");


        try {
            // تجهيز البيانات لإرسالها إلى Google Apps Script
            const formData = new FormData();

            formData.append("id", order.id);
            formData.append("customerName", order.customerName);
            formData.append("phone", order.phone);
            formData.append("projectName", order.projectName);
            formData.append("buildingNumber", order.buildingNumber);
            formData.append("orderDetails", order.orderDetails);
            formData.append("createdAt", order.createdAt);
            formData.append("status", order.status);


            // إرسال الطلب إلى الخادم
            await fetch(SCRIPT_URL, {
                method: "POST",
                body: formData,
                mode: "no-cors"
            });


            /*
              مع no-cors لا يستطيع المتصفح قراءة استجابة الخادم.
              لذلك نجاح fetch وحده لا يثبت أن الطلب وصل إلى الشيت.
              سنعرض رسالة توضح أن الإرسال بدأ، ثم يلزم التحقق من الشيت.
            */

            showMessage(
                "تم إرسال الطلب. راجع Google Sheets للتأكد من تسجيله.",
                "success"
            );


            // حفظ نسخة محلية بعد محاولة الإرسال
            const orders = getOrders();
            orders.push(order);

            if (saveOrders(orders)) {
                renderOrders();
            }


            form.reset();

            try {
                localStorage.removeItem(DRAFT_KEY);
            } catch (error) {
                console.warn(error);
            }

        } catch (error) {
            console.error("خطأ أثناء إرسال الطلب:", error);

            showMessage(
                "تعذر إرسال الطلب. راجع اتصال الإنترنت وحاول مرة أخرى.",
                "error"
            );

        } finally {
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.innerHTML = "<span>🛒</span> تسجيل الطلب";
            }
        }
    });
}


// تشغيل الصفحة
restoreDraft();
renderOrders();
