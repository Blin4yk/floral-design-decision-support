# Flora Vision - Frontend + Mock Backend

Проект реализует SPA для сервиса подбора растений по фото участка, гармонии цвета (круг Иттена) и климатической зоне.  
В репозитории добавлены:
- фронтенд (React + Vite),
- mock-микросервисы backend (FastAPI),
- единый API Gateway,
- `docker-compose` для запуска всей системы одной командой.

## Что сделано

### 1) Фронтенд по макетам SVG 01-07

Верстка и логика выстроены по структуре ваших макетов:
- `01_landing.svg` -> лендинг с hero, CTA, блоком шагов и статистикой.
- `02_auth.svg` -> форма регистрации/входа с табами, чекбоксом условий, OAuth-кнопкой.
- `03_photo_upload.svg` -> шаг загрузки фото с drag/drop зоной и подсказками.
- `04_choose_color.svg` -> шаг гармонии с типами гармоний и итоговой палитрой.
- `05_location.svg` -> шаг локации с адресом, геопоиском и выводом зоны.
- `06_moodboard.svg` -> карточки растений + фильтры + экспорт PDF.
- `07_plant_card.svg` -> детальная карточка растения + совместимость + CTA.

Ключевые файлы:
- `frontend/src/pages/*`
- `frontend/src/components/*`
- `frontend/src/styles.css`
- `frontend/src/services/api.js`
- `frontend/src/store/*`
- `frontend/src/utils/harmony.js`
- `frontend/src/utils/pdf.js`

### 2) Регистрация/вход через Яндекс

Добавлена кнопка "Войти через Яндекс" на странице авторизации:
- фронтенд вызывает `GET /api/auth/yandex/url`,
- получает OAuth URL и открывает его в новой вкладке.

Файлы:
- `frontend/src/pages/AuthPage.jsx`
- `frontend/src/services/api.js`
- `backend/auth-service/app/main.py`

Важно: в текущем виде это mock-поток (заглушка URL), чтобы фронтенд и UX уже работали.  
Для production нужно подставить реальные `client_id`, callback URI и обмен `code -> token`.

### 3) Backend mock-сервисы

Чтобы фронтенд запускался и тестировался end-to-end, добавлены рабочие заглушки:

- `auth-service` (`8001`)
  - `/api/auth/register`
  - `/api/auth/login`
  - `/api/auth/me`
  - `/api/auth/yandex/url`

- `image-service` (`8002`)
  - `/api/upload` (возвращает палитру в HEX)

- `geo-service` (`8003`)
  - `/api/location/zone?lat=&lng=`

- `recommendation-service` (`8004`)
  - `/api/harmony`
  - `/api/match`
  - `/api/plants`
  - `/api/plants/:id`

- `preferences-service` (`8005`)
  - `/api/user/garden` GET/POST/DELETE

- `api-gateway` (`8000`)
  - маршрутизация всех `/api/*` вызовов во внутренние сервисы.

### 4) Docker и инфраструктура

Собран единый `docker-compose.yml`:
- `frontend` (Vite),
- `api-gateway`,
- `auth-service`,
- `image-service`,
- `geo-service`,
- `recommendation-service`,
- `preferences-service`.

Все сервисы поднимаются вместе, и фронтенд обращается к gateway.

## Почему именно такое решение

1. **Mock backend в микросервисном виде**  
   Позволяет сразу тестировать весь пользовательский сценарий и контракты API, не дожидаясь полной реализации бизнес-логики.

2. **API Gateway перед сервисами**  
   Упрощает фронтенд: один `baseURL`, единая точка входа, проще переключаться с mock на real backend.

3. **Redux Toolkit для шагающего флоу**  
   Палитра, гармония, зона и список растений нужны сразу на нескольких страницах - централизованный store надежнее локального состояния.

4. **Разделение `pages/components/services/store/utils`**  
   Такая структура снижает связность и упрощает дальнейшую доработку под финальные макеты и бизнес-правила.

5. **PDF через `html2canvas + jsPDF`**  
   Быстрый способ экспортировать текущие UI-блоки без отдельного backend-рендера PDF.

## Инструкция по запуску

### Вариант A (рекомендуется): через Docker Compose

Требования:
- Docker Desktop
- Docker Compose v2

Команды из корня проекта:

```bash
docker compose up --build -d
docker compose ps
```

Доступ:
- Frontend: `http://localhost:5173`
- API Gateway: `http://localhost:8000`

Остановка:

```bash
docker compose down
```

### Вариант B: локально без Docker

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

#### Backend (каждый сервис отдельно)
Для каждого сервиса:
```bash
cd backend/<service-name>
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port <port>
```

Порты:
- gateway: `8000`
- auth: `8001`
- image: `8002`
- geo: `8003`
- recommendation: `8004`
- preferences: `8005`

## Что можно допилить дальше

- Подогнать пиксель-перфект (размеры шрифтов, интервалы, графические декоративные элементы) строго 1:1 на основе финальных SVG-ассетов.
- Реализовать полноценный OAuth Яндекс callback flow.
- Заменить mock-данные на реальный backend.
- Добавить автотесты (unit + e2e).
