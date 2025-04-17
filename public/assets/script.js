document.addEventListener('DOMContentLoaded', function () {
    const registerForm = document.getElementById('register-form');
    const loginForm = document.getElementById('login-form');
    const showLoginForm = document.getElementById('show-login-form');
    const showRegisterForm = document.getElementById('show-register-form');
  
    const notesContainer = document.getElementById('notes-container');
    const createNoteForm = document.getElementById('create-note-form');
  
    // === Страница входа/регистрации ===
    if (showLoginForm && showRegisterForm && registerForm && loginForm) {
      // Переключение между формами
      showLoginForm.addEventListener('click', () => {
        document.getElementById('register-form-container').style.display = 'none';
        document.getElementById('login-form-container').style.display = 'block';
      });
  
      showRegisterForm.addEventListener('click', () => {
        document.getElementById('login-form-container').style.display = 'none';
        document.getElementById('register-form-container').style.display = 'block';
      });
  
      // Регистрация
      registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('register-username').value;
        const password = document.getElementById('register-password').value;
  
        try {
          const res = await fetch('/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
  
          if (res.ok) {
            alert('Registration successful!');
            window.location.href = '/';
          } else {
            alert(data.message || 'Registration failed');
          }
        } catch (err) {
          console.error(err);
          alert('Something went wrong!');
        }
      });
  
      // Вход
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('login-username').value;
        const password = document.getElementById('login-password').value;
  
        try {
          const res = await fetch('/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
          });
          const data = await res.json();
  
          if (res.ok) {
            localStorage.setItem('token', data.token);
            window.location.href = '/notes.html';
          } else {
            alert(data.message || 'Login failed');
          }
        } catch (err) {
          console.error(err);
          alert('Something went wrong!');
        }
      });
    }
  
    // === Страница заметок ===
    if (notesContainer && createNoteForm) {
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/';
        return;
      }
  
      // Загрузка заметок
      async function fetchNotes() {
        try {
          const res = await fetch('/api/notes', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const notes = await res.json();
  
          if (res.ok) {
            notesContainer.innerHTML = '';
            if (notes.length === 0) {
              notesContainer.innerHTML = '<p>No notes found.</p>';
            } else {
              notes.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.classList.add('note');
                noteEl.innerHTML = `
                  <h3>${note.title}</h3>
                  <p>${note.content}</p>
                  <button class="delete-note" data-id="${note._id}">Delete</button>
                `;
                notesContainer.appendChild(noteEl);
              });
            }
          } else {
            alert('Failed to load notes');
          }
        } catch (err) {
          console.error(err);
          alert('Error fetching notes');
        }
      }
  
      fetchNotes();
  
      // Удаление заметки
      notesContainer.addEventListener('click', async (e) => {
        if (e.target.classList.contains('delete-note')) {
          const id = e.target.dataset.id;
          try {
            const res = await fetch(`/api/notes/${id}`, {
              method: 'DELETE',
              headers: { 'Authorization': `Bearer ${token}` }
            });
  
            if (res.ok) {
              e.target.closest('.note').remove();
            } else {
              alert('Failed to delete note');
            }
          } catch (err) {
            console.error(err);
            alert('Error deleting note');
          }
        }
      });
  
      // Создание заметки
      createNoteForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const title = document.getElementById('note-title').value;
        const content = document.getElementById('note-content').value;
  
        try {
          const res = await fetch('/api/notes', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ title, content })
          });
  
          if (res.ok) {
            fetchNotes(); // обновим список
            createNoteForm.reset(); // очистим форму
          } else {
            alert('Failed to create note');
          }
        } catch (err) {
          console.error(err);
          alert('Error creating note');
        }
      });
    }
  });
  