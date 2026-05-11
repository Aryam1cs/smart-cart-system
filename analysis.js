// ==========================================
// 1. التنبؤ بالازدحام (الطلب)
// ==========================================
document.getElementById('btnDemandPredict').addEventListener('click', async function(event) {
    const hr = document.getElementById('inp_hr').value;
    const weekday = document.getElementById('inp_weekday').value;
    const weathersit = document.getElementById('inp_weather').value;
    const temp = document.getElementById('inp_temp').value;
    const hum = document.getElementById('inp_hum').value; // 🔥 سحبنا الرطوبة
    const workingday = (weekday == 5 || weekday == 6) ? 0 : 1;

    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحليل...';

    try {
        const response = await fetch('http://127.0.0.1:5000/predict_demand', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 🔥 أضفنا hum في الإرسال
            body: JSON.stringify({ hr, weekday, workingday, weathersit, temp, hum }) 
        });
        
        const data = await response.json();
        
        if (data.error) {
            alert("⚠️ خطأ من الموديل: " + data.error);
            document.getElementById('demandResult').innerText = "خطأ";
        } else {
            document.getElementById('demandResult').innerText = data.expected_demand + " عربة";
            document.getElementById('demandResultBox').style.borderColor = "var(--forest-green)";
        }
    } catch (error) {
        alert("لم يتم العثور على خادم فلاسك! تأكد من تشغيل app.py");
    } finally {
        btn.innerHTML = 'توقع عدد الزوار <i class="fas fa-magic"></i>';
    }
});
// ==========================================
// 2. التنبؤ بالصيانة الاستباقية
// ==========================================
let currentSensors = {}; 

// أزرار المحاكاة
document.getElementById('btnSimGood').addEventListener('click', function() {
    const monitor = document.getElementById('sensorDataMonitor');
    currentSensors = { metric1: 12.1, metric2: 0.05, metric3: 2.1, metric4: 35.0, metric5: 1.1, metric6: 0.1, metric7: 0.2, metric8: 0.3, metric9: 0.0 };
    monitor.innerHTML = `> Volt: 12.1V (Stable)<br>> Vibration: 0.05g (Normal)<br>> Current: 2.1A<br>> Temp: 35C (Cool)<br>> System: OK`;
    monitor.style.color = "#0f0";
});

document.getElementById('btnSimBad').addEventListener('click', function() {
    const monitor = document.getElementById('sensorDataMonitor');
    currentSensors = { metric1: 11.2, metric2: 0.85, metric3: 4.5, metric4: 65.0, metric5: 2.5, metric6: 1.5, metric7: 0.8, metric8: 0.9, metric9: 1.0 };
    monitor.innerHTML = `> Volt: 11.2V (Low)<br>> Vibration: 0.85g (HIGH!)<br>> Current: 4.5A (Overload)<br>> Temp: 65C (HOT!)<br>> System: WARNING`;
    monitor.style.color = "#f00";
});

// زر الفحص
document.getElementById('btnMaintenancePredict').addEventListener('click', async function(event) {
    if(Object.keys(currentSensors).length === 0) {
        alert("يرجى محاكاة سحب البيانات من الحساسات أولاً (اضغط أحد الأزرار الخضراء أو الحمراء).");
        return;
    }

    const btn = event.target;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري الفحص...';

    try {
        const response = await fetch('http://127.0.0.1:5000/predict_maintenance', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentSensors)
        });
        
        const data = await response.json();
        const resBox = document.getElementById('maintResultBox');
        const resText = document.getElementById('maintResult');

        if (data.error) {
            alert("⚠️ خطأ من الموديل: " + data.error);
            resText.innerText = "خطأ";
        } else {
            resText.innerText = data.status;
            if(data.prediction === 1) { 
                resText.style.color = "var(--vivid-red)";
                resBox.style.borderColor = "var(--vivid-red)";
                resBox.style.background = "rgba(233,12,0,0.05)";
            } else {
                resText.style.color = "var(--forest-green)";
                resBox.style.borderColor = "var(--forest-green)";
                resBox.style.background = "rgba(65,139,36,0.05)";
            }
        }
    } catch (error) {
        alert("لم يتم العثور على خادم فلاسك! تأكد من تشغيل app.py");
    } finally {
        btn.innerHTML = 'فحص بالذكاء الاصطناعي <i class="fas fa-search"></i>';
    }
});