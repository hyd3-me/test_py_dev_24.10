let queryEditScript = document.querySelector('#queryEditScript')
let proceedToQuery = document.querySelector('.edit-title>a')
let submitChangesBtn = document.querySelector('#submitChanges') 

proceedToQuery.addEventListener('click', () => proceedToProjectQueryTest(proceedToQuery.title))
submitChangesBtn.addEventListener('click', (event) => submitChanges(event.target))

function getSelectedConfig() {
    return localStorage.getItem('selectedConfig') || 'Dropdown';
}

function setSelectedConfig(configName) {
    localStorage.setItem('selectedConfig', configName);
}

async function selectConfig(configName) {
    setSelectedConfig(configName);

    try {
        const response = await fetch(queryEditScript.dataset.set_config, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config_name: configName })
        });

        if (response.ok) {
            console.log('Config set successfully');
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.detail);
            alert('Error: ' + errorData.detail);
        }
    } catch (error) {
        console.error('Error during setting config:', error);
        alert('An error occurred during setting config. Please try again.');
    }
}

async function proceedToProjectQueryTest(configName){
    await selectConfig(configName)
    window.location.href = queryEditScript.dataset.get_queries
  }

async function submitChanges(button) {
    let url = button.dataset.submit_url

    let fields = {
        name: '',
        group_name: '',
        access_token: '',
        user_id: '',
        host_id: '',
    }

    Object.keys(fields).forEach(field => {
        fieldValue = document.querySelector(`#${field}`)
        fields[field] = field != 'group_name' ? fieldValue.value : fieldValue.innerText
    })

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
        response => response.json()
        .then(data => console.log(data))
    )
    .catch(error => console.log(error))
}