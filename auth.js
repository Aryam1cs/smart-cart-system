import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
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
const auth = getAuth(app);
const db = getDatabase(app);

document.getElementById('loginForm').addEventListener('submit', (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnLogin');
    const msg = document.getElementById('loginError');
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحقق...'; btn.disabled = true; msg.innerText = "";

    signInWithEmailAndPassword(auth, document.getElementById('loginEmail').value, document.getElementById('loginPassword').value)
        .then(async (userCredential) => {
            const snapshot = await get(ref(db, 'Employees/' + userCredential.user.uid));
            if (snapshot.exists()) {
                const role = snapshot.val().role;
                if (role === "Admin") window.location.href = "dashboard.html";
                else if (role === "Worker") window.location.href = "heatmap.html";
                else msg.innerText = "صلاحيات الحساب غير معروفة.";
            } else { msg.innerText = "لا توجد صلاحيات مسجلة لهذا الحساب."; }
        }).catch(() => {
            btn.innerHTML = 'دخول للنظام'; btn.disabled = false;
            msg.innerText = "البريد أو كلمة المرور غير صحيحة 🛑";
        });
});