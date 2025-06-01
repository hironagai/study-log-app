const SUPABASE_URL = 'https://ghsjhzdshkevnjoytxxs.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdoc2poemRzaGtldm5qb3l0eHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDg3NTY0NzQsImV4cCI6MjA2NDMzMjQ3NH0.fqH5r49rfQMDpqF6vSyuotVqCPiY3TLCz38GyMToLAo';

let supabaseClient; // グローバルスコープで宣言のみ行う

document.addEventListener('DOMContentLoaded', async () => {
    
    // supabaseClient の初期化をここで行う
    supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
        auth: {
            persistSession: true, // セッションを永続化する (デフォルトtrue)
            autoRefreshToken: true, // 自動的にトークンをリフレッシュする (デフォルトtrue)
            detectSessionInUrl: true // URL内のセッション情報を検出する (デフォルトtrue)
        }
    });

    // DOM要素の取得 (認証関連)
    const authContainer = document.getElementById('authContainer');
    const appContainer = document.getElementById('appContainer');
    const userAuthIconContainer = document.getElementById('userAuthIconContainer');
    const userIcon = document.getElementById('userIcon');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const userEmailDisplay = document.getElementById('userEmailDisplay');
    const logoutButton = document.getElementById('logoutButton');

    const inviteFriendButton = document.getElementById('inviteFriendButton');
    const qrModal = document.getElementById('qrModal');
    const closeQrModal = document.getElementById('closeQrModal');


    const showSignInButton = document.getElementById('showSignInButton');
    const showSignUpButton = document.getElementById('showSignUpButton');
    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');
    const signInEmailInput = document.getElementById('signInEmail');
    const signInPasswordInput = document.getElementById('signInPassword');
    const signInError = document.getElementById('signInError');
    const signUpEmailInput = document.getElementById('signUpEmail');
    const signUpPasswordInput = document.getElementById('signUpPassword');
    const signUpError = document.getElementById('signUpError');

    const subjectIconContainer = document.getElementById('subjectIconContainer'); // アイコンコンテナ
    const selectedSubjectInput = document.getElementById('selectedSubject'); // 選択された科目を保持するhidden input
    const hoursWheel = document.getElementById('hoursWheel');
    const minutesWheel = document.getElementById('minutesWheel');
    const selectedDurationText = document.getElementById('selectedDurationText');
    const logButton = document.getElementById('logButton');
    const logList = document.getElementById('logList');
    const pieChartCanvas = document.getElementById('studyChart'); // 円グラフ用canvas
    const stackedBarChartCanvas = document.getElementById('stackedBarChart'); // 積み上げ棒グラフ用canvas
    let studyPieChart = null; // 円グラフオブジェクト
    let studyStackedBarChart = null; // 積み上げ棒グラフオブジェクト

    const tabButtons = document.querySelectorAll('.tab-button');
    const tabPanels = document.querySelectorAll('.tab-panel');

    const { data: { session: initialSession }, error: initialSessionError } = await supabaseClient.auth.getSession();

    // 認証状態が確定するまで、関連コンテナを非表示にする
    if (authContainer) authContainer.style.display = 'none';
    if (appContainer) appContainer.style.display = 'none'; // HTMLでデフォルトnoneだが念のため
    if (userAuthIconContainer) userAuthIconContainer.style.display = 'none';


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

    // 認証状態変更の監視
    supabaseClient.auth.onAuthStateChange((event, session) => {
        // console.log('Auth state changed. Event:', event, 'Session:', session);
        if (session && session.user) {
            // ログイン状態
            authContainer.style.display = 'none';
            appContainer.style.display = 'block';
            userAuthIconContainer.style.display = 'block';
            userEmailDisplay.textContent = session.user.email;
            loadLogsAndRenderList();
            if (document.getElementById('chartTab').classList.contains('active')) {
                updateChart();
            }
        } else {
            // 未ログイン状態
            authContainer.style.display = 'flex';
            appContainer.style.display = 'none';
            userAuthIconContainer.style.display = 'none';
            userDropdownMenu.classList.remove('show');
            logList.innerHTML = '';
            if (studyPieChart) studyPieChart.destroy();
            if (studyStackedBarChart) studyStackedBarChart.destroy();
        }
    });

    // ログイン/サインアップフォーム切り替え
    showSignInButton.addEventListener('click', () => {
        signInForm.style.display = 'block';
        signUpForm.style.display = 'none';
        showSignInButton.classList.add('active');
        showSignUpButton.classList.remove('active');
        signInError.textContent = '';
        signUpError.textContent = '';
    });

    showSignUpButton.addEventListener('click', () => {
        signInForm.style.display = 'none';
        signUpForm.style.display = 'block';
        showSignInButton.classList.remove('active');
        showSignUpButton.classList.add('active');
        signInError.textContent = '';
        signUpError.textContent = '';
    });

    // サインアップ処理
    signUpForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signUpEmailInput.value;
        const password = signUpPasswordInput.value;
        signUpError.textContent = '';
        const { data, error } = await supabaseClient.auth.signUp({ email, password });
        if (error) {
            signUpError.textContent = 'エラー: ' + error.message;
        } else {
            alert('認証メール(件名:Confirm your signup)を送信しました。メール内のリンクをクリックしてください。メールが見つからない場合は、迷惑フォルダを確認してください。');
            showSignInButton.click();
            signInEmailInput.value = email;
        }
    });

    // ログイン処理
    signInForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = signInEmailInput.value;
        const password = signInPasswordInput.value;
        signInError.textContent = '';

        const { data, error } = await supabaseClient.auth.signInWithPassword({ email, password });

        if (error) {
            signInError.textContent = 'エラー: ' + error.message;
        }
    });

    // ログアウト処理
    logoutButton.addEventListener('click', async () => {
        const { error } = await supabaseClient.auth.signOut();
        if (error) {
            alert('ログアウトエラー: ' + error.message);
        }
        // ログアウト後にドロップダウンメニューも閉じる
        userDropdownMenu.classList.remove('show');
    });

    if (inviteFriendButton && qrModal) {
        inviteFriendButton.addEventListener('click', () => {
            qrModal.style.display = 'block';
            userDropdownMenu.classList.remove('show'); // モーダル表示時にドロップダウンを閉じる
        });
    }

    if (closeQrModal && qrModal) {
        closeQrModal.addEventListener('click', () => {
            qrModal.style.display = 'none';
        });
    }

    // モーダル背景クリックで閉じる
    if (qrModal) {
        window.addEventListener('click', (event) => {
            if (event.target === qrModal) {
                qrModal.style.display = 'none';
            }
        });
    }

    // ユーザードロップダウン表示切り替え
    userIcon.addEventListener('click', (e) => {
        e.stopPropagation(); // 親要素へのイベント伝播を停止
        userDropdownMenu.classList.toggle('show');
    });

    // ドキュメント全体でのクリックを監視し、ドロップダウン以外がクリックされたら閉じる
    document.addEventListener('click', (e) => {
        if (!userAuthIconContainer.contains(e.target) && userDropdownMenu.classList.contains('show')) {
            userDropdownMenu.classList.remove('show');
        }
    });

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
        let selectedMinute = 0; // 初期値0分
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
        // console.error('ChartDataLabels plugin error');
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

    initializeSubjectIcons(); // 科目アイコンを初期化
    // initializeDurationSlider(); // 勉強時間スライダーを初期化 -> ピッカー初期化に変更
    initializeDurationPicker(); // ドラム式ピッカーを初期化
    loadLogsAndRenderList(); 
    // 初期表示で入力タブがアクティブなので、もしグラフを初めから描画したい場合はここでupdateChart()を呼ぶ
    // ただし、chartTabがアクティブでないと描画されないように updateChart 側で制御する

    logButton.addEventListener('click', async () => {
        const { data: { user } } = await supabaseClient.auth.getUser();
        if (!user) {
            alert('ログインしていません。記録を保存するにはログインしてください。');
            return;
        }

        const subject = selectedSubjectInput.value;
        if (!subject) { alert('科目を選択してください。'); return; }

        const selectedHourItem = hoursWheel.querySelector('.wheel-item.selected-item');
        const selectedMinuteItem = minutesWheel.querySelector('.wheel-item.selected-item');
        let hours = 0;
        let minutes = 0;
        if (selectedHourItem) hours = parseInt(selectedHourItem.dataset.value, 10);
        if (selectedMinuteItem) minutes = parseInt(selectedMinuteItem.dataset.value, 10);
        const durationMinutes = hours * 60 + minutes;

        if (isNaN(durationMinutes) || durationMinutes < 1) { // 1分以上
             alert('1分以上の有効な勉強時間を選択してください。');
             return;
        }

        // Supabaseに保存
        const logEntry = {
            user_id: user.id,
            subject: subject,
            duration_minutes: durationMinutes,
            // logged_at はDBのデフォルトで設定される
        };

        const { data, error } = await supabaseClient.from('study_logs').insert([logEntry]).select();

        if (error) {
            alert('記録の保存に失敗しました: ' + error.message);
        } else if (data && data.length > 0) {
            addLogToList(data[0], true);
            if (document.getElementById('chartTab').classList.contains('active')) {
                updateChart();
            }
            const logTabButton = document.querySelector('.tab-button[data-tab="logTab"]');
            if (logTabButton) logTabButton.click();
        } else {
            alert('記録は保存されましたが、表示の更新に問題が発生しました。');
        }
    });

    async function loadLogsAndRenderList() {
        logList.innerHTML = '';
        const { data: { user } , error: userError } = await supabaseClient.auth.getUser();
        if (userError || !user) {
            return;
        }
        const { data: logs, error } = await supabaseClient
            .from('study_logs')
            .select('*')
            .eq('user_id', user.id)
            .order('logged_at', { ascending: false });

        if (error) {
            // alert('記録の読み込みに失敗しました: ' + error.message);
        } else {
            logs.forEach(log => addLogToList(log, false));
        }
    }

    function addLogToList(log, prepend = false) { // DBからのデータ形式に合わせて調整、prepend パラメータ追加
        // 既に同じIDの要素が存在する場合は追加しない
        const existingItem = logList.querySelector(`.log-card[data-log-id="${log.id}"]`);
        if (existingItem) {
            return; // 既に存在する場合は何もしない
        }

        const li = document.createElement('li');
        li.classList.add('log-card');
        li.dataset.logId = log.id; // DBのidを使用

        const loggedDateTime = new Date(log.logged_at); // カラム名を修正
        const month = loggedDateTime.getMonth() + 1;
        const day = loggedDateTime.getDate();
        const dayOfWeekIndex = loggedDateTime.getDay();
        const daysOfWeek = ["日", "月", "火", "水", "木", "金", "土"];
        const dayOfWeek = daysOfWeek[dayOfWeekIndex];
        const hours = loggedDateTime.getHours();
        const minutes = loggedDateTime.getMinutes();
        const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        
        // duration_minutes はそのまま分なので、表示用にフォーマット
        let durationText = formatDuration(log.duration_minutes); // 既存のフォーマット関数を利用

        const subjectObject = defaultSubjects.find(s => s.name === log.subject);
        const subjectIndex = subjectObject ? defaultSubjects.indexOf(subjectObject) : -1;
        const cardSubjectBorderColor = subjectIndex !== -1 ? subjectColors[subjectIndex] : 'rgba(0,0,0,1)';
        const cardSubjectBackgroundColor = subjectIndex !== -1 ? subjectBackgroundColors[subjectIndex] : 'rgba(169, 169, 169, 0.7)';
        
        li.innerHTML = `
            <div class="log-card-header">
                <span class="log-date">${month}/${day}(${dayOfWeek})</span>
                <span class="log-time">${formattedTime}</span>
            </div>
            <div class="log-card-body">
                <span class="log-subject" style="border-color: ${cardSubjectBorderColor}; background-color: ${cardSubjectBackgroundColor}; color: black;">${log.subject}</span>
                <span class="log-duration">${durationText}</span>
            </div>
            <button class="delete-log-button">×</button>
        `;

        const deleteButton = li.querySelector('.delete-log-button');
        deleteButton.onclick = async function () { // async追加
            await deleteLogFromSupabase(log.id); // Supabaseからの削除に変更
        };

        if (prepend && logList.firstChild) {
            logList.insertBefore(li, logList.firstChild);
        } else {
            logList.appendChild(li);
        }
    }

    async function deleteLogFromSupabase(logId) { // 関数名を変更し、asyncに
        const { error } = await supabaseClient
            .from('study_logs')
            .delete()
            .match({ id: logId });

        if (error) {
            alert('記録の削除に失敗しました: ' + error.message);
        } else {
            await loadLogsAndRenderList();
            if (document.getElementById('chartTab').classList.contains('active')) {
                updateChart();
            }
        }
    }
    
    function aggregatePieChartData(logs) {
        const aggregatedData = {};
        logs.forEach(log => {
            if (aggregatedData[log.subject]) {
                aggregatedData[log.subject] += log.duration_minutes;
            } else {
                aggregatedData[log.subject] = log.duration_minutes;
            }
        });
        return aggregatedData;
    }

    function aggregateStackedBarData(logs) {
        const last7Days = [];
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            last7Days.push(date.toISOString().split('T')[0]);
        }

        const dailyData = {};
        logs.forEach(log => {
            const dateStr = new Date(log.logged_at).toISOString().split('T')[0];
            if (!last7Days.includes(dateStr)) {
                return; 
            }
            if (!dailyData[dateStr]) dailyData[dateStr] = {};
            if (!dailyData[dateStr][log.subject]) dailyData[dateStr][log.subject] = 0;
            dailyData[dateStr][log.subject] += log.duration_minutes;
        });

        const datasets = defaultSubjects.map((subjectObj, index) => {
            return {
                label: subjectObj.name,
                data: last7Days.map(date => (dailyData[date] && dailyData[date][subjectObj.name]) || 0),
                backgroundColor: subjectBackgroundColors[index],
                borderColor: subjectColors[index],
                borderWidth: 1
            };
        }).filter(dataset => dataset.data.some(d => d > 0));
        
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

        const currentSubjectIndices = subjects.map(s => defaultSubjects.findIndex(ds => ds.name === s));
        const currentGraphBorderColors = currentSubjectIndices.map(index => index !== -1 ? subjectColors[index] : 'rgba(169, 169, 169, 1)');
        const currentGraphBackgroundColors = currentSubjectIndices.map(index => index !== -1 ? subjectBackgroundColors[index] : 'rgba(169, 169, 169, 0.7)');

        const chartData = {
            labels: subjects,
            datasets: [{
                label: '勉強時間 (分)',
                data: durations,
                backgroundColor: currentGraphBackgroundColors,
                borderColor: currentGraphBorderColors,
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
                            if (context.parsed !== null) {
                                const subjectLabel = context.label; // 科目名
                                const durationMinutes = context.parsed; // この項目の勉強時間（分）
                                const formattedDuration = formatDuration(durationMinutes); // 既存の関数でフォーマット

                                const totalMinutesAllSubjects = context.dataset.data.reduce((acc, val) => acc + val, 0);
                                const percentage = ((durationMinutes / totalMinutesAllSubjects) * 100).toFixed(1) + '%';
                                // 表示を「科目名: X時間Y分 (Z%)」の形式にする
                                return `${subjectLabel}: ${formattedDuration} (${percentage})`;
                            }
                            return ''; // データがない場合は空文字
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
                            return tooltipItems[0].label; // 日付をタイトルとして表示
                        },
                        label: function(context) {
                            const subjectLabel = context.dataset.label; // 科目名
                            const durationMinutes = context.raw; // このデータセットのこの日付の勉強時間（分）
                            if (durationMinutes === null || typeof durationMinutes === 'undefined' || durationMinutes === 0) {
                                return null; // 時間が0または無効な場合はツールチップに表示しない
                            }
                            const formattedDuration = formatDuration(durationMinutes);
                            return `${subjectLabel}: ${formattedDuration}`;
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

    async function updateChart() { // async に変更
        if (document.getElementById('chartTab').classList.contains('active')) {
            const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
            if (userError || !user) {
                 if (studyPieChart) studyPieChart.destroy();
                 if (studyStackedBarChart) studyStackedBarChart.destroy();
                return;
            }

            const { data: logs, error } = await supabaseClient
                .from('study_logs')
                .select('*')
                .eq('user_id', user.id)
                .order('logged_at', { ascending: false });

            if (error) {
                 if (studyPieChart) studyPieChart.destroy();
                 if (studyStackedBarChart) studyStackedBarChart.destroy();
            } else {
                renderStackedBarChart(logs);
                renderPieChart(logs);
            }
        }
    }

    // 初期表示時にタブの状態をリセットする (入力タブをデフォルトアクティブに)
    tabButtons.forEach(btn => btn.classList.remove('active'));
    document.querySelector('.tab-button[data-tab="inputTab"]').classList.add('active');
    tabPanels.forEach(panel => panel.classList.remove('active'));
    document.getElementById('inputTab').classList.add('active');

    let newWorker;
    window.addEventListener('load', () => {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/service-worker.js')
                .then(registration => {
                    console.log('ServiceWorker registration successful with scope: ', registration.scope);

                    registration.onupdatefound = () => {
                        newWorker = registration.installing;
                        if (newWorker == null) {
                            return;
                        }
                        newWorker.onstatechange = () => {
                            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                // 新しいService Workerがインストールされたが、まだ待機中
                                // ここでユーザーに通知UIを表示するなどの処理を行う
                                if (confirm('新しいバージョンがあります。アプリを更新しますか？')) {
                                    newWorker.postMessage({ action: 'skipWaiting' });
                                }
                            }
                        };
                    };
                })
                .catch(error => {
                    console.log('ServiceWorker registration failed: ', error);
                });

            navigator.serviceWorker.oncontrollerchange = () => {
                // Service Workerが更新されたらページをリロードして新しいコンテンツを読み込む
                console.log('Controller changed, reloading page.');
                window.location.reload();
            };
        }
    });
}); 