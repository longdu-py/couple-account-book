// 登录校验
if(localStorage.getItem('isLogin') !== 'true'){
    location.href = 'index.html';
}

// DOM
const logoutBtn = document.getElementById('logoutBtn');
const changePwdBtn = document.getElementById('changePwdBtn');
const pwdMask = document.getElementById('pwdMask');
const closeMask = document.getElementById('closeMask');
const oldPwd = document.getElementById('oldPwd');
const newPwd = document.getElementById('newPwd');
const newPwd2 = document.getElementById('newPwd2');
const confirmPwd = document.getElementById('confirmPwd');

const budgetInput = document.getElementById('budgetInput');
const saveBudget = document.getElementById('saveBudget');
const budgetTip = document.getElementById('budgetTip');

const moneyInput = document.getElementById('moneyInput');
const cateSelect = document.getElementById('cateSelect');
const dateInput = document.getElementById('dateInput');
const descInput = document.getElementById('descInput');
const addBillBtn = document.getElementById('addBillBtn');

const monthIncomeEl = document.getElementById('monthIncome');
const monthPayEl = document.getElementById('monthPay');
const monthSurplusEl = document.getElementById('monthSurplus');
const monthBudgetEl = document.getElementById('monthBudget');

const billList = document.getElementById('billList');
const exportData = document.getElementById('exportData');
const importData = document.getElementById('importData');
const fileInput = document.getElementById('fileInput');
const clearAll = document.getElementById('clearAll');

let billData = JSON.parse(localStorage.getItem('familyBill')) || [];
let budget = Number(localStorage.getItem('monthBudget')) || 0;
let payChart = null;

// 初始化日期为今天
const now = new Date();
dateInput.value = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')}`;
budgetInput.value = budget;

// 退出登录
logoutBtn.onclick = ()=>{
    localStorage.removeItem('isLogin');
    location.href = 'index.html';
}

// 修改密码弹窗
changePwdBtn.onclick = ()=> pwdMask.style.display = 'flex';
closeMask.onclick = ()=> pwdMask.style.display = 'none';
confirmPwd.onclick = ()=>{
    const originPwd = localStorage.getItem('familyPwd') || '1314520';
    if(oldPwd.value !== originPwd){
        alert('原密码不正确');
        return;
    }
    if(newPwd.value.length < 3){
        alert('新密码至少3位');
        return;
    }
    if(newPwd.value !== newPwd2.value){
        alert('两次新密码不一致');
        return;
    }
    localStorage.setItem('familyPwd', newPwd.value);
    alert('密码修改成功，请重新登录');
    localStorage.removeItem('isLogin');
    location.href = 'index.html';
}

// 保存月度预算
saveBudget.onclick = ()=>{
    const num = Number(budgetInput.value);
    if(isNaN(num) || num < 0){
        budgetTip.innerText = '请输入合法金额';
        return;
    }
    budget = num;
    localStorage.setItem('monthBudget', budget);
    budgetTip.innerText = '预算已保存';
    calcMonthData();
    setTimeout(()=>budgetTip.innerText='',1500);
}

// 新增账单
addBillBtn.onclick = ()=>{
    const type = document.querySelector('input[name="type"]:checked').value;
    const money = Number(moneyInput.value);
    const cate = cateSelect.value;
    const date = dateInput.value;
    const desc = descInput.value.trim();
    if(!money || money <= 0){
        alert('请填写有效金额');
        return;
    }
    const bill = {
        id: Date.now(),
        type, money, cate, date, desc
    }
    billData.unshift(bill);
    saveData();
    refreshAll();
    moneyInput.value = '';
    descInput.value = '';
}

// 本地存储
function saveData(){
    localStorage.setItem('familyBill', JSON.stringify(billData));
}

// 计算本月收支
function calcMonthData(){
    const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    let income = 0, pay = 0;
    billData.forEach(item=>{
        if(item.date.startsWith(curMonth)){
            if(item.type === 'income') income += item.money;
            else pay += item.money;
        }
    })
    const surplus = income - pay;
    monthIncomeEl.innerText = income.toFixed(2);
    monthPayEl.innerText = pay.toFixed(2);
    monthSurplusEl.innerText = surplus.toFixed(2);
    monthBudgetEl.innerText = budget.toFixed(2);
    renderChart();
}

// 渲染支出饼图
function renderChart(){
    const curMonth = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}`;
    const cateMap = {};
    billData.forEach(item=>{
        if(item.date.startsWith(curMonth) && item.type === 'pay'){
            if(!cateMap[item.cate]) cateMap[item.cate] = 0;
            cateMap[item.cate] += item.money;
        }
    })
    const labels = Object.keys(cateMap);
    const data = Object.values(cateMap);
    const ctx = document.getElementById('payChart').getContext('2d');
    if(payChart) payChart.destroy();
    payChart = new Chart(ctx,{
        type:'pie',
        data:{
            labels,
            datasets:[{data,backgroundColor:['#ff7b9c','#7b9cff','#ffd17b','#84e884','#b484e8','#ff967b','#7be0e0','#e884b4','#cccccc']}]
        },
        options:{responsive:true,plugins:{legend:{position:'bottom'}}}
    })
}

// 渲染账单列表
function renderBillList(){
    billList.innerHTML = '';
    billData.forEach(item=>{
        const div = document.createElement('div');
        div.className = 'bill-item';
        const moneyClass = item.type === 'income' ? 'income-text' : 'pay-text';
        div.innerHTML = `
            <div class="bill-left">
                <span class="cate">${item.cate}</span>
                <span>${item.date} ${item.desc || '无备注'}</span>
                <div class="desc">ID:${item.id}</div>
            </div>
            <div class="bill-right">
                <span class="${moneyClass}">${item.type==='income'?'+':'-'}${item.money.toFixed(2)}</span>
                <button class="del-btn" data-id="${item.id}">删除</button>
            </div>
        `;
        billList.appendChild(div);
    })
    // 删除账单
    document.querySelectorAll('.del-btn').forEach(btn=>{
        btn.onclick = ()=>{
            const id = Number(btn.dataset.id);
            billData = billData.filter(b=>b.id !== id);
            saveData();
            refreshAll();
        }
    })
}

// 刷新全部数据
function refreshAll(){
    calcMonthData();
    renderBillList();
}

// 导出JSON备份
exportData.onclick = ()=>{
    const blob = new Blob([JSON.stringify(billData,null,2)],{type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `夫妻账本备份_${new Date().getTime()}.json`;
    a.click();
}

// 导入备份
importData.onclick = ()=> fileInput.click();
fileInput.onchange = e=>{
    const f = e.target.files[0];
    if(!f) return;
    const reader = new FileReader();
    reader.onload = ev=>{
        try{
            const arr = JSON.parse(ev.target.result);
            if(Array.isArray(arr)){
                billData = arr;
                saveData();
                refreshAll();
                alert('导入成功');
            }
        }catch(err){
            alert('备份文件格式错误');
        }
    }
    reader.readAsText(f);
}

// 清空所有账单
clearAll.onclick = ()=>{
    if(!confirm('确定清空全部账单记录？无法恢复！')) return;
    billData = [];
    saveData();
    refreshAll();
}

// 页面加载初始化
refreshAll();
