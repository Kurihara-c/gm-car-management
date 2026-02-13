// 代車データの配列
let cars = [];

// 預かり車両データの配列
let storedVehicles = [];

// 入出庫履歴の配列
let checkInOutHistory = [];

// 貸出履歴の配列
let loanHistory = [];

// LocalStorageからデータを読み込み
function loadCars() {
    const savedCars = localStorage.getItem('cars');
    if (savedCars) {
        cars = JSON.parse(savedCars);
    }
}

// LocalStorageにデータを保存
function saveCars() {
    localStorage.setItem('cars', JSON.stringify(cars));
}

// 預かり車両データの読み込み
function loadStoredVehicles() {
    const saved = localStorage.getItem('storedVehicles');
    if (saved) {
        storedVehicles = JSON.parse(saved);
    }
}

// 預かり車両データの保存
function saveStoredVehicles() {
    localStorage.setItem('storedVehicles', JSON.stringify(storedVehicles));
}

// 入出庫履歴の読み込み
function loadCheckInOutHistory() {
    const saved = localStorage.getItem('checkInOutHistory');
    if (saved) {
        checkInOutHistory = JSON.parse(saved);
    }
}

// 入出庫履歴の保存
function saveCheckInOutHistory() {
    localStorage.setItem('checkInOutHistory', JSON.stringify(checkInOutHistory));
}

// 貸出履歴の読み込み
function loadLoanHistory() {
    const saved = localStorage.getItem('loanHistory');
    if (saved) {
        loanHistory = JSON.parse(saved);
    }
}

// 貸出履歴の保存
function saveLoanHistory() {
    localStorage.setItem('loanHistory', JSON.stringify(loanHistory));
}

// 代車を追加
function addCar(carModel, carNumber, inspectionDate, status = 'available') {
    const newCar = {
        id: Date.now(),
        carModel: carModel,
        carNumber: carNumber,
        inspectionDate: inspectionDate,
        status: status
    };
    cars.push(newCar);
    saveCars();
    displayCars(currentFilter);
}

// 代車を編集
function editCar(id, carModel, carNumber, inspectionDate, status) {
    const car = cars.find(c => c.id === id);
    if (car) {
        car.carModel = carModel;
        car.carNumber = carNumber;
        car.inspectionDate = inspectionDate;
        car.status = status;

        saveCars();
        displayCars(currentFilter);
    }
}

// 代車を削除（代車一覧ページ用）
function deleteCarFromList(id) {
    if (confirm('この代車を削除しますか？')) {
        cars = cars.filter(c => c.id !== id);
        saveCars();
        displayCars(currentFilter);
    }
}

// 代車を削除（旧関数・互換性のため残す）
function deleteCar(id) {
    if (confirm('この代車を削除しますか?')) {
        cars = cars.filter(c => c.id !== id);
        saveCars();
        displayCars(currentFilter);
    }
}

// 返却から2週間経過しているかチェック
function checkTwoWeeksElapsed(returnedDate) {
    if (!returnedDate) return false;

    const returned = new Date(returnedDate);
    const now = new Date();
    const diffTime = now - returned;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays >= 14;
}

// ステータスの日本語表示とクラス名
function getStatusInfo(status) {
    const statusMap = {
        'available': { text: '貸出可', class: 'status-available' },
        'in-use': { text: '貸出中', class: 'status-in-use' },
        'needs-cleaning': { text: '清掃必要', class: 'status-needs-cleaning' },
        'unavailable': { text: '貸出不可', class: 'status-unavailable' }
    };
    return statusMap[status] || statusMap['available'];
}

// 車検日が1か月以内かチェック
function checkInspectionDateNear(inspectionDate) {
    const inspection = new Date(inspectionDate);
    const today = new Date();
    const oneMonthLater = new Date();
    oneMonthLater.setMonth(today.getMonth() + 1);

    return inspection <= oneMonthLater && inspection >= today;
}

// 返却後2週間以上貸出していないかチェック
function checkNotLoanedForTwoWeeks(car) {
    if (!car.returnedDate) return false;

    const returned = new Date(car.returnedDate);
    const today = new Date();
    const diffTime = today - returned;
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    return diffDays >= 14;
}

// 代車リストを表示（絞り込み対応）
let currentFilter = 'all';

// フィルターボタンに台数を表示
function updateFilterButtonCounts() {
    const totalCount = cars.length;
    const availableCount = cars.filter(car => car.status === 'available').length;
    const inUseCount = cars.filter(car => car.status === 'in-use').length;
    const needsCleaningCount = cars.filter(car => car.status === 'needs-cleaning').length;
    const unavailableCount = cars.filter(car => car.status === 'unavailable').length;

    document.querySelectorAll('.btn-filter').forEach(btn => {
        const filter = btn.dataset.filter;
        let count = 0;
        let label = '';

        switch (filter) {
            case 'all':
                count = totalCount;
                label = '代車一覧';
                break;
            case 'available':
                count = availableCount;
                label = '貸出可';
                break;
            case 'in-use':
                count = inUseCount;
                label = '貸出中';
                break;
            case 'needs-cleaning':
                count = needsCleaningCount;
                label = '清掃必要';
                break;
            case 'unavailable':
                count = unavailableCount;
                label = '貸出不可';
                break;
        }

        btn.textContent = `${label}：${count}台`;
    });
}

function displayCars(filter = 'all') {
    currentFilter = filter;
    const carList = document.getElementById('loanerCarList');

    if (!carList) return;

    // フィルターボタンの台数を更新
    updateFilterButtonCounts();

    // フィルターボタンのアクティブ状態を更新
    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.filter === filter) {
            btn.classList.add('active');
        }
    });

    // フィルタリング
    let filteredCars = cars;
    if (filter !== 'all') {
        filteredCars = cars.filter(car => car.status === filter);
    }

    if (filteredCars.length === 0) {
        carList.innerHTML = '<p style="text-align: center; color: #999;">該当する代車がありません</p>';
        return;
    }

    carList.innerHTML = filteredCars.map(car => {
        const statusInfo = getStatusInfo(car.status);
        const inspectionWarning = checkInspectionDateNear(car.inspectionDate);
        const notLoanedWarning = car.status === 'available' && checkNotLoanedForTwoWeeks(car);

        return `
            <div class="car-item">
                <div class="car-info">
                    <h3>${car.carModel}</h3>
                    <p><strong>ナンバー:</strong> ${car.carNumber}</p>
                    <p><strong>車検日:</strong> ${car.inspectionDate}</p>
                    <span class="car-status ${statusInfo.class}">${statusInfo.text}</span>
                    ${inspectionWarning ? '<div class="inspection-warning">車検日が近づいています</div>' : ''}
                    ${notLoanedWarning ? '<div class="inspection-warning">しばらく貸出していません。エンジン始動を確認してください</div>' : ''}
                </div>
                <div class="car-actions">
                    <button class="btn-edit" onclick="openEditModal(${car.id})">編集</button>
                    <button class="btn-delete" onclick="deleteCarFromList(${car.id})">この代車を削除する</button>
                </div>
            </div>
        `;
    }).join('');
}

// 編集モーダルを開く
function openEditModal(id) {
    const car = cars.find(c => c.id === id);
    if (!car) return;

    document.getElementById('editCarId').value = car.id;
    document.getElementById('editCarModel').value = car.carModel;
    document.getElementById('editCarNumber').value = car.carNumber;
    document.getElementById('editInspectionDate').value = car.inspectionDate;
    document.getElementById('editStatus').value = car.status;

    document.getElementById('editModal').style.display = 'block';
}

// 編集モーダルを閉じる
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
}

// 画面遷移
function showPage(pageId) {
    // すべてのページを非表示
    document.querySelectorAll('.page').forEach(page => {
        page.style.display = 'none';
    });
    // 指定されたページを表示
    document.getElementById(pageId).style.display = 'block';
}

// 入庫処理
function checkInVehicle(checkInDate, customerName, vehicleModel, vehicleNumber, remarks, checkInTime = '') {
    const newVehicle = {
        id: Date.now(),
        checkInDate: checkInDate,
        checkInTime: checkInTime,
        customerName: customerName,
        vehicleModel: vehicleModel,
        vehicleNumber: vehicleNumber,
        remarks: remarks
    };
    storedVehicles.push(newVehicle);
    saveStoredVehicles();
}

// 出庫する車両を選択
function selectVehicleForCheckOut(vehicleId, vehicleModel) {
    // 選択した車両の情報を保存
    document.getElementById('checkOutVehicleId').value = vehicleId;
    document.getElementById('checkOutVehicleInfo').textContent = `${vehicleModel}`;

    // 現在時刻を設定
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('checkOutTime').value = currentTime;

    // 出庫時刻入力画面に遷移
    showPage('checkOutInputPage');
}

// 出庫処理
function checkOutVehicle(id, checkOutTime) {
    const vehicle = storedVehicles.find(v => v.id === id);
    if (!vehicle) return false;

    if (confirm(`${vehicle.vehicleModel}を出庫しますか？`)) {
        // 入出庫履歴に追加
        const checkOutDate = new Date().toISOString().split('T')[0];
        const historyEntry = {
            id: Date.now(),
            customerName: vehicle.customerName,
            checkInDate: vehicle.checkInDate,
            checkInTime: vehicle.checkInTime || '',
            checkOutDate: checkOutDate,
            checkOutTime: checkOutTime,
            vehicleModel: vehicle.vehicleModel,
            vehicleNumber: vehicle.vehicleNumber
        };
        checkInOutHistory.push(historyEntry);
        saveCheckInOutHistory();

        // 預かり車両一覧から削除
        storedVehicles = storedVehicles.filter(v => v.id !== id);
        saveStoredVehicles();

        return true;
    }

    return false;
}

// 預かり車両一覧を表示
function displayStoredVehicles(containerId, isCheckOut = false) {
    const container = document.getElementById(containerId);

    if (storedVehicles.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">預かり車両がありません</p>';
        return;
    }

    container.innerHTML = storedVehicles.map(vehicle => {
        return `
            <div class="vehicle-item">
                <div class="vehicle-info">
                    <h3>${vehicle.customerName}</h3>
                    <p><strong>入庫日:</strong> ${vehicle.checkInDate} ${vehicle.checkInTime || ''}</p>
                    <p><strong>車両:</strong> ${vehicle.vehicleModel}</p>
                    <p><strong>ナンバー:</strong> ${vehicle.vehicleNumber}</p>
                    ${vehicle.remarks ? `<p><strong>備考:</strong> ${vehicle.remarks}</p>` : ''}
                </div>
                ${isCheckOut ? `
                    <div class="car-actions">
                        <button class="btn-add" onclick="selectVehicleForCheckOut(${vehicle.id}, '${vehicle.vehicleModel}')">出庫する</button>
                    </div>
                ` : ''}
            </div>
        `;
    }).join('');
}

// 入出庫履歴を表示（フィルター対応）
function displayCheckInOutHistory(keyword = null, startDate = null, endDate = null) {
    const container = document.getElementById('historyList');

    if (checkInOutHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">履歴がありません</p>';
        return;
    }

    // 新しい順に表示
    let sortedHistory = [...checkInOutHistory].reverse();

    // フリーワードでフィルター
    if (keyword && keyword.trim() !== '') {
        const searchKeyword = keyword.toLowerCase();
        sortedHistory = sortedHistory.filter(entry => {
            const customerName = (entry.customerName || '').toLowerCase();
            const vehicleModel = (entry.vehicleModel || '').toLowerCase();
            const vehicleNumber = (entry.vehicleNumber || '').toLowerCase();

            return customerName.includes(searchKeyword) ||
                   vehicleModel.includes(searchKeyword) ||
                   vehicleNumber.includes(searchKeyword);
        });
    }

    // 期間でフィルター
    if (startDate || endDate) {
        sortedHistory = sortedHistory.filter(entry => {
            const checkOutDate = new Date(entry.checkOutDate);
            let match = true;

            if (startDate) {
                const start = new Date(startDate);
                match = match && checkOutDate >= start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // 終了日の終わりまで含める
                match = match && checkOutDate <= end;
            }

            return match;
        });
    }

    if (sortedHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">該当する履歴がありません</p>';
        return;
    }

    container.innerHTML = sortedHistory.map(entry => `
        <div class="history-item">
            <div class="history-info">
                <h3>${entry.customerName}</h3>
                <p><strong>車種:</strong> ${entry.vehicleModel}</p>
                <p><strong>ナンバー:</strong> ${entry.vehicleNumber}</p>
                <p><strong>入庫日:</strong> ${entry.checkInDate} ${entry.checkInTime || ''}</p>
                <p><strong>出庫日:</strong> ${entry.checkOutDate} ${entry.checkOutTime || ''}</p>
            </div>
        </div>
    `).join('');
}

// 貸出履歴を表示（フィルター対応）
function displayLoanHistory(keyword = null, startDate = null, endDate = null) {
    const container = document.getElementById('loanHistoryList');

    if (loanHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">貸出履歴がありません</p>';
        return;
    }

    // 新しい順に表示
    let sortedHistory = [...loanHistory].reverse();

    // フリーワードでフィルター
    if (keyword && keyword.trim() !== '') {
        const searchKeyword = keyword.toLowerCase();
        sortedHistory = sortedHistory.filter(entry => {
            const customerName = (entry.customerName || '').toLowerCase();
            const carModel = (entry.carModel || '').toLowerCase();
            const carNumber = (entry.carNumber || '').toLowerCase();
            const customerVehicleModel = (entry.customerVehicleModel || '').toLowerCase();
            const customerVehicleNumber = (entry.customerVehicleNumber || '').toLowerCase();

            return customerName.includes(searchKeyword) ||
                   carModel.includes(searchKeyword) ||
                   carNumber.includes(searchKeyword) ||
                   customerVehicleModel.includes(searchKeyword) ||
                   customerVehicleNumber.includes(searchKeyword);
        });
    }

    // 期間でフィルター
    if (startDate || endDate) {
        sortedHistory = sortedHistory.filter(entry => {
            const returnDate = new Date(entry.returnDate);
            let match = true;

            if (startDate) {
                const start = new Date(startDate);
                match = match && returnDate >= start;
            }

            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // 終了日の終わりまで含める
                match = match && returnDate <= end;
            }

            return match;
        });
    }

    if (sortedHistory.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">該当する履歴がありません</p>';
        return;
    }

    container.innerHTML = sortedHistory.map(entry => `
        <div class="history-item">
            <div class="history-info">
                <h3>${entry.carModel} (${entry.carNumber})</h3>
                <p><strong>お客様名:</strong> ${entry.customerName || '未登録'}</p>
                <p><strong>貸出日:</strong> ${entry.loanOutDate} ${entry.loanOutTime}</p>
                <p><strong>返却日:</strong> ${entry.returnDate} ${entry.returnTime}</p>
                <p><strong>貸出期間:</strong> ${entry.loanDays}日間</p>
                ${entry.customerVehicleModel ? `<p><strong>預かり車両:</strong> ${entry.customerVehicleModel}</p>` : ''}
                ${entry.customerVehicleNumber ? `<p><strong>預かり車両ナンバー:</strong> ${entry.customerVehicleNumber}</p>` : ''}
            </div>
        </div>
    `).join('');
}


// 貸出可能な代車一覧を表示
function displayAvailableCars() {
    const container = document.getElementById('availableCarsList');
    const availableCars = cars.filter(car => car.status === 'available');

    if (availableCars.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">貸出可能な代車がありません</p>';
        return;
    }

    container.innerHTML = availableCars.map(car => {
        const inspectionWarning = checkInspectionDateNear(car.inspectionDate);

        return `
            <div class="car-item selectable-car" onclick="selectCarForLoanOut(${car.id}, '${car.carModel}')">
                <div class="car-info">
                    <h3>${car.carModel}</h3>
                    <p><strong>ナンバー:</strong> ${car.carNumber}</p>
                    <p><strong>車検日:</strong> ${car.inspectionDate}</p>
                    <span class="car-status status-available">貸出可</span>
                    ${inspectionWarning ? '<div class="inspection-warning">車検日が近づいています</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 貸出する代車を選択
function selectCarForLoanOut(carId, carModel) {
    // 選択した車の情報を保存
    document.getElementById('selectedCarId').value = carId;
    document.getElementById('selectedCarInfo').textContent = carModel;

    // 貸出日を今日に設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('loanOutDate').value = today;

    // 現在時刻を設定
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('loanOutTime').value = currentTime;

    // 貸出入力画面に遷移
    showPage('loanOutInputPage');
}

// 貸出時間のプルダウンを生成
function generateTimeOptions() {
    const timeSelect = document.getElementById('loanOutTime');
    if (!timeSelect) return;

    timeSelect.innerHTML = '';

    // 0:00 から 23:30 まで30分刻みで生成
    for (let hour = 0; hour < 24; hour++) {
        for (let minute = 0; minute < 60; minute += 30) {
            const timeValue = `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
            const option = document.createElement('option');
            option.value = timeValue;
            option.textContent = timeValue;
            timeSelect.appendChild(option);
        }
    }

    // 現在時刻を設定
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes() < 30 ? 0 : 30;
    const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMinute).padStart(2, '0')}`;
    timeSelect.value = currentTime;
}

// 貸出処理
function loanOutCar(carId, loanOutDate, loanOutTime, customerName, customerVehicleModel, customerVehicleNumber) {
    const car = cars.find(c => c.id === carId);
    if (!car) return false;

    // 代車のステータスを貸出中に変更
    car.status = 'in-use';
    car.loanOutDate = loanOutDate;
    car.loanOutTime = loanOutTime;
    car.customerName = customerName;
    car.customerVehicleModel = customerVehicleModel || '';
    car.customerVehicleNumber = customerVehicleNumber || '';
    // 返却日をクリア（貸出時）
    if (car.returnedDate) {
        delete car.returnedDate;
    }
    saveCars();

    // 預かり車両の入力がある場合、預かり車両一覧に登録
    if (customerVehicleModel && customerVehicleModel.trim() !== '') {
        const currentTime = new Date();
        const timeString = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;

        checkInVehicle(
            loanOutDate,
            customerName,
            customerVehicleModel,
            customerVehicleNumber || '',
            `代車貸出: ${car.carModel}`,
            loanOutTime || timeString
        );
    }

    return true;
}

// 貸出中の代車一覧を表示
function displayInUseCars() {
    const container = document.getElementById('inUseCars');
    const inUseCars = cars.filter(car => car.status === 'in-use');

    if (inUseCars.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #999;">貸出中の代車がありません</p>';
        return;
    }

    container.innerHTML = inUseCars.map(car => {
        const inspectionWarning = checkInspectionDateNear(car.inspectionDate);

        return `
            <div class="car-item selectable-car" onclick="selectCarForReturn(${car.id})">
                <div class="car-info">
                    <h3>${car.carModel}</h3>
                    <p><strong>ナンバー:</strong> ${car.carNumber}</p>
                    <p><strong>車検日:</strong> ${car.inspectionDate}</p>
                    <p><strong>お客様名:</strong> ${car.customerName || '未登録'}</p>
                    <p><strong>貸出日:</strong> ${car.loanOutDate || '未登録'} ${car.loanOutTime || ''}</p>
                    <span class="car-status status-in-use">貸出中</span>
                    ${inspectionWarning ? '<div class="inspection-warning">車検日が近づいています</div>' : ''}
                </div>
            </div>
        `;
    }).join('');
}

// 返却する代車を選択
function selectCarForReturn(carId) {
    const car = cars.find(c => c.id === carId);
    if (!car) return;

    // 選択した車の情報を保存
    document.getElementById('returnCarId').value = carId;
    document.getElementById('returnCarInfo').textContent = `${car.carModel} (${car.carNumber})`;

    // 返却日を今日に設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('returnDate').value = today;

    // 現在時刻を設定
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('returnTime').value = currentTime;

    // 返却入力画面に遷移
    showPage('returnInputPage');
}

// 貸出期間を計算（日数）
function calculateLoanDays(loanOutDate, returnDate) {
    const loan = new Date(loanOutDate);
    const returnD = new Date(returnDate);
    const diffTime = returnD - loan;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
}

// 返却処理
function returnCarProcess(carId, returnDate, returnTime) {
    const car = cars.find(c => c.id === carId);
    if (!car) return false;

    const carModel = car.carModel;

    if (confirm(`${carModel}が返却されましたか？`)) {
        // 貸出期間を計算
        const loanDays = calculateLoanDays(car.loanOutDate, returnDate);

        // 貸出履歴に追加
        const historyEntry = {
            id: Date.now(),
            carModel: car.carModel,
            carNumber: car.carNumber,
            loanOutDate: car.loanOutDate || '',
            loanOutTime: car.loanOutTime || '',
            returnDate: returnDate,
            returnTime: returnTime,
            loanDays: loanDays,
            customerName: car.customerName || '',
            customerVehicleModel: car.customerVehicleModel || '',
            customerVehicleNumber: car.customerVehicleNumber || ''
        };
        loanHistory.push(historyEntry);
        saveLoanHistory();

        // ステータスを清掃必要に変更
        car.status = 'needs-cleaning';
        car.returnedDate = new Date().toISOString();
        // 貸出情報をクリア
        delete car.loanOutDate;
        delete car.loanOutTime;
        delete car.customerName;
        delete car.customerVehicleModel;
        delete car.customerVehicleNumber;
        saveCars();

        return true;
    }

    return false;
}

// DOMの読み込み完了後に実行
document.addEventListener('DOMContentLoaded', function() {
    console.log('代車管理システムが起動しました');

    // データを読み込み
    loadCars();
    loadStoredVehicles();
    loadCheckInOutHistory();
    loadLoanHistory();

    // 初期表示（存在する場合のみ）
    if (document.getElementById('carList')) {
        displayCars();
    }

    // 入庫日の初期値を今日の日付に設定
    const checkInDateInput = document.getElementById('checkInDate');
    if (checkInDateInput) {
        const today = new Date().toISOString().split('T')[0];
        checkInDateInput.value = today;
    }

    // 入庫時刻の初期値を現在時刻に設定
    const checkInTimeInput = document.getElementById('checkInTime');
    if (checkInTimeInput) {
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        checkInTimeInput.value = currentTime;
    }

    // 貸出時間のプルダウンを生成
    generateTimeOptions();

    // ===== トップページのボタンイベント =====

    // 入庫ボタン
    document.getElementById('btnCheckIn')?.addEventListener('click', function() {
        showPage('checkInPage');
        // 入庫日を今日の日付に設定
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('checkInDate').value = today;
        // 入庫時刻を現在時刻に設定
        const now = new Date();
        const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
        document.getElementById('checkInTime').value = currentTime;
    });

    // 出庫ボタン
    document.getElementById('btnCheckOut')?.addEventListener('click', function() {
        showPage('checkOutPage');
        displayStoredVehicles('checkOutList', true);
    });

    // 入出庫履歴ボタン
    document.getElementById('btnCheckInOutHistory')?.addEventListener('click', function() {
        showPage('checkInOutHistoryPage');
        displayCheckInOutHistory();
    });

    // 預かり車両一覧ボタン
    document.getElementById('btnStoredVehicleList')?.addEventListener('click', function() {
        showPage('storedVehicleListPage');
        displayStoredVehicles('storedVehicleList', false);
    });

    // 代車一覧ボタン
    document.getElementById('btnLoanerCarList')?.addEventListener('click', function() {
        showPage('loanerCarListPage');
        currentFilter = 'all';
        displayCars('all');
    });

    // 貸出ボタン
    document.getElementById('btnLoanOut')?.addEventListener('click', function() {
        showPage('loanOutSelectPage');
        displayAvailableCars();
    });

    // 返却ボタン
    document.getElementById('btnReturn')?.addEventListener('click', function() {
        showPage('returnSelectPage');
        displayInUseCars();
    });

    // 貸出履歴ボタン
    document.getElementById('btnLoanHistory')?.addEventListener('click', function() {
        showPage('loanHistoryPage');
        displayLoanHistory();
    });

    // ===== 入庫フォームのイベント =====

    document.getElementById('checkInForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        if (confirm('入庫処理をしますか？')) {
            const checkInDate = document.getElementById('checkInDate').value;
            const checkInTime = document.getElementById('checkInTime').value;
            const customerName = document.getElementById('customerName').value;
            const vehicleModel = document.getElementById('vehicleModel').value;
            const vehicleNumber = document.getElementById('vehicleNumber').value;
            const remarks = document.getElementById('remarks').value;

            checkInVehicle(checkInDate, customerName, vehicleModel, vehicleNumber, remarks, checkInTime);

            // フォームをリセット
            this.reset();
            // 今日の日付と現在時刻を再設定
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('checkInDate').value = today;
            const now = new Date();
            const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
            document.getElementById('checkInTime').value = currentTime;

            alert('入庫処理が完了しました');
            showPage('topPage');
        }
    });

    // 入庫キャンセルボタン
    document.getElementById('btnCancelCheckIn')?.addEventListener('click', function() {
        if (confirm('入庫処理をキャンセルしますか？')) {
            document.getElementById('checkInForm').reset();
            showPage('topPage');
        }
    });

    // ===== 出庫フォーム =====

    document.getElementById('checkOutForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const vehicleId = parseInt(document.getElementById('checkOutVehicleId').value);
        const checkOutTime = document.getElementById('checkOutTime').value;

        const success = checkOutVehicle(vehicleId, checkOutTime);

        if (success) {
            // フォームをリセット
            this.reset();

            alert('出庫処理が完了しました');
            showPage('topPage');
        }
    });

    // 出庫キャンセルボタン
    document.getElementById('btnCancelCheckOut')?.addEventListener('click', function() {
        if (confirm('出庫処理をキャンセルしますか？')) {
            document.getElementById('checkOutForm').reset();
            showPage('checkOutPage');
        }
    });

    // ===== 戻るボタンのイベント =====

    document.getElementById('btnBackFromCheckOut')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromStoredList')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromHistory')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromLoanerCarList')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromLoanOutSelect')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromReturnSelect')?.addEventListener('click', function() {
        showPage('topPage');
    });

    document.getElementById('btnBackFromLoanHistory')?.addEventListener('click', function() {
        showPage('topPage');
    });

    // ===== 代車一覧のフィルターボタン =====

    document.querySelectorAll('.btn-filter').forEach(btn => {
        btn.addEventListener('click', function() {
            const filter = this.dataset.filter;
            displayCars(filter);
        });
    });

    // ===== 代車を追加するボタン =====

    document.getElementById('btnAddLoanerCar')?.addEventListener('click', function() {
        showPage('addLoanerCarPage');
    });

    // 代車追加フォーム
    document.getElementById('addLoanerCarForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const carModel = document.getElementById('newCarModel').value;
        const carNumber = document.getElementById('newCarNumber').value;
        const inspectionDate = document.getElementById('newInspectionDate').value;
        const status = document.getElementById('newCarStatus').value;

        addCar(carModel, carNumber, inspectionDate, status);

        // フォームをリセット
        this.reset();

        alert('代車を追加しました');
        showPage('loanerCarListPage');
        displayCars(currentFilter);
    });

    // 代車追加キャンセルボタン
    document.getElementById('btnCancelAddCar')?.addEventListener('click', function() {
        document.getElementById('addLoanerCarForm').reset();
        showPage('loanerCarListPage');
    });

    // ===== 貸出フォーム =====

    document.getElementById('loanOutForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const carId = parseInt(document.getElementById('selectedCarId').value);
        const carModel = document.getElementById('selectedCarInfo').textContent;
        const loanOutDate = document.getElementById('loanOutDate').value;
        const loanOutTime = document.getElementById('loanOutTime').value;
        const customerName = document.getElementById('loanCustomerName').value;
        const customerVehicleModel = document.getElementById('customerVehicleModel').value;
        const customerVehicleNumber = document.getElementById('customerVehicleNumber').value;

        if (confirm(`${carModel}を貸出しますか？`)) {
            const success = loanOutCar(carId, loanOutDate, loanOutTime, customerName, customerVehicleModel, customerVehicleNumber);

            if (success) {
                // フォームをリセット
                this.reset();

                alert('貸出処理が完了しました');
                showPage('topPage');
            } else {
                alert('エラーが発生しました');
            }
        }
    });

    // 貸出キャンセルボタン
    document.getElementById('btnCancelLoanOut')?.addEventListener('click', function() {
        if (confirm('貸出処理をキャンセルしますか？')) {
            document.getElementById('loanOutForm').reset();
            showPage('topPage');
        }
    });

    // ===== 返却フォーム =====

    document.getElementById('returnForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const carId = parseInt(document.getElementById('returnCarId').value);
        const returnDate = document.getElementById('returnDate').value;
        const returnTime = document.getElementById('returnTime').value;

        const success = returnCarProcess(carId, returnDate, returnTime);

        if (success) {
            // フォームをリセット
            this.reset();

            alert('返却処理が完了しました');
            showPage('topPage');
        }
    });

    // 返却キャンセルボタン
    document.getElementById('btnCancelReturn')?.addEventListener('click', function() {
        if (confirm('返却処理をキャンセルしますか？')) {
            document.getElementById('returnForm').reset();
            showPage('topPage');
        }
    });

    // ===== 入出庫履歴検索 =====

    document.getElementById('checkInOutSearchForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const keyword = document.getElementById('checkInOutKeyword').value;
        const startDate = document.getElementById('checkInOutStartDate').value;
        const endDate = document.getElementById('checkInOutEndDate').value;

        displayCheckInOutHistory(keyword || null, startDate || null, endDate || null);
    });

    // 入出庫履歴検索リセット
    document.getElementById('btnResetCheckInOutSearch')?.addEventListener('click', function() {
        document.getElementById('checkInOutKeyword').value = '';
        document.getElementById('checkInOutStartDate').value = '';
        document.getElementById('checkInOutEndDate').value = '';
        displayCheckInOutHistory();
    });

    // ===== 貸出履歴検索 =====

    document.getElementById('loanHistorySearchForm')?.addEventListener('submit', function(e) {
        e.preventDefault();

        const keyword = document.getElementById('loanHistoryKeyword').value;
        const startDate = document.getElementById('loanHistoryStartDate').value;
        const endDate = document.getElementById('loanHistoryEndDate').value;

        displayLoanHistory(keyword || null, startDate || null, endDate || null);
    });

    // 貸出履歴検索リセット
    document.getElementById('btnResetLoanHistorySearch')?.addEventListener('click', function() {
        document.getElementById('loanHistoryKeyword').value = '';
        document.getElementById('loanHistoryStartDate').value = '';
        document.getElementById('loanHistoryEndDate').value = '';
        displayLoanHistory();
    });

    // ===== 既存の代車管理機能 =====

    // 代車追加フォームのイベント
    const addCarForm = document.getElementById('addCarForm');
    if (addCarForm) {
        addCarForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const carModel = document.getElementById('carModel').value;
            const carNumber = document.getElementById('carNumber').value;
            const inspectionDate = document.getElementById('inspectionDate').value;

            addCar(carModel, carNumber, inspectionDate);

            // フォームをリセット
            this.reset();
        });
    }

    // 編集フォームのイベント
    const editCarForm = document.getElementById('editCarForm');
    if (editCarForm) {
        editCarForm.addEventListener('submit', function(e) {
            e.preventDefault();

            const id = parseInt(document.getElementById('editCarId').value);
            const carModel = document.getElementById('editCarModel').value;
            const carNumber = document.getElementById('editCarNumber').value;
            const inspectionDate = document.getElementById('editInspectionDate').value;
            const status = document.getElementById('editStatus').value;

            editCar(id, carModel, carNumber, inspectionDate, status);
            closeEditModal();
        });
    }

    // モーダルの×ボタン
    const closeButton = document.querySelector('.close');
    if (closeButton) {
        closeButton.addEventListener('click', closeEditModal);
    }

    // モーダルの外側をクリックしたら閉じる
    window.addEventListener('click', function(event) {
        const modal = document.getElementById('editModal');
        if (modal && event.target === modal) {
            closeEditModal();
        }
    });
});
