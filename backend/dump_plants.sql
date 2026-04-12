CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Справочник типов растений
CREATE TABLE plant_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник стилей сада
CREATE TABLE garden_styles (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    characteristics JSONB, -- Особенности стиля в JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник цветов (палитра)
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    hex_code VARCHAR(7) NOT NULL, -- HEX код цвета
    category VARCHAR(50), -- основной, дополнительный, акцентный
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник климатических зон (USDA или российские)
CREATE TABLE climate_zones (
    id SERIAL PRIMARY KEY,
    usda_zone VARCHAR(10) NOT NULL UNIQUE, -- '4a', '5b', '6a' и т.д.
    min_temperature DECIMAL(5,2), -- минимальная температура в °C
    description TEXT,
    region_examples TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник условий освещенности
CREATE TABLE light_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sun_hours_min INTEGER, -- минимальное часов солнца
    sun_hours_max INTEGER, -- максимальное часов солнца
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник типов почвы
CREATE TABLE soil_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    ph_min DECIMAL(3,1), -- минимальный pH
    ph_max DECIMAL(3,1), -- максимальный pH
    drainage VARCHAR(50), -- дренаж
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник условий влажности
CREATE TABLE moisture_conditions (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    watering_frequency VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Справочник сезонности
CREATE TABLE seasons (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    months_range VARCHAR(50), -- диапазон месяцев
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Основная таблица растений
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    name_ru VARCHAR(200) NOT NULL,
    name_latin VARCHAR(200) NOT NULL,
    plant_type_id INTEGER REFERENCES plant_types(id),
    description TEXT,

    -- Экологические параметры
    climate_zone_min VARCHAR(10), -- минимальная зона USDA
    climate_zone_max VARCHAR(10), -- максимальная зона USDA
    light_condition_id INTEGER REFERENCES light_conditions(id),
    soil_type_id INTEGER REFERENCES soil_types(id),
    moisture_condition_id INTEGER REFERENCES moisture_conditions(id),

    -- Характеристики растения
    height_min DECIMAL(6,2), -- минимальная высота в см
    height_max DECIMAL(6,2), -- максимальная высота в см
    width_min DECIMAL(6,2), -- минимальная ширина в см
    width_max DECIMAL(6,2), -- максимальная ширина в см

    -- Сроки
    flowering_start_season_id INTEGER REFERENCES seasons(id),
    flowering_end_season_id INTEGER REFERENCES seasons(id),
    foliage_season_id INTEGER REFERENCES seasons(id), -- сезон декоративной листвы

    -- Особенности ухода
    care_complexity INTEGER CHECK (care_complexity BETWEEN 1 AND 5), -- сложность ухода (1-5)
    is_perennial BOOLEAN DEFAULT TRUE, -- многолетнее
    is_evergreen BOOLEAN DEFAULT FALSE, -- вечнозеленое
    is_toxic BOOLEAN DEFAULT FALSE, -- ядовитое

    -- Медиа
    image_url TEXT, -- URL изображения растения
    color_palette JSONB, -- доминирующие цвета в формате JSON

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Связь растений и цветов (многие-ко-многим)
CREATE TABLE plant_colors (
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    color_id INTEGER REFERENCES colors(id) ON DELETE CASCADE,
    color_type VARCHAR(50), -- 'flower', 'foliage', 'berry', 'bark'
    intensity INTEGER CHECK (intensity BETWEEN 1 AND 10), -- интенсивность цвета
    PRIMARY KEY (plant_id, color_id, color_type)
);

-- Связь растений и стилей сада (многие-ко-многим)
CREATE TABLE plant_garden_styles (
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    style_id INTEGER REFERENCES garden_styles(id) ON DELETE CASCADE,
    suitability INTEGER CHECK (suitability BETWEEN 1 AND 10), -- пригодность для стиля
    PRIMARY KEY (plant_id, style_id)
);

-- Связь растений и сезонов декоративности
CREATE TABLE plant_seasons (
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    season_id INTEGER REFERENCES seasons(id) ON DELETE CASCADE,
    decorative_aspect VARCHAR(50), -- 'flowering', 'foliage', 'berry', 'bark'
    PRIMARY KEY (plant_id, season_id, decorative_aspect)
);

-- Таблица для карточек опроса
CREATE TABLE survey_cards (
    id SERIAL PRIMARY KEY,
    card_name VARCHAR(200) NOT NULL,
    description TEXT,

    -- Атрибуты карточки
    color_palette JSONB NOT NULL, -- массив цветов в HEX
    plant_type_ids JSONB, -- массив ID типов растений
    style_ids JSONB, -- массив ID стилей
    season_ids JSONB, -- массив ID сезонов

    image_url TEXT, -- URL изображения карточки
    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица пользователей
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица ответов на опрос
CREATE TABLE user_survey_responses (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    survey_card_id INTEGER REFERENCES survey_cards(id),
    is_liked BOOLEAN NOT NULL,
    response_time_ms INTEGER, -- время ответа в мс
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица экологических параметров пользователя
CREATE TABLE user_environment (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    climate_zone VARCHAR(10) REFERENCES climate_zones(usda_zone),
    light_condition_id INTEGER REFERENCES light_conditions(id),
    soil_type_id INTEGER REFERENCES soil_types(id),
    moisture_condition_id INTEGER REFERENCES moisture_conditions(id),
    garden_size VARCHAR(50), -- малый, средний, большой
    garden_purpose JSONB, -- цели сада
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица рекомендаций для пользователей
CREATE TABLE user_recommendations (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    recommendation_set JSONB NOT NULL, -- набор растений в JSON
    recommendation_score DECIMAL(5,4), -- оценка рекомендации (0-1)
    feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5), -- оценка пользователя
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_plants_climate_zone ON plants(climate_zone_min, climate_zone_max);
CREATE INDEX idx_plants_light_condition ON plants(light_condition_id);
CREATE INDEX idx_plants_care_complexity ON plants(care_complexity);
CREATE INDEX idx_user_responses_user ON user_survey_responses(user_id, created_at);
CREATE INDEX idx_plant_colors_color ON plant_colors(color_id);

-- Вставляем типы растений
INSERT INTO plant_types (name, description) VALUES
('Многолетние травянистые', 'Травянистые растения, живущие более двух лет'),
('Кустарники', 'Многолетние деревянистые растения с несколькими стеблями'),
('Деревья', 'Крупные многолетние растения с одним главным стволом'),
('Луковичные', 'Растения с подземными запасающими органами'),
('Хвойные', 'Растения с игольчатыми или чешуйчатыми листьями'),
('Почвопокровные', 'Низкорослые растения, образующие сплошной покров'),
('Лианы', 'Вьющиеся и лазающие растения'),
('Злаки и травы', 'Декоративные злаки и травы');

-- Вставляем стили сада
INSERT INTO garden_styles (name, description, characteristics) VALUES
('Английский коттеджный сад', 'Неформальный, пышный, романтичный стиль',
 '{"features": ["обильное цветение", "смешанные посадки", "извилистые дорожки"], "mood": "романтичный, ностальгический"}'),
('Современный минимализм', 'Четкие линии, простота, ограниченная палитра',
 '{"features": ["геометрические формы", "акцент на фактуре", "ограниченная цветовая гамма"], "mood": "спокойный, лаконичный"}'),
('Японский сад', 'Гармония, асимметрия, природные материалы',
 '{"features": ["камень", "вода", "мхи", "асимметрия"], "mood": "созерцательный, умиротворенный"}'),
('Средиземноморский стиль', 'Солнцелюбивые растения, засухоустойчивость',
 '{"features": ["ароматные травы", "серебристые листья", "терракотовые горшки"], "mood": "теплый, расслабленный"}'),
('Деревенский стиль', 'Простой, натуральный, с местными растениями',
 '{"features": ["плодовые растения", "полевые цветы", "деревянные элементы"], "mood": "уютный, натуральный"}'),
('Эко-сад', 'Естественный, дикорастущие растения, поддержка биоразнообразия',
 '{"features": ["местные виды", "дикие цветы", "укрытия для животных"], "mood": "естественный, дикий"}');

-- Вставляем цвета
INSERT INTO colors (name, hex_code, category) VALUES
('Белый', '#FFFFFF', 'основной'),
('Кремовый', '#FFFDD0', 'основной'),
('Нежно-розовый', '#FFD1DC', 'основной'),
('Ярко-розовый', '#FF69B4', 'акцентный'),
('Красный', '#FF0000', 'акцентный'),
('Бордовый', '#800000', 'дополнительный'),
('Лавандовый', '#E6E6FA', 'основной'),
('Фиолетовый', '#800080', 'акцентный'),
('Синий', '#0000FF', 'основной'),
('Голубой', '#ADD8E6', 'основной'),
('Желтый', '#FFFF00', 'акцентный'),
('Оранжевый', '#FFA500', 'акцентный'),
('Лимонный', '#FFF44F', 'акцентный'),
('Серебристый', '#C0C0C0', 'дополнительный'),
('Серо-зеленый', '#5F7A6B', 'дополнительный'),
('Светло-зеленый', '#90EE90', 'фон'),
('Темно-зеленый', '#013220', 'фон'),
('Пурпурный', '#9F00C5', 'акцентный');

-- Вставляем климатические зоны (USDA для средней полосы России)
INSERT INTO climate_zones (usda_zone, min_temperature, description, region_examples) VALUES
('3a', -40.0, 'Очень холодные зимы', 'Северная Сибирь'),
('3b', -37.2, 'Холодные зимы', 'Северный Урал'),
('4a', -34.4, 'Холодные зимы', 'Южный Урал, Алтай'),
('4b', -31.7, 'Умеренно холодные зимы', 'Средний Урал'),
('5a', -28.9, 'Умеренные зимы', 'Московская область, Средняя полоса'),
('5b', -26.1, 'Умеренные зимы', 'Центральная Россия'),
('6a', -23.3, 'Относительно мягкие зимы', 'Западная Россия, Юг'),
('6b', -20.6, 'Мягкие зимы', 'Калининградская область');

-- Вставляем условия освещенности
INSERT INTO light_conditions (name, description, sun_hours_min, sun_hours_max) VALUES
('Полное солнце', 'Прямое солнце более 6 часов в день', 6, 12),
('Полутень', 'Солнце 3-6 часов в день или рассеянный свет', 3, 6),
('Тень', 'Менее 3 часов прямого солнца или глубокая тень', 0, 3),
('Любое освещение', 'Растение адаптируется к разным условиям', 0, 12);

-- Вставляем типы почвы
INSERT INTO soil_types (name, description, ph_min, ph_max, drainage) VALUES
('Суглинок', 'Идеальная почва, смесь глины, песка и ила', 6.0, 7.0, 'хороший'),
('Песчаная', 'Легкая, хорошо дренированная, бедная питательными веществами', 5.5, 7.5, 'отличный'),
('Глинистая', 'Тяжелая, плохо дренированная, богатая питательными веществами', 6.0, 7.5, 'плохой'),
('Супесчаная', 'Легкая, умеренно дренированная', 5.5, 7.0, 'хороший'),
('Торфяная', 'Кислая, влагоемкая, богатая органикой', 4.0, 6.0, 'умеренный'),
('Известковая', 'Щелочная, часто каменистая', 7.0, 8.5, 'хороший');

-- Вставляем условия влажности
INSERT INTO moisture_conditions (name, description, watering_frequency) VALUES
('Сухая', 'Засухоустойчивые растения, не требуют частого полива', 'редкий'),
('Умеренная', 'Стандартные условия, полив по мере подсыхания', 'умеренный'),
('Влажная', 'Растения любят постоянно влажную почву', 'частый'),
('Заболоченная', 'Растения для берегов водоемов и болот', 'постоянная влага');

-- Вставляем сезоны
INSERT INTO seasons (name, months_range, description) VALUES
('Ранняя весна', 'март-апрель', 'Первоцветы, начало вегетации'),
('Поздняя весна', 'апрель-май', 'Весеннее цветение'),
('Раннее лето', 'июнь', 'Начало летнего цветения'),
('Разгар лета', 'июль-август', 'Основное цветение'),
('Ранняя осень', 'сентябрь', 'Осенние краски, поздние цветы'),
('Поздняя осень', 'октябрь-ноябрь', 'Окончание сезона, подготовка к зиме'),
('Зима', 'декабрь-февраль', 'Зимние декоративные элементы'),
('Круглый год', 'все месяцы', 'Декоративность в течение всего года');

-- Вставляем реальные растения (20 примеров)
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
-- 1. Лаванда
('Лаванда узколистная', 'Lavandula angustifolia', 1,
 'Ароматный многолетник с серебристой листвой и фиолетовыми цветами. Любит солнце и хорошо дренированные почвы.',
 '5a', '6b', 1, 1, 1, 30, 60, 40, 80, 2, 3, 7, 2, TRUE, TRUE, FALSE,
 'https://example.com/images/lavandula.jpg'),

-- 2. Гортензия метельчатая
('Гортензия метельчатая "Лаймлайт"', 'Hydrangea paniculata "Limelight"', 2,
 'Крупный кустарник с огромными соцветиями, меняющими цвет от лаймового до белого и розового.',
 '4a', '6b', 1, 1, 2, 150, 200, 150, 200, 3, 4, 7, 3, TRUE, FALSE, FALSE,
 'https://example.com/images/hydrangea.jpg'),

-- 3. Спирея японская
('Спирея японская "Голдфлейм"', 'Spiraea japonica "Goldflame"', 2,
 'Компактный кустарник с яркой желто-оранжевой листвой и розовыми цветами.',
 '4a', '6b', 1, 1, 2, 60, 80, 80, 100, 2, 3, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/spirea.jpg'),

-- 4. Хоста
('Хоста "Блю Айвори"', 'Hosta "Blue Ivory"', 1,
 'Теневыносливое растение с крупными сизо-голубыми листьями с кремовой каймой.',
 '3a', '6b', 2, 1, 2, 40, 50, 60, 80, 3, 4, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/hosta.jpg'),

-- 5. Роза флорибунда
('Роза "Леонардо да Винчи"', 'Rosa "Leonardo da Vinci"', 2,
 'Пышноцветущая роза с густомахровыми цветами насыщенного розового цвета.',
 '5a', '6b', 1, 1, 2, 80, 100, 60, 80, 2, 5, 7, 4, TRUE, FALSE, FALSE,
 'https://example.com/images/rose.jpg'),

-- 6. Декоративный клен
('Клен дланевидный "Атропурпуреум"', 'Acer palmatum "Atropurpureum"', 3,
 'Небольшое дерево с изящной кроной и пурпурно-красными листьями, осенью ярко-красными.',
 '5b', '6b', 2, 1, 2, 200, 300, 250, 350, NULL, NULL, 5, 3, TRUE, FALSE, FALSE,
 'https://example.com/images/maple.jpg'),

-- 7. Туя западная
('Туя западная "Смарагд"', 'Thuja occidentalis "Smaragd"', 5,
 'Колонновидное хвойное растение с изумрудно-зеленой хвоей, сохраняющей цвет зимой.',
 '3a', '6b', 1, 1, 2, 300, 500, 80, 150, NULL, NULL, 7, 2, TRUE, TRUE, TRUE,
 'https://example.com/images/thuja.jpg'),

-- 8. Шалфей дубравный
('Шалфей дубравный "Мэйнахт"', 'Salvia nemorosa "Mainacht"', 1,
 'Неприхотливый многолетник с фиолетово-синими колосовидными соцветиями.',
 '4a', '6b', 1, 1, 1, 40, 60, 30, 40, 3, 4, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/salvia.jpg'),

-- 9. Очиток видный
('Очиток видный "Бриллиант"', 'Sedum spectabile "Brilliant"', 1,
 'Сукулентное растение с мясистыми листьями и розовыми щитковидными соцветиями.',
 '3a', '6b', 1, 2, 1, 40, 50, 40, 50, 4, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/sedum.jpg'),

-- 10. Астильба
('Астильба "Фанал"', 'Astilbe "Fanal"', 1,
 'Тенелюбивое растение с ажурными красными соцветиями и декоративной листвой.',
 '4a', '6b', 2, 1, 3, 60, 80, 40, 50, 3, 4, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/astilbe.jpg'),

-- 11. Пион молочноцветковый
('Пион "Сара Бернар"', 'Paeonia lactiflora "Sarah Bernhardt"', 1,
 'Классический пион с огромными махровыми розовыми цветами и приятным ароматом.',
 '3a', '6b', 1, 1, 2, 80, 100, 80, 100, 2, 2, 7, 3, TRUE, FALSE, FALSE,
 'https://example.com/images/peony.jpg'),

-- 12. Ирис бородатый
('Ирис бородатый "Беверли Хиллз"', 'Iris germanica "Beverly Hills"', 1,
 'Корневищный многолетник с крупными оранжево-розовыми цветами.',
 '4a', '6b', 1, 1, 1, 70, 90, 30, 40, 2, 2, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/iris.jpg'),

-- 13. Лилейник
('Лилейник "Стелла де Оро"', 'Hemerocallis "Stella de Oro"', 1,
 'Компактный лилейник с золотисто-желтыми цветами, цветущий все лето.',
 '3a', '6b', 1, 1, 2, 30, 40, 40, 50, 2, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/daylily.jpg'),

-- 14. Можжевельник горизонтальный
('Можжевельник горизонтальный "Блю Чип"', 'Juniperus horizontalis "Blue Chip"', 5,
 'Стелющийся хвойный кустарник с серебристо-голубой хвоей.',
 '3a', '6b', 1, 2, 1, 20, 30, 150, 200, NULL, NULL, 7, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/juniper.jpg'),

-- 15. Бузульник зубчатый
('Бузульник зубчатый "Отелло"', 'Ligularia dentata "Othello"', 1,
 'Крупное растение с пурпурными листьями и оранжевыми ромашковидными цветами.',
 '4a', '6b', 2, 1, 3, 100, 120, 80, 100, 3, 4, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/ligularia.jpg'),

-- 16. Девичий виноград
('Девичий виноград пятилисточковый', 'Parthenocissus quinquefolia', 7,
 'Быстрорастущая лиана с яркой осенней окраской от оранжевой до пурпурной.',
 '3a', '6b', 1, 1, 2, 1000, 1500, 300, 500, NULL, NULL, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/vine.jpg'),

-- 17. Мискантус китайский
('Мискантус китайский "Малипатрон"', 'Miscanthus sinensis "Malepartus"', 8,
 'Декоративный злак с изящными метелками и осенней окраской.',
 '5a', '6b', 1, 1, 2, 180, 220, 80, 100, 4, 5, 5, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/miscanthus.jpg'),

-- 18. Флокс метельчатый
('Флокс метельчатый "Блю Парадайз"', 'Phlox paniculata "Blue Paradise"', 1,
 'Классический многолетник с ароматными сиренево-голубыми соцветиями.',
 '4a', '6b', 1, 1, 2, 80, 100, 50, 60, 3, 4, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/phlox.jpg'),

-- 19. Рододендрон
('Рододендрон "Нова Зембла"', 'Rhododendron "Nova Zembla"', 2,
 'Вечнозеленый кустарник с крупными рубиново-красными цветами.',
 '5a', '6b', 2, 5, 2, 150, 180, 150, 180, 2, 2, 7, 4, TRUE, TRUE, TRUE,
 'https://example.com/images/rhododendron.jpg'),

-- 20. Барбарис Тунберга
('Барбарис Тунберга "Атропурпуреа"', 'Berberis thunbergii "Atropurpurea"', 2,
 'Колючий кустарник с пурпурной листвой, осенью ярко-красный.',
 '4a', '6b', 1, 1, 1, 150, 180, 150, 180, 2, 2, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/barberry.jpg');

-- Заполняем связи растений с цветами
INSERT INTO plant_colors (plant_id, color_id, color_type, intensity) VALUES
-- Лаванда
(1, 8, 'flower', 8),  -- фиолетовый
(1, 14, 'foliage', 6), -- серебристый

-- Гортензия
(2, 9, 'flower', 7),  -- синий (в кислой почве)
(2, 1, 'flower', 6),  -- белый
(2, 3, 'flower', 5),  -- розовый

-- Спирея
(3, 11, 'foliage', 9), -- желтый
(3, 3, 'flower', 7),   -- розовый

-- Хоста
(4, 9, 'foliage', 6),  -- синий
(4, 1, 'foliage', 5),  -- белый

-- Роза
(5, 3, 'flower', 9),   -- розовый

-- Клен
(6, 5, 'foliage', 8),  -- красный
(6, 6, 'foliage', 7),  -- бордовый

-- Шалфей
(8, 8, 'flower', 9),   -- фиолетовый
(8, 9, 'flower', 7),   -- синий

-- Очиток
(9, 3, 'flower', 8),   -- розовый
(9, 16, 'foliage', 6), -- серо-зеленый

-- Астильба
(10, 5, 'flower', 9),  -- красный

-- Пион
(11, 3, 'flower', 9),  -- розовый

-- Ирис
(12, 12, 'flower', 8), -- оранжевый
(12, 3, 'flower', 7),  -- розовый

-- Лилейник
(13, 11, 'flower', 9), -- желтый

-- Можжевельник
(14, 9, 'foliage', 8), -- синий
(14, 14, 'foliage', 6),-- серебристый

-- Бузульник
(15, 12, 'flower', 9), -- оранжевый
(15, 6, 'foliage', 8), -- бордовый

-- Девичий виноград
(16, 12, 'foliage', 9), -- оранжевый осенью
(16, 5, 'foliage', 8),  -- красный осенью

-- Мискантус
(17, 11, 'flower', 7),  -- желтый
(17, 15, 'foliage', 6), -- серо-зеленый

-- Флокс
(18, 8, 'flower', 8),   -- фиолетовый
(18, 9, 'flower', 7),   -- синий

-- Рододендрон
(19, 5, 'flower', 9),   -- красный

-- Барбарис
(20, 6, 'foliage', 8);  -- бордовый

-- Заполняем связи растений со стилями сада
INSERT INTO plant_garden_styles (plant_id, style_id, suitability) VALUES
-- Лаванда - Средиземноморский, Английский
(1, 4, 10), (1, 1, 8),

-- Гортензия - Английский, Деревенский
(2, 1, 9), (2, 5, 8),

-- Спирея - Современный, Деревенский
(3, 2, 8), (3, 5, 7),

-- Хоста - Японский, Современный
(4, 3, 9), (4, 2, 7),

-- Роза - Английский, Деревенский
(5, 1, 10), (5, 5, 9),

-- Клен - Японский, Современный
(6, 3, 10), (6, 2, 8),

-- Туя - Современный
(7, 2, 9),

-- Шалфей - Средиземноморский, Эко-сад
(8, 4, 9), (8, 6, 8),

-- Очиток - Современный, Средиземноморский
(9, 2, 8), (9, 4, 7),

-- Астильба - Японский, Деревенский
(10, 3, 9), (10, 5, 7),

-- Пион - Английский, Деревенский
(11, 1, 10), (11, 5, 9),

-- Ирис - Английский, Деревенский
(12, 1, 8), (12, 5, 8),

-- Лилейник - Деревенский, Эко-сад
(13, 5, 8), (13, 6, 7),

-- Можжевельник - Современный, Средиземноморский
(14, 2, 9), (14, 4, 8),

-- Бузульник - Деревенский, Эко-сад
(15, 5, 8), (15, 6, 8),

-- Девичий виноград - Деревенский, Эко-сад
(16, 5, 7), (16, 6, 8),

-- Мискантус - Современный, Эко-сад
(17, 2, 9), (17, 6, 8),

-- Флокс - Английский, Деревенский
(18, 1, 9), (18, 5, 8),

-- Рододендрон - Японский, Английский
(19, 3, 10), (19, 1, 8),

-- Барбарис - Современный, Средиземноморский
(20, 2, 8), (20, 4, 7);

-- Заполняем связи растений с сезонами декоративности
INSERT INTO plant_seasons (plant_id, season_id, decorative_aspect) VALUES
-- Лаванда - лето (цветение)
(1, 3, 'flowering'), (1, 4, 'flowering'),

-- Гортензия - лето-осень (цветение)
(2, 4, 'flowering'), (2, 5, 'flowering'),

-- Спирея - весна-лето (цветение, листва)
(3, 2, 'flowering'), (3, 3, 'foliage'),

-- Хоста - лето (листва)
(4, 3, 'foliage'), (4, 4, 'foliage'),

-- Роза - лето (цветение)
(5, 3, 'flowering'), (5, 4, 'flowering'),

-- Клен - осень (листва)
(6, 5, 'foliage'),

-- Туя - круглый год (хвоя)
(7, 8, 'foliage'),

-- Шалфей - лето (цветение)
(8, 3, 'flowering'), (8, 4, 'flowering'),

-- Очиток - осень (цветение)
(9, 5, 'flowering'),

-- Астильба - лето (цветение)
(10, 3, 'flowering'), (10, 4, 'flowering'),

-- Пион - весна (цветение)
(11, 2, 'flowering'),

-- Ирис - весна (цветение)
(12, 2, 'flowering'),

-- Лилейник - лето (цветение)
(13, 3, 'flowering'), (13, 4, 'flowering'),

-- Можжевельник - круглый год (хвоя)
(14, 8, 'foliage'),

-- Бузульник - лето (цветение, листва)
(15, 3, 'flowering'), (15, 4, 'foliage'),

-- Девичий виноград - осень (листва)
(16, 5, 'foliage'),

-- Мискантус - осень (соцветия, листва)
(17, 5, 'flowering'), (17, 5, 'foliage'),

-- Флокс - лето (цветение)
(18, 3, 'flowering'), (18, 4, 'flowering'),

-- Рододендрон - весна (цветение)
(19, 2, 'flowering'),

-- Барбарис - весна-осень (листва)
(20, 2, 'foliage'), (20, 5, 'foliage');

-- Создаем карточки для опроса (10 карточек)
INSERT INTO survey_cards (card_name, description, color_palette, plant_type_ids, style_ids, season_ids, image_url) VALUES
('Романтичный английский сад', 'Мягкие пастельные тона, пышное цветение, неформальная планировка',
 '["#FFD1DC", "#E6E6FA", "#FFFFFF", "#90EE90"]', '[1, 2]', '[1]', '[2, 3, 4]',
 'https://example.com/cards/english_garden.jpg'),

('Современный минимализм', 'Четкие линии, ограниченная палитра, акцент на форме и текстуре',
 '["#FFFFFF", "#C0C0C0", "#013220", "#5F7A6B"]', '[5, 8]', '[2]', '[8]',
 'https://example.com/cards/modern_minimalism.jpg'),

('Японский сад умиротворения', 'Природные материалы, асимметрия, зеленые и серые тона',
 '["#013220", "#5F7A6B", "#C0C0C0", "#FFFFFF"]', '[3, 5]', '[3]', '[8]',
 'https://example.com/cards/japanese_garden.jpg'),

('Средиземноморское солнце', 'Серебристая листва, синие и фиолетовые акценты, ароматные травы',
 '["#E6E6FA", "#800080", "#C0C0C0", "#5F7A6B"]', '[1, 5]', '[4]', '[3, 4]',
 'https://example.com/cards/mediterranean.jpg'),

('Осенний фейерверк', 'Теплые осенние краски, яркие акценты, декоративные травы',
 '["#FFA500", "#FFFF00", "#800000", "#9F00C5"]', '[2, 8]', '[5, 6]', '[5]',
 'https://example.com/cards/autumn_fireworks.jpg'),

('Весенняя свежесть', 'Нежные весенние цвета, первоцветы, пробуждение природы',
 '["#90EE90", "#FFFFFF", "#FFD1DC", "#ADD8E6"]', '[1, 4]', '[1, 5]', '[1, 2]',
 'https://example.com/cards/spring_freshness.jpg'),

('Деревенский шарм', 'Натуральные материалы, смешанные посадки, плодовые растения',
 '["#FFA500", "#FFFF00", "#90EE90", "#800000"]', '[1, 2, 5]', '[5]', '[2, 3, 4, 5]',
 'https://example.com/cards/cottage_charm.jpg'),

('Сине-фиолетовая гармония', 'Холодная цветовая гамма, успокаивающее воздействие',
 '["#0000FF", "#800080", "#E6E6FA", "#ADD8E6"]', '[1, 2]', '[1, 3, 4]', '[3, 4]',
 'https://example.com/cards/blue_purple_harmony.jpg'),

('Белый сад', 'Монохромная элегантность, игра света и тени, ночная магия',
 '["#FFFFFF", "#FFFDD0", "#C0C0C0", "#90EE90"]', '[1, 2, 5]', '[1, 2]', '[2, 3, 4]',
 'https://example.com/cards/white_garden.jpg'),

('Эко-сад дикой природы', 'Местные виды, поддержка биоразнообразия, естественная красота',
 '["#013220", "#5F7A6B", "#FFFF00", "#FFA500"]', '[1, 8]', '[6]', '[1, 2, 3, 4, 5]',
 'https://example.com/cards/eco_garden.jpg');