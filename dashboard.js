import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, get, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// إعدادات الفايربيس
const firebaseConfig = {
    apiKey: "AIzaSyCzStxDgxiNgYzYyhShHBC3uAAgIiuStLg",
    authDomain: "smart-cart-d93e3.firebaseapp.com",
    databaseURL: "https://smart-cart-d93e3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "smart-cart-d93e3",
    storageBucket: "smart-cart-d93e3.firebasestorage.app",
    messagingSenderId: "224477435182",
    appId: "1:224477435182:web:a48ece6ed40f9e3af9d6bf",
    measurementId: "G-SBPV1R3741"
};
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// الاتصال الثانوي عشان المدير يضيف موظفين
const secondaryApp = initializeApp(firebaseConfig, "SecondaryApp");
const secondaryAuth = getAuth(secondaryApp);

// ==========================================
// 1. حارس الباب الآمن والتحقق من الصلاحيات
// ==========================================
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const snap = await get(ref(db, 'Employees/' + user.uid));
        if (!snap.exists() || snap.val().role !== "Admin") {
            window.location.href = "heatmap.html"; // طرد الموظف العادي
        } else {
            document.querySelectorAll('.admin-only').forEach(el => el.style.display = 'block');
            startDashboardLogic(); // تشغيل المنطق
        }
    } else {
        window.location.href = "index.html"; // طرد إذا لم يتم تسجيل الدخول
    }
});

// تسجيل الخروج
document.getElementById('btnLogout').addEventListener('click', () => {
    signOut(auth).then(() => window.location.href = "index.html");
});

// ==========================================
// 2. إضافة موظف جديد
// ==========================================
document.getElementById('adminRegisterForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnAddNew');
    const msg = document.getElementById('addEmpMsg');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الإنشاء...'; 
    btn.disabled = true; msg.innerText = "";

    createUserWithEmailAndPassword(secondaryAuth, document.getElementById('newEmpEmail').value, document.getElementById('newEmpPass').value)
        .then(async (userCred) => {
            await set(ref(db, 'Employees/' + userCred.user.uid), {
                fullName: document.getElementById('newEmpName').value,
                email: document.getElementById('newEmpEmail').value,
                role: document.getElementById('newEmpRole').value
            });
            await signOut(secondaryAuth);
            msg.innerText = "تم إنشاء حساب الموظف بنجاح! ✅";
            msg.style.color = "var(--forest-green)";
            document.getElementById('adminRegisterForm').reset();
            btn.innerHTML = 'اعتماد وإنشاء الحساب'; btn.disabled = false;
        }).catch(err => { 
            msg.innerText = "حدث خطأ: " + err.message; msg.style.color = "red"; 
            btn.innerHTML = 'اعتماد وإنشاء الحساب'; btn.disabled = false;
        });
});

/// ==========================================
// 3. المنطق الداخلي للشاشة (نسخة 4 عربات للديمو)
// ==========================================
// 3. المنطق الداخلي للشاشة (نسخة 4 عربات للديمو)
// ==========================================
function startDashboardLogic() {
    let isNorthCritical = false;
    let isSouthCritical = false;

    const updateAlerts = () => {
        let alertsCount = (isNorthCritical ? 1 : 0) + (isSouthCritical ? 1 : 0);
        const alertElement = document.getElementById('stationsAlert');
        if (alertElement) alertElement.innerText = alertsCount;
    };

    // ==========================================
    // 1. المحطة الشمالية (تعتمد على 4 عربات حقيقية)
    // ==========================================
    onValue(ref(db, 'Fleet/Carts'), (snapshot) => {
        if (snapshot.exists()) {
            let availableCarts = 0;

            snapshot.forEach((childSnapshot) => {
                const cartData = childSnapshot.val();
                if (cartData.status === "In_Station") {
                    availableCarts++;
                }
            });

            const maxCapacity = 4; 
            
            // استخدام "من" بدل "/" عشان العربي ما ينقلب
            document.getElementById('northStationCount').innerText = availableCarts + " من " + maxCapacity;
            document.getElementById('northStationBar').style.width = (availableCarts / maxCapacity) * 100 + '%';

            const card = document.getElementById('northCard');
            const alertMsg = document.getElementById('northAlertMsg');
            
            isNorthCritical = (availableCarts >= maxCapacity); 
            
            // اللوجيك الذكي لتغيير النصوص والألوان
            if (isNorthCritical) {
                card.className = "station-card critical";
                document.getElementById('northStationBar').style.background = 'var(--vivid-red)';
                if(alertMsg) {
                    alertMsg.innerHTML = '<i class="fas fa-exclamation-circle"></i> تنبيه: المحطة ممتلئة! يرجى سحب العربات.';
                    alertMsg.style.color = 'var(--vivid-red)';
                }
            } else {
                card.className = "station-card normal";
                document.getElementById('northStationBar').style.background = 'var(--forest-green)';
                if(alertMsg) {
                    alertMsg.innerHTML = '<i class="fas fa-check-circle"></i> مساحة متوفرة لاستقبال العربات';
                    alertMsg.style.color = 'var(--forest-green)';
                }
            }

            updateAlerts(); 
        }
    });

    // ==========================================
    // 2. المحطة الجنوبية (ثابتة للديمو)
    // ==========================================
    const southMax = 4;
    document.getElementById('southStationCount').innerText = "0 من " + southMax;
    document.getElementById('southStationBar').style.width = '0%';
    
    const southCard = document.getElementById('southCard');
    const southAlertMsg = document.getElementById('southAlertMsg');
    
    if(southCard) southCard.className = "station-card normal";
    if(southAlertMsg) {
        southAlertMsg.innerHTML = '<i class="fas fa-check-circle"></i> مساحة متوفرة لاستقبال العربات';
        southAlertMsg.style.color = 'var(--forest-green)';
    }
    
    isSouthCritical = false;
    updateAlerts();

    // ==========================================
    // 3. الشارتات 
    // ==========================================
    const ctxDaily = document.getElementById('dailyChart');
    if (ctxDaily) {
        new Chart(ctxDaily.getContext('2d'), {
            type: 'line',
            data: { labels: ['8ص', '10ص', '12م', '2م', '4م', '6م'], datasets: [{ label: 'عربات مسترجعة', data: [15, 30, 45, 25, 60, 84], borderColor: '#1A4734', backgroundColor: 'rgba(26, 71, 52, 0.1)', fill: true, tension: 0.4, pointBackgroundColor: '#870903'}] },
            options: { plugins: { legend: { display: false } }, responsive: true, maintainAspectRatio: false }
        });
    }

    const ctxStatus = document.getElementById('statusChart');
    if (ctxStatus) {
        new Chart(ctxStatus.getContext('2d'), {
            type: 'doughnut',
            data: { labels: ['بالمحطات', 'قيد الاستخدام', 'صيانة'], datasets: [{ data: [40, 55, 5], backgroundColor: ['#1A4734', '#F9DD9C', '#870903'], borderWidth: 0 }] },
            options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } }, responsive: true, maintainAspectRatio: false }
        });
    }
}
// ==========================================
// 4. نظام الطباعة
// ==========================================
const btnPrintReport = document.getElementById('btnPrintReport');
if (btnPrintReport) {
    btnPrintReport.addEventListener('click', () => {
        const fromDate = document.getElementById('reportFromDate').value;
        const toDate = document.getElementById('reportToDate').value;

        if(!fromDate || !toDate) {
            alert("يرجى تحديد تاريخ البداية والنهاية أولاً لإصدار التقرير!");
            return;
        }

        const printWindow = window.open('', '_blank', 'width=800,height=900');
        printWindow.document.write(`
            <html dir="rtl">
            <head>
                <title>تقرير مدى الرسمي</title>
                <style>
                    body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px; color: #333; }
                    .header { text-align: center; border-bottom: 3px solid #1A4734; padding-bottom: 20px; margin-bottom: 30px; }
                    .header h1 { color: #1A4734; margin: 0; font-size: 2.5rem; }
                    .header h1 span { color: #A3C08F; }
                    .header p { color: #666; font-size: 1.2rem; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th, td { border: 1px solid #ddd; padding: 15px; text-align: right; }
                    th { background-color: #1A4734; color: white; }
                    tr:nth-child(even) { background-color: #f9f9f9; }
                    .footer { text-align: center; margin-top: 50px; font-size: 0.9rem; color: #999; border-top: 1px dashed #ddd; padding-top: 20px;}
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>نظام <span>مدى</span> 🛒</h1>
                    <h2>تقرير السجل التاريخي للعمليات</h2>
                    <p>الفترة الزمنية: من <strong style="color:red;">${fromDate}</strong> إلى <strong style="color:red;">${toDate}</strong></p>
                </div>
                <table>
                    <thead>
                        <tr>
                            <th>التاريخ والوقت</th>
                            <th>نوع العملية</th>
                            <th>الموقع / المحطة</th>
                            <th>ملاحظات النظام</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr><td>${fromDate} 08:30 ص</td><td>استرجاع عربة</td><td>المحطة الشمالية</td><td>✅ تم إضافة 50 نقطة للعميل</td></tr>
                        <tr><td>${fromDate} 11:15 ص</td><td>استبدال نقاط</td><td>تطبيق الولاء</td><td>🎟️ إصدار كوبون خصم 10%</td></tr>
                        <tr><td>${fromDate} 02:45 م</td><td>نقص حاد بالعربات</td><td>المحطة الجنوبية</td><td>⚠️ تم توجيه العمال للدعم</td></tr>
                        <tr><td>${toDate} 09:00 ص</td><td>صيانة مبدئية</td><td>مستودع الأسطول</td><td>🔧 فحص بطاريات وحساسات</td></tr>
                        <tr><td>${toDate} 05:20 م</td><td>استرجاع عربة</td><td>المحطة الجنوبية</td><td>✅ تم إضافة 50 نقطة للعميل</td></tr>
                    </tbody>
                </table>
                <div class="footer">
                    <p>تم إصدار هذا التقرير آلياً من نظام الإدارة المركزي لمدى</p>
                    <p>طُبع بواسطة: مدير النظام</p>
                </div>
            </body>
            </html>
        `);
        printWindow.document.close();
        setTimeout(() => { printWindow.print(); }, 500);
    });
}