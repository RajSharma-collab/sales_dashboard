// --- Supabase Setup ---
// PASTE YOUR ACTUAL URL AND ANON KEY HERE
const SUPABASE_URL = 'https://gkzuapwjyrfpwurganuw.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_MkpMHJR4hk5bIxOF1nh5-A_J05TEz1p';

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

let dailyChartInstance = null;
let monthlyChartInstance = null;

const formatINR = (val) => {
  const num = Number(val) || 0;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toFixed(0)}`;
};

function updateKpiCards(kpi, reportDate) {
  if (!kpi) return;

  const dateObj = new Date(reportDate);
  const monthName = dateObj.toLocaleString('default', { month: 'short' }).toUpperCase();
  const labelEl = document.getElementById('kpiMtdLabel');
  if (labelEl) labelEl.textContent = `${monthName} MTD`;

  document.getElementById('kpiTodaySales').textContent = kpi.today_sales ?? 0;
  document.getElementById('kpiTodayRevenue').innerHTML = `${formatINR(kpi.today_revenue)} <span class="text-xs text-slate-400 font-normal">Revenue</span>`;

  document.getElementById('kpiMtdSales').textContent = kpi.mtd_sales ?? 0;
  document.getElementById('kpiMtdRevenue').innerHTML = `${formatINR(kpi.mtd_revenue)} <span class="text-[10px] font-normal">Revenue</span>`;

  document.getElementById('kpiPrevDaySales').textContent = kpi.prev_same_day_sales ?? 0;
  document.getElementById('kpiPrevDayRevenue').innerHTML = `${formatINR(kpi.prev_same_day_revenue)} <span class="text-[10px] font-normal">Revenue</span>`;

  document.getElementById('kpiPrevMonthSales').textContent = kpi.prev_month_sales ?? 0;
  document.getElementById('kpiPrevMonthRevenue').innerHTML = `${formatINR(kpi.prev_month_revenue)} <span class="text-[10px] font-normal">Revenue</span>`;
}

function updateLeaderboard(employees) {
  const tbody = document.getElementById('leaderboardBody');
  tbody.innerHTML = '';

  if (!employees || employees.length === 0) {
    tbody.innerHTML = `<tr><td colspan="8" class="text-center py-6 text-slate-400">No employee sales found for this date.</td></tr>`;
    return;
  }

  const TARGET_SALES = 125;

  employees.forEach((emp, index) => {
    const mtdSales = Number(emp.monthly_sales) || 0;
    const mtdRev = Number(emp.monthly_revenue) || 0;
    const todaySales = Number(emp.today_sales) || 0;
    const todayRev = Number(emp.today_revenue) || 0;
    const arpu = mtdSales > 0 ? Math.round(mtdRev / mtdSales) : 0;
    const targetPercent = Math.min(Math.round((mtdSales / TARGET_SALES) * 100), 100);

    const tr = document.createElement('tr');
    tr.className = 'hover:bg-slate-50 transition-colors';
    tr.innerHTML = `
      <td class="py-3 text-center font-bold text-slate-400">${index + 1}</td>
      <td class="py-3 font-semibold text-slate-800">${emp.staff_name || 'Unassigned'}</td>
      <td class="py-3 text-center">
        <span class="font-bold text-slate-700">${todaySales}</span>
        ${todayRev > 0 ? `<div class="text-[10px] text-slate-400">₹${(todayRev / 1000).toFixed(1)}k</div>` : ''}
      </td>
      <td class="py-3 text-center font-bold text-slate-800">${mtdSales}</td>
      <td class="py-3 text-right font-semibold text-slate-700">₹${(mtdRev / 1000).toFixed(1)}k</td>
      <td class="py-3 text-right text-slate-500 font-medium">₹${arpu}</td>
      <td class="py-3 text-center">
        <div class="flex items-center gap-2 justify-center">
          <span class="text-[11px] font-bold ${targetPercent >= 100 ? 'text-emerald-500' : 'text-slate-600'}">${targetPercent}%</span>
          <div class="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden">
            <div class="bg-[#ff5722] h-full rounded-full" style="width: ${targetPercent}%"></div>
          </div>
          <span class="text-[10px] text-slate-400 font-semibold">${TARGET_SALES}</span>
        </div>
      </td>
      <td class="py-3 text-center font-semibold text-slate-600">${Math.floor(mtdSales * 0.65)}</td>
    `;
    tbody.appendChild(tr);
  });
}

function updateDestinations() {
  const destList = document.getElementById('destinationsList');
  const items = [
    { name: 'United Kingdom', count: 9 },
    { name: 'Europe (47)', count: 8 },
    { name: 'Orange Holiday Europe', count: 7 },
    { name: 'United States', count: 7 },
    { name: 'South Korea', count: 6 },
    { name: 'Malaysia [TuneTalk]', count: 5 },
    { name: 'Orange World', count: 5 }
  ];

  destList.innerHTML = items.map(item => `
    <div class="flex items-center justify-between py-1.5 border-b border-slate-800 text-xs">
      <span class="text-slate-200 font-medium">${item.name}</span>
      <span class="bg-[#1e293b] text-white px-3 py-1 rounded-lg font-bold">${item.count}</span>
    </div>
  `).join('');
}

function updateCharts(dailyData, monthlyData) {
  const orangeTheme = '#ff5722';

  // Daily Chart
  const ctxDaily = document.getElementById('dailySummaryChart').getContext('2d');
  if (dailyChartInstance) dailyChartInstance.destroy();

  const dailyLabels = dailyData.length > 0 
    ? dailyData.map(d => d.date) 
    : ['01-06', '02-06', '03-06', '04-06', '05-06', '06-06', '07-06'];
  const dailyValues = dailyData.length > 0 
    ? dailyData.map(d => Number(d.sales)) 
    : [35, 45, 32, 50, 28, 30, 58];

  dailyChartInstance = new Chart(ctxDaily, {
    type: 'line',
    data: {
      labels: dailyLabels,
      datasets: [{
        data: dailyValues,
        borderColor: orangeTheme,
        backgroundColor: 'rgba(255, 87, 34, 0.05)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: orangeTheme,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' }, beginAtZero: true }
      }
    }
  });

  // Monthly Chart
  const ctxMonthly = document.getElementById('monthlySummaryChart').getContext('2d');
  if (monthlyChartInstance) monthlyChartInstance.destroy();

  const monthLabels = ['Nov 25', 'Dec 25', 'Jan 26', 'Feb 26', 'Mar 26', 'Apr 26', 'May 26', 'Jun 26'];
  const monthValues = [0, 80, 150, 220, 360, 520, 920, 643];

  monthlyChartInstance = new Chart(ctxMonthly, {
    type: 'line',
    data: {
      labels: monthlyData && monthlyData.length > 0 ? monthlyData.map(m => m.date) : monthLabels,
      datasets: [{
        data: monthlyData && monthlyData.length > 0 ? monthlyData.map(m => Number(m.sales)) : monthValues,
        borderColor: orangeTheme,
        backgroundColor: 'rgba(255, 87, 34, 0.05)',
        borderWidth: 2.5,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: orangeTheme,
        pointRadius: 4
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { grid: { display: false }, ticks: { font: { size: 10 }, color: '#94a3b8' } },
        y: { grid: { color: '#f1f5f9' }, ticks: { font: { size: 10 }, color: '#94a3b8' }, beginAtZero: true }
      }
    }
  });
}

async function loadDashboard() {
  const selectedDate = document.getElementById('reportDateInput').value;

  try {
    const [kpiRes, dailyRes, staffRes, monthlyRes] = await Promise.all([
      supabaseClient.rpc('kpi_metric_card', { report_date: selectedDate }),
      supabaseClient.rpc('daily_sales', { report_date: selectedDate }),
      supabaseClient.rpc('employee_sales_report', { report_date: selectedDate }),
      supabaseClient.rpc('monthly_sales', { report_date: selectedDate })
    ]);

    if (kpiRes.error) console.error('kpi_metric_card error:', kpiRes.error);
    if (dailyRes.error) console.error('daily_sales error:', dailyRes.error);
    if (staffRes.error) console.error('employee_sales_report error:', staffRes.error);

    updateKpiCards(kpiRes.data?.[0], selectedDate);
    updateLeaderboard(staffRes.data || []);
    updateDestinations();
    updateCharts(dailyRes.data || [], monthlyRes.data || []);
  } catch (err) {
    console.error('Fatal loadDashboard error:', err);
  }
}

document.getElementById('reportDateInput').addEventListener('change', loadDashboard);

document.addEventListener('DOMContentLoaded', () => {
  if (window.lucide) {
    lucide.createIcons();
  }
  loadDashboard();
});