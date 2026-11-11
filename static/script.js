
document.addEventListener("DOMContentLoaded", function () {

    const publicationList =
        document.getElementById("publicationList");

    // 其他頁面不執行這段程式
    if (!publicationList) return;

    const searchInput = document.getElementById("searchInput");
    const yearFilter = document.getElementById("yearFilter");
    const typeFilter = document.getElementById("typeFilter");
    const chartType = document.getElementById("chartType");

    const publicationCount =
        document.getElementById("publicationCount");

    const yearCount =
        document.getElementById("yearCount");

    const noResults =
        document.getElementById("noResults");

    const publications = Array.from(
        document.querySelectorAll(".publication")
    );

    let publicationChart = null;

    // 取得篩選後的論文
    function getFilteredPublications() {

        const keyword = searchInput.value
            .trim()
            .toLowerCase();

        const selectedYear = yearFilter.value;
        const selectedType = typeFilter.value;

        return publications.filter(function (publication) {

            const title = publication.querySelector("h3")
                .textContent.toLowerCase();

            const authors = publication.querySelector("p")
                .textContent.toLowerCase();

            const year = publication.dataset.year;
            const type = publication.dataset.type;

            const matchSearch =
                title.includes(keyword) ||
                authors.includes(keyword);

            const matchYear =
                selectedYear === "all" ||
                year === selectedYear;

            const matchType =
                selectedType === "all" ||
                type === selectedType;

            return matchSearch && matchYear && matchType;
        });
    }

    // 更新統計圖表
    function updateChart(filtered) {

        const yearlyCounts = {};

        filtered.forEach(function (publication) {
            const year = publication.dataset.year;

            yearlyCounts[year] =
                (yearlyCounts[year] || 0) + 1;
        });

        const years = Object.keys(yearlyCounts).sort();

        const counts = years.map(function (year) {
            return yearlyCounts[year];
        });

        const canvas =
            document.getElementById("publicationChart");

        if (!canvas || typeof Chart === "undefined") return;

        if (publicationChart) {
            publicationChart.destroy();
        }

        publicationChart = new Chart(canvas, {
            type: chartType.value,
            data: {
                labels: years,
                datasets: [{
                    label: "論文數量",
                    data: counts,
                    backgroundColor: "rgba(23, 54, 93, 0.65)",
                    borderColor: "#17365d",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

    // 更新畫面
    function updateDashboard() {

        const filtered = getFilteredPublications();

        publications.forEach(function (publication) {
            publication.hidden = !filtered.includes(publication);
        });

        // 更新論文數量
        publicationCount.textContent = filtered.length;

        // 更新涵蓋年份
        const years = new Set(
            filtered.map(p => p.dataset.year)
        );

        yearCount.textContent = years.size;

        // 沒有符合資料時顯示提示
        noResults.hidden =
            filtered.length > 0 || publications.length === 0;

        updateChart(filtered);
    }

    // 綁定互動事件
    
    // 搜尋行為追蹤：停止輸入 500 毫秒後才記錄
    let searchTimer = null;

    searchInput.addEventListener("input", function () {

        // 原本的搜尋功能
        updateDashboard();

        clearTimeout(searchTimer);

        searchTimer = setTimeout(function () {

            if (window.UITracker && UITracker.isEnabled()) {

                const keyword = searchInput.value.trim();
                const filtered = getFilteredPublications();

                UITracker.track("search", "searchInput", {
                    keyword_length: keyword.length,
                    result_count: filtered.length
                });
            }

        }, 500);
    });

yearFilter.addEventListener("change", function () {

    // 保留原本的年份篩選功能
    updateDashboard();

    // 記錄使用者選擇的年份
    if (window.UITracker && UITracker.isEnabled()) {

        const filtered = getFilteredPublications();

        UITracker.track("filter_change", "yearFilter", {
            selected_year: yearFilter.value,
            result_count: filtered.length
        });
    }
});


 
typeFilter.addEventListener("change", function () {

    // 保留原本的論文類型篩選功能
    updateDashboard();

    // 記錄使用者選擇的論文類型
    if (window.UITracker && UITracker.isEnabled()) {

        const filtered = getFilteredPublications();

        UITracker.track("filter_change", "typeFilter", {
            selected_type: typeFilter.value,
            result_count: filtered.length
        });
    }
});

    
chartType.addEventListener("change", function () {

    // 保留原本的圖表切換功能
    updateDashboard();

    // 記錄使用者切換的圖表類型
    if (window.UITracker && UITracker.isEnabled()) {

        UITracker.track("chart_change", "chartType", {
            selected_chart: chartType.value
        });

    }
});

    // 初次載入
    updateDashboard();
});

document.addEventListener("DOMContentLoaded", function () {

    const projectList = document.getElementById("projectList");

    // 只有主持計畫頁面才執行
    if (!projectList) return;

    const searchInput = document.getElementById("projectSearch");
    const yearFilter = document.getElementById("projectYearFilter");
    const fundingFilter = document.getElementById("fundingFilter");
    const chartType = document.getElementById("projectChartType");

    const projectCount = document.getElementById("projectCount");
    const projectYearCount = document.getElementById("projectYearCount");
    const noResults = document.getElementById("projectNoResults");

    const projects = Array.from(
        projectList.querySelectorAll(".project")
    );

    let projectChart = null;

    // 移除下拉選單的重複選項
    function removeDuplicates(select) {
        const seen = new Set();

        Array.from(select.options).forEach(option => {
            if (option.value === "all") return;

            if (seen.has(option.value)) {
                option.remove();
            } else {
                seen.add(option.value);
            }
        });
    }

    removeDuplicates(yearFilter);
    removeDuplicates(fundingFilter);

    // 更新畫面
    function updateDashboard() {

        const keyword = searchInput.value.trim().toLowerCase();
        const selectedYear = yearFilter.value;
        const selectedFunding = fundingFilter.value;

        const yearlyCounts = {};
        const visibleYears = new Set();

        let count = 0;

        projects.forEach(project => {

            const title = project.querySelector("h3")
                .textContent.toLowerCase();

            const investigator = project.querySelector("p")
                .textContent.toLowerCase();

            const year = project.dataset.year;
            const funding = project.dataset.funding;

            const matchSearch =
                title.includes(keyword) ||
                investigator.includes(keyword);

            const matchYear =
                selectedYear === "all" ||
                year === selectedYear;

            const matchFunding =
                selectedFunding === "all" ||
                funding === selectedFunding;

            const visible =
                matchSearch && matchYear && matchFunding;

            project.hidden = !visible;

            if (visible) {
                count++;
                visibleYears.add(year);

                yearlyCounts[year] =
                    (yearlyCounts[year] || 0) + 1;
            }
        });

        // 更新統計卡片
        projectCount.textContent = count;
        projectYearCount.textContent = visibleYears.size;

        // 無符合資料提示
        noResults.hidden =
            count > 0 || projects.length === 0;

        // 更新圖表
        const years = Object.keys(yearlyCounts).sort();
        const counts = years.map(year => yearlyCounts[year]);

        const canvas = document.getElementById("projectChart");

        if (!canvas || typeof Chart === "undefined") return;

        if (projectChart) {
            projectChart.destroy();
        }

        projectChart = new Chart(canvas, {
            type: chartType.value,
            data: {
                labels: years,
                datasets: [{
                    label: "主持計畫數量",
                    data: counts,
                    backgroundColor: "rgba(23, 54, 93, 0.65)",
                    borderColor: "#17365d",
                    borderWidth: 2,
                    tension: 0.3,
                    fill: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            precision: 0
                        }
                    }
                }
            }
        });
    }

   
    // 主持計畫搜尋行為追蹤
    let projectSearchTimer = null;

    searchInput.addEventListener("input", function () {

        // 保留原本搜尋與圖表更新功能
        updateDashboard();

        // 避免每輸入一個字就記錄一次
        clearTimeout(projectSearchTimer);

        projectSearchTimer = setTimeout(function () {

            if (window.UITracker && UITracker.isEnabled()) {

                const keyword = searchInput.value.trim();

                // 計算目前顯示的計畫數量
                const resultCount = projects.filter(function (project) {
                    return !project.hidden;
                }).length;

                UITracker.track("search", "projectSearch", {
                    keyword_length: keyword.length,
                    result_count: resultCount
                });
            }

        }, 500);
    });

    
yearFilter.addEventListener("change", function () {

    // 保留原本的年份篩選與圖表更新
    updateDashboard();

    // 記錄使用者選擇的年份
    if (window.UITracker && UITracker.isEnabled()) {

        // 計算篩選後顯示的計畫數量
        const resultCount = projects.filter(function (project) {
            return !project.hidden;
        }).length;

        UITracker.track("filter_change", "projectYearFilter", {
            selected_year: yearFilter.value,
            result_count: resultCount
        });
    }
});

    
fundingFilter.addEventListener("change", function () {

    // 保留原本的經費來源篩選功能
    updateDashboard();

    // 記錄使用者選擇的經費來源
    if (window.UITracker && UITracker.isEnabled()) {

        // 計算篩選後顯示的計畫數量
        const resultCount = projects.filter(function (project) {
            return !project.hidden;
        }).length;

        UITracker.track("filter_change", "fundingFilter", {
            selected_funding: fundingFilter.value,
            result_count: resultCount
        });
    }
});

    
chartType.addEventListener("change", function () {

    // 保留原本的圖表切換功能
    updateDashboard();

    // 記錄使用者切換的圖表類型
    if (window.UITracker && UITracker.isEnabled()) {

        UITracker.track("chart_change", "projectChartType", {
            selected_chart: chartType.value
        });

    }
});

    // 網頁載入時先顯示所有統計
    updateDashboard();
});
