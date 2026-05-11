// ==========================================
// 1. استدعاء مكتبات الفايربيس (v9)
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// --- ضعي إعدادات مشروعك هنا ---
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT.firebasedatabase.app",
    projectId: "YOUR_PROJECT"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

// ==========================================
// 2. التنقل بين الواجهات (SPA Logic)
// ==========================================
window.toggleAuth = (type) => {
    document.getElementById('loginForm').style.display = type === 'login' ? 'block' : 'none';
    document.getElementById('registerForm').style.display = type === 'register' ? 'block' : 'none';
    document.getElementById('tabLogin').classList.toggle('active', type === 'login');
    document.getElementById('tabRegister').classList.toggle('active', type === 'register');
    document.getElementById('loginError').innerText = "";
    document.getElementById('regError').innerText = "";
};

let mapInitialized = false; // عشان ما نرسم الخريطة مرتين

window.showPage = (pageId, event) => {
    // إخفاء كل الصفحات
    document.querySelectorAll('.page').forEach(p => p.style.display = 'none');
    // إظهار الصفحة المطلوبة
    document.getElementById(pageId).style.display = 'block';
    
    // تلوين الزر النشط في القائمة
    if (event) {
        document.querySelectorAll('.nav-links a').forEach(a => a.classList.remove('active'));
        event.target.classList.add('active');
    }

    // تهيئة الخريطة والشارتات فقط لما نفتح صفحاتها
    if (pageId === 'heatmap' && !mapInitialized) {
        initMap();
        mapInitialized = true;
    }
    if (pageId === 'dashboard') {
        initCharts();
    }
};

// ==========================================
// 3. نظام الحماية (Authentication Guard)
// ==========================================
onAuthStateChanged(auth, (user) => {
    if (user) {
        // إذا مسجل دخول: أظهر القائمة وانقله للداشبورد
        document.getElementById('mainNavigation').style.display = 'flex';
        showPage('dashboard', null);
    } else {
        // إذا مو مسجل: اخف القائمة واحبسه في صفحة التسجيل
        document.getElementById('mainNavigation').style.display = 'none';
        showPage('auth-page', null);
    }
});

// تسجيل حساب جديد
document.getElementById('registerForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('regEmail').value;
    const pass = document.getElementById('regPassword').value;
    const name = document.getElementById('regName').value;
    const role = document.querySelector('input[name="role"]:checked').value;

    document.getElementById('regError').innerText = "جاري الإنشاء...";
    
    createUserWithEmailAndPassword(auth, email, pass)
        .then((userCredential) => {
            // حفظ بيانات المستخدم في الداتابيس
            set(ref(db, 'Users/' + userCredential.user.uid), {
                fullName: name, email: email, role: role
            });
        })
        .catch((error) => {
            document.getElementById('regError').innerText = "خطأ: " + error.message;
        });
});

// تسجيل الدخول
document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('loginEmail').value;
    const pass = document.getElementById('loginPassword').value;
    
    document.getElementById('loginError').innerText = "جاري التحقق...";

    signInWithEmailAndPassword(auth, email, pass)
        .catch((error) => {
            document.getElementById('loginError').innerText = "بيانات الدخول غير صحيحة!";
        });
});

// الخروج
window.logoutUser = () => { signOut(auth); };

// ==========================================
// 4. قراءة الداتا من ESP32 + الصيانة التنبؤية
// ==========================================
function checkMaintenanceNeeds(data) {
    let reasons = [];
    if (data.ultrasonic == 0 || data.ultrasonic > 400) reasons.push("عطل حساسات");
    if (data.battery < 15) reasons.push("بطارية منخفضة جداً");
    
    let timeSinceLastSeen = (Date.now() - data.lastSeenTimestamp) / 1000;
    if (timeSinceLastSeen > 120) reasons.push("مفقودة (انقطاع إشارة)");
    
    return reasons;
}

// مسار العربة في الفايربيس (يتطابق مع كود الـ C++ اللي أرسلته لك)
const cartRef = ref(db, 'Fleet/Carts/104');

onValue(cartRef, (snapshot) => {
    const data = snapshot.val();
    if (!data) return;

    // تحديث الأرقام
    document.getElementById('us_val').innerText = data.ultrasonic + " cm";
    
    // نعتبر نسبة البطارية هي شريط التقدم للتبسيط
    let battery = data.battery || 0;
    document.getElementById('progress_text').innerText = battery + "%";
    document.getElementById('mission_bar').style.width = battery + "%";

    // خوارزمية الصيانة الذكية
    let maintenanceReasons = checkMaintenanceNeeds(data);

    if (maintenanceReasons.length > 0) {
        document.getElementById('path_status').innerHTML = `<i class="fas fa-tools"></i> صيانة مطلوبة: ${maintenanceReasons.join(' و ')}`;
        document.getElementById('path_status').className = 'detail-value text-red fw-bold';
        document.getElementById('mission_status_badge').innerHTML = `<i class="fas fa-exclamation-triangle"></i> خارج الخدمة`;
        document.getElementById('mission_status_badge').className = 'status-badge bg-light-red';
    } else {
        document.getElementById('path_status').innerHTML = `<i class="fas fa-check"></i> المسار آمن والأجهزة سليمة`;
        document.getElementById('path_status').className = 'detail-value text-green fw-bold';
        document.getElementById('mission_status_badge').innerHTML = `<i class="fas fa-route"></i> نشطة`;
        document.getElementById('mission_status_badge').className = 'status-badge bg-light-green';
    }
});

// ==========================================
// 5. إعداد الرسوم البيانية والخريطة
// ==========================================
let statusChartInstance = null;
let peakChartInstance = null;

function initCharts() {
    if (statusChartInstance) return; // عشان ما يرسمها فوق بعض

    // شارت التوزيع
    const ctxStatus = document.getElementById('statusChart').getContext('2d');
    statusChartInstance = new Chart(ctxStatus, {
        type: 'doughnut',
        data: {
            labels: ['متاحة', 'متحركة', 'صيانة'],
            datasets: [{
                data: [142, 58, 4],
                backgroundColor: ['#10b981', '#FF6B00', '#ef4444'],
                borderWidth: 0
            }]
        },
        options: { cutout: '75%', plugins: { legend: { position: 'bottom', labels: { font: { family: 'Cairo' } } } } }
    });

    // شارت الذروة
    const ctxPeak = document.getElementById('peakChart').getContext('2d');
    peakChartInstance = new Chart(ctxPeak, {
        type: 'bar',
        data: {
            labels: ['8 ص', '12 م', '4 م', '8 م', '12 ص'],
            datasets: [{
                label: 'استخدام العربات',
                data: [12, 45, 30, 85, 20],
                backgroundColor: '#FF6B00',
                borderRadius: 8
            }]
        },
        options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }
    });
}

function initMap() {
    var map = L.map('map').setView([24.7136, 46.6753], 15);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OpenStreetMap &copy; CARTO'
    }).addTo(map);
    
    // نقاط التكدس الوهمية للبروتوتايب
    var heatPoints = [
        [24.7136, 46.6753, 0.9], [24.7140, 46.6760, 0.6], [24.7120, 46.6740, 0.4]
    ];
    L.heatLayer(heatPoints, {radius: 35, blur: 20, gradient: {0.4: 'blue', 0.6: 'cyan', 0.8: 'orange', 1.0: 'red'}}).addTo(map);
}