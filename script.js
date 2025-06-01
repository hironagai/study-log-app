document.addEventListener('DOMContentLoaded', () => {
    // const subjectInput = document.getElementById('subject'); // inputからselectに変更したので不要
    // const subjectSelect = document.getElementById('subjectSelect'); // select要素を取得 → アイコン選択に変更
    const subjectIconContainer = document.getElementById('subjectIconContainer'); // アイコンコンテナ
    const selectedSubjectInput = document.getElementById('selectedSubject'); // 選択された科目を保持するhidden input
    // const durationInput = document.getElementById('duration'); // selectに変更したので不要
    // const durationSlider = document.getElementById('durationSlider'); // スライダー要素を取得 -> ピッカーに変更
    // const selectedDurationDisplay = document.getElementById('selectedDurationDisplay'); // スライダーの値表示用span -> ピッカー用に変更
    const hoursWheel = document.getElementById('hoursWheel');
    const minutesWheel = document.getElementById('minutesWheel');
    const selectedDurationText = document.getElementById('selectedDurationText');
    const logButton = document.getElementById('logButton');
    const logList = document.getElementById('logList');
    const pieChartCanvas = document.getElementById('studyChart'); // 円グラフ用canvas
    const stackedBarChartCanvas = document.getElementById('stackedBarChart'); // 積み上げ棒グラフ用canvas
    // const chartTypeRadios = document.querySelectorAll('input[name="chartType"]'); // 削除
    let studyPieChart = null; // 円グラフオブジェクト
    let studyStackedBarChart = null; // 積み上げ棒グラフオブジェクト

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    const defaultSubjects = [
        { name: "国語", icon: "fas fa-book" },
        { name: "数学", icon: "fas fa-calculator" },
        { name: "理科", icon: "fas fa-flask" },
        { name: "社会", icon: "fas fa-landmark" },
        { name: "英語", icon: "fas fa-language" },
        { name: "プログラミング", icon: "fas fa-laptop-code" },
        { name: "資格勉強", icon: "fas fa-user-graduate" },
        { name: "読書", icon: "fas fa-book-open" },
        { name: "その他", icon: "fas fa-ellipsis-h" }
    ];
    // 各科目に割り当てる色の配列 (グラフのborderColorと対応させる)
    const subjectColors = [
        'rgba(255, 99, 132, 1)',  // 国語 (赤系)
        'rgba(54, 162, 235, 1)',  // 数学 (青系)
        'rgba(75, 192, 192, 1)',  // 理科 (緑系)
        'rgba(255, 206, 86, 1)',  // 社会 (黄系)
        'rgba(153, 102, 255, 1)', // 英語 (紫系)
        'rgba(255, 159, 64, 1)',  // プログラミング (オレンジ系)
        'rgba(60, 179, 113, 1)',   // 資格勉強 (シーグリーン)
        'rgba(218, 112, 214, 1)', // 読書 (オーキッド)
        'rgba(169, 169, 169, 1)'   // その他 (ダークグレイ)
    ];
    // グラフの背景色は、上記の色に透明度を加えたものを使用
    const subjectBackgroundColors = subjectColors.map(color => color.replace(', 1)', ', 0.7)'));

    const defaultDurations = [
        { text: "15分", value: 15 },
        { text: "30分", value: 30 },
        { text: "45分", value: 45 },
        { text: "1時間", value: 60 },
        { text: "1時間30分", value: 90 },
        { text: "2時間", value: 120 },
        { text: "2時間30分", value: 150 },
        { text: "3時間", value: 180 },
    ];

    function generateRandomPastTimestamp(daysAgo) {
        const now = new Date();
        const pastDate = new Date(now);
        pastDate.setDate(now.getDate() - daysAgo);
        // 時間は0時から23時までランダム
        pastDate.setHours(Math.floor(Math.random() * 24));
        pastDate.setMinutes(Math.floor(Math.random() * 60));
        pastDate.setSeconds(Math.floor(Math.random() * 60));
        return pastDate.toISOString();
    }

    function generateSampleLogs() {
        const logs = [];
        let currentId = Date.now();
        const numberOfDays = 365;

        for (let i = 0; i < numberOfDays; i++) {
            const recordsPerDay = Math.floor(Math.random() * 4); // 0から3件の記録/日
            for (let j = 0; j < recordsPerDay; j++) {
                const randomSubjectIndex = Math.floor(Math.random() * defaultSubjects.length);
                const subject = defaultSubjects[randomSubjectIndex].name;

                // 15分から180分まで、15分刻みでランダム
                const randomDurationStep = Math.floor(Math.random() * (180/15 - 15/15 + 1)) + (15/15);
                const durationMinutes = randomDurationStep * 15;

                logs.push({
                    id: currentId--,
                    subject: subject,
                    loggedAt: generateRandomPastTimestamp(i),
                    duration: durationMinutes * 60 // 秒単位で保存
                });
            }
        }
        // ログを時系列順（古いものが先）にソートする（任意だが、ID生成順とは逆なので表示に影響するかも）
        // logs.sort((a, b) => new Date(a.loggedAt) - new Date(b.loggedAt)); 
        // IDを振り直す場合
        // logs.forEach((log, index) => log.id = Date.now() - (logs.length - index) * 1000);
        return logs;
    }

    const sampleLogs = generateSampleLogs();

    // 科目選択プルダウンの初期化 -> 科目アイコンの初期化に変更
    function initializeSubjectIcons() {
        subjectIconContainer.innerHTML = ''; // コンテナをクリア
        defaultSubjects.forEach(subject => {
            const iconDiv = document.createElement('div');
            iconDiv.classList.add('subject-icon');
            iconDiv.dataset.subjectName = subject.name; // 科目名をdata属性に保持

            const iconElement = document.createElement('i');
            iconElement.className = subject.icon; // Font Awesomeのクラスを設定

            const nameSpan = document.createElement('span');
            nameSpan.textContent = subject.name;

            iconDiv.appendChild(iconElement);
            iconDiv.appendChild(nameSpan);

            iconDiv.addEventListener('click', () => {
                // 他のアイコンの選択状態を解除
                document.querySelectorAll('.subject-icon.selected').forEach(selectedIcon => {
                    selectedIcon.classList.remove('selected');
                });
                // クリックされたアイコンを選択状態にする
                iconDiv.classList.add('selected');
                selectedSubjectInput.value = subject.name; // hidden inputに値を設定
            });
            subjectIconContainer.appendChild(iconDiv);
        });

        // 初期選択 (例: 最初の科目をデフォルトで選択状態にする)
        if (defaultSubjects.length > 0 && subjectIconContainer.firstChild) {
            const firstIcon = subjectIconContainer.firstChild;
            firstIcon.classList.add('selected');
            selectedSubjectInput.value = firstIcon.dataset.subjectName;
        }
    }

    function formatDuration(totalMinutes) {
        const h = Math.floor(totalMinutes / 60);
        const m = totalMinutes % 60;
        let text = "";
        if (h > 0) text += `${h}時間`;
        if (m > 0) text += `${m}分`;
        return text || "0分";
    }

    function initializeDurationPicker() {
        const maxHours = 23; // 最大23時間まで
        const minuteStep = 5; // 5分刻み
        const itemHeight = 40; // CSSで設定した .wheel-item の高さ
        const pickerHeight = 150; // CSSで設定した .duration-picker-container の高さ

        let selectedHour = 0;    // 初期値0時間
        let selectedMinute = 15; // 初期値15分
        let isSnappingHours = false; // 時間ホイールのスナップ処理中フラグ
        let isSnappingMinutes = false; // 分ホイールのスナップ処理中フラグ

        function populateWheel(wheelElement, max, step, unit, isHoursWheel) {
            // スクロール位置調整のため、上下にダミー要素を追加
            const paddingTop = (pickerHeight / 2) - (itemHeight / 2);
            for (let i = 0; i < Math.floor(paddingTop / itemHeight); i++) {
                const paddingItem = document.createElement('div');
                paddingItem.classList.add('wheel-item', 'padding-item');
                paddingItem.style.height = `${itemHeight}px`;
                wheelElement.appendChild(paddingItem);
            }

            for (let i = 0; i <= max; i += (isHoursWheel ? 1 : step)) {
                const item = document.createElement('div');
                item.classList.add('wheel-item');
                item.textContent = `${i}${unit}`;
                item.dataset.value = i;
                wheelElement.appendChild(item);
            }
            // 下部パディング
            for (let i = 0; i < Math.floor(paddingTop / itemHeight); i++) {
                const paddingItem = document.createElement('div');
                paddingItem.classList.add('wheel-item', 'padding-item');
                paddingItem.style.height = `${itemHeight}px`;
                wheelElement.appendChild(paddingItem);
            }
        }

        populateWheel(hoursWheel, maxHours, 1, "時間", true);
        populateWheel(minutesWheel, 55, minuteStep, "分", false); // 0, 5, ..., 55

        function updateSelectedDurationText() {
            const totalMinutes = selectedHour * 60 + selectedMinute;
            selectedDurationText.textContent = formatDuration(totalMinutes);
        }
        
        function snapToItem(wheelWrapper, wheel) {
            let isSnapping, setIsSnapping;
            if (wheel.id === 'hoursWheel') {
                if (isSnappingHours) return;
                isSnappingHours = true;
                isSnapping = isSnappingHours;
                setIsSnapping = (val) => { isSnappingHours = val; };
            } else { // minutesWheel
                if (isSnappingMinutes) return;
                isSnappingMinutes = true;
                isSnapping = isSnappingMinutes;
                setIsSnapping = (val) => { isSnappingMinutes = val; };
            }

            const currentScrollTop = wheelWrapper.scrollTop;
            const pickerCenterY = currentScrollTop + pickerHeight / 2;

            let closestItemIndex = -1;
            let minDistance = Infinity;

            const items = Array.from(wheel.querySelectorAll('.wheel-item:not(.padding-item)'));

            if (items.length === 0) {
                setIsSnapping(false);
                return;
            }

            items.forEach((item, index) => {
                const itemTopInWheel = item.offsetTop - wheel.offsetTop;
                const itemCenterInWheel = itemTopInWheel + itemHeight / 2;
                const distance = Math.abs(itemCenterInWheel - pickerCenterY);

                if (distance < minDistance) {
                    minDistance = distance;
                    closestItemIndex = index;
                }
            });

            if (closestItemIndex === -1) {
                // 通常ここには来ないはずだが、念のため最初のアイテムを選択するなどのフォールバック
                closestItemIndex = 0; 
                if (items.length === 0) { // itemsが空なら何もしない (上でチェック済みだが二重チェック)
                     setIsSnapping(false);
                     return;
                }
            }
            
            const targetItem = items[closestItemIndex];
            if (!targetItem) { // targetItem が存在しない場合 (ほぼありえないが念のため)
                setIsSnapping(false);
                return;
            }

            const targetItemTopInWheel = targetItem.offsetTop - wheel.offsetTop;
            const newScrollTop = targetItemTopInWheel + itemHeight / 2 - pickerHeight / 2;

            wheelWrapper.scrollTop = newScrollTop;

            // スナップ後の選択状態を更新
            const allWheelItems = Array.from(wheel.querySelectorAll('.wheel-item')); // paddingアイテムも含む
            allWheelItems.forEach(item => item.classList.remove('selected-item'));
            targetItem.classList.add('selected-item');

            if (wheel.id === 'hoursWheel') {
                selectedHour = parseInt(targetItem.dataset.value, 10);
            } else if (wheel.id === 'minutesWheel') {
                selectedMinute = parseInt(targetItem.dataset.value, 10);
            }
            updateSelectedDurationText();
            
            setTimeout(() => {
                setIsSnapping(false);
            }, 50); // 短い遅延の後フラグを解除
        }
        
        [hoursWheel.parentElement, minutesWheel.parentElement].forEach(wrapper => {
            let scrollTimeout;
            wrapper.addEventListener('scroll', () => {
                const wheel = wrapper.querySelector('.wheel');
                // スナップ処理中は新たなsetTimeoutを設定しない
                if ((wheel.id === 'hoursWheel' && isSnappingHours) || (wheel.id === 'minutesWheel' && isSnappingMinutes)) {
                    return;
                }

                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    snapToItem(wrapper, wheel);
                }, 150); // スクロール停止後150msでスナップ
            });
        });

        // 初期選択状態の設定
        function setInitialSelection(wheelWrapper, wheel, initialValue, unit) {
            const items = Array.from(wheel.querySelectorAll('.wheel-item:not(.padding-item)'));
            const allWheelItems = Array.from(wheel.querySelectorAll('.wheel-item'));

            const initialItem = items.find(item => parseInt(item.dataset.value, 10) === initialValue);
            if (initialItem) {
                allWheelItems.forEach(item => item.classList.remove('selected-item'));
                initialItem.classList.add('selected-item');

                const initialItemTopInWheel = initialItem.offsetTop - wheel.offsetTop;
                const initialScrollTop = initialItemTopInWheel - (pickerHeight / 2) + (itemHeight/2);
                
                // scrollTopの変更がscrollイベントをトリガーする可能性があるため、
                // 初期設定時は一時的にフラグを立てて、意図しないsnapToItemの連鎖を防ぐ
                let setIsSnappingOnInit = () => {};
                if (wheel.id === 'hoursWheel') { isSnappingHours = true; setIsSnappingOnInit = (val) => { isSnappingHours = val; }; }
                else { isSnappingMinutes = true; setIsSnappingOnInit = (val) => { isSnappingMinutes = val; }; }

                wheelWrapper.scrollTop = initialScrollTop;

                if (wheel.id === 'hoursWheel') {
                    selectedHour = parseInt(initialItem.dataset.value, 10);
                } else if (wheel.id === 'minutesWheel') {
                    selectedMinute = parseInt(initialItem.dataset.value, 10);
                }
                updateSelectedDurationText();

                // scrollTop設定によるscrollイベントとsnapToItem呼び出しが落ち着くのを待ってフラグを解除
                setTimeout(() => {
                    setIsSnappingOnInit(false);
                    // 初期スクロール後に再度スナップを強制して位置を確定させる (任意)
                    // snapToItem(wheelWrapper, wheel);
                }, 200); // scrollTimeout (150ms) より少し長く待つ
            }
        }

        setInitialSelection(hoursWheel.parentElement, hoursWheel, selectedHour, "時間");
        setInitialSelection(minutesWheel.parentElement, minutesWheel, selectedMinute, "分");
        updateSelectedDurationText(); // 初期表示
    }

    // プラグインをグローバルに登録
    if (typeof ChartDataLabels !== 'undefined') {
        Chart.register(ChartDataLabels);
    } else {
        console.error('ChartDataLabels plugin error');
    }

    // タブ切り替え機能
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            tabButtons.forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            const targetTab = button.dataset.tab;
            tabPanels.forEach(panel => {
                if (panel.id === targetTab) {
                    panel.classList.add('active');
                    if (targetTab === 'chartTab') { // 円グラフタブが表示されたらグラフを更新
                        updateChart();
                    }
                } else {
                    panel.classList.remove('active');
                }
            });
        });
    });

    function addSampleDataIfNeeded() {
        const logs = getLogsFromStorage();
        if (logs.length === 0) {
            localStorage.setItem('studyLogs', JSON.stringify(sampleLogs));
        }
    }

    initializeSubjectIcons(); // 科目アイコンを初期化
    // initializeDurationSlider(); // 勉強時間スライダーを初期化 -> ピッカー初期化に変更
    initializeDurationPicker(); // ドラム式ピッカーを初期化
    addSampleDataIfNeeded(); 
    loadLogsAndRenderList(); 
    // 初期表示で入力タブがアクティブなので、もしグラフを初めから描画したい場合はここでupdateChart()を呼ぶ
    // ただし、chartTabがアクティブでないと描画されないように updateChart 側で制御する

    logButton.addEventListener('click', () => {
        const subject = selectedSubjectInput.value; 
        if (!subject) { alert('科目を選択してください。'); return; }
        
        // ピッカーから値を取得
        const selectedHourItem = hoursWheel.querySelector('.wheel-item.selected-item');
        const selectedMinuteItem = minutesWheel.querySelector('.wheel-item.selected-item');

        let hours = 0;
        let minutes = 0;

        if (selectedHourItem) {
            hours = parseInt(selectedHourItem.dataset.value, 10);
        }
        if (selectedMinuteItem) {
            minutes = parseInt(selectedMinuteItem.dataset.value, 10);
        }

        const durationMinutes = hours * 60 + minutes;

        if (isNaN(durationMinutes) || durationMinutes < 15) { // 最小15分とする（0分記録を防ぐ）
             alert('15分以上の有効な勉強時間を選択してください。'); 
             return; 
        }
        const now = new Date();
        const log = { id: Date.now(), subject: subject, loggedAt: now.toISOString(), duration: durationMinutes * 60 };
        saveLog(log);
        addLogToList(log);
        // 記録追加時に、もし円グラフタブが表示されていれば更新する
        if (document.getElementById('chartTab').classList.contains('active')) {
            updateChart();
        }

        // 「記録一覧」タブに移動
        const logTabButton = document.querySelector('.tab-button[data-tab="logTab"]');
        if (logTabButton) {
            logTabButton.click(); // プログラムからクリックイベントを発火
        }
    });

    function saveLog(log) {
        const logs = getLogsFromStorage();
        logs.push(log);
        localStorage.setItem('studyLogs', JSON.stringify(logs));
    }

    function loadLogsAndRenderList() { // 関数名変更
        logList.innerHTML = '';
        const logs = getLogsFromStorage();
        logs.forEach(log => addLogToList(log));
        // renderChart(logs); // 初期表示ではグラフ描画しない
    }

    function getLogsFromStorage() {
        const logsJSON = localStorage.getItem('studyLogs');
        return logsJSON ? JSON.parse(logsJSON) : [];
    }

    function addLogToList(log) {
        const li = document.createElement('li');
        li.classList.add('log-card');
        li.dataset.logId = log.id;

        const loggedDateTime = new Date(log.loggedAt);
        const month = loggedDateTime.getMonth() + 1;
        const day = loggedDateTime.getDate();
        const dayOfWeekIndex = loggedDateTime.getDay(); // 曜日を数値で取得 (0:日曜, 1:月曜, ...)
        const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
        const dayOfWeek = daysOfWeek[dayOfWeekIndex]; // 数値を曜日の文字列に変換

        const hours = loggedDateTime.getHours();
        const minutes = loggedDateTime.getMinutes();
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

        const durationHours = Math.floor(log.duration / 3600);
        const durationMinutes = Math.floor((log.duration % 3600) / 60);
        let durationText = "";
        if (durationHours > 0) { durationText += `${durationHours}時間`; }
        if (durationMinutes > 0) { durationText += `${durationMinutes}分`; }
        if (durationText === "") { durationText = "0分"; }

        const subjectObject = defaultSubjects.find(s => s.name === log.subject);
        const subjectIndex = subjectObject ? defaultSubjects.indexOf(subjectObject) : -1;
        const cardSubjectBorderColor = subjectIndex !== -1 ? subjectColors[subjectIndex] : 'rgba(0,0,0,1)';
        const cardSubjectBackgroundColor = subjectIndex !== -1 ? subjectBackgroundColors[subjectIndex] : 'rgba(169, 169, 169, 0.7)';
        const cardSubjectTextColor = 'black';

        // カードの内部構造を作成
        li.innerHTML = `
            <div class="log-card-header">
                <span class="log-date">${month}/${day}(${dayOfWeek})</span>
                <span class="log-time">${formattedTime}</span>
            </div>
            <div class="log-card-body">
                <span class="log-subject" style="border-color: ${cardSubjectBorderColor}; background-color: ${cardSubjectBackgroundColor}; color: ${cardSubjectTextColor};">${log.subject}</span>
                <span class="log-duration">${durationText}</span>
            </div>
            <button class="delete-log-button">×</button>
        `;

        const deleteButton = li.querySelector('.delete-log-button');
        deleteButton.onclick = function () {
            deleteLog(log.id);
        };

        if (logList.firstChild) {
            logList.insertBefore(li, logList.firstChild);
        } else {
            logList.appendChild(li);
        }
    }

    function deleteLog(logId) {
        let logs = getLogsFromStorage();
        logs = logs.filter(log => log.id !== logId);
        localStorage.setItem('studyLogs', JSON.stringify(logs));
        loadLogsAndRenderList(); // リストのみ再描画
        // 削除時に、もし円グラフタブが表示されていれば更新する
        if (document.getElementById('chartTab').classList.contains('active')) {
            updateChart();
        }
    }

    function aggregatePieChartData(logs) {
        const aggregatedData = {};
        logs.forEach(log => {
            const durationMinutes = log.duration / 60;
            if (aggregatedData[log.subject]) {
                aggregatedData[log.subject] += durationMinutes;
            } else {
                aggregatedData[log.subject] = durationMinutes;
            }
        });
        return aggregatedData;
    }

    function aggregateStackedBarData(logs) {
        // 1. 直近1週間の日付配列を生成 (YYYY-MM-DD形式)
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        // 2. ログデータを日付ごとに集計 (既存のロジックを活用)
        const dailyData = {}; // { 'YYYY-MM-DD': { '科目A': totalMinutes, '科目B': totalMinutes } }
        logs.forEach(log => {
            const dateStr = new Date(log.loggedAt).toISOString().split('T')[0];
            // 過去7日間より古いデータは集計対象外とする (任意だが、表示範囲と合わせるため)
            if (!last7Days.includes(dateStr)) {
                return; 
            }
            const durationMinutes = log.duration / 60;
            if (!dailyData[dateStr]) dailyData[dateStr] = {};
            if (!dailyData[dateStr][log.subject]) dailyData[dateStr][log.subject] = 0;
            dailyData[dateStr][log.subject] += durationMinutes;
        });

        // 3. 科目ごとのデータセットを作成 (X軸はlast7Daysを基準にする)
        const datasets = defaultSubjects.map((subjectObj, index) => { // subject -> subjectObj
            return {
                label: subjectObj.name, // subject.name を使用
                data: last7Days.map(date => (dailyData[date] && dailyData[date][subjectObj.name]) || 0),
                backgroundColor: subjectBackgroundColors[index],
                borderColor: subjectColors[index],
                borderWidth: 1
            };
        }).filter(dataset => dataset.data.some(d => d > 0)); // 1週間を通じてデータが全て0の科目は除外
        
        return { labels: last7Days, datasets: datasets };
    }

    function renderPieChart(logs) {
        const aggregatedData = aggregatePieChartData(logs);
        const subjects = Object.keys(aggregatedData);
        const durations = Object.values(aggregatedData);

        if (studyPieChart) {
            studyPieChart.destroy();
        }

        if (subjects.length === 0) {
            if (pieChartCanvas.getContext('2d')){
                 const ctx = pieChartCanvas.getContext('2d');
                 ctx.clearRect(0, 0, pieChartCanvas.width, pieChartCanvas.height);
            }
            return;
        }

        const currentSubjectIndices = subjects.map(s => defaultSubjects.findIndex(ds => ds.name === s)); // 変更: defaultSubjectsがオブジェクトの配列になったため
        const currentGraphBorderColors = currentSubjectIndices.map(index => index !== -1 ? subjectColors[index] : 'rgba(169, 169, 169, 1)');
        const currentGraphBackgroundColors = currentSubjectIndices.map(index => index !== -1 ? subjectBackgroundColors[index] : 'rgba(169, 169, 169, 0.7)');

        const chartData = {
            labels: subjects,
            datasets: [{
                label: '勉強時間 (分)',
                data: durations,
                backgroundColor: currentGraphBackgroundColors, // 動的に割り当てた背景色
                borderColor: currentGraphBorderColors,       // 動的に割り当てた枠線色
                borderWidth: 1
            }]
        };

        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            let label = context.dataset.label || '';
                            if (label) {
                                label += ': ';
                            }
                            if (context.parsed !== null) {
                                const total = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = ((context.parsed / total) * 100).toFixed(1) + '%';
                                label = `${context.label}: ${context.parsed} 分 (${percentage})`;
                            }
                            return label;
                        }
                    }
                },
                datalabels: {
                    display: function(context) {
                        return context.dataset.data[context.dataIndex] > 0;
                    },
                    formatter: (value, context) => {
                        const total = context.chart.data.datasets[0].data.reduce((acc, val) => acc + val, 0);
                        const percentage = ((value / total) * 100).toFixed(1) + '%';
                        return percentage;
                    },
                    color: '#fff',
                    font: function(context) {
                        let size = 14;
                        return {
                            weight: 'bold',
                            size: size
                        };
                    },
                    anchor: 'center',
                    align: 'center',
                    textStrokeColor: 'black',
                    textStrokeWidth: 2,
                    backgroundColor: 'rgba(0, 0, 0, 0.5)',
                    borderRadius: 4,
                    padding: {
                        top: 2,
                        bottom: 2,
                        left: 4,
                        right: 4
                    }
                }
            }
        };

        studyPieChart = new Chart(pieChartCanvas, {
            type: 'pie',
            data: chartData,
            options: chartOptions
        });
    }

    function renderStackedBarChart(logs) {
        const chartData = aggregateStackedBarData(logs);
        if (studyStackedBarChart) {
            studyStackedBarChart.destroy();
        }
        if (chartData.labels.length === 0) {
            if (stackedBarChartCanvas.getContext('2d')) {
                const ctx = stackedBarChartCanvas.getContext('2d');
                ctx.clearRect(0, 0, stackedBarChartCanvas.width, stackedBarChartCanvas.height);
            }
            return;
        }
        
        const chartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    stacked: true,
                    title: {
                        display: true,
                        text: '日付'
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: '勉強時間 (分)',
                        beginAtZero: true
                    }
                }
            },
            plugins: {
                legend: {
                    position: 'bottom'
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    callbacks: {
                        title: function(tooltipItems) {
                            return tooltipItems[0].label;
                        },
                        label: function(context) {
                            return `${context.dataset.label}: ${context.raw} 分`;
                        }
                    }
                },
                datalabels: {
                    display: false
                }
            }
        };
        studyStackedBarChart = new Chart(stackedBarChartCanvas, {
            type: 'bar',
            data: chartData,
            options: chartOptions
        });
    }

    function updateChart() {
        if (document.getElementById('chartTab').classList.contains('active')) {
            const logs = getLogsFromStorage();
            renderStackedBarChart(logs);
            renderPieChart(logs);
        }
    }
}); 