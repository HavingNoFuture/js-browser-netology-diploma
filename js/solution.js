"use strict"
const app = document.querySelector('.app');
// по умолчанию
function setDefaults() {
	app.querySelector('.error').style.display = 'none';
	app.querySelector('.image-loader').style.display = 'none';
	app.querySelector('.comments__form').style.display = 'none';
	app.querySelector('.current-image').style.display = 'none';

	// скрываю ненужные элементы меню
	const menuItems = Array.from(app.querySelectorAll('.menu__item'));
	for (let item of menuItems) {
		if (!(item.classList.contains('drag') || item.classList.contains('new'))) {
			item.style.display = 'none';
		}
	}

	app.querySelector('.menu').style.top = '48%';
	app.querySelector('.menu').style.left = '46%';
}

// backgorund
const backgorund = app.querySelector('.current-image');
app.addEventListener('dragover', e => {
	e.preventDefault()});

app.addEventListener('drop', makeBG);

function makeBG(e) {
	e.preventDefault();
	const pic = Array.from(e.dataTransfer.files)[0];

	sendPic(pic)
}

function sendPic(pic) {
	// const corsproxy = 'https://cors-anywhere.herokuapp.com/';
	// const urlJSON = 'https://neto-api.herokuapp.com/pic';

 //  	fetch(corsproxy + urlJSON, {
	//     method: 'POST',
	//     body: {title: pic.name,
	//     	image: pic}
	//  })
	// 	.then(res => res.json())
	// 	.then((res) => {console.log(res)})


	const formData = new FormData();
	formData.append('pic', pic);

	const myHeaders = new Headers({
	  "Content-Type": "multipart/form-data",

	});

	// const xhr = new XMLHttpRequest();
	// xhr.open('POST', 'https://neto-api.herokuapp.com/pic');
	// xhr.setRequestHeader('Content-Type', 'multipart/form-data');

	// xhr.addEventListener('load', () => {
	// if (xhr.status === 200){
	// 	console.log(`Файл ${pic.name} сохранен.`);
	// }
	// });
	// xhr.send(formData);

  fetch('https://neto-api.herokuapp.com/pic', {
    method: 'POST',
    body: {title: pic.name,
    	image: pic}
  })
  .then((res) => {console.log(res)})
  .catch((err) => {console.log(err)})
}




// переключение меню
const menu = app.querySelector('.menu');
menu.querySelector('.comments').addEventListener('click', e => {
	switchMode('comments');
});

menu.querySelector('.draw').addEventListener('click', e => {
	switchMode('draw');
});

menu.querySelector('.share').addEventListener('click', e => {
	switchMode('share');
});

function switchMode(mode) {
	const menuModes = Array.from(menu.querySelectorAll('.mode'));
	for (let item of menuModes) {
		if (!(item.classList.contains(mode))) {
			item.style.display = 'none';
		}
	}
	menu.querySelector(`.${mode}-tools`).style.display = 'inline-block'
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

// перетаскивание меню
console.log(menu.querySelector('.drag'))
// menu.querySelector('.drag').setAttribute('draggable', 'true')
menu.setAttribute('draggable', 'true')