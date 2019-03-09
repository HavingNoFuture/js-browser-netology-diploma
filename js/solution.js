"use strict"
const app = document.querySelector('.app');
const menu = app.querySelector('.menu');

let isHideComments = false;
let isDrawningMode = false;

const canvas = document.createElement('canvas');

let ws; // глобальная переменная web socket


// Очистить local storage:
// localStorage.currentPic = '';
// localStorage.picId = ''
// localStorage.currentCoordinates = '';


// нужна для тестов на компе.
menu.querySelector('.share-tools').querySelector('.menu__url').value = document.location.href.split('?id=')[0];

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


let picId = document.location.href.split('?id=')[1];

// Задаю состояние по умолчанию + сохраняю последнее состояние
function setDefaults() {
  // сюда попаду и при переходе по ссылке и при обновлении страницы.
  if ((picId != undefined) || (localStorage.currentPic)) {
    // ls.currentPic и ls.picId задаются при initWebSocket().
  app.querySelector('.current-image').src = localStorage.currentPic;
    if (picId != undefined) {
      // сюда попали, если перешли по ссылке
      switchMode('comments');
      localStorage.picId = picId;
    }
    // При обновлении страницы ls.picId и ls.currentPic уже будут.
    initWebSocket(localStorage.picId);


    // обновляю ur; в меню
    const url = app.querySelector('.menu__url').value.split('?id=')[0] + `?id=${localStorage.picId}`;
    menu.querySelector('.share-tools').querySelector('.menu__url').value = url;
  } else {
    app.querySelector('.error').style.display = 'none';
    app.querySelector('.image-loader').style.display = 'none';

    // скрываю ненужные элементы меню
    const menuItems = Array.from(app.querySelectorAll('.menu__item'));
    for (let item of menuItems) {
      if (!(item.classList.contains('drag') || item.classList.contains('new'))) {
        item.style.display = 'none';
      }
    }
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
    app.querySelector('.image-loader').style.display = 'none';
    const url = app.querySelector('.menu__url').value.split('?id=')[0] + `?id=${data.id}`;
    menu.querySelector('.share-tools').querySelector('.menu__url').value = url;
    switchMode('share');
    initWebSocket(data.id);
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

// const canvas = document.createElement('canvas');
app.appendChild(canvas);

canvas.style.display = 'none'; // Скрыто, пока не нужен
const ctx = canvas.getContext('2d');

const BRUSH_RADIUS = 4;

let curves = [];
let drawing = false;
let needsRepaint = false;

// появляется и устанавливает границы окна canvas
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


// curves and figures
function circle(point) {
    ctx.beginPath();
    ctx.strokeStyle = point.color;
    ctx.arc(...point, point.brushSize / 2, 0, 2 * Math.PI);
    ctx.fill();
}


function smoothCurveBetween (p1, p2) {
  // Bezier control point
  const cp = p1.map((coord, idx) => (coord + p2[idx]) / 2);
  ctx.quadraticCurveTo(...p1, ...cp);
}

function smoothCurve(points) {
  ctx.beginPath();
  ctx.lineWidth = BRUSH_RADIUS;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';

  ctx.moveTo(...points[0]);

  for(let i = 1; i < points.length - 1; i++) {
    smoothCurveBetween(points[i], points[i + 1]);
  }

  ctx.stroke();
}

// events
function makePoint(x, y) {
  return [x, y];
};


canvas.addEventListener("mousedown", (evt) => {
  drawing = true;

  const curve = []; // create a new curve

  const point = [evt.offsetX, evt.offsetY];
  point.color = currentColor;

  curve.push(point); // add a new point
  curves.push(curve); // add the curve to the array of curves
  needsRepaint = true;
});

canvas.addEventListener("mouseup", (evt) => {
  drawing = false;
  sendPngMask();
  // clearInterval(intervalID);
});

canvas.addEventListener("mouseleave", (evt) => {
  drawing = false;
});

canvas.addEventListener("mousemove", (evt) => {
  if (drawing) {
    // add a point
    const point = makePoint(evt.offsetX, evt.offsetY)
    ctx.fillStyle = currentColor;
    curves[curves.length - 1].push(point);
    needsRepaint = true;
  }
});

// rendering
function repaint () {
  // clear before repainting
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  curves
    .forEach((curve) => {
      // first...
      circle(curve[0]);

      // the body is compraised of lines
      smoothCurve(curve);
    });
}

function tick () {
  if(needsRepaint) {
    repaint();
    needsRepaint = false;
  }

  window.requestAnimationFrame(tick);
}

tick();



let intervalID = null;

// intervalID = setInterval(() => {
  //   sendPngMask();
  // }, 1000);

// отправить маску
var fps = 1;
function step() {
  sendPngMask();
  console.log(x1++)
    intervalID = setTimeout(function() {
        requestAnimationFrame(step);
        // Drawing code goes here
    }, 1000 / fps);
}



// ------------------------ Комментарии ----------------------

const commentsArea = app.querySelector('.comments-area');

function createCommentsForm() {
  // создает коммент форму по шаблону
  return browserJSEngine(commentsFormTemplate());
}

function addCommentsForm(x, y) {
  // добавляет пустую коммент форму
  commentsArea.appendChild(createCommentsForm());
  const commentsFormNodeList = app.querySelectorAll('.comments__form');
  const commentsFormLast = commentsFormNodeList[commentsFormNodeList.length - 1];
  commentsFormLast.querySelector('.loader').style.display = 'none';
  if (isHideComments) {
    commentsFormLast.style.display = 'none';
  }


  commentsFormLast.style.left = `${x - 22}px`;
  commentsFormLast.style.top = `${y - 14}px`;
  commentsFormLast.style.zIndex = 2;

  return commentsFormLast;
}


app.querySelector('.current-image').addEventListener('click', addNewComment)
function addNewComment(e) {
  // добавляю коммент форму, сохраняю координаты точки комментария
  e.preventDefault();
  const x = e.offsetX;
  const y = e.offsetY;

  const commentsFormLast = addCommentsForm(x, y);

  // показываю прелоадер, отправляю коммент на сервер.
  commentsFormLast.querySelector('.comments__submit').addEventListener('click', e => {
    e.preventDefault();
    e.target.parentNode.querySelector('.loader').style.display = 'block';

    const message = commentsFormLast.querySelector('.comments__input').value;

    sendComment(x, y, message);
  });
}

function commentTemplate(time, message) {
  // шаблон одного сообщения
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


function commentsFormTemplate() {
  // шаблон пустой формы сообщения
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

function browserJSEngine(block) {
  // движок-обработчик для добавления DOM-элементов.
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

function sendComment(x, y, message) {
  // отправка комментария на сервер
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

  fetch(`https://neto-api.herokuapp.com/pic/${localStorage.picId}/comments`, {
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


function searchCommentsForm(data) {
  // Возвращает коммент форму по координатам от сервера, если координаты не соответсвуют - создает новую по координатам
  const x = data.comment.left;
  const y = data.comment.top;

  const commentsForms = commentsArea.querySelectorAll('.comments__form');
  for (let form of commentsForms) {
    if (((parseInt(form.style.left)) === x - 22) && (parseInt(form.style.top)) === y - 14) {
      return form;
    } 
  }

  return addCommentsForm(x, y);
}


// ------------------------ Web Socket ----------------------


function initWebSocket(id) {
  ws = new WebSocket(`wss://neto-api.herokuapp.com/pic/${id}`)

  ws.addEventListener('message', e => {

    const data = JSON.parse(e.data);

    if (data.event == 'pic') {
      localStorage.picId = data.pic.id;
      localStorage.currentPic = data.pic.url;
      app.querySelector('.current-image').src = localStorage.currentPic;
      console.log(data);
    }

    if (data.event == 'error') {
      console.log('err', data.message);
    }

    if (data.event == 'comment') {
      console.log(data);
      let date = new Date(data.comment.timestamp);

        const options = {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  };

      // Определяю comment form и вставляю в неe комментарий
      const currentCommentsForm = searchCommentsForm(data);
      const commentItems = currentCommentsForm.querySelectorAll('.comment');
      const lastCommentItem = commentItems[commentItems.length - 1]

      currentCommentsForm.querySelector('.loader').style.display = 'none';
      currentCommentsForm.querySelector('.comments__body').insertBefore(
        browserJSEngine(commentTemplate(date.toLocaleString("ru", options), data.comment.message)),
        lastCommentItem)
    }

    if (data.event == 'mask') {
      const img = new Image();
    img.src = data.url;
    img.addEventListener("load", function() {
      console.log('load img')
      ctx.drawImage(img, 0, 0);
    }, false);
      img.src = data.url;
      console.log(data.url);
    }
  });
}


function sendPngMask() {
    canvas.toBlob(blob => {
        // if (!wsGlobal) return;
        // const curvesNumberToRemoveNow = curvesNumberToRemoveNextTime;
        // curves.splice(0, curvesNumberToRemoveNow);
        // curvesNumberToRemoveNextTime = curves.length - 1;

        ws.send(blob);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }, 'image/png', 0.95);
}
  
// function createPngFromMask() {
//   canvas.toBlob(function(blob){
//       link.href = URL.createObjectURL(blob);
//       console.log(blob);
//       console.log(link.href); // this line should be here
//   },'image/png');
//   // return canvas.toBlob(function(blob) {
//   //   const url = URL.createObjectURL(blob);
//  //      URL.revokeObjectURL(url);
//   // }, 'image/png', 0.95);
// }

menu.style.left = getCoordinatesMenu().x + 'px';
menu.style.top = getCoordinatesMenu().y + 'px';
