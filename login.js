import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const auth = getAuth();
const loginForm = document.getElementById('loginForm');

loginForm.onsubmit = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;

    try {
        await signInWithEmailAndPassword(auth, email, password);
        localStorage.setItem("loggedInUser", email);
        window.location.href = "dashboard.html";
    } catch (error) {
        alert("Login Failed: " + error.message);
    }
};