
// Импортируем функцию для генерации книг из модуля
import { generateBooks } from './scripts/bookGenerator.js';

// ПОЛУЧЕНИЕ ССЫЛОК НА DOM-ЭЛЕМЕНТЫ

// Получаем ссылку на tbody таблицы - контейнер для строк с книгами
const tableBody = document.getElementById('table-body');
// Получаем ссылку на элемент для отображения количества книг
const countEl = document.getElementById('count');
// Получаем ссылку на поле поиска
const searchInput = document.getElementById('search');
// Получаем ссылку на форму добавления/редактирования
const form = document.getElementById('book-form');

// ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ

// Массив книг - "источник истины" (single source of truth)
// Все изменения данных происходят здесь, а потом UI перерисовывается
let books = [];

// ФУНКЦИЯ НОРМАЛИЗАЦИИ ДАННЫХ КНИГИ

/**
 * Приводит данные книги к правильному формату
 * @param {Object} data - сырые данные из формы
 * @returns {Object} нормализованный объект книги
 */
function normalizeBook(data) {
    return {
        // Обрезаем пробелы в строковых полях
        title: data.title?.trim() || '',
        author: data.author?.trim() || '',
        genre: data.genre?.trim() || '',
        // Преобразуем год в число или null, если поле пустое
        year: data.year ? Number(data.year) : null,
        // Преобразуем рейтинг в число или null, если поле пустое
        rating: data.rating ? Number(data.rating) : null
    };
}

// ФУНКЦИЯ ЗАГРУЗКИ КНИГ

/**
 * Асинхронно загружает книги через API и обновляет интерфейс
 */
async function loadBooks() {
    try {
        // Пытаемся получить книги через генератор
        // await - ждем завершения асинхронной операции
        const loadedBooks = await generateBooks(10);
        // Сохраняем загруженные книги в глобальный массив
        books = loadedBooks;
        // Перерисовываем таблицу с новыми данными
        render();
    } catch (error) {
        // В случае ошибки выводим в консоль и показываем alert пользователю
        console.error('Ошибка загрузки книг:', error);
        alert('Не удалось загрузить книги. Попробуйте позже.');
    }
}

// ФУНКЦИЯ ОТРИСОВКИ ТАБЛИЦЫ

/**
 * Отрисовывает таблицу на основе текущего состояния books и поискового запроса
 */
function render() {
    // Очищаем содержимое tbody (удаляем все старые строки)
    tableBody.innerHTML = '';
    
    // Получаем текст поиска, приводим к нижнему регистру и убираем лишние пробелы
    const searchTerm = searchInput.value.toLowerCase().trim();
    
    // Фильтруем книги по поисковому запросу
    // Оставляем только те, у которых название или автор содержат искомый текст
    const filtered = books.filter(book => 
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm)
    );
    
    // Для каждой отфильтрованной книги создаем строку таблицы
    filtered.forEach(book => {
        // Создаем элемент <tr> (строку таблицы)
        const tr = document.createElement('tr');
        
        // Привязываем ID книги к строке через data-атрибут
        // Это позволит легко найти книгу при клике на кнопки
        tr.dataset.id = book.id;
        
        // Формируем содержимое строки
        tr.innerHTML = `
            <td>${book.title || ''}</td>
            <td>${book.author || ''}</td>
            <td>${book.genre || ''}</td>
            <td>${book.year || ''}</td>
            <td>${book.rating || ''}</td>
            <td>
                <button class="edit">✏️ Редактировать</button>
                <button class="delete">🗑️ Удалить</button>
            </td>
        `;
        
        // Добавляем созданную строку в таблицу
        tableBody.appendChild(tr);
    });
    
    // Обновляем счетчик отображаемых книг
    countEl.textContent = filtered.length;
}

// ДЕЛЕГИРОВАНИЕ СОБЫТИЙ ДЛЯ КНОПОК В ТАБЛИЦЕ

// Навешиваем один обработчик на весь tbody (делегирование событий)
// Это эффективнее, чем вешать обработчик на каждую кнопку отдельно
tableBody.addEventListener('click', (e) => {
    // Находим строку <tr>, в которой произошел клик
    // closest ищет ближайший родительский элемент с указанным селектором
    const row = e.target.closest('tr');
    if (!row) return; // Если строка не найдена, выходим
    
    // Получаем ID книги из data-атрибута строки
    const bookId = row.dataset.id;
    
    // Обработка клика по кнопке "Удалить"
    if (e.target.classList.contains('delete')) {
        // Показываем диалог подтверждения
        if (confirm('Вы уверены, что хотите удалить эту книгу?')) {
            // Фильтруем массив - оставляем все книги, кроме удаляемой
            books = books.filter(book => book.id !== bookId);
            // Перерисовываем таблицу
            render();
        }
    }
    
    // Обработка клика по кнопке "Редактировать"
    if (e.target.classList.contains('edit')) {
        // Ищем книгу в массиве по ID
        const book = books.find(b => b.id === bookId);
        if (book) {
            // Заполняем форму данными найденной книги
            fillForm(book);
        }
    }
});

// ОБРАБОТКА ОТПРАВКИ ФОРМЫ

form.addEventListener('submit', (e) => {
    // Отменяем стандартную отправку формы (перезагрузку страницы)
    e.preventDefault();
    
    // Создаем объект FormData из формы - собираем все значения полей
    const formData = new FormData(form);
    // Преобразуем FormData в обычный JavaScript объект
    const data = Object.fromEntries(formData);
    
    // Нормализуем данные (обрезаем пробелы, преобразуем числа)
    const bookData = normalizeBook(data);
    
    if (data.id) {
        // РЕЖИМ РЕДАКТИРОВАНИЯ: если есть ID, обновляем существующую книгу
        
        // Находим индекс книги в массиве
        const index = books.findIndex(b => b.id === data.id);
        if (index !== -1) {
            // Обновляем объект книги, сохраняя старый ID
            // Object.assign копирует свойства из bookData в существующий объект
            books[index] = { ...books[index], ...bookData, id: data.id };
        }
    } else {
        // РЕЖИМ ДОБАВЛЕНИЯ: создаем новую книгу
        
        // Создаем объект новой книги с уникальным ID
        const newBook = {
            ...bookData,
            id: crypto.randomUUID() // Генерируем уникальный идентификатор
        };
        // Добавляем новую книгу в массив
        books.push(newBook);
    }
    
    // Сбрасываем форму (очищаем поля)
    form.reset();
    // Очищаем скрытое поле id, чтобы при следующем сохранении создавалась новая книга
    form.querySelector('[name="id"]').value = '';
    
    // Перерисовываем таблицу с обновленными данными
    render();
});

// ФУНКЦИЯ ЗАПОЛНЕНИЯ ФОРМЫ ДАННЫМИ КНИГИ

/**
 * Заполняет форму данными выбранной книги для редактирования
 * @param {Object} book - объект книги для редактирования
 */
function fillForm(book) {
    // Устанавливаем значения всех полей формы
    form.querySelector('[name="id"]').value = book.id || '';
    form.querySelector('[name="title"]').value = book.title || '';
    form.querySelector('[name="author"]').value = book.author || '';
    form.querySelector('[name="genre"]').value = book.genre || '';
    form.querySelector('[name="year"]').value = book.year || '';
    form.querySelector('[name="rating"]').value = book.rating || '';
}

// ОБРАБОТЧИКИ ДЛЯ ДОПОЛНИТЕЛЬНЫХ ЭЛЕМЕНТОВ

// Поиск в реальном времени
searchInput.addEventListener('input', () => {
    // При каждом вводе текста перерисовываем таблицу с учетом фильтрации
    render();
});

// Экспорт данных в JSON файл
document.getElementById('export').addEventListener('click', () => {
    // Преобразуем массив книг в JSON строку с отступами для читаемости
    const jsonString = JSON.stringify(books, null, 2);
    
    // Создаем Blob (бинарный объект) с JSON данными
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    // Создаем временную ссылку на Blob
    const url = URL.createObjectURL(blob);
    
    // Создаем невидимую ссылку для скачивания
    const a = document.createElement('a');
    a.href = url;
    a.download = 'books.json'; // Имя файла для скачивания
    
    // Программно кликаем по ссылке - начинается скачивание
    a.click();
    
    // Освобождаем временную ссылку (чистим память)
    URL.revokeObjectURL(url);
});

// Загрузка новых книг по кнопке
document.getElementById('reload').addEventListener('click', loadBooks);

// При загрузке страницы автоматически загружаем книги
loadBooks();

