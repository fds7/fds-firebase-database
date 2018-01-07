const db = firebase.database();
const auth = firebase.auth();
const todoListEl = document.querySelector('.todo-list');
const inputEl = document.querySelector('.input-group__input');
const addButtonEl = document.querySelector('.input-group__add-button');
const loginButtonEl = document.querySelector('.login__button');

// 로그인 상태를 확인하고 로그인이 되어있다면 할 일 목록을 보여주기
auth.onAuthStateChanged(user => {
  if (user) {
    document.body.classList.add('authed');
    refreshTodoList();
  } else {
    document.body.classList.add('not-authed');
  }
});

// 로그인
loginButtonEl.addEventListener('click', async e => {
  const provider = new firebase.auth.GoogleAuthProvider();
  const result = await auth.signInWithPopup(provider);
  document.body.classList.remove('not-authed');
  document.body.classList.add('authed');
  return refreshTodoList();
})

// 할 일 추가 (엔터키를 눌렀을 때)
inputEl.addEventListener('keypress', async e => {
  if (e.key === 'Enter') {
    e.preventDefault();
    await addTodo(inputEl.textContent);
    refreshTodoList();
  }
});

// 할 일 추가 (`+` 버튼을 클릭했을 때)
addButtonEl.addEventListener('click', async e => {
  await addTodo(inputEl.textContent);
  refreshTodoList();
});

async function addTodo(title) {
  inputEl.textContent = '';
  return db.ref(`/users/${auth.currentUser.uid}/todos`).push({
    title,
    complete: false
  });
}

async function refreshTodoList() {
  // 데이터베이스에서 현재 사용자의 할 일 목록 가져오기
  const snapshot = await db.ref(`/users/${auth.currentUser.uid}/todos`).once('value');
  const todos = snapshot.val() || {};

  // 현재 화면의 할 일 목록 삭제
  todoListEl.innerHTML = '';

  // 할 일 목록 새로 표시하기
  Object.entries(todos).forEach(([todoId, {title, complete}]) => {
    const todoEl = document.createElement('div');
    todoEl.classList.add('todo-list__item');

    const todoTitleEl = document.createElement('div');
    todoTitleEl.classList.add('todo-list__title');
    todoTitleEl.textContent = title;
    if (complete) {
      todoTitleEl.classList.add('todo-list__title--complete');
    }
    todoTitleEl.addEventListener('click', async e => {
      await db.ref(`/users/${auth.currentUser.uid}/todos/${todoId}`).update({
        complete: !complete
      });
      return refreshTodoList();
    })
    todoEl.appendChild(todoTitleEl);

    const todoRemoveEl = document.createElement('div');
    todoRemoveEl.classList.add('todo-list__remove-button');
    todoRemoveEl.addEventListener('click', async e => {
      await db.ref(`/users/${auth.currentUser.uid}/todos/${todoId}`).remove();
      return refreshTodoList();
    })
    todoEl.appendChild(todoRemoveEl);

    todoListEl.appendChild(todoEl);
  });
}
