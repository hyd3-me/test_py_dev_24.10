export function getSelectedConfig() {
    return localStorage.getItem('selectedConfig') || 'Проект';
}

export function getSelectedGroup() {
    return localStorage.getItem('selectedGroup') || 'Выберите папку';
}

// Функция для установки сохраненного значения в localStorage
export function setSelectedConfig(configName) {
    localStorage.setItem('selectedConfig', configName);
}

export function setSelectedGroup(groupName) {
    localStorage.setItem('selectedGroup', groupName);
}

export async function selectConfig(configName, url) {
    setSelectedConfig(configName);

    // Отправка POST-запроса на эндпоинт set_config
    try {
        const response = await fetch(url, { // '{{ url_for('set_config') }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ config_name: configName })
        });

        if (response.ok) {
            console.log('Config set successfully');
            window.location.reload();
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

export async function selectGroup(groupName, url) {
    setSelectedGroup(groupName);
    setSelectedConfig('None');

    // Отправка POST-запроса на эндпоинт set_group
    try {
        const response = await fetch(url, { // '{{ url_for('set_group') }}', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ group_name: groupName })
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Group set successfully');

            // Перезагрузка страницы, если это необходимо
            window.location.reload();
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.detail);
            alert('Error: ' + errorData.detail);
        }
    } catch (error) {
        console.error('Error during setting group:', error);
        alert('An error occurred during setting group. Please try again.');
    }
}
