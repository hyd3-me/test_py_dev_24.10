import { datePicker } from '/static/js/datePicker.js'
import { createChart } from '/static/js/graphic.js'
import { IncrementDate, getFormattedDate, calculateDays } from '/static/js/dateUtils.js'

export const queryParams = {
  search_text: '',
  start_date: IncrementDate(14).dateObj,
  end_date: IncrementDate(0).dateObj,
  paginationResultsCnt: 50,
  currentPage: 1,
  amount: 15,
  button_date: '',
  button_state: 0, // order options [none, increase, decrease]
  metric_type: '',
  state_type: '', // result or date
  total_records: 0,
  list_name: "None"
}

let state = null;
let global_date = null;
let metric_type = null;
let state_type = "date";
let script = document.querySelector('#queryScript')

let queryTable = document.querySelector('.positions__items')
let queryHeaderRow = document.querySelector(".header-pos__dates");
let queryTotalsRow = document.querySelector(".positions__total")
let searchText = document.querySelector('#searchText')
let paginationButton = document.querySelectorAll('.pos-pag__variable')
let loader = document.querySelector('.cssload-container')

let exportExcelButton = document.querySelector('#generateExcel')
let exportCsvButton = document.querySelector('#generateCsv')

searchText.addEventListener('change', (event) => {
  queryParams.search_text = event.target.value
  SetDataTable()
})

paginationButton.forEach((option) => {
  option.addEventListener('click', (event) => {
    queryParams.paginationResultsCnt = parseInt(event.target.innerText)
    document.querySelector('#selectedPagesCnt').innerText = event.target.innerText
    document.querySelector('.pos-pag__variables').classList.remove('active')
    queryParams.currentPage = 1
    SetDataTable()
  })
})

let prevArrow =  document.querySelector('.pos-pag__arrow-1')
let nextArrow =  document.querySelector('.pos-pag__arrow-2')
prevArrow.addEventListener('click', (event) => {changeCurrentPage(event.target)})
nextArrow.addEventListener('click', (event) => {changeCurrentPage(event.target)})

function changeCurrentPage(target){
  let max_pages = Math.floor(queryParams.total_records / queryParams.paginationResultsCnt) + 1
  if (target.classList.contains('pos-pag__arrow-2')) {
    queryParams.currentPage = queryParams.currentPage + 1 < max_pages ? queryParams.currentPage + 1 : max_pages
  } else {
    queryParams.currentPage = queryParams.currentPage - 1 > 1 ? queryParams.currentPage - 1 : 1
  }
  SetDataTable()
}


let excelUrl = exportExcelButton.dataset.url 
exportExcelButton.addEventListener('click', () => generateExcel(excelUrl))

let csvUrl = exportCsvButton.dataset.url
exportCsvButton.addEventListener('click', () => generateCsv(csvUrl))

export function SetDataTable() {
    loader.classList.add('active')
    queryTable.innerHTML = ''
    queryHeaderRow.innerHTML = ''
    let columns = [
      {"title": "result"},
    ]

    queryParams.amount = calculateDays(queryParams.start_date, queryParams.end_date)

    for (let i = 0; i <= queryParams.amount; i++) {
        let date = IncrementDate(i, queryParams.end_date); 
        columns.push({'title': date.dateStr})

        let nameCell = document.createElement('div');
        nameCell.setAttribute('class', 'header-pos__date')
        nameCell.setAttribute('data-sort', '')
        nameCell.setAttribute('data-order', queryParams.button_state) 
        nameCell.setAttribute('data-stateType', 'date')
        nameCell.setAttribute('data-buttondate', date.dateStr)
        if (date.dateStr == queryParams.button_date && queryParams.button_state != 0) {
          nameCell.classList.add('active--sort')
        }
        let { day, month, year, weekday } = getFormattedDate(date.dateObj)
        let sort_indicator = `
          <svg class="header-pos__svg--hover" style="transform: rotate(${queryParams.button_state == 1 ? '0deg' : '180deg'})" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.42857 10C5.34898 10 5.27096 9.97931 5.20326 9.94026C5.13555 9.90121 5.08084 9.84533 5.04525 9.77889C5.00965 9.71244 4.99458 9.63806 5.00173 9.56408C5.00888 9.49009 5.03796 9.41943 5.08571 9.36L7.65714 6.16C7.69706 6.11032 7.74883 6.07 7.80834 6.04223C7.86785 6.01446 7.93347 6 8 6C8.06653 6 8.13215 6.01446 8.19166 6.04223C8.25117 6.07 8.30294 6.11032 8.34286 6.16L10.9143 9.36C10.962 9.41943 10.9911 9.49009 10.9983 9.56408C11.0054 9.63806 10.9903 9.71244 10.9548 9.77889C10.9192 9.84533 10.8644 9.90121 10.7967 9.94026C10.729 9.97931 10.651 10 10.5714 10H5.42857Z"></path>
          </svg>
        `
        let nameCellHTML = `
          <button class="header-pos__date-button btn-reset">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M2 3L8.4 10.3897V15.9375L11.6 17.5V10.3897L18 3H2Z" stroke="#BBBBBB" stroke-width="1.2" stroke-linejoin="round"></path>
            </svg>
            <div class="header-pos__date-value">
              <span>${day}.${month}</span><span>.</span><span>${year}</span>
              <span>${weekday}</span>
            </div>
            ${nameCell.classList.contains('active--sort') && queryParams.button_state != 0 ? sort_indicator : ''}
          </button>
          <div class="project__dropdown-wrapper">
            <div class="pos-pag__variable">Позиция</div>
            <div class="pos-pag__variable">Клики</div>
            <div class="pos-pag__variable">Показы</div>
            <div class="pos-pag__variable">CTR</div>
          </div>
        `;
        nameCell.innerHTML = nameCellHTML
        queryHeaderRow.appendChild(nameCell);
    }

    // Сортировка по показам по умолчанию
    state_type = "result";                
    state = "decrease";
    metric_type = "R";

    let orderOptions = [null, 'decrease', 'increase']
    let url = script.dataset.setdatatableurl
    var params = {
        length: queryParams.paginationResultsCnt, // количество отображаемых элементов
        start: (queryParams.currentPage - 1) * queryParams.paginationResultsCnt, // номер страницы
        start_date: queryParams.start_date ? IncrementDate(0, queryParams.start_date).dateStr : null, // Дата начала поиска
        end_date: queryParams.end_date ? IncrementDate(0, queryParams.end_date).dateStr : null, // Дата начала поиска
        amount: calculateDays(queryParams.start_date, queryParams.end_date),
        search_text: queryParams.search_text,
        button_date: queryParams.button_date ? queryParams.button_date : global_date,
        button_state: orderOptions[queryParams.button_state],
        metric_type: queryParams.metric_type ? queryParams.metric_type : metric_type,
        state_type: queryParams.state_type ? queryParams.state_type : state_type,
        sort_result: false, // document.getElementById("input_sort") ? document.getElementById("input_sort").checked : false,
        sort_desc: false, // document.getElementById("input_desc") ? document.getElementById("input_desc").checked : false,
        list_name: queryParams.list_name,
    };

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
            }
              getTotalSum(totalUrl)
              document.querySelector('#currentPage').value = queryParams.currentPage
              loader.classList.remove('active')

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
        <label class="checkbox">
          <input type="checkbox" role="switch">
          <span title="${data['title']}" class="copied-text" style="overflow: scroll; width: 200px; max-height: 85px;">${data['title']}</span>
        </label>
      </div>
      <div class="item-pos__block">
        <div class="copy-item">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_336_12215-${data['id']}" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
              <rect width="24" height="24" fill="#D9D9D9"></rect>
            </mask>
            <g mask="url(#mask0_336_12215-${data['id']})">
              <path d="M9.84118 15.2V15.3H9.94118H17.3529H17.4529V15.2V5.6V5.5H17.3529H9.94118H9.84118V5.6V15.2ZM6.64706 18.5H15.6059V19.9H6.64706C6.21993 19.9 5.85724 19.7533 5.5535 19.4583C5.24986 19.1633 5.1 18.8123 5.1 18.4V7.3H6.54706V18.4V18.5H6.64706ZM9.94118 16.7C9.51404 16.7 9.15135 16.5533 8.84762 16.2583C8.54397 15.9633 8.39412 15.6123 8.39412 15.2V5.6C8.39412 5.18769 8.54397 4.8367 8.84762 4.54173C9.15135 4.24667 9.51404 4.1 9.94118 4.1H17.3529C17.7801 4.1 18.1428 4.24667 18.4465 4.54173C18.7501 4.8367 18.9 5.18769 18.9 5.6V15.2C18.9 15.6123 18.7501 15.9633 18.4465 16.2583C18.1428 16.5533 17.7801 16.7 17.3529 16.7H9.94118Z" fill="#747474" stroke="white" stroke-width="0.2"></path>
            </g>
          </svg>
        </div>
        <div class="item-pos__values">
          <div class="item-pos__values-rate">${data['total_position'].toFixed(2)}</div>
          <div class="item-pos__values-short">
            <span>${data['total_clicks']}</span>
            <span>${data['total_impressions']}</span>
          </div>
          <div class="item-pos__values-hover">
            <div class="item-pos__values-hover__title">Показатели</div>
            <div class="item-pos__values-hover__item">
              <span>Позиция</span>
              <span>${data['total_position']}</span>
            </div>
            <div class="item-pos__values-hover__item">
              <span>Клики</span>
              <span>${data['total_clicks']}</span>
            </div>
            <div class="item-pos__values-hover__item">
              <span>CTR</span>
              <span>${data['total_CTR']}%</span>
            </div>
            <div class="item-pos__values-hover__item">
              <span>Показы</span>
              <span>${data['total_impressions']}</span>
            </div>
            <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.2857 2.23145C22.5181 2.23145 22.7437 2.29195 22.9371 2.40351C23.1303 2.51495 23.2816 2.67156 23.3783 2.85201C23.4747 3.03206 23.5143 3.23085 23.4954 3.42705C23.4764 3.62339 23.399 3.81444 23.2674 3.97825L23.6535 4.28848L23.2674 3.97825L12.9817 16.7783C12.8714 16.9155 12.7261 17.0297 12.5552 17.1094C12.3843 17.1892 12.1941 17.2314 12 17.2314C11.8059 17.2314 11.6157 17.1892 11.4448 17.1094C11.2739 17.0297 11.1286 16.9155 11.0183 16.7783L0.732615 3.97825C0.600978 3.81444 0.523578 3.62338 0.504609 3.42705C0.485654 3.23086 0.525271 3.03206 0.621726 2.85202C0.7184 2.67156 0.869674 2.51495 1.06287 2.40352C1.25627 2.29196 1.48194 2.23145 1.71429 2.23145L22.2857 2.23145Z" fill="white" stroke="#F4F4F4"></path>
              <path d="M22.2857 1.73002e-07C22.6041 1.40873e-07 22.9161 0.0827428 23.187 0.238958C23.4578 0.395174 23.6766 0.61869 23.819 0.884459C23.9614 1.15023 24.0217 1.44775 23.9931 1.74369C23.9645 2.03963 23.8482 2.32229 23.6571 2.56L13.3714 15.36C13.2117 15.5587 13.0047 15.72 12.7667 15.8311C12.5286 15.9422 12.2661 16 12 16C11.7339 16 11.4714 15.9422 11.2333 15.8311C10.9953 15.72 10.7883 15.5587 10.6286 15.36L0.34286 2.56C0.151843 2.32229 0.0355176 2.03963 0.00692641 1.74369C-0.0216648 1.44775 0.0386093 1.15023 0.180985 0.884461C0.323361 0.618692 0.542216 0.395176 0.813033 0.238961C1.08385 0.082745 1.39592 2.28115e-06 1.71429 2.24902e-06L22.2857 1.73002e-07Z" fill="white"></path>
            </svg>
          </div>
        </div>
      </div>
    </div>
    <div class="item-pos__others positions-others">
      <div class="item-pos__value">${data['total_clicks']}</div>
      <div class="item-pos__value">${data['total_CTR']}%</div>
      <div class="item-pos__value">${data['total_impressions']}</div>
    </div>
  `
  return baseTemplate.content
}

function setDatasOfItem(data){
  let baseTemplate = document.createElement('template')
  baseTemplate.innerHTML  = `
    <div class="item-pos__data ${data['color']}-data">
      <div class="item-pos__data-first">
        <div class="item-pos__position">${data['position'].toFixed(2)}</div>
        <div class="item-pos__increase increase-up">
          <svg width="17" height="16" viewBox="0 0 17 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5.92857 10C5.84898 10 5.77096 9.97931 5.70326 9.94026C5.63555 9.90121 5.58084 9.84533 5.54525 9.77889C5.50965 9.71244 5.49458 9.63806 5.50173 9.56408C5.50888 9.49009 5.53796 9.41943 5.58571 9.36L8.15714 6.16C8.19706 6.11032 8.24883 6.07 8.30834 6.04223C8.36785 6.01446 8.43347 6 8.5 6C8.56653 6 8.63215 6.01446 8.69166 6.04223C8.75117 6.07 8.80294 6.11032 8.84286 6.16L11.4143 9.36C11.462 9.41943 11.4911 9.49009 11.4983 9.56408C11.5054 9.63806 11.4903 9.71244 11.4548 9.77889C11.4192 9.84533 11.3644 9.90121 11.2967 9.94026C11.229 9.97931 11.151 10 11.0714 10H5.92857Z" fill="#009906"></path>
          </svg>
          <span>${data['up']}</span>
        </div>
      </div>
      <div class="item-pos__infos">
          <div class="item-pos__info">
            <span class="item-pos__name">Клики</span>
            <span class="item-pos__text">${data['clicks']}</span>
          </div>
          <div class="item-pos__info">
            <span class="item-pos__name">CTR</span>
            <span class="item-pos__text">${data['CTR']}%</span>
          </div>
          <div class="item-pos__info">
            <span class="item-pos__name">Показы</span>
            <span class="item-pos__text">${data['impressions']}</span>
          </div>
      </div>
      <div class="item-pos__infos-short short-infos">
          <div class="short-infos__item">
            <span class="item-pos__name">Показы</span>
            <span class="item-pos__text">${data['impressions']}</span>
          </div>
          <div class="short-infos__item">
            <span class="item-pos__name">Клики</span>
            <span class="item-pos__text">${data['clicks']}</span>
          </div>
      </div>
      <div class="item-pos__values-hover">
        <div class="item-pos__values-hover__title">${data['date']}</div>
        <div class="item-pos__values-hover__item">
          <span>Позиция</span>
          <span>${data['position']}</span>
        </div>
        <div class="item-pos__values-hover__item">
          <span>Клики</span>
          <span>${data['clicks']}</span>
        </div>
        <div class="item-pos__values-hover__item">
          <span>CTR</span>
          <span>${data['CTR']}%</span>
        </div>
        <div class="item-pos__values-hover__item">
          <span>Показы</span>
          <span>${data['impressions']}</span>
        </div>
        <svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M22.2857 2.23145C22.5181 2.23145 22.7437 2.29195 22.9371 2.40351C23.1303 2.51495 23.2816 2.67156 23.3783 2.85201C23.4747 3.03206 23.5143 3.23085 23.4954 3.42705C23.4764 3.62339 23.399 3.81444 23.2674 3.97825L23.6535 4.28848L23.2674 3.97825L12.9817 16.7783C12.8714 16.9155 12.7261 17.0297 12.5552 17.1094C12.3843 17.1892 12.1941 17.2314 12 17.2314C11.8059 17.2314 11.6157 17.1892 11.4448 17.1094C11.2739 17.0297 11.1286 16.9155 11.0183 16.7783L0.732615 3.97825C0.600978 3.81444 0.523578 3.62338 0.504609 3.42705C0.485654 3.23086 0.525271 3.03206 0.621726 2.85202C0.7184 2.67156 0.869674 2.51495 1.06287 2.40352C1.25627 2.29196 1.48194 2.23145 1.71429 2.23145L22.2857 2.23145Z" fill="white" stroke="#F4F4F4"></path>
          <path d="M22.2857 1.73002e-07C22.6041 1.40873e-07 22.9161 0.0827428 23.187 0.238958C23.4578 0.395174 23.6766 0.61869 23.819 0.884459C23.9614 1.15023 24.0217 1.44775 23.9931 1.74369C23.9645 2.03963 23.8482 2.32229 23.6571 2.56L13.3714 15.36C13.2117 15.5587 13.0047 15.72 12.7667 15.8311C12.5286 15.9422 12.2661 16 12 16C11.7339 16 11.4714 15.9422 11.2333 15.8311C10.9953 15.72 10.7883 15.5587 10.6286 15.36L0.34286 2.56C0.151843 2.32229 0.0355176 2.03963 0.00692641 1.74369C-0.0216648 1.44775 0.0386093 1.15023 0.180985 0.884461C0.323361 0.618692 0.542216 0.395176 0.813033 0.238961C1.08385 0.082745 1.39592 2.28115e-06 1.71429 2.24902e-06L22.2857 1.73002e-07Z" fill="white"></path>
        </svg>
      </div>
    </div> 
  `
  return baseTemplate.content
}

function generateExcel(url_f) {
  loader.classList.add('active')
  const data = {
      length: queryParams.paginationResultsCnt, // количество отображаемых элементов
      start: queryParams.currentPage * queryParams.paginationResultsCnt, // номер страницы
      start_date: queryParams.start_date ? IncrementDate(0, queryParams.start_date).dateStr : null, // Дата начала поиска
      end_date: queryParams.end_date ? IncrementDate(0, queryParams.end_date).dateStr : null, // Дата начала поиска
      amount: calculateDays(queryParams.start_date, queryParams.end_date),
      search_text: queryParams.search_text,
      sort_result: false, // document.getElementById("input_sort") ? document.getElementById("input_sort").checked : false,
      sort_desc: false, // document.getElementById("input_desc") ? document.getElementById("input_desc").checked : false,
      button_date: global_date,
      button_state: state,
      metric_type: metric_type,
      state_type: state_type,
      list_name: 'query.xlsx',
  };

  fetch(url_f, {
      method: 'POST',
      headers: {
          "Content-Type": 'application/json'
      },
      body: JSON.stringify(data)
  })
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok.');
          }
          return response.blob();
      })
      .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'query.xlsx';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          loader.classList.remove('active')
      })
      .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
          loader.classList.remove('active')
      });
}

function generateCsv(url_f) {
  loader.classList.add('active')
  const data = {
      length: queryParams.paginationResultsCnt, // количество отображаемых элементов
      start: queryParams.currentPage * queryParams.paginationResultsCnt, // номер страницы
      start_date: queryParams.start_date ? IncrementDate(0, queryParams.start_date).dateStr : null, // Дата начала поиска
      end_date: queryParams.end_date ? IncrementDate(0, queryParams.end_date).dateStr : null, // Дата начала поиска
      amount: calculateDays(queryParams.start_date, queryParams.end_date),
      search_text: queryParams.search_text,
      sort_result: false,
      sort_desc: false,
      button_date: global_date,
      button_state: state,
      metric_type: metric_type,
      state_type: state_type,
      list_name: 'query.csv',
  };

  fetch(url_f, {
      method: 'POST',
      headers: {
          "Content-Type": 'application/json'
      },
      body: JSON.stringify(data)
  })
      .then(response => {
          if (!response.ok) {
              throw new Error('Network response was not ok.');
          }
          return response.blob();
      })
      .then(blob => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = 'query.csv';
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          loader.classList.remove('active')
      })
      .catch(error => {
          console.error('There was a problem with the fetch operation:', error);
          loader.classList.remove('active')
      });
}

let totalUrl = queryTotalsRow.dataset.url
function getTotalSum(url_f) {
  var params = {
      start_date: IncrementDate(0, queryParams.start_date).dateStr,
      end_date: IncrementDate(0, queryParams.end_date).dateStr,
      search_text: queryParams.search_text, 
      list_name: queryParams.list_name,
  };

  fetch(url_f, {
      method: "POST",
      headers: {
          "Content-type": "application/json"
      },
      body: JSON.stringify(params)
  })
      .then(response => response.json())
      .then(data => {
          prepareChartData(data)
          setTotalTable(data)
          let pagesCount = document.querySelector('#pagesCount')
          pagesCount.innerText = `Из ${Math.floor(queryParams.total_records / queryParams.paginationResultsCnt) + 1}`
      })
      .catch(error => {
          // Обработка ошибки
          console.error('There was a problem with the fetch operation:', error);
      });
}

function setTotalTable(data) {
  queryTotalsRow.innerHTML = ''
  let metrics = data.metricks_data
  queryParams.total_records = data.total_records
  queryTotalsRow.appendChild(setBaseOfTotal(
    data.total_records, metrics
  ))
  let totalDatesContainer = document.createElement('div')
  totalDatesContainer.setAttribute('class', 'positions__dates')

  for (let i = 0; i <= queryParams.amount; i++) {
    let date = IncrementDate(i, queryParams.end_date); 

    let clicks = metrics[0][date.dateStr]
    let impressions = metrics[1][date.dateStr]
    let top_50 = metrics[2][date.dateStr]

    totalDatesContainer.appendChild(
      setDatesOfTotal(
        Boolean(clicks) ? clicks : 0,
        Boolean(impressions) ? impressions : 0,
        Boolean(top_50) ? top_50 : 0,
      )
    )
  }
  queryTotalsRow.appendChild(totalDatesContainer)
}

function prepareChartData(data){
  let datasetParams = [
    ['Клики', data.clean_data[0], 'rgba(75, 192, 192)'],
    ['Показы', data.clean_data[1], 'rgba(54, 162, 235)'],
    ['Топ-50 запросов', data.clean_data[2], 'rgba(153, 102, 255)'],
    ['Топ-3 запросов', data.clean_data[3], 'rgba(255, 216, 106)'],
    ['Топ-5 запросов', data.clean_data[4], 'rgba(255, 216, 206)'],
    ['Топ-10 запросов', data.clean_data[5], 'rgba(255, 216, 156)'],
    ['Тенденции кликов', data.trendline_data[0], 'rgba(255, 159, 64)'],
    ['Тенденции показов', data.trendline_data[1], 'rgba(255, 99, 132)'],
    ['Тенденции Топ-50 запросов', data.trendline_data[2], 'rgba(255, 216, 106)'],
    ['Тенденции Топ-3 запросов', data.trendline_data[3], 'rgba(205, 216, 106)'],
    ['Тенденции Топ-5 запросов', data.trendline_data[4], 'rgba(155, 216, 106)'],
    ['Тенденции Топ-10 запросов', data.trendline_data[5], 'rgba(55, 216, 106)'],
  ]

  let dates = []
  for (let i = 0; i <= queryParams.amount; i++) {
    let date = IncrementDate(i, queryParams.end_date); 
    dates.push(date.dateStr)
  }

  let allDatasets = datasetParams.map((data) => {
    return {
      label: data[0],
      data: data[1],
      pointRadius: 4,
      borderWidth: 1,
      borderColor: data[2],
      pointBorderWidth: 0,
      pointBackgroundColor: data[2],
    }
  }) 
  createChart(dates, allDatasets)
}

function setBaseOfTotal(total_records, metrics) {
  let baseTemplate = document.createElement('template')
  baseTemplate.innerHTML = `
      <div class="positions__base">
        <div>
          Всего слов
          <span class="positions__total-words">${total_records}</span>
        </div>
        <div class="positions__total-pos">
          <div class="positions__total-pos__more">
            <span>${metrics[0].result}</span>
            <span>${metrics[1].result}</span>
          </div>
        </div>
      </div>
      <div class="positions__others">
        <div class="positions__total-other">
          <span>${metrics[0].result}</span>
        </div>
        <div class="positions__total-other">
        </div>
        <div class="positions__total-other">
          <span>${metrics[1].result}</span>
        </div>
      </div> 
  `
  return baseTemplate.content
}

function setDatesOfTotal(clicks, impressions, top50) {
  let baseTemplate = document.createElement('template')
  baseTemplate.innerHTML = `
  <div class="positions__date">
    <div class="positions__total-value">
      <span>Клики</span>
      <span class="positions__total-clicks">${clicks}</span>
    </div>
    <div class="positions__total-value positions__total-value--m">
      <span>Показы</span>
      <span class="positions__total-shows">${impressions}</span>
    </div>
    <div class="positions__total-value">
      <span>В топ-50</span>
      <span class="positions__total-rates">${top50}</span>
    </div>
    <div class="positions__date-short">
      <div class="positions__date-short__top">
        <span>В топ-50</span>
        <span>${top50}</span>
      </div>
      <div class="positions__date-short__bottom">
        <span>${clicks}</span>
        <span>${impressions}</span>
      </div>
    </div>
  </div> 
  `
  return baseTemplate.content
}

let updateQueryButton = document.querySelector('#updateQueries')
updateQueryButton.addEventListener('click', () => {
  updateDataQuery(script.dataset.updatedataqueryurl)
})

function updateDataQuery(url) {
  loader.classList.add('active')
  fetch(url)
      .then(async response => {
          // проверяем статус ответа
          if (!response.ok) {
              const errdata = await response.json();
            // обработка ошибки в зависимости от статуса
            if (response.status === 400) {
              throw new Error(errdata.detail || 'bad request');
            }
          }
          return response.json();  // если статус успешный, возвращаем json
      })
      .then(data => {
          console.log('success:', data);
          // обработка успешного ответа
          alert(data.message)
          loader.classList.remove('active')
          window.location.reload();  // обновление страницы
      })
      .catch((error) => {
          // обработка ошибки
          loader.classList.remove('active')
          alert(error.message);
      });
}

let deleteDaysConfirm = document.querySelector('#deleteDaysConfirm')
deleteDaysConfirm.addEventListener('click', ()=> {deleteDataForLast(deleteDaysConfirm.dataset.url)})

async function deleteDataForLast(url) {
  // Получить значение из поля ввода
  const days = document.querySelector('#deleteDaysInput').value;

  // Проверка корректности значения
  if (days < 1 || days > 13) {
      alert("Incorrect value (1-13)");
      return;
  
}

  // Запрос подтверждения удаления
  const confirmation = prompt(`Для подтверждения удаления данных за ${days} дней введите 'delete':`);
  if (confirmation !== 'delete') {
      alert('Удаление отменено.');
      return;
  }

  if (days) {
      try {
          const response = await fetch(`${url}?days=${days}`, {
              method: 'DELETE',
              headers: {
                  'Content-Type': 'application/json',
              }
          });

          if (response.ok) {
              // Запрос выполнен успешно
              const result = await response.json();
              window.location.reload();
          } else {
              // Обработка ошибки сервера
              const errorData = await response.json();
              alert('Error: ' + errorData.detail);
          }
      } catch (error) {
          // Обработка ошибки запроса
          console.error('Error during delete request:', error);
          alert('An error occurred during the delete request. Please try again.');
      }
  } else {
      alert('Please enter a number of days.');
  }
}

  function handleSorting() {
    //Кнопка удаления сортировок позиций в датах
    if (document.querySelector(".body-panel__reset-sort")) {
      document
        .querySelector(".body-panel__reset-sort")
        .addEventListener("click", (el) => {
          el.target.classList.remove("active");
  
          const allSorted = document.querySelectorAll(".active--sort");
  
          allSorted.forEach((el) => {
            el.classList.remove("active--sort");
            el.dataset.sort = "";
          });
          queryParams.button_date = ''
          queryParams.button_state = 0
          queryParams.metric_type = ''
          queryParams.state_type = ''
          SetDataTable()
        });
    }
  
    //Показать меню сортировки у заголовков 
    let items = document.querySelectorAll(".header-pos__characters")
    items.forEach((item) => {
      let svg_icon = item.querySelector('svg')
      svg_icon.style = 'opacity: 0'
      item.addEventListener("click", () => {
        const reserSort = document.querySelector(".body-panel__reset-sort");
        items.forEach(item => {
          item.querySelector('svg').style = 'opacity: 0;'
          item.classList.remove('active--sort')
        })
        if (queryParams.metric_type == item.dataset.metric && queryParams.state_type == 'result') {
          queryParams.button_state = queryParams.button_state == 2 ? 0 : queryParams.button_state + 1
        } else {
          queryParams.button_state = 1
        }
        if (queryParams.button_state != 0) {
          svg_icon.style = `transform: rotate(${queryParams.button_state == 1 ? '180deg' : '0deg'})`
          item.classList.add('active--sort')
        }
        queryParams.state_type = 'result'
        queryParams.button_date = ''
        queryParams.metric_type = item.dataset.metric
        SetDataTable()
        reserSort.classList.add("active");
      })
    });
  
    //Показать меню сортировки у дат
    document.querySelector(".header-pos__dates")?.addEventListener("click", (event) => {
      const item = event.target.closest(".header-pos__date");
      const dropItemCliked = event.target.classList.contains("pos-pag__variable");
      const dropClicked = event.target.classList.contains(
        "project__dropdown-wrapper"
      );
  
      //Клик по дате
      if (item && !dropClicked) {
        const countPages = () => {
          const t = item;
          var e = t.querySelector(".header-pos__date-button");
          let r = !1;
          const c = () => {
            t.classList.remove("active"), (r = !1);
          };
          t.classList.toggle("active"), (r = !r);
          window.addEventListener("click", (e) => {
            r && !t.contains(e.target) && c();
          }),
            window.addEventListener("keydown", (e) => {
              r && "Escape" === e.key && c();
            });
        };
        countPages();
      }
      if (dropItemCliked) {
        const reserSort = document.querySelector(".body-panel__reset-sort");
        const metricTypes = {
          'Клики': 'K',
          'Позиция': 'P',
          'CTR': 'C',
          'Показы': 'R',
        }
        items.forEach(item => {
          item.style = ''
          item.querySelector('svg').style = 'opacity: 0'
        })
        item.classList.add("active--sort");
        item.dataset.sort = event.target.textContent;
        queryParams.state_type = 'date'
        let selected_metric = metricTypes[item.dataset.sort]
        if (queryParams.button_date == item.dataset.buttondate && queryParams.metric_type == selected_metric) {
          queryParams.button_state = queryParams.button_state == 2 ? 0 : queryParams.button_state + 1
        } else {
          queryParams.button_state = 1
        }
        queryParams.metric_type = metricTypes[item.dataset.sort]
        queryParams.button_date = item.dataset.buttondate
        SetDataTable()
        reserSort.classList.add("active");
      }
    });
  }

window.addEventListener("DOMContentLoaded", ()=> { 
  SetDataTable()
  handleSorting()
  datePicker(SetDataTable, queryParams)
})