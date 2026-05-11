// ==========================================
// 1. رسم الخريطة أولاً (عشان تظهر فوراً بدون انتظار الفايربيس)
// ==========================================
// إحداثيات الرياض كمثال
const map = L.map('map').setView([24.7136, 46.6753], 16);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© Mada System'
}).addTo(map);

// تجهيز طبقة الحرارة (Heatmap)
let heatLayer = L.heatLayer([], { radius: 25, blur: 15, maxZoom: 17, gradient: {0.4: 'blue', 0.6: 'cyan', 0.7: 'lime', 0.8: 'yellow', 1.0: 'red'} }).addTo(map);
// هذا الكود يجبر الخريطة تتحدث وتظهر بكامل حجمها 
setTimeout(() => {
    map.invalidateSize();
}, 500);
// ==========================================
// 2. منطق كارت المهام (الاستقرار vs التكدس)
// ==========================================
let northCount = 0;
let southCount = 0;

function updateWorkerUI() {
    const workerTask = document.getElementById('workerTask');
    const taskIcon = document.getElementById('taskIcon');
    const taskTitle = document.getElementById('taskTitle');
    const taskDesc = document.getElementById('taskDesc');
    const taskCounter = document.getElementById('taskCounter');
    const cartAmount = document.getElementById('cartAmount');
    const taskBtn = document.getElementById('taskBtn');

    if (northCount >= 20) {
        workerTask.className = "task-banner alert-mode";
        taskIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="animation: pulse 1s infinite;"></i>';
        taskTitle.innerText = 'تكدس في المحطة الشمالية!';
        taskTitle.style.color = 'var(--vivid-red)';
        taskDesc.innerText = 'المحطة ممتلئة بالكامل (20/20). توجه فوراً لسحب العربات.';
        taskCounter.style.display = 'block';
        cartAmount.innerText = northCount;
        taskBtn.style.display = 'block';
    } 
    else if (southCount >= 20) {
        workerTask.className = "task-banner alert-mode";
        taskIcon.innerHTML = '<i class="fas fa-exclamation-triangle" style="animation: pulse 1s infinite;"></i>';
        taskTitle.innerText = 'تكدس في المحطة الجنوبية!';
        taskTitle.style.color = 'var(--vivid-red)';
        taskDesc.innerText = 'المحطة ممتلئة بالكامل (20/20). توجه فوراً لسحب العربات.';
        taskCounter.style.display = 'block';
        cartAmount.innerText = southCount;
        taskBtn.style.display = 'block';
    } 
    else {
        workerTask.className = "task-banner";
        taskIcon.innerHTML = '<i class="fas fa-check-circle"></i>';
        taskTitle.innerText = 'الوضع مستقر';
        taskTitle.style.color = 'var(--brunswick-green)';
        taskDesc.innerText = 'جميع المحطات بها مساحة كافية، استمر في جولاتك المعتادة.';
        taskCounter.style.display = 'none';
        taskBtn.style.display = 'none';
    }
}

// ==========================================
// 3. إعدادات الفايربيس وجلب البيانات
// ==========================================
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-app.js";
import { getDatabase, ref, onValue } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-database.js";

// 🚨 حطي بيانات مشروعكم هنا
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT_ID.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_ID",
    appId: "YOUR_APP_ID"
};

try {
    const app = initializeApp(firebaseConfig);
    const db = getDatabase(app);

    onValue(ref(db, 'Stations/NorthGate'), (snapshot) => {
        if (snapshot.exists()) {
            northCount = snapshot.val().cartCount || 0;
            updateWorkerUI();
        }
    });

    onValue(ref(db, 'Stations/SouthGate'), (snapshot) => {
        if (snapshot.exists()) {
            southCount = snapshot.val().cartCount || 0;
            updateWorkerUI();
        }
    });

    onValue(ref(db, 'CartsLocations'), (snapshot) => {
        if (snapshot.exists()) {
            const locations = snapshot.val();
            const heatPoints = [];
            for (let key in locations) {
                if (locations[key].lat && locations[key].lng) {
                    heatPoints.push([locations[key].lat, locations[key].lng, locations[key].intensity || 1]);
                }
            }
            heatLayer.setLatLngs(heatPoints);
        }
    });
} catch(e) {
    console.log("Firebase not configured yet, but UI is running!");
}

// ==========================================
// 4. تسجيل الخروج
// ==========================================
const btnLogout = document.querySelector('.sidebar-logout');
if(btnLogout) {
    btnLogout.addEventListener('click', (e) => {
        e.preventDefault();
        window.location.href = 'index.html'; 
    });
}
// ==========================================
// 7. زر محاكاة الطوارئ للمناقشة (الديمو)
// ==========================================
const demoBtn = document.getElementById('demoBtn');
if (demoBtn) {
    demoBtn.addEventListener('click', () => {
        // 1. تغيير الكارت لحالة الخطر
        const workerTask = document.getElementById('workerTask');
        workerTask.className = "task-banner alert-mode";
        
        document.getElementById('taskIcon').innerHTML = '<i class="fas fa-exclamation-triangle" style="animation: pulse 1s infinite;"></i>';
        document.getElementById('taskTitle').innerText = 'تكدس حرج في المحطة الشمالية!';
        document.getElementById('taskTitle').style.color = 'var(--vivid-red)';
        document.getElementById('taskDesc').innerText = 'المحطة ممتلئة بالكامل (20/20) ولا يوجد مساحة. توجه فوراً لسحب العربات!';
        
        document.getElementById('taskCounter').style.display = 'block';
        document.getElementById('cartAmount').innerText = "20";
        document.getElementById('taskBtn').style.display = 'block';

        // 2. تحديث الخريطة الأصلية (بدون حذفها)
        map.setView([24.7136, 46.6753], 18); // زووم قوي على المحطة
        
        // رسم البقعة الحرارية الحمراء القوية
        heatLayer.setLatLngs([
            [24.7136, 46.6753, 1], 
            [24.71365, 46.67535, 1], 
            [24.71355, 46.67525, 0.9]
        ]);
    });
}