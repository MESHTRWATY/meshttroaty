function doPost(e) {
    try {
      var ss = SpreadsheetApp.getActiveSpreadsheet();
      // استخدام أول ورقة تلقائياً لتجنب أي أخطاء في التسمية
      var sheet = ss.getSheets()[0];
      
      var data = e.parameter || {};
      
      var id = data.id || ("ORD-" + new Date().getTime().toString().slice(-6));
      var customerName = data.customerName || "";
      var phone = data.phone || "";
      var projectName = data.projectName || "";
      var buildingNumber = data.buildingNumber || "";
      var orderDetails = data.orderDetails || "";
      var createdAt = data.createdAt || new Date().toLocaleString();
      var status = data.status || "جديد";
      
      // إضافة الطلب كصف في الشيت
      sheet.appendRow([
        id,
        customerName,
        phone,
        projectName,
        buildingNumber,
        orderDetails,
        createdAt,
        status
      ]);
      
      return ContentService
        .createTextOutput(JSON.stringify({ result: "success", orderId: id }))
        .setMimeType(ContentService.MimeType.JSON);
  
    } catch (error) {
      return ContentService
        .createTextOutput(JSON.stringify({ result: "error", message: error.toString() }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  }
