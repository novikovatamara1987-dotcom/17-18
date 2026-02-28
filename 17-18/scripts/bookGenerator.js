// Неизменяемый массив с возможными жанрами книг
const SUBJECTS = ['love', 'science', 'history', 'fantasy', 'adventure', 'classic', 'drama', 'comedy'];

/**
 * Функция для выбора случайного элемента из переданного массива
 * @param {Array} arr - массив, из которого нужно выбрать случайный элемент
 * @returns {*} случайный элемент массива
 */
function randomItem(arr) {
    // Math.random() генерирует число от 0 до 1 (не включая 1)
    // Умножаем на длину массива, чтобы получить число в диапазоне от 0 до arr.length-1
    // Math.floor округляет вниз до целого числа, получаем индекс
    // Возвращаем элемент массива по полученному индексу
    return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Асинхронная функция для генерации списка книг через Open Library API
 * @param {number} count - количество книг для генерации (по умолчанию 10)
 * @returns {Promise<Array>} массив объектов книг
 */
export async function generateBooks(count = 10) {
    // Пытаемся получить данные до 5 раз в случае неудачи
    for (let attempt = 0; attempt < 5; attempt++) {
        try {
            // Выбираем случайный жанр из списка
            const subject = randomItem(SUBJECTS);
            
            // Формируем URL для запроса к Open Library API
            // Ищем книги по выбранному жанру, лимит - 50 книг
            const url = `https://openlibrary.org/subjects/${subject}.json?limit=50`;
            
            // Выполняем запрос к API и ждем ответ
            const response = await fetch(url);
            
            // Проверяем, успешен ли запрос (код 200-299)
            if (!response.ok) {
                console.warn(`Попытка ${attempt + 1}: Ошибка HTTP ${response.status}`);
                continue; // Переходим к следующей попытке
            }
            
            // Преобразуем ответ в JavaScript объект
            const data = await response.json();
            
            // Проверяем, есть ли в ответе массив книг
            if (!data.works || !Array.isArray(data.works)) {
                console.warn(`Попытка ${attempt + 1}: Нет книг в ответе API`);
                continue;
            }
            
            // Обрабатываем полученные книги:
            // 1. Фильтруем - оставляем только те, у которых есть название и хотя бы один автор
            // 2. Берем первые 'count' элементов
            // 3. Преобразуем каждый элемент в нужный нам формат
            const books = data.works
                .filter(book => book.title && book.authors && book.authors.length > 0)
                .slice(0, count)
                .map(book => ({
                    // Генерируем уникальный идентификатор для каждой книги
                    id: crypto.randomUUID(),
                    // Название книги
                    title: book.title,
                    // Объединяем всех авторов через запятую
                    author: book.authors.map(a => a.name).join(', '),
                    // Жанр (тот, который использовали для поиска)
                    genre: subject,
                    // Год первого издания (если есть, иначе null)
                    year: book.first_publish_year || null,
                    // Генерируем случайный рейтинг от 3.0 до 5.0 с одним знаком после запятой
                    rating: Math.round((3 + Math.random() * 2) * 10) / 10
                }));
            
            // Если получили книги, возвращаем их
            if (books.length > 0) {
                return books;
            }
            
        } catch (error) {
            // Логируем ошибку, но продолжаем попытки
            console.warn(`Попытка ${attempt + 1}: Ошибка - ${error.message}`);
        }
    }
    
    // Если после всех попыток не удалось получить книги, выбрасываем ошибку
    throw new Error('Не удалось сгенерировать книги после 5 попыток');
}