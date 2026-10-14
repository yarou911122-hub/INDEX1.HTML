
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
    searchInput.addEventListener("input", updateDashboard);

    yearFilter.addEventListener("change", updateDashboard);

    typeFilter.addEventListener("change", updateDashboard);

    chartType.addEventListener("change", updateDashboard);

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

    searchInput.addEventListener("input", updateDashboard);
    yearFilter.addEventListener("change", updateDashboard);
    fundingFilter.addEventListener("change", updateDashboard);
    chartType.addEventListener("change", updateDashboard);

    // 網頁載入時先顯示所有統計
    updateDashboard();
});
