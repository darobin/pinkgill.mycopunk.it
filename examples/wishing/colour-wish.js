
const readyState = await window.wish.ready;
document.body.append(document.createTextNode(`readyState=${readyState.mode} `));

const but = document.createElement('button');
but.textContent = 'Reload';
but.onclick = () => window.location.reload();
document.body.append(but);
