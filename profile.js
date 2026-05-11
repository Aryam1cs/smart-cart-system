import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const db = getDatabase(app);

let generatedOTP = ""; // لتخزين الرمز المحاكى
let verifiedPhone = ""; // لتخزين الرقم بعد التحقق

// 1. طلب الرمز (محاكاة SMS)
document.getElementById('btnRequestOTP').addEventListener('click', async () => {
    const phone = document.getElementById('phoneInput').value;
    const msg = document.getElementById('msgPhone');
    const btn = document.getElementById('btnRequestOTP');

    if(!phone) { msg.innerText = "يرجى إدخال رقم الجوال أولاً."; return; }
    
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري البحث...';
    btn.disabled = true;
    msg.innerText = "";

    try {
        const userRef = ref(db, 'Customers/' + phone);
        const snapshot = await get(userRef);

        if (snapshot.exists()) {
            verifiedPhone = phone; // حفظ الرقم
            // توليد كود عشوائي من 4 أرقام
            generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
            
            // إظهار قسم إدخال الرمز
            document.getElementById('otpContainer').style.display = 'block';
            
            // 🔥 حركة ذكية للمناقشة: إظهار تنبيه يمثل رسالة الـ SMS للجنة
            alert("  رسالة  لمحاكاة :\n\nرمز التحقق (OTP) الخاص بك لمنصة SmartCart هو: " + generatedOTP);
            
            btn.innerHTML = 'إعادة إرسال الرمز';
            btn.disabled = false;
        } else {
            msg.innerText = "هذا الرقم لا يملك نقاط مسجلة مسبقاً.";
            btn.innerHTML = 'إرسال رمز التحقق (OTP)';
            btn.disabled = false;
        }
    } catch (error) {
        msg.innerText = "حدث خطأ بالاتصال بقاعدة البيانات.";
        btn.disabled = false;
    }
});

// 2. التحقق من الـ OTP المدخل
document.getElementById('btnVerifyOTP').addEventListener('click', async () => {
    const inputOTP = document.getElementById('otpInput').value;
    const msg = document.getElementById('msgOTP');

    if(inputOTP === generatedOTP) {
        // الرمز صحيح! نجيب البيانات من الفايربيس
        const snapshot = await get(ref(db, 'Customers/' + verifiedPhone));
        if (snapshot.exists()) {
            document.getElementById('loginSection').style.display = 'none';
            document.getElementById('dataSection').style.display = 'block';
            document.getElementById('userPoints').innerText = snapshot.val().points || 0;
        }
    } else {
        msg.innerText = "الرمز المدخل غير صحيح ❌";
    }
});