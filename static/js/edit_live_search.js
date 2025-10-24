let submitChangesBtn = document.querySelector('#submitChanges')

submitChangesBtn.addEventListener('click', (event) => submitChanges(event.target))

async function submitChanges(button) {
    let url = button.dataset.submit_url

    let fields = {
        name: '',
        main_domain: '',
        queries: {
            old: [],
            new: [],
        },
        regions: {
            old: [],
            new: []
        },
    }
    let queries = document.querySelector('.edit-tab-2')
    let regions = document.querySelector('.edit-tab-3')

    fields.name = document.querySelector('#name').value
    fields.main_domain = document.querySelector('#main_domain').value

    queries.querySelectorAll('.pop-graphics__pos span').forEach(item => {
        fields.queries.old.push({
            id: parseInt(item.dataset.query_id),
            query: item.innerText,
        })
    })
    fields.queries.new.push(
        ...queries.querySelector('.pop-pos__block textarea')
        .value.split('\n')
        .filter(uri => uri.trim() !== '')
    )

    regions.querySelectorAll('.edit__body .regions__body .regions-btn>span').forEach(item => {
        if (item.id) {
            is_exists = item.dataset.is_exists == 'true'
            key = is_exists ? 'old' : 'new'
            data = {
                lr: parseInt(item.id),
                search_system: item.dataset.search_system
            }
            fields.regions[key].push(data)
        }
    })

    let empty_fields = []
    for (let field of Object.entries(fields)) {
        // Проверки на случай отсутствия данных в запросе
        if (field[0] == 'regions') {
            if (field[1].old.length == 0 && field[1].new.length == 0) {
                empty_fields.push(field[0])
            }
        } else if (!field[1] || field[1].length == 0) {
            empty_fields.push(field[0])
        }
    }
    if (empty_fields.length > 0) {
        let error_fields = {
            name: 'название',
            main_domain: 'домен',
            queries: 'запросы',
            regions: 'поисковую систему и регионы'
        }
        alert(`Необходимо заполнить: ${empty_fields.map(item => error_fields[item])}`)
    } else {
        console.log(fields)
        await fetch(
            url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(fields),
            }
        )
        .then(
            response => {
                response.json()
                document.location.reload()
            }
        )
        .catch(error => console.log(error))
    }

}