import * as groupConfig from '/static/js/groupConfig.js'

const projectsDropdown = document.querySelector('#projectsDropdown')

async function grouped_configs() {
    fetch(projectsDropdown.dataset.urlgetconfigs)
    .then(response => response.json())
    .then(data => {
        for (let item of Object.entries(data)) {
            let container = document.createElement('div')
            container.setAttribute('class', 'folder')
            container.setAttribute('data-projectdropdown', '')
            container.setAttribute('data-visible', 'false')
            container.appendChild(setProjectsFolder(item[0]))
            container.appendChild(setProjectsConfig(item[1]))
            projectsDropdown.appendChild(container)
        }
        project()
        dropdown()
    })
  }

let groupTitle = document.querySelector('#groupTitle')
function setProjectsFolder(group){
    let baseTemplate = document.createElement('template')
    baseTemplate.innerHTML = `
    <button class="folder__btn btn-reset" data-toggle="">
        <svg width="20" height="20">
            <use href="/static/img/svg/sprite.svg#folder"></use>
        </svg>
        <span>${group}</span>
    </button>
    `
    return baseTemplate.content
}

function setGroup(title = null) {
    if (title) {
        groupConfig.setSelectedGroup(title)
    } else {
        title = groupConfig.getSelectedGroup()
    }
    groupTitle.children[0].innerHTML = `<span>${title}</span>`
}

function setProjectsConfig(configs){
    let container = document.createElement('div')
    container.setAttribute('class', 'folder__submenu')
    container.setAttribute('data-submenu', '')

    for (let config of configs) {
        let [ name, id ] = config
        let baseTemplate = document.createElement('template')
        baseTemplate.innerHTML = `
            <button class="folder__select btn-reset">
            <span id="${id}">${name}</span>
            <svg class="folder__select-icon" width="16" height="16">
                <use href="/static/img/svg/sprite.svg#link"></use>
            </svg>
            <svg class="folder__select-settings" width="2" height="10" viewBox="0 0 2 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="1" cy="1" r="1" fill="#BBBBBB"></circle>
                <circle cx="1" cy="5" r="1" fill="#BBBBBB"></circle>
                <circle cx="1" cy="9" r="1" fill="#BBBBBB"></circle>
            </svg>
            </button>
        `
        container.appendChild(baseTemplate.content)
    }
    return container
}

function dropdown () {
    document.querySelectorAll("[data-projectdropdown]").forEach((e) => {
      const t = e.querySelector("[data-toggle]"),
        r = e.querySelector("[data-submenu]"),
        c = r.scrollHeight;
      t.addEventListener("click", () => {
        setGroup(t.children[1].innerText)
        t.classList.toggle("active"),
        r.clientHeight
            ? ((r.style.height = "0"), (e.dataset.visible = "false"))
            : ((r.style.height = c + "px"), (e.dataset.visible = "true"));
        console.log('ok')
        r.querySelectorAll('.folder__select>span').forEach((item) => {
            item.addEventListener('click', async () => {
                await groupConfig.selectConfig(item.innerText, projectsDropdown.dataset.setconfig)
                window.location.href = projectsDropdown.dataset.movetoconfig
            })
        })
        });
    });
}

function project() {
    if (!document.querySelector(".project")) return;

    const t = document.querySelector(".project");
    var e = t.querySelector(".project__btn");
    let r = !1;
    const c = () => {
        t.classList.remove("active")
        r = !1
        groupConfig.selectGroup(groupConfig.getSelectedGroup(), projectsDropdown.dataset.urlsetgroup);
    };
    e.addEventListener("click", () => {
        t.classList.toggle("active"), (r = !r);
    });
    window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c() 
    });
    window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
    });
  }

  const logoutButton = document.querySelector('#logoutButton')
  if (logoutButton) {
      logoutButton.addEventListener('click', async () => {
          try {
              const response = await fetch('/auth/jwt/logout', {
                  method: 'POST',
              });
    
              if (response.ok) {
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
  }

window.addEventListener('DOMContentLoaded', () => {
    grouped_configs()
    setGroup()
})