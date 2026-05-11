import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, get, set } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

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

document.getElementById('btnAddPoints').addEventListener('click', async () => {
    const phone = document.getElementById('phoneAdd').value;
    const code = document.getElementById('receiptCode').value;
    const msg = document.getElementById('msgAdd');

    if(!phone || !code) { msg.innerText = "يرجى تعبئة جميع الحقول."; msg.style.color="red"; return; }
    
    msg.innerText = "جاري التحقق وإضافة النقاط..."; msg.style.color = "blue";

    try {
        const userRef = ref(db, 'Customers/' + phone);
        const snapshot = await get(userRef);
        
        // إذا العميل مسجل مسبقاً، نزيد نقاطه، إذا جديد نسوي له حساب مبدئي
        let currentPoints = 0;
        let userData = { pin: "1234" }; // PIN افتراضي للعملاء الجدد

        if (snapshot.exists()) {
            userData = snapshot.val();
            currentPoints = userData.points || 0;
        }

        // إضافة 50 نقطة مكافأة
        userData.points = currentPoints + 50;

        await set(userRef, userData);
        
        msg.innerText = "تم بنجاح! تمت إضافة 50 نقطة لرصيدك 🌟";
        msg.style.color = "var(--forest-green)";
        
        // تنظيف الحقول
        document.getElementById('phoneAdd').value = "";
        document.getElementById('receiptCode').value = "";

    } catch (error) {
        msg.innerText = "حدث خطأ بالاتصال."; msg.style.color="red";
    }
});