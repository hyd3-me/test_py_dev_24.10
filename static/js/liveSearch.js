import { datePicker } from '/static/js/datePicker.js'
import { createChart } from '/static/js/graphic.js'
import { IncrementDate, getFormattedDate, calculateDays } from '/static/js/dateUtils.js'

const liveParams = {
    search_text: '',
    start_date: IncrementDate(14).dateObj, 
    end_date: IncrementDate(0).dateObj,
    paginationResultsCnt: 50,
    currentPage: 1,
    amount: 15,
    button_date: '',
    button_state: 0,
    metric_type: '',
    state_type: '',
    list_id: '',
    region_id: '', 
    search_system: 'Yandex',
}

let state_type = "result";                
let metric_type = "R";

let script = document.querySelector('#liveScript')
let queryTable = document.querySelector('.positions__items')
let queryHeaderRow = document.querySelector(".header-pos__dates");
let searchText = document.querySelector('#searchText')
let updateButton = document.querySelector('.check-pos')
let paginationButton = document.querySelectorAll('.pos-pag__variable')
let loader = document.querySelector('.cssload-container')

const input = document.querySelector('#searchRegion');
const selectedRegion = document.querySelector('#selectedRegion')
const suggestionsContainer = document.querySelector('#suggestionsContainer')
const regionCodes = JSON.parse(selectedRegion.dataset.regions)

paginationButton.forEach((option) => {
    option.addEventListener('click', (event) => {
      liveParams.paginationResultsCnt = parseInt(event.target.innerText)
      document.querySelector('#selectedPagesCnt').innerText = event.target.innerText
      document.querySelector('.pos-pag__variables').classList.remove('active')
      liveParams.currentPage = 1
      SetDataTable()
    })
  })
  
  let prevArrow =  document.querySelector('.pos-pag__arrow-1')
  let nextArrow =  document.querySelector('.pos-pag__arrow-2')
  prevArrow.addEventListener('click', (event) => {changeCurrentPage(event.target)})
  nextArrow.addEventListener('click', (event) => {changeCurrentPage(event.target)})
  
  function changeCurrentPage(target){
    let max_pages = Math.floor(liveParams.total_records / liveParams.paginationResultsCnt) + 1
    if (target.classList.contains('pos-pag__arrow-2')) {
      liveParams.currentPage = liveParams.currentPage + 1 < max_pages ? liveParams.currentPage + 1 : max_pages
    } else {
      liveParams.currentPage = liveParams.currentPage - 1 > 1 ? liveParams.currentPage - 1 : 1
    }
    SetDataTable()
  }

let searchSystem = document.querySelector('#searchSystem')
  searchSystem.querySelectorAll('.folder').forEach((item) => {
    item.addEventListener('click', () => {
        let searchName = item.querySelector('span')
        liveParams.search_system = searchName.innerText == 'Яндекс' ? 'Yandex' : 'Google'

        let searchRegions = regionCodes[liveParams.search_system]
        let firstRegion = !searchRegions ? 'Регионы не добавлены' : searchRegions[0].Geo 
        selectedRegion.querySelector('span').innerText = firstRegion
        SetDataTable()
    })
})

updateButton.addEventListener('click', updateLiveSearch)

searchText.addEventListener('change', (event) => {
    liveParams.search_text = event.target.value
    SetDataTable()
  })

export function SetDataTable() {
    queryTable.innerHTML = ''
    queryHeaderRow.innerHTML = ''
    let columns = [
      {"title": "result"},
    ]

    liveParams.amount = calculateDays(liveParams.start_date, liveParams.end_date)

    for (let i = 0; i <= liveParams.amount; i++) {
        let date = IncrementDate(i, liveParams.end_date); 
        columns.push({'title': date.dateStr})

        let nameCell = document.createElement('div');
        nameCell.setAttribute('class', 'header-pos__date')
        nameCell.setAttribute('data-sort', '')
        nameCell.setAttribute('data-order', liveParams.button_state) 
        nameCell.setAttribute('data-stateType', 'date')
        nameCell.setAttribute('data-buttondate', date.dateStr)
        if (date.dateStr == liveParams.button_date) {
          nameCell.classList.add('active--sort')
        }
        let { day, month, year, weekday } = getFormattedDate(date.dateObj)
        let nameCellHTML = `
          <button class="header-pos__date-button btn-reset">
            <div class="header-pos__date-value">
              <span>${day}.${month}.${year}</span>
              <span>${weekday}</span>
            </div>
            <svg class="header-pos__svg--hover" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M5.42857 10C5.34898 10 5.27096 9.97931 5.20326 9.94026C5.13555 9.90121 5.08084 9.84533 5.04525 9.77889C5.00965 9.71244 4.99458 9.63806 5.00173 9.56408C5.00888 9.49009 5.03796 9.41943 5.08571 9.36L7.65714 6.16C7.69706 6.11032 7.74883 6.07 7.80834 6.04223C7.86785 6.01446 7.93347 6 8 6C8.06653 6 8.13215 6.01446 8.19166 6.04223C8.25117 6.07 8.30294 6.11032 8.34286 6.16L10.9143 9.36C10.962 9.41943 10.9911 9.49009 10.9983 9.56408C11.0054 9.63806 10.9903 9.71244 10.9548 9.77889C10.9192 9.84533 10.8644 9.90121 10.7967 9.94026C10.729 9.97931 10.651 10 10.5714 10H5.42857Z"  />
            </svg>
          </button>
        `;
        nameCell.innerHTML = nameCellHTML
        queryHeaderRow.appendChild(nameCell);
    }

    let orderOptions = [null, 'increase', 'decrease']
    let url = script.dataset.setdatatableurl
    var params = {
        length: liveParams.paginationResultsCnt, // количество отображаемых элементов
        start: (liveParams.currentPage - 1) * liveParams.paginationResultsCnt, // номер страницы
        start_date: liveParams.start_date ? IncrementDate(0, liveParams.start_date).dateStr : null, // Дата начала поиска
        end_date: liveParams.end_date ? IncrementDate(0, liveParams.end_date).dateStr : null, // Дата начала поиска
        amount: calculateDays(liveParams.start_date, liveParams.end_date),
        search_text: liveParams.search_text,
        button_date: liveParams.button_date,
        button_state: orderOptions[liveParams.button_state],
        metric_type: liveParams.metric_type ? liveParams.metric_type : metric_type,
        state_type: liveParams.state_type ? liveParams.state_type : state_type,
        sort_result: false, // document.getElementById("input_sort") ? document.getElementById("input_sort").checked : false,
        sort_desc: false, // document.getElementById("input_desc") ? document.getElementById("input_desc").checked : false,
        list_id: script.dataset.listid,
        region_id: liveParams.region_id, 
        search_system: liveParams.search_system,
    };
    loader.classList.add('active')
    fetch(url, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(params)
    })
        .then(response => response.json())
        .then(data => {
            data = data.data;

            for (let i = 0; i < data.length; i++) {
              let row = document.createElement('div')
              row.setAttribute('class', 'positions__item item-pos')
              columns.forEach((column) => {
                let columnName = column['title']
                if (columnName === 'result') {
                  row.appendChild(setBaseOfItem(data[i][columnName]))
                } else {
                  let dateInfo = data[i][columnName]
                  let datesContainer = document.createElement('div')
                  datesContainer.setAttribute('class', 'item-pos__datas')
                  if (dateInfo) {
                    dateInfo['date'] = columnName // Column Date
                    datesContainer.appendChild(setDatasOfItem(dateInfo))
                  } else {
                    let emptyCell = document.createElement('template')
                     emptyCell.innerHTML = `
                      <div class="item-pos__data no-data">
                        <span>Нет данных</span>
                      </div> 
                    `
                    datesContainer.appendChild(emptyCell.content)
                  }
                row.appendChild(datesContainer)
                }
              })
              queryTable.appendChild(row)
              loader.classList.remove('active')
            }
            //   document.querySelector('#currentPage').value = liveParams.currentPage

        })
        .catch(error => {
            // Обработка ошибки
            console.error("Error:", error);
            loader.classList.remove('active')
        });

    }

function setBaseOfItem(data){
    let baseTemplate = document.createElement('template')
    baseTemplate.innerHTML = `
        <div class="item-pos__base">
          <div class="item-pos__left">
            <label
            class="checkbox"
            >
              <input type="checkbox" role="switch"/>
              <span class="copied-text">${data.title}</span>
            </label>
          </div>
          <div class="item-pos__wrap">
            <div class="body-panel__copy">          
              <div class="copy-btn item-pos__menu" onclick="copyAndTable(event)">
                <svg width="2" height="11" viewBox="0 0 2 11" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="1" cy="1.5" r="1" fill="#404040" />
                  <circle cx="1" cy="5.5" r="1" fill="#404040" />
                  <circle cx="1" cy="9.5" r="1" fill="#404040" />
                </svg>
              </div>
              <div class="project__dropdown-wrapper">
                <div class="body-panel__google-item copy-item">
                  <svg width="12" height="14" viewBox="0 0 12 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4.18366 9.66683V9.76683H4.28366H10.4601H10.5601V9.66683V1.66683V1.56683H10.4601H4.28366H4.18366V1.66683V9.66683ZM1.53856 12.4335H8.98758V13.5668H1.53856C1.18692 13.5668 0.888857 13.4463 0.63888 13.2034C0.388993 12.9607 0.266016 12.6725 0.266016 12.3335V3.10016H1.43856V12.3335V12.4335H1.53856ZM4.28366 10.9002C3.93202 10.9002 3.63395 10.7796 3.38398 10.5368C3.13409 10.294 3.01111 10.0058 3.01111 9.66683V1.66683C3.01111 1.32785 3.13409 1.03964 3.38398 0.796891C3.63395 0.554056 3.93202 0.433496 4.28366 0.433496H10.4601C10.8118 0.433496 11.1098 0.554056 11.3598 0.796891C11.6097 1.03964 11.7327 1.32785 11.7327 1.66683V9.66683C11.7327 10.0058 11.6097 10.294 11.3598 10.5368C11.1098 10.7796 10.8118 10.9002 10.4601 10.9002H4.28366Z" fill="#404040" stroke="white" stroke-width="0.2" />
                  </svg>
                  <span>Скопировать</span>
                </div>
                <div class="body-panel__google-item open-graphic-solo">
                  <svg width="14" height="13" viewBox="0 0 14 13" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M3.01252 11.7453L7.25475 7.33367L9.40489 9.5616L9.47684 9.63616L9.5488 9.5616L12.7626 6.23156L13.5282 7.02492L9.47698 11.2069L7.32657 8.97864L7.25462 8.90408L7.18266 8.97864L3.76256 12.5225L3.01252 11.7453ZM1.50383 11.9047C1.22541 11.8825 0.985047 11.7662 0.778956 11.5527C0.548478 11.3138 0.433984 11.0291 0.433984 10.6928V1.48229C0.433984 1.14606 0.548478 0.861278 0.778956 0.62246C1.00933 0.383752 1.28253 0.266504 1.60383 0.266504H10.4927C10.814 0.266504 11.0872 0.383752 11.3176 0.62246C11.5481 0.861278 11.6626 1.14606 11.6626 1.48229V4.14545H1.60383H1.50383V4.24545V11.9047ZM1.50383 2.92966V3.02966H1.60383H10.4927H10.5927V2.92966V1.48229V1.38229H10.4927H1.60383H1.50383V1.48229V2.92966Z" fill="#404040" stroke="white" stroke-width="0.2" />
                  </svg>
                  <span>Показать график</span>
                </div>
              </div>
            </div>


            <div class="item-pos__block">
              <div class="item-pos__values">
                <div class="item-pos__values-rate">${data.total.toFixed(2)}</div>
                <div class="item-pos__values-short">
                  <span>14500</span>
                  <span>14500</span>
                </div>
                <div class="item-pos__values-hover">
                  <div class="item-pos__values-hover__title">Показатели</div>
                  <div class="item-pos__values-hover__item">
                    <span>Позиция</span>
                    <span>25.5</span>
                  </div>
                  <div class="item-pos__values-hover__item">
                    <span>Клики</span>
                    <span>14500</span>
                  </div>
                  <div class="item-pos__values-hover__item">
                    <span>CTR</span>
                    <span>20.01%</span>
                  </div>
                  <div class="item-pos__values-hover__item">
                    <span>Показы</span>
                    <span>14500</span>
                  </div>
                  <div class="item-pos__values-hover__item">
                    <span>Спрос</span>
                    <span>14500</span>
                  </div>
                  <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.2857 2.23145C22.5181 2.23145 22.7437 2.29195 22.9371 2.40351C23.1303 2.51495 23.2816 2.67156 23.3783 2.85201C23.4747 3.03206 23.5143 3.23085 23.4954 3.42705C23.4764 3.62339 23.399 3.81444 23.2674 3.97825L23.6535 4.28848L23.2674 3.97825L12.9817 16.7783C12.8714 16.9155 12.7261 17.0297 12.5552 17.1094C12.3843 17.1892 12.1941 17.2314 12 17.2314C11.8059 17.2314 11.6157 17.1892 11.4448 17.1094C11.2739 17.0297 11.1286 16.9155 11.0183 16.7783L0.732615 3.97825C0.600978 3.81444 0.523578 3.62338 0.504609 3.42705C0.485654 3.23086 0.525271 3.03206 0.621726 2.85202C0.7184 2.67156 0.869674 2.51495 1.06287 2.40352C1.25627 2.29196 1.48194 2.23145 1.71429 2.23145L22.2857 2.23145Z" fill="white" stroke="#F4F4F4"/>
                    <path d="M22.2857 1.73002e-07C22.6041 1.40873e-07 22.9161 0.0827428 23.187 0.238958C23.4578 0.395174 23.6766 0.61869 23.819 0.884459C23.9614 1.15023 24.0217 1.44775 23.9931 1.74369C23.9645 2.03963 23.8482 2.32229 23.6571 2.56L13.3714 15.36C13.2117 15.5587 13.0047 15.72 12.7667 15.8311C12.5286 15.9422 12.2661 16 12 16C11.7339 16 11.4714 15.9422 11.2333 15.8311C10.9953 15.72 10.7883 15.5587 10.6286 15.36L0.34286 2.56C0.151843 2.32229 0.0355176 2.03963 0.00692641 1.74369C-0.0216648 1.44775 0.0386093 1.15023 0.180985 0.884461C0.323361 0.618692 0.542216 0.395176 0.813033 0.238961C1.08385 0.082745 1.39592 2.28115e-06 1.71429 2.24902e-06L22.2857 1.73002e-07Z" fill="white"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
    `
    return baseTemplate.content
}

function setDatasOfItem(data){
    let baseTemplate = document.createElement('template')
    baseTemplate.innerHTML = `
        <div class="item-pos__data ${data.color}-data">
            <div class="item-pos__data-first">
            <div class="item-pos__position">${data.position}</div>
            <div class="item-pos__increase increase-${data.delta >= 0 ? 'up' : 'down'}">
                <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5.92857 10C5.84898 10 5.77096 9.97931 5.70326 9.94026C5.63555 9.90121 5.58084 9.84533 5.54525 9.77889C5.50965 9.71244 5.49458 9.63806 5.50173 9.56408C5.50888 9.49009 5.53796 9.41943 5.58571 9.36L8.15714 6.16C8.19706 6.11032 8.24883 6.07 8.30834 6.04223C8.36785 6.01446 8.43347 6 8.5 6C8.56653 6 8.63215 6.01446 8.69166 6.04223C8.75117 6.07 8.80294 6.11032 8.84286 6.16L11.4143 9.36C11.462 9.41943 11.4911 9.49009 11.4983 9.56408C11.5054 9.63806 11.4903 9.71244 11.4548 9.77889C11.4192 9.84533 11.3644 9.90121 11.2967 9.94026C11.229 9.97931 11.151 10 11.0714 10H5.92857Z"/>
                </svg>
                <span>${Math.abs(data.delta)}</span>
            </div>
            </div>
        </div>
    `
    return baseTemplate.content
}

function updateLiveSearch() {
    let url = script.dataset.updatedataqueryurl
    var params = {
        list_id: script.dataset.listid,
        region_id: liveParams.region_id
    };

    loader.classList.add('active')
    fetch(url, {
        method: "POST",
        headers: {
            "Content-type": "application/json"
        },
        body: JSON.stringify(params)
    })
        .then(response => response.json())
        .then(data => {
            alert('Данные успешно обновились')
            loader.classList.remove('active')
            window.location.reload()
        })
        .catch(error => {
            // Обработка ошибки
            console.error("Error:", error);
            loader.classList.remove('active')
        });

};


if (liveParams.region_id != '') {
  selectedRegion.children[0].innerHTML = liveParams.region_id
} else {
  let firstRegion = regionCodes[liveParams.search_system][0]
  selectedRegion.children[0].innerHTML = firstRegion.Geo
  liveParams.region_id = firstRegion.Geoid
}

function limitRegions(filteredRegions) {
  if (filteredRegions) {
    filteredRegions.slice(0, 10).forEach(item => { // ограничиваем количество подсказок до 10
        const div = document.createElement('div');
        div.className = 'body-panel__google-item folder';
        div.innerHTML = `<span id="region-${item.Geoid}">${item.Geo}</span>`
        div.onclick = function() {
            selectedRegion.children[0].innerHTML = item.Geo;
            suggestionsContainer.innerHTML = ''; // Очищаем подсказки после выбора
            input.value = ''
            liveParams.region_id = item.Geoid 
            SetDataTable()
        };
        suggestionsContainer.appendChild(div);
    });
  }
}

selectedRegion.addEventListener('click', () => {
  input.value = ''
  suggestionsContainer.innerHTML = ''
  let filteredRegions = regionCodes[liveParams.search_system];
  limitRegions(filteredRegions)
})

input.addEventListener('input', () => {
  const query = input.value.toLowerCase();
  suggestionsContainer.innerHTML = ''; // Очищаем контейнер с подсказками
  let filteredRegions;

  // Если поле ввода пустое, показываем все регионы
  if (query.length === 0) {
    filteredRegions = regionCodes[liveParams.search_system]
  } else {
    // Фильтруем регионы, если есть введенный текст
    filteredRegions = regionCodes[liveParams.search_system].filter((item) => {
      return item.Geo.toLowerCase().includes(query)
    });
  }

  limitRegions(filteredRegions)
  // Позиционирование контейнера с подсказками
  const rect = input.getBoundingClientRect();
  suggestionsContainer.style.top = `${rect.height}px`; // Сдвигаем подсказки вниз относительно поля ввода
})

function handleSorting() {

  //Показать меню сортировки у заголовков 
  let items = document.querySelectorAll(".header-pos__characters")
  items.forEach((item) => {
    let svg_icon = item.querySelector('svg:last-child')
    svg_icon.style = 'opacity: 0'
    item.addEventListener("click", () => {
      items.forEach(item => {
        item.querySelector('svg:last-child').style = 'opacity: 0;'
        item.classList.remove('active--sort')
      })
      if (liveParams.metric_type == item.dataset.metric && liveParams.state_type == 'result') {
        liveParams.button_state = liveParams.button_state == 2 ? 0 : liveParams.button_state + 1
      } else {
        liveParams.button_state = 1
      }
      if (liveParams.button_state != 0) {
        svg_icon.style = `transform: rotate(${liveParams.button_state == 1 ? '180deg' : '0deg'})`
        item.classList.add('active--sort')
      }
      liveParams.state_type = 'result'
      liveParams.button_date = ''
      liveParams.metric_type = item.dataset.metric
      SetDataTable()
    })
  });

  //Показать меню сортировки у дат
  document.querySelector(".header-pos__dates").addEventListener("click", (event) => {
    const item = event.target.closest(".header-pos__date");
    items.forEach(item => {
      item.style = ''
      item.classList.remove('active--sort')
      item.querySelector('svg:last-child').style = 'opacity: 0'
    })
    item.classList.add("active--sort");
    item.dataset.sort = 'P';
    liveParams.state_type = 'date'
    if (liveParams.button_date == item.dataset.buttondate) {
      liveParams.button_state = liveParams.button_state == 2 ? 0 : liveParams.button_state + 1
    } else {
      let oldDate = document.querySelector(`[data-buttondate="${liveParams.button_date}"]`)
      if (oldDate) {
        oldDate.classList.remove('active--sort')
      }
      liveParams.button_state = 1
    }
    liveParams.metric_type = item.dataset.sort
    liveParams.button_date = item.dataset.buttondate
    SetDataTable()
  });
}

window.addEventListener("load", ()=> { 
  SetDataTable()
  handleSorting()
  datePicker(SetDataTable, liveParams)
});