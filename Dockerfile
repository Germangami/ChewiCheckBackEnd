# Используем Node.js как базовый образ
FROM node:20.16.0

# Устанавливаем рабочую директорию в контейнере
WORKDIR /app

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm install

# Копируем весь код приложения
COPY . .

# Указываем порт, на котором работает приложение
EXPOSE 5000

# Запускаем сервер
CMD ["node", "index.js"]