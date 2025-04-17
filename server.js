require('dotenv').config(); // Загружаем переменные окружения
const express = require('express');
const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const bodyParser = require('body-parser');
const cors = require('cors');
const protect = require('./middleware/auth'); // Импортируем middleware для авторизации

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

app.use(bodyParser.json());
app.use(cors());
app.use(express.static('public')); // Отдаем статичные файлы из папки public

// Подключение к MongoDB
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => console.error('MongoDB connection error:', err));

// Модели
const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  title: { type: String, required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Note = mongoose.model('Note', noteSchema);

// API

// Регистрация пользователя
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const userExists = await User.findOne({ username });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    const user = new User({ username, password }); // пароль будет захеширован в pre('save')
    await user.save();
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Вход пользователя
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.json({ token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Создание заметки
app.post('/api/notes', protect, async (req, res) => {
  const { title, content } = req.body;
  try {
    const newNote = new Note({ title, content, userId: req.user.id });
    await newNote.save();
    res.status(201).json(newNote);
  } catch (error) {
    res.status(400).send('Error creating note');
  }
});

// Получение заметок
app.get('/api/notes', protect, async (req, res) => {
  try {
    const notes = await Note.find({ userId: req.user.id });
    res.json(notes);
  } catch (error) {
    res.status(400).send('Error fetching notes');
  }
});

// Удаление заметки
app.delete('/api/notes/:id', protect, async (req, res) => {
  const { id } = req.params;
  try {
    const note = await Note.findById(id);
    if (note.userId.toString() !== req.user.id.toString()) {
      return res.status(403).send('You can only delete your own notes');
    }

    await note.remove();
    res.status(200).send('Note deleted');
  } catch (error) {
    res.status(400).send('Error deleting note');
  }
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
