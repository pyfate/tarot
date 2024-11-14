// 載入塔羅牌資料
let tarotData = [];

// 從 data.json 讀取資料
fetch('data.json')
  .then(response => response.json())
  .then(data => {
    tarotData = data;
    console.log('塔羅牌資料載入完成', tarotData.length);
  })
  .catch(error => console.error('Error loading tarot data:', error));

// DOM 元素
const questionInput = document.getElementById('questionInput');
const questionType = document.getElementById('questionType');
const spreadType = document.getElementById('spreadType');
const drawButton = document.getElementById('drawCards');
const spreadDisplay = document.getElementById('spreadDisplay');
const readingResult = document.getElementById('readingResult');
const personalInterpretation = document.getElementById('personalInterpretation');
const saveButton = document.getElementById('saveReading');
const downloadButton = document.getElementById('downloadReading');

// 新增歷史紀錄顯示區域的參考
const historyList = document.getElementById('historyList');

// 用來追踪已抽取的牌
let drawnCards = new Set();

// 新增一個變數來追踪是否已經抽牌
let hasDrawnCards = false;

// 重置抽牌錄
function resetDrawnCards() {
  drawnCards.clear();
}

// 抽牌功能
function drawRandomCard() {
  if (!tarotData || tarotData.length === 0) {
    console.error('塔羅牌資料尚未載入');
    return null;
  }

  const availableCards = tarotData.filter(card => !drawnCards.has(card.id));
  if (availableCards.length === 0) {
    resetDrawnCards(); // 如果所有牌都抽完了，重置記錄
    return drawRandomCard(); // 重新抽一張牌
  }
  
  const randomIndex = Math.floor(Math.random() * availableCards.length);
  const card = availableCards[randomIndex];
  const isReversed = Math.random() < 0.5;
  drawnCards.add(card.id);
  return { ...card, isReversed };
}

// 根據牌陣類型抽取對應數量的牌
function drawSpread(type) {
  switch(type) {
    case 'single':
      return [drawRandomCard()];
    case 'timeline':
      return [
        { ...drawRandomCard(), position: '過去' },
        { ...drawRandomCard(), position: '現在' },
        { ...drawRandomCard(), position: '未來' }
      ];
    case 'triangle':
      return [
        { ...drawRandomCard(), position: '主題' },
        { ...drawRandomCard(), position: '困難' },
        { ...drawRandomCard(), position: '建議' }
      ];
    case 'choice':
      return [
        { ...drawRandomCard(), position: '選擇A' },
        { ...drawRandomCard(), position: '選擇B' },
        { ...drawRandomCard(), position: '建議' }
      ];
    default:
      return [];
  }
}

// 修改顯示牌陣的函數
function displaySpread(cards) {
    spreadDisplay.innerHTML = '';
    cards.forEach(card => {
        const cardElement = document.createElement('div');
        cardElement.className = `card ${card.isReversed ? 'reversed' : ''}`;
        
        // 修改 HTML 結構，確保圖片可以正確翻轉
        cardElement.innerHTML = `
            <div class="card-image ${card.isReversed ? 'reversed' : ''}">
                <a href="${card.url}" target="_blank" class="card-link">
                    <img src="${card.image}" alt="${card.name}">
                </a>
            </div>
            <div class="card-text">
                <div class="card-position">${card.position || ''}</div>
                <div class="card-name">${card.name} ${card.isReversed ? '(逆)' : '(正)'}</div>
            </div>
        `;

        spreadDisplay.appendChild(cardElement);
    });

    // 生成解讀結果
    readingResult.innerHTML = generateReading(cards, questionType.value);
}

// 生成解讀結果
function generateReading(cards, type) {
  let reading = '<h2>塔羅牌解讀</h2>';
  cards.forEach(card => {
    const meanings = card.isReversed ? card.meanings.reversed : card.meanings.upright;
    reading += `
      <div class="card-reading">
        <h3>${card.position ? card.position + ': ' : ''}${card.name} ${card.isReversed ? '(逆位)' : '(正位)'}</h3>
        <p>${meanings[type || 'general']}</p>
        <p><strong>建議：</strong> ${meanings.advice}</p>
      </div>
    `;
  });
  return reading;
}

// 載入歷史紀錄
function loadHistory() {
    const readings = JSON.parse(localStorage.getItem('tarotReadings') || '[]');
    const historySection = document.querySelector('.history-section');
    historyList.innerHTML = '';
    
    // 如果沒有歷史紀錄，隱藏整個歷史區塊
    if (readings.length === 0) {
        historySection.style.display = 'none';
        return;
    }

    // 如果有歷史紀錄，顯示區塊
    historySection.style.display = 'block';
    
    // 反轉陣列順序，讓新的記錄在上面
    readings.slice().reverse().forEach((reading, index) => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        // 格式化日期
        const date = new Date(reading.date);
        const formattedDate = date.toLocaleString();
        
        // 創建標題區域（始終可見）
        const titleSection = document.createElement('div');
        titleSection.className = 'history-title';
        titleSection.innerHTML = `
            <div class="history-header">
                <span class="history-date">${formattedDate}</span>
                <span class="history-question">${reading.question}</span>
            </div>
            <button class="delete-btn" onclick="deleteReading(${readings.length - 1 - index})">刪除</button>
        `;

        // 創建詳細內容區域（初始隱藏）
        const detailsSection = document.createElement('div');
        detailsSection.className = 'history-details';
        detailsSection.style.display = 'none';
        
        // 生成卡牌解讀的HTML
        const cardsReadingHtml = reading.cards.map(card => {
            return `
                <div class="card-reading">
                    <h4>${card.name} ${card.isReversed ? '(逆位)' : '(正位)'}</h4>
                    <p>${card.meaning}</p>
                </div>
            `;
        }).join('');

        detailsSection.innerHTML = `
            <p><strong>類型：</strong>${reading.type}</p>
            <p><strong>牌陣：</strong>${reading.spread}</p>
            <div class="cards-drawn">
                <strong>抽到的牌：</strong>
                ${cardsReadingHtml}
            </div>
            <p><strong>個人解讀：</strong>${reading.interpretation}</p>
        `;

        // 添加點擊事件來切換詳細內容的顯示
        titleSection.addEventListener('click', (e) => {
            if (!e.target.classList.contains('delete-btn')) {
                detailsSection.style.display = 
                    detailsSection.style.display === 'none' ? 'block' : 'none';
            }
        });

        historyItem.appendChild(titleSection);
        historyItem.appendChild(detailsSection);
        historyList.appendChild(historyItem);
    });
}

// 修改儲存功能
function saveReading() {
    // 獲取當前抽到的牌的資訊
    const drawnCards = Array.from(spreadDisplay.children).map(cardElement => {
        const cardPosition = cardElement.querySelector('.card-position').textContent;
        const cardNameElement = cardElement.querySelector('.card-name');
        const isReversed = cardElement.classList.contains('reversed');
        
        // 從卡牌名稱中提取原始名稱（去除正逆位標記）
        const fullName = cardNameElement.textContent;
        const cardName = fullName.replace(/\s*[\(\（].*[\)\）]$/, '').trim();
        
        // 找到對應的卡牌數據
        const cardData = tarotData.find(card => card.name === cardName);
        
        // 根據問題類型和正逆位獲取對應的解讀
        const meanings = isReversed ? cardData.meanings.reversed : cardData.meanings.upright;
        const meaning = meanings[questionType.value || 'general'];

        return {
            position: cardPosition,
            name: cardName,
            isReversed: isReversed,
            meaning: meaning
        };
    });

    const reading = {
        date: new Date().toISOString(),
        question: questionInput.value,
        type: questionType.value,
        spread: spreadType.value,
        cards: drawnCards,
        interpretation: personalInterpretation.value
    };

    let readings = JSON.parse(localStorage.getItem('tarotReadings') || '[]');
    readings.push(reading);
    localStorage.setItem('tarotReadings', JSON.stringify(readings));
    
    alert('占卜紀錄已儲存！');
    loadHistory();
}

// 刪除紀錄功能
function deleteReading(index) {
    if (confirm('確定要刪除這筆紀錄嗎？')) {
        let readings = JSON.parse(localStorage.getItem('tarotReadings') || '[]');
        readings.splice(index, 1);
        localStorage.setItem('tarotReadings', JSON.stringify(readings));
        loadHistory(); // 重新載入歷史紀錄
    }
}

// 修改下載功能
function downloadReading() {
    const drawnCards = Array.from(spreadDisplay.children).map(cardElement => {
        const cardPosition = cardElement.querySelector('.card-position').textContent;
        const cardNameElement = cardElement.querySelector('.card-name');
        const isReversed = cardElement.classList.contains('reversed');
        
        // 從卡牌名稱中提取原始名稱（去除正逆位標記）
        const fullName = cardNameElement.textContent;
        const cardName = fullName.replace(/\s*[\(\（].*[\)\）]$/, '').trim();
        
        // 找到對應的卡牌數據
        const cardData = tarotData.find(card => card.name === cardName);
        
        // 根據問題類型和正逆位獲取對應的解讀
        const meanings = isReversed ? cardData.meanings.reversed : cardData.meanings.upright;
        const meaning = meanings[questionType.value || 'general'];

        return `${cardPosition ? cardPosition + ': ' : ''}${cardName} ${isReversed ? '(逆位)' : '(正位)'}\n解讀：${meaning}`;
    }).join('\n\n');

    const reading = `
塔羅牌占卜紀錄
日期時間：${new Date().toLocaleString()}
問題：${questionInput.value}
類型：${questionType.value}
牌陣：${spreadType.value}

抽到的牌：
${drawnCards}

個人解讀：${personalInterpretation.value}
    `;

    const blob = new Blob([reading], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tarot-reading-${new Date().toISOString()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// 更新按鈕狀態的函數
function updateButtonStates() {
    const saveButton = document.getElementById('saveReading');
    const downloadButton = document.getElementById('downloadReading');
    
    saveButton.disabled = !hasDrawnCards;
    downloadButton.disabled = !hasDrawnCards;
    
    // 更新按鈕樣式
    [saveButton, downloadButton].forEach(button => {
        if (button.disabled) {
            button.classList.add('disabled');
        } else {
            button.classList.remove('disabled');
        }
    });
}

// 在 DOM 元素宣告後加入以下代碼
function updateDrawButtonState() {
    const questionTypeValue = questionType.value;
    const spreadTypeValue = spreadType.value;
    
    // 只有當兩個選項都有選擇時，抽牌按鈕才能使用
    drawButton.disabled = !questionTypeValue || !spreadTypeValue;
    
    // 更新按鈕樣式
    if (drawButton.disabled) {
        drawButton.classList.add('disabled');
    } else {
        drawButton.classList.remove('disabled');
    }
}

// 監聽選項變更
questionType.addEventListener('change', updateDrawButtonState);
spreadType.addEventListener('change', updateDrawButtonState);

// 修改抽牌按鈕的事件處理
document.addEventListener('DOMContentLoaded', function() {
    // 初始化按鈕狀態
    updateDrawButtonState();
    
    drawButton.addEventListener('click', () => {
        if (drawButton.disabled) return;  // 如果按鈕被禁用，直接返回

        resetDrawnCards();
        const cards = drawSpread(spreadType.value);
        if (cards && cards.length > 0) {
            displaySpread(cards);
            readingResult.innerHTML = generateReading(cards, questionType.value);
            hasDrawnCards = true;
            updateButtonStates();
        }
    });

    // 初始化其他按鈕狀態
    updateButtonStates();
});

// 在 CSS 中新增樣式
const style = document.createElement('style');
style.textContent = `
    button.disabled {
        background-color: #cccccc;
        cursor: not-allowed;
    }
    
    button.disabled:hover {
        background-color: #cccccc;
    }
`;
document.head.appendChild(style);

// 修改儲存和下載按鈕的事件處理
saveButton.addEventListener('click', () => {
    if (!hasDrawnCards) return;
    saveReading();
});

downloadButton.addEventListener('click', () => {
    if (!hasDrawnCards) return;
    downloadReading();
});

// 在重新載入頁面時重置狀態
window.addEventListener('load', () => {
    hasDrawnCards = false;
    updateButtonStates();
    loadHistory();
}); 