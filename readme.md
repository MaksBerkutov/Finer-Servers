# Finer Discord Бот
Бот позваоляет воспроизводить музыку в ваш войс канал на ваш дискорд сервер. С возможностью удобного управления через веб интрефейс.
## Установка
1. Склонируйте репозиторий:
   ```bash
   git clone https://github.com/MaksBerkutov/Finer-Servers.git
   ```
2. Перейдите в директорию проекта:
   ```bash
   cd Finer-Servers
   ```
3. Установите зависимости:
   ```bash
   npm install
   ```
4. Создайте в корне папку и `.env` и заполните по примеру `.env.example`.
```plaintext
DATABASE_STRING=MONGO_DB_CONN_STRING
NAME_COLLECTION=MONGODB_NAME_COLLECTION
PORT_EXPRESS=PORT_EXPRESS
DISCORD_TOKEN=TOKEN
DISCORD_SECRET_ID=SECKERT_ID
DISCORD_CLIENT_ID=CLIENT_ID
TYPE=developer or product
SLOWED=false ot true
```

## Использование
Запустите бота с помощью следующих команд:
```bash
npm run dev
npm run dev2
```
## Команды
В зависмисоти от типа проекта команды меняються (play или devplay).
- `/play query` — Запукс песни в очерди и добавление в конец плейлиста. 
  - query - сылка на песню.
- `/skip` — Пропустить текущю песню в плейлисте.
- `/leave` — Выйти с войса и сотановить проигрывание.
- `/clearquen` — Очистить плейлист.
- `/pause` — Пауза трека.
- `/unpause` — Продолжыть воспроизведение трека.
## Web GUI
Для утсановки перейди на репозитроий графики и установите следуя инструкции.
[Перейти на GitHub репозиторий](https://github.com/MaksBerkutov/Finer-Client)

## Лицензия
Этот проект лицензируется на условиях MIT License. Подробности смотрите в файле [LICENSE](LICENSE).