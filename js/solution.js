"use strict"
const app = document.querySelector('.app');
const menu = app.querySelector('.menu');
let isHavingPic = false;
let isHideComments = false;
let isDrawningMode = false;

// Очистить local storage:
// localStorage.currentPic = '';
// localStorage.currentCoordinates = '';

// сохранение координат меню в local storage
function saveCoordinatesMenu(x, y) {
  localStorage.currentCoordinates = JSON.stringify({
    'x': x,
    'y': y
  });
}

// получение координат из local storage
function getCoordinatesMenu() {
  return JSON.parse(localStorage.currentCoordinates);
}



// Задаю состояние по умолчанию + сохраняю последнее состояние
function setDefaults() {
  if (!(localStorage.currentPic)) {
    app.querySelector('.error').style.display = 'none';
    app.querySelector('.image-loader').style.display = 'none';
    app.querySelector('.comments__form').style.display = 'none';
    app.querySelector('.current-image').src = '';

    // скрываю ненужные элементы меню
    const menuItems = Array.from(app.querySelectorAll('.menu__item'));
    for (let item of menuItems) {
      if (!(item.classList.contains('drag') || item.classList.contains('new'))) {
        item.style.display = 'none';
      }
    }
  } else {
    app.querySelector('.current-image').src = localStorage.currentPic;
  }

  if (!(localStorage.currentCoordinates)) {
    saveCoordinatesMenu(0, 0)
  }

  if (!(localStorage.currentCoordinates)) {	
	menu.style.left = getCoordinatesMenu().x + 'px';
	menu.style.top = getCoordinatesMenu().y + 'px';
  }
}
setDefaults();

// backgorund
const backgorund = app.querySelector('.current-image');
app.addEventListener('dragover', e => {
  e.preventDefault();
});

// Проверяет на ошибки и отправляет пику.
function makeBG(e) {
  e.preventDefault();
  if (localStorage.currentPic && (!(drawing))) {
    app.querySelector('.error').querySelector('.error__message').textContent = 'Чтобы загрузить новое изображение, пожалуйста, воспользуйтесь пунктом «Загрузить новое» в меню.';
    app.querySelector('.error').style.display = 'block';
  } else {
    const pic = Array.from(e.dataTransfer.files)[0];
    if ((pic.type === 'image/jpeg') || (pic.type === 'image/png')) {
      app.querySelector('.error').style.display = 'none';
    } else {
      app.querySelector('.error').style.display = 'block';
    }

    sendPic(pic);
  }
}
app.addEventListener('drop', makeBG);

// отправляет пикчу на сервер. Показывает прелоадер. Переключает в share mode.
function sendPic(pic) {
  app.querySelector('.image-loader').style.display = 'block';
  const formData = new FormData();
    formData.append('title', pic.name);
    formData.append('image', pic);

    fetch('https://neto-api.herokuapp.com/pic', {
        body: formData,
        // credentials: 'same-origin',
        method: 'POST'
    })
  .then((res) => {
    return res.json();
  })
  .then((data) => {
    localStorage.setItem('picId', data.id);
    localStorage.setItem('currentPic', data.url);
    app.querySelector('.current-image').src = data.url;
    app.querySelector('.image-loader').style.display = 'none';
    menu.querySelector('.share-tools').querySelector('.menu__url').value = 'https://havingnofuture.github.io/js-browser-netology-diploma/'; // (?)
    switchMode('share');
    initWebSocket(localStorage.picId);
  })
  .catch((err) => {console.log(err)})
}




// переключение меню
menu.querySelector('.comments').addEventListener('click', e => {
  switchMode('comments');
});


menu.querySelector('.draw').addEventListener('click', e => {
	isDrawningMode = true;
  switchMode('draw');
	setWindowCanvas();
  // drawing = true; // (?)
});

menu.querySelector('.share').addEventListener('click', e => {
  switchMode('share');
});

function switchMode(mode) {
  const menuModes = Array.from(menu.querySelectorAll('.mode'));
  for (let item of menuModes) {
    if (!(item.classList.contains(mode))) {
      item.style.display = 'none';
      canvas.style.display = 'none';
    }
  }
  menu.querySelector('.burger').style.display = 'inline-block';
  menu.querySelector(`.${mode}-tools`).style.display = 'inline-block';
}


menu.querySelector('.burger').addEventListener('click', onBurgerBtnClick);
function onBurgerBtnClick(e) {
  const menuTools = Array.from(menu.querySelectorAll('.tool'));
  for (let item of menuTools) {
    item.style.display = 'none';
  }

  const menuModes = Array.from(menu.querySelectorAll('.mode'));
  for (let item of menuModes) {
    item.style.display = 'inline-block';
  }
}

// new mode
const input = document.createElement('input')
input.setAttribute('type', 'file');
input.setAttribute('accept', 'image/jpeg, image/png');

input.addEventListener('change', e => {
  const pic = event.currentTarget.files[0];
  sendPic(pic)
})

menu.querySelector('.new').addEventListener('click', e => {
  input.click();
})


// draw mode
const colors = menu.querySelector('.draw-tools').querySelectorAll('[name="color"]');
let currentColor = 'green';
for (let color of colors) {
  color.addEventListener('change', e => {
    currentColor = e.target.value;
  });
}


// comments mode
const commentsTools = menu.querySelector('.comments-tools');

// comments on
commentsTools.querySelectorAll('.menu__toggle')[0].addEventListener('change', e => {
  for (let commentsForm of app.querySelectorAll('.comments__form')) {
    isHideComments = false;
    commentsForm.style.display = 'block';
  }
})

// comments off
commentsTools.querySelectorAll('.menu__toggle')[1].addEventListener('change', e => {
  for (let commentsForm of app.querySelectorAll('.comments__form')) {
    isHideComments = true;
    commentsForm.style.display = 'none';
  }
})


// share mode
const shareTools = menu.querySelector('.share-tools');
shareTools.querySelector('[type="button"]').addEventListener('click', e => {
  e.preventDefault();
  shareTools.querySelector('[type="text"]').select();
  document.execCommand("copy");
})


// перетаскивание меню
let isDragMenu = false;
let minY, minX, maxX, maxY;
let shiftX = 0;
let shiftY = 0;

// Высчитываю координаты при старте перетаскивания.
const dragStart = event => {
  if (event.target.classList.contains('drag')) {
    isDragMenu = true;
      minY = app.offsetTop;
      minX = app.offsetLeft;
      maxX = app.offsetLeft + app.offsetWidth - menu.offsetWidth - 1;
      maxY = app.offsetTop + app.offsetHeight - menu.offsetHeight;
      shiftX = event.pageX - menu.getBoundingClientRect().left - window.pageXOffset;
      shiftY = event.pageY - menu.getBoundingClientRect().top - window.pageYOffset;
    }
};

function throttle(callback) {
  let isWaiting = false;
  return function () {
    if (!isWaiting) {
      callback.apply(this, arguments);
      isWaiting = true;
      requestAnimationFrame(() => {
        isWaiting = false;
      });
    }
  };
}

// Не даю уйти за границы окна.
const drag = throttle((x, y) => {
  if (isDragMenu) {
    x = x - shiftX;
    y = y - shiftY;
    x = Math.min(x, maxX);
    y = Math.min(y, maxY);
    x = Math.max(x, minX);
    y = Math.max(y, minY);
    menu.style.left = x + 'px';
    menu.style.top = y + 'px';
    saveCoordinatesMenu(x, y);
  }
});


function drop(e) {
  isDragMenu = false;
}

document.addEventListener('mousedown', dragStart);
document.addEventListener('mousemove', e => drag(event.pageX, event.pageY));
document.addEventListener('mouseup', drop);

document.addEventListener('touchstart', event => dragStart(event.touches[0]));
document.addEventListener('touchmove', event => drag(event.touches[0].pageX, event.touches[0].pageY));
document.addEventListener('touchend', event => drop(event.changedTouches[0]));


// рисование
const canvas = document.createElement('canvas');
app.appendChild(canvas);

canvas.style.display = 'none'; // Скрыто, пока не нужен
const ctx = canvas.getContext('2d');


const brushSize = 4;

let curves = [];
let drawing = false;

let needsRepaint = false;

function setWindowCanvas() {
  canvas.width = app.querySelector('.current-image').width;
  canvas.height = app.querySelector('.current-image').width;
  canvas.style.position = 'absolute';
  canvas.style.zIndex = 5;
  canvas.style.transform = 'translate(-50%, -50%)';
  canvas.style.left = '50%';
  canvas.style.top = '50%';
  canvas.style.display = 'block';
  repaint();
}


function circle(point) {
    ctx.beginPath();
    ctx.fillStyle = currentColor;
    ctx.arc(...point, point.brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}

function smoothCurveBetween(p1, p2) {
    ctx.strokeStyle = p1.color;
    ctx.lineWidth = p1.brushSize;
    ctx.beginPath();
    const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
    ctx.quadraticCurveTo(...p1, ...cp);
    ctx.stroke();
}

function smoothCurve(points) {
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
  
    ctx.moveTo(...points[0]);
  
    for (let i = 1; i < points.length - 1; i++) {
        smoothCurveBetween(points[i], points[i + 1]);
    }
}

canvas.addEventListener('mousedown', (evt) => {
    drawing = true;

    const curve = [];

    const point = [evt.offsetX, evt.offsetY];
    point.color = currentColor;
    point.brushSize = brushSize;

    curve.push(point);
    curves.push(curve);
    needsRepaint = true;
});

canvas.addEventListener('mouseup', () => {
    drawing = false;
});


canvas.addEventListener('mousemove', (evt) => {
    if (drawing) {
      const point = [evt.offsetX, evt.offsetY];
      point.color = currentColor;
      point.brushSize = brushSize;
      curves[curves.length - 1].push(point);
      needsRepaint = true;
    }
});

// canvas.addEventListener('dblclick', () => {
//     curves = [];
//     needsRepaint = true;
// });


function repaint() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    curves
        .forEach((curve) => {
            circle(curve[0]);
            smoothCurve(curve);
        });
}

function tick() {

    if (needsRepaint) {
        repaint();
        needsRepaint = false;
    }
  
    window.requestAnimationFrame(tick);
}

tick();




// добавление нового комментария
const commentsForm = app.querySelector('.comments__form');
commentsForm.parentNode.removeChild(commentsForm) // (?) Мб просто убрать разметку из хтмл? Так как шаблон у меня в JS

// elementFromPoint(x, y)

// добавляю маркер, сохраняю координаты точки комментария
app.querySelector('.current-image').addEventListener('click', addNewComment)

function addNewComment(e) {
  e.preventDefault();

  // работаю с координатами
  const picCoordinates = app.querySelector('.current-image').getBoundingClientRect();
  const x1 = e.pageX - picCoordinates.left;
  const y2 = e.pageY - picCoordinates.top;

  // добавляю коментарий в DOM-дерево.
  app.appendChild(browserJSEngine(commentsFormTemplate()));
  const commentsFormNodeList = app.querySelectorAll('.comments__form');
  const commentsFormLast = commentsFormNodeList[commentsFormNodeList.length - 1];
  commentsFormLast.querySelector('.loader').style.display = 'none';
  if (isHideComments) {
    commentsFormLast.style.display = 'none';
  }

  // цеаляю маркер на пикчу.
  const commentMarker = commentsFormLast.querySelector('.comments__marker')

  commentsFormLast.style.left = `${e.pageX - (commentMarker.offsetWidth / 2) - 7}px`;
  commentsFormLast.style.top = `${e.pageY - (commentMarker.offsetHeight / 2) - 2}px`;
  console.log(commentsFormLast.style.top)

  // показываю прелоадер, отправляю коммент на сервер.
  commentsFormLast.querySelector('.comments__submit').addEventListener('click', e => {
    e.preventDefault();
    e.target.parentNode.querySelector('.loader').style.display = 'block';
    const message = commentsFormLast.querySelector('.comments__input').value;

    // Вытаскиваю координаты меню
    const x = e.target.parentNode.parentNode.getBoundingClientRect().left
    const y = e.target.parentNode.parentNode.getBoundingClientRect().top

    sendComment(localStorage.picId, x, y, message, commentsFormLast);
  });
}


// добавление одного сообщения
function commentTemplate(time, message) {
  return {
        tag: 'div',
        cls: 'comment',
        content: [
          {
            tag: 'p',
            cls: 'comment__time',
            text: `${time}`
          },
          {
            tag: 'p',
            cls: 'comment__message',
            text: `${message}`
          },
        ]
  }
}

// добавление формы сообщения
function commentsFormTemplate() {
  return {
        tag: 'form',
        cls: 'comments__form',
        content: [
          {
            tag: 'span',
            cls: 'comments__marker'
          },
          {
            tag: 'input',
            attrs: {
              type: "checkbox"
            },
            cls: 'comments__marker-checkbox'
          },
          {
            tag: 'div',
            cls: 'comments__body',
            content: [
              {
                tag: 'div',
                cls: 'comment',
                content: [
                  {
                    tag: 'div',
                    cls: 'loader',
                    content: [
                      {
                        tag: 'span',
                      },
                      {
                        tag: 'span',
                      },
                      {
                        tag: 'span',
                      },
                      {
                        tag: 'span',
                      },
                      {
                        tag: 'span',
                      }
                    ]
                  },
                ]
              },
              {
                tag: 'textarea',
                cls: 'comments__input',
                    attrs: {
                  type: "checkbox",
                  placeholder: "Напишите ответ..."
              }
            },
              {
                tag: 'input',
                cls: 'comments__close',
                    attrs: {
                  type: "button",
                  value: "Закрыть"
              }
            },
              {
                tag: 'input',
                cls: 'comments__submit',
                    attrs: {
                  type: "submit",
                  value: "Отправить"
              }
            }
            ]
          }
        ]
  }
}

// движок-обработчик для добавления DOM-элементов.
function browserJSEngine(block) {
    if ((block === undefined) || (block === null) || (block === false)) {
        return document.createTextNode('');
    }
    if ((typeof block === 'number') || (typeof block === 'string') || (block === true)) {
        return document.createTextNode(block.toString());
    }

    if (Array.isArray(block)) {
        return block.reduce((f, item) => {
            f.appendChild(
                browserJSEngine(item)
            );

            return f;
        }, document.createDocumentFragment());
    }

    const element = document.createElement(block.tag);

    if (block.cls) {
        element.classList.add(...[].concat(block.cls));
    }

    if (block.attrs) {
        Object.keys(block.attrs).forEach(key => {
            element.setAttribute(key, block.attrs[key]);
        });
    }

    if (block.content) {
        element.appendChild(browserJSEngine(block.content));
    }

    if (block.text) {
        element.textContent = block.text;
    }

    return element;
}

// отправка комментария на сервер
function sendComment(picId, x, y, message, commentsForm) {
  var details = {
      'message': `${message}`,
      'left': `${x}`,
      'top': `${y}`
  };

  var formBody = [];
  for (var property in details) {
    var encodedKey = encodeURIComponent(property);
    var encodedValue = encodeURIComponent(details[property]);
    formBody.push(encodedKey + "=" + encodedValue);
  }
  formBody = formBody.join("&");

  fetch(`https://neto-api.herokuapp.com/pic/${picId}/comments`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
    },
    body: formBody
  })
    .then((res) => {
      return res.json();
    })
    .then((data) => {
      console.log(data)
    })
    .catch((err) => {console.log(err)})

}


// websocket
function initWebSocket(id) {
  const ws = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`)

  ws.addEventListener('message', e => {

    const data = JSON.parse(e.data);

    if (data.event == 'pic') {
      console.log(data);
    }

    if (data.event == 'error') {
      console.log('err', data.message);
    }

    if (data.event == 'comment') {
      console.log(data);
      let date = new Date(data.comment.timestamp);
      const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        timezone: 'UTC',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric'
      };

      // Определяю comment form и вставляю в него комментарий
 	  const currentCommentsForm = searchCommentsForm(document.elementFromPoint(data.comment.left, data.comment.top))
      const commentItems = currentCommentsForm.querySelectorAll('.comment');
      const lastCommentItem = commentItems[commentItems.length - 1]
      currentCommentsForm.querySelector('.loader').style.display = 'none';
      currentCommentsForm.querySelector('.comments__body').insertBefore(
        browserJSEngine(commentTemplate(date.toLocaleString("ru", options), data.comment.message)),
        lastCommentItem)
    }

    if (data.event == 'mask') {
      console.log(data);
    }
  });

}


// возвращает commentsFormy идя вверх по дереву.
function searchCommentsForm(node) {
	let currentNode = node;
	while (!(currentNode.classList.contains('comments__form'))) {
		currentNode = currentNode.parentNode;
	}
	return currentNode;
}

menu.style.left = getCoordinatesMenu().x + 'px';
menu.style.top = getCoordinatesMenu().y + 'px';