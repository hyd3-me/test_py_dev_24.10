const sidebar = () => {
    const e = document.querySelector(".sidebar");
    var t = document.querySelector('[data-collapse="sidebar"]');
    const r = document.querySelector(".burger"),
      c = e.querySelectorAll("[data-expanded]"),
      a =
        (t.addEventListener("click", () => {
          a(), r.classList.add("active");
          setCookie("sidebar", 1, 365);
        }),
        r.addEventListener("click", () => {
          s(), r.classList.remove("active");
          setCookie("sidebar", 2, 365);
        }),
        () => {
          (e.dataset.expanded = "true"), n("true");
        }),
      s = () => {
        (e.dataset.expanded = "false"), n("false");
      },
      n = (t) => {
        c.forEach((e) => {
          e.dataset.expanded = t;
        });
      };
  },
  userDropdown = () => {
    const t = document.querySelector(".user");
    var e = t.querySelector(".user__btn");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };
    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  refresh = () => {
    if (!document.querySelector(".refresh")) return;

    var e = document.querySelector(".refresh"),
      t = e.querySelector(".refresh__btn");
    const r = e.querySelector("[data-refresh-date]"),
      c = e.querySelector("[data-refresh-time]");
    e = () => {
      var { currentDate: e, currentTime: t } = (() => {
        const e = new Date(),
          t = e.toLocaleDateString(),
          r = e.toLocaleTimeString().slice(0, 5);
        return { currentDate: t, currentTime: r };
      })();
      (r.textContent = e), (c.textContent = t);
    };
    e(), t.addEventListener("click", e);
  },
  popProject = (wrap) => {
    const wrapper = document.querySelector(`${wrap}`);
    const t = wrapper.querySelector(".search-projects-menu");
    var e = t.querySelector(".select-project-btn");
    let r = !1;

    const c = () => {
      t.classList.remove("active"), (r = !1);
      e.style.borderColor = "#e5e5ea";
    };

    changeContent(t, e, c, wrap);

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
      e.style.borderColor = "#0076f5";
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  // popFolders = (wrap) => {
  //   const t = document.querySelector(".search-folders-menu");
  //   var e = t.querySelector(".select-folders-btn");
  //   let r = !1;

  //   const c = () => {
  //     t.classList.remove("active"), (r = !1);
  //     e.style.borderColor = "#e5e5ea";
  //   };

  //   changeContent(t, e, c, wrap);

  //   e.addEventListener("click", () => {
  //     t.classList.toggle("active"), (r = !r);
  //     e.style.borderColor = "#0076f5";
  //   }),
  //     window.addEventListener("click", (e) => {
  //       r && !t.contains(e.target) && c();
  //     }),
  //     window.addEventListener("keydown", (e) => {
  //       r && "Escape" === e.key && c();
  //     });
  // },
  regionPopup = document.querySelector('#regionsPopup'),
  regionItems = fetch(regionPopup.dataset.getregionsurl).then(response => response.json().then(data => data.data));
  popRegions = () => {
    const allElements = document.querySelectorAll(".regions-menu");

    allElements.forEach((el) => {
      const t = el;
      var e = t.querySelector(".regions-btn");
      let r = !1;

      const c = () => {
        t.classList.remove("active"), (r = !1);
        e.style.borderColor = "#e5e5ea";
      };

      changeContent(t, e, c, "country");

      if (e.dataset.is_listening != 'active') {
        e.setAttribute('data-is_listening', 'active')
        e.addEventListener("click", async () => {
          t.classList.toggle("active"), (r = !r);
          e.style.borderColor = "#0076f5";
          let input = el.querySelector('.search__dropdown-wrapper input')
          let selectedRegion = el.querySelector('.regions-btn>span')
          let suggestionsContainer = el.querySelector('.project__dropdown')
          limitRegions(Object.entries(await regionItems));
          input.addEventListener('input', async () => {
            query = input.value.toLowerCase();
            suggestionsContainer.innerHTML = '';
            let filteredRegions;
            if (query.length === 0) {
              filteredRegions = Object.entries(await regionItems);
            } else {
              // Фильтруем регионы, если есть введенный текст
              filteredRegions = Object.entries(await regionItems).filter((item) => {
                return item[1].toLowerCase().includes(query)
              });
            }
            limitRegions(filteredRegions)
          })
          function limitRegions(filteredRegions) {
            filteredRegions.slice(0, 10).forEach(item => { // ограничиваем количество подсказок до 10
                const div = document.createElement('div');
                let [id, region] = item
                let search_system = e.querySelector('span').dataset.search_system
                let regionSpan = `<span ${search_system != undefined ? 'data-search_system='+search_system : ''} id="${id}">${region}</span>`
                div.className = 'body-panel__google-item folder';
                div.innerHTML = regionSpan
                div.onclick = function() {
                    selectedRegion.innerText = region;
                    selectedRegion.id = id
                    suggestionsContainer.innerHTML = ''; // Очищаем подсказки после выбора
                    input.value = ''
                    // liveParams.region_id = id
                };
                suggestionsContainer.appendChild(div);
            });
          }
        })
      }
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
    });
  },
  downloads = () => {
    if (!document.querySelector(".body-panel__download")) return;
    const t = document.querySelector(".body-panel__download");
    var e = t.querySelector(".body-panel-download__btn");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };

    changeContent(t, e, c, "body-panel__download");

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  settings = () => {
    if (!document.querySelector(".body-panel__settings")) return;
    const t = document.querySelector(".body-panel__settings");
    var e = t.querySelector(".settings-button");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };
    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  countPages = () => {
    const t = document.querySelector(".pos-pag__variables");
    var e = t.querySelector(".pos-pag-button");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };
    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
    window.addEventListener("click", (e) => {
      r && !t.contains(e.target) && c();
    }),
    window.addEventListener("keydown", (e) => {
      r && "Escape" === e.key && c();
    });
  },
  copy = () => {
    const t = document.querySelector(".copy-wrap");
    var e = t.querySelector(".copy-button");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };
    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
    window.addEventListener("click", (e) => {
      r && !t.contains(e.target) && c();
    }),
    window.addEventListener("keydown", (e) => {
      r && "Escape" === e.key && c();
    });
  },
  google = (body, button) => {
    if (!document.querySelector(`${body}`)) return;
    const t = document.querySelector(`${body}`);
    var e = t.querySelector(`${button}`);
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };

    changeContent(t, e, c, "browser");

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  device = (body, button) => {
    if (!document.querySelector(`${body}`)) return;
    const t = document.querySelector(`${body}`);
    var e = t.querySelector(`${button}`);
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };

    changeContent(t, e, c, "device");

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  deviceRegion = () => {
    if (!document.querySelector(".region__device")) return;

    const allElements = document.querySelectorAll(".region__device");

    allElements.forEach((el) => {
      const t = el;
      var e = t.querySelector(".region__device-btn");
      let r = !1;
      const c = () => {
        t.classList.remove("active"), (r = !1);
      };

      changeContent(t, e, c, "regionDevice");

      e.addEventListener("click", () => {
        t.classList.toggle("active"), (r = !r);
      }),
        window.addEventListener("click", (e) => {
          r && !t.contains(e.target) && c();
        }),
        window.addEventListener("keydown", (e) => {
          r && "Escape" === e.key && c();
        });
    });
  },
  frequency = () => {
    if (!document.querySelector(".frequency__body")) return;
    const t = document.querySelector(".frequency__body");
    var e = t.querySelector(".frequency-btn");
    let r = !1;
    const c = () => {
      t.classList.remove("active"), (r = !1);
    };
    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  copyAndTable = (e) => {
    if (!document.querySelector(".body-panel__copy")) return;
    const t = e.target.closest(".body-panel__copy");
    var e = t.querySelector(".copy-btn");
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
  },
  timeChosePop = (wrap) => {
    if (!document.querySelector(`${wrap} .time-menu`)) return;
    const t = document.querySelector(`${wrap} .time-menu`);
    var e = t.querySelector(".time-btn");
    let r = !1;

    const c = () => {
      t.classList.remove("active"), (r = !1);
    };

    changeContent(t, e, c, wrap);

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  },
  city = (wrap) => {
    if (!document.querySelector(".city")) return;
    const t = document.querySelector(".city");
    var e = t.querySelector(".city-btn");
    let r = !1;

    const c = () => {
      t.classList.remove("active"), (r = !1);
    };

    changeContent(t, e, c, wrap);

    e.addEventListener("click", () => {
      t.classList.toggle("active"), (r = !r);
    }),
      window.addEventListener("click", (e) => {
        r && !t.contains(e.target) && c();
      }),
      window.addEventListener("keydown", (e) => {
        r && "Escape" === e.key && c();
      });
  };

sidebar(),
  userDropdown(),
  refresh(),
  document.querySelector(".pos-pag") ? popProject(".pos-pag") : "",
  downloads(),
  settings(),
  document.querySelector(".pos-pag") ? countPages() : "",
  document.querySelector(".copy-wrap") ? copy() : "";

if (document.querySelector(".body-panel__google")) {
  google(".body-panel__google--1", ".google-btn--1");
  google(".body-panel__google--2", ".google-btn--2");
  device(".body-panel__device--1", ".device-btn--1");
  device(".body-panel__device--2", ".device-btn--2");
  frequency();
  city("city")
}
if (document.querySelector(".pop-pos")) {
  popRegions();
  deviceRegion();
  timeChosePop(".pop-pos");
}
if (document.querySelector(".edit")) {
  timeChosePop(".edit");
}
function changeContent(itemsParent, itemClass, close, wrap) {
  const items = itemsParent.querySelectorAll(".folder");
  items.forEach((el) => {
    el.addEventListener("click", (e) => {
      if (wrap == ".pop-project" || wrap == ".edit-tab-1") {
        itemClass.textContent = e.target.textContent;
      }
      if (wrap == "country") {
        itemClass.querySelector("span").textContent = e.target.textContent;
      }
      if (wrap == "project") {
        itemClass.querySelector("span").textContent = e.target.textContent;
        itemClass.querySelector("span").style.color = "#404040";
      }
      if (wrap == ".pop-pos" || wrap == ".edit") {
        const parent = document.querySelector(wrap);
        parent
          .querySelector(".time-btn")
          .nextElementSibling.classList.remove("active");

        itemClass.querySelector("span").textContent = e.target.textContent;
        const allTypes = parent.querySelectorAll(".time-type");

        allTypes.forEach((el) => {
          el.classList.remove("active");
        });
        switch (e.target.textContent) {
          case "По требованию":
            break;
          case "Ежечасно":
            break;
          case "Ежедневно":
            parent.querySelector(".time-type-daily").classList.add("active");
            break;
          case "Еженедельно":
            parent.querySelector(".time-type-weekly").classList.add("active");
            break;
          case "В определенные дни недели":
            parent.querySelector(".time-type-certain").classList.add("active");
            break;
          case "В определенные дни месяца":
            parent.querySelector(".time-type-month").classList.add("active");
            break;
          case "После апдейтов Яндекса":
            break;
        }
      }
      if (wrap == "regionDevice") {
        const svg = e.target.closest(".folder").querySelector(".folder-device");
        const body = e.target
          .closest(".region__device")
          .querySelector(".region__device-svg-wrap");
        body.innerHTML = svg.outerHTML;
      }
      if (wrap == "device") {
        items.forEach((city) => {
          city.classList.remove("active");
        });
        e.target.classList.add("active");
        itemClass.innerHTML = `
        ${el.innerHTML}
        <svg class="google-btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5714 6C10.651 6 10.729 6.02069 10.7967 6.05974C10.8644 6.09879 10.9192 6.15467 10.9548 6.22111C10.9903 6.28756 11.0054 6.36194 10.9983 6.43592C10.9911 6.50991 10.962 6.58057 10.9143 6.64L8.34286 9.84C8.30294 9.88968 8.25117 9.93 8.19166 9.95777C8.13215 9.98554 8.06653 10 8 10C7.93347 10 7.86785 9.98554 7.80834 9.95777C7.74883 9.93 7.69706 9.88968 7.65714 9.84L5.08572 6.64C5.03796 6.58057 5.00888 6.50991 5.00173 6.43592C4.99458 6.36194 5.00965 6.28756 5.04525 6.22112C5.08084 6.15467 5.13555 6.09879 5.20326 6.05974C5.27096 6.02069 5.34898 6 5.42857 6L10.5714 6Z" fill="#747474"></path>
                    </svg>
        `;
        const body = itemClass.querySelector("span");
        body.style.color = "#404040";
        body.textContent =
          body.textContent.match(/\(.*?\)/)?.[0]?.replace(/[()]/g, "") ||
          "Компьютер";
        el.classList.add("active");
      }
      if (wrap == "city") {
        console.log(itemClass);

        items.forEach((city) => {
          city.classList.remove("active");
        });
        e.target.classList.add("active");
        itemClass.querySelector("span").textContent = e.target.textContent;
        itemClass.querySelector("span").style.color = "#404040";
        el.classList.add("active");
      }
      if (wrap == "browser") {
        items.forEach((city) => {
          city.classList.remove("active");
        });
        e.target.classList.add("active");
        itemClass.innerHTML = `
        ${el.innerHTML}
        <svg class="google-btn__arrow" width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M10.5714 6C10.651 6 10.729 6.02069 10.7967 6.05974C10.8644 6.09879 10.9192 6.15467 10.9548 6.22111C10.9903 6.28756 11.0054 6.36194 10.9983 6.43592C10.9911 6.50991 10.962 6.58057 10.9143 6.64L8.34286 9.84C8.30294 9.88968 8.25117 9.93 8.19166 9.95777C8.13215 9.98554 8.06653 10 8 10C7.93347 10 7.86785 9.98554 7.80834 9.95777C7.74883 9.93 7.69706 9.88968 7.65714 9.84L5.08572 6.64C5.03796 6.58057 5.00888 6.50991 5.00173 6.43592C4.99458 6.36194 5.00965 6.28756 5.04525 6.22112C5.08084 6.15467 5.13555 6.09879 5.20326 6.05974C5.27096 6.02069 5.34898 6 5.42857 6L10.5714 6Z" fill="#747474"></path>
                    </svg>
        `;
        const body = itemClass.querySelector("span");
        body.style.color = "#404040";
        body.textContent = body.textContent;
        el.classList.add("active");
      }
      if (wrap == "body-panel__download") {
        items.forEach((city) => {
          city.classList.remove("active");
        });
        e.target.classList.add("active");
        itemClass.style.color = "red";
        el.classList.add("active");
      }
      close();
    });
  });
}

//Сохранить положение sidebar
function setCookie(name, value, days) {
  let expires = "";
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    expires = "; expires=" + date.toUTCString();
  }
  document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
