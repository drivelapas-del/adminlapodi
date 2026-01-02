// Inisialisasi elemen DOM
const dashboardIframe = document.getElementById('dashboard-iframe');
const iframeHeightSlider = document.getElementById('iframe-height');
const heightValueDisplay = document.getElementById('height-value');
const refreshIntervalSelect = document.getElementById('refresh-interval');
const refreshBtn = document.getElementById('refresh-btn');
const retryBtn = document.getElementById('retry-btn');
const themeToggle = document.querySelector('.theme-toggle');
const themeIcon = document.getElementById('theme-icon');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');
const lastUpdatedTime = document.getElementById('last-updated-time');
const lastUpdatedText = document.getElementById('last-updated-text');
const currentYear = document.getElementById('current-year');

// Variabel global
let refreshInterval = null;
let iframeLoaded = false;
let currentHeight = 900;

// Inisialisasi saat halaman dimuat
document.addEventListener('DOMContentLoaded', function() {
    initApp();
});

function initApp() {
    // Set tahun saat ini di footer
    currentYear.textContent = new Date().getFullYear();
    
    // Inisialisasi slider tinggi iframe
    updateHeightDisplay();
    
    // Set event listeners
    setupEventListeners();
    
    // Cek status tema yang disimpan
    checkSavedTheme();
    
    // Mulai monitoring status iframe
    startIframeMonitoring();
}

function setupEventListeners() {
    // Slider tinggi iframe
    iframeHeightSlider.addEventListener('input', function() {
        currentHeight = parseInt(this.value);
        updateIframeHeight();
        updateHeightDisplay();
    });
    
    // Pilihan interval refresh otomatis
    refreshIntervalSelect.addEventListener('change', function() {
        const interval = parseInt(this.value);
        setupAutoRefresh(interval);
    });
    
    // Tombol refresh manual
    refreshBtn.addEventListener('click', function() {
        refreshDashboard();
    });
    
    // Tombol retry jika error
    retryBtn.addEventListener('click', function() {
        retryLoading();
    });
    
    // Toggle tema gelap/terang
    themeToggle.addEventListener('click', function() {
        toggleTheme();
    });
    
    // Event listener untuk iframe
    dashboardIframe.addEventListener('load', handleIframeLoad);
    dashboardIframe.addEventListener('error', handleIframeError);
}

function updateIframeHeight() {
    dashboardIframe.style.height = `${currentHeight}px`;
}

function updateHeightDisplay() {
    heightValueDisplay.textContent = `${currentHeight}px`;
}

function refreshDashboard() {
    // Tampilkan loading state
    showLoading();
    
    // Tambahkan timestamp untuk menghindari cache
    const timestamp = new Date().getTime();
    const currentSrc = dashboardIframe.src.split('?')[0];
    dashboardIframe.src = `${currentSrc}?t=${timestamp}`;
    
    // Update status
    updateStatus('Memuat ulang...', 'loading');
    
    // Update waktu terakhir refresh
    updateLastUpdatedTime();
}

function retryLoading() {
    hideError();
    refreshDashboard();
}

function handleIframeLoad() {
    iframeLoaded = true;
    hideLoading();
    hideError();
    
    // Periksa apakah iframe berisi konten yang valid
    try {
        // Coba akses dokumen iframe untuk memastikan konten dimuat
        const iframeDoc = dashboardIframe.contentDocument || dashboardIframe.contentWindow.document;
        
        if (iframeDoc && iframeDoc.body && iframeDoc.body.children.length > 0) {
            updateStatus('Terhubung', 'connected');
            console.log('Dashboard LAPODI berhasil dimuat');
        } else {
            handleIframeError();
        }
    } catch (error) {
        // Jika ada error akses cross-origin, anggap berhasil dimuat
        updateStatus('Terhubung', 'connected');
        console.log('Dashboard LAPODI dimuat (akses cross-origin dibatasi)');
    }
    
    // Update waktu terakhir dimuat
    updateLastUpdatedTime();
}

function handleIframeError() {
    iframeLoaded = false;
    hideLoading();
    showError();
    updateStatus('Gagal memuat', 'error');
    console.error('Gagal memuat dashboard LAPODI');
}

function showLoading() {
    loadingElement.style.display = 'flex';
    dashboardIframe.style.display = 'none';
}

function hideLoading() {
    loadingElement.style.display = 'none';
    dashboardIframe.style.display = 'block';
}

function showError() {
    errorElement.style.display = 'flex';
    dashboardIframe.style.display = 'none';
}

function hideError() {
    errorElement.style.display = 'none';
    dashboardIframe.style.display = 'block';
}

function updateStatus(text, state) {
    statusText.textContent = text;
    
    // Reset kelas status
    statusIndicator.classList.remove('status-connected', 'status-error');
    
    // Set kelas berdasarkan state
    if (state === 'connected') {
        statusIndicator.classList.add('status-connected');
    } else if (state === 'error') {
        statusIndicator.classList.add('status-error');
    } else {
        // Loading state - tidak perlu kelas tambahan
    }
}

function setupAutoRefresh(intervalSeconds) {
    // Hapus interval sebelumnya jika ada
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = null;
    }
    
    // Set interval baru jika intervalSeconds > 0
    if (intervalSeconds > 0) {
        refreshInterval = setInterval(() => {
            refreshDashboard();
        }, intervalSeconds * 1000);
        
        console.log(`Auto refresh diatur setiap ${intervalSeconds} detik`);
    } else {
        console.log('Auto refresh dinonaktifkan');
    }
}

function toggleTheme() {
    const body = document.body;
    body.classList.toggle('dark-mode');
    
    // Update ikon tema
    if (body.classList.contains('dark-mode')) {
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
        localStorage.setItem('lapodi-theme', 'dark');
    } else {
        themeIcon.classList.remove('fa-sun');
        themeIcon.classList.add('fa-moon');
        localStorage.setItem('lapodi-theme', 'light');
    }
}

function checkSavedTheme() {
    const savedTheme = localStorage.getItem('lapodi-theme');
    
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeIcon.classList.remove('fa-moon');
        themeIcon.classList.add('fa-sun');
    }
}

function updateLastUpdatedTime() {
    const now = new Date();
    const timeString = now.toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });
    
    lastUpdatedTime.textContent = timeString;
    lastUpdatedText.textContent = `Diperbarui: ${timeString}`;
}

function startIframeMonitoring() {
    // Monitor konektivitas iframe setiap 30 detik
    setInterval(() => {
        if (iframeLoaded) {
            try {
                const iframeDoc = dashboardIframe.contentDocument || dashboardIframe.contentWindow.document;
                
                if (iframeDoc && iframeDoc.body) {
                    // Iframe masih berfungsi
                    updateStatus('Terhubung', 'connected');
                } else {
                    handleIframeError();
                }
            } catch (error) {
                // Tidak dapat mengakses dokumen iframe karena cross-origin
                // Asumsikan iframe masih berfungsi
                updateStatus('Terhubung', 'connected');
            }
        }
    }, 30000); // Cek setiap 30 detik
}

// Inisialisasi refresh otomatis dengan nilai default
document.addEventListener('DOMContentLoaded', function() {
    const defaultInterval = parseInt(refreshIntervalSelect.value);
    if (defaultInterval > 0) {
        setTimeout(() => {
            setupAutoRefresh(defaultInterval);
        }, 1000);
    }
});