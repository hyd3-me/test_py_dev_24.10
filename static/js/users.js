function setSelectedConfig(configName) {
    localStorage.setItem('selectedConfig', configName);
}

const form = document.querySelector('form')
form.addEventListener('submit', (event) => {
    form.getAttribute('id') === 'register' ? register(event) : login(event)
})
async function login(event) {
    event.preventDefault(); // Предотвращаем стандартную отправку формы

    const formData = new FormData(form);

    try {
        const response = await fetch('/auth/jwt/login', {
            method: 'POST',
            body: formData,
        });

        if (response.ok) {
            window.location.href = document.querySelector('#usersScript').dataset.successurl;
        } else if (response.status === 400) {
            const errorData = await response.json();
            console.error('Error 400:', errorData.detail);
            alert('Неверный логин или пароль');
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.detail);
            alert('Error: ' + errorData.detail);
        }
    } catch (error) {
        console.error('Error during login:', error);
        alert('An error occurred during login. Please try again.');
    }
}

async function register(event) {
    event.preventDefault(); // Предотвращаем стандартную отправку формы

    const formData = new FormData(form);

    const data = {
        email: formData.get('email'), // Получаем email из формы
        password: formData.get('password'),
        is_active: true,
        is_superuser: false,
        is_verified: false,
        id: 0
    };

    try {
        const response = await fetch('/auth/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data),
        });

        console.log(response);
        if (response.ok) {
            window.location.href = '/admin/test';
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.detail);
            alert('Error: ' + errorData.detail);
        }
    } catch (error) {
        console.error('Error during register:', error);
        alert('An error occurred during register. Please try again.');
    }
}

const logoutButton = document.querySelector('#logoutButton')
logoutButton.addEventListener('click', async () => {
    try {
        const response = await fetch('/auth/jwt/logout', {
            method: 'POST',
        });

        if (response.ok) {
            // Очистка localStorage при успешном выходе
            localStorage.removeItem('selectedConfig');
            localStorage.removeItem('selectedGroup');
            window.location.href = '/';
        } else {
            const errorData = await response.json();
            console.error('Error:', errorData.detail);
            alert('Error: ' + errorData.detail);
        }
    } catch (error) {
        console.error('Error during logout:', error);
        alert('An error occurred during logout. Please try again.');
    }
})