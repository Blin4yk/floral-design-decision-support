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

-- =====================================================
-- ДОПОЛНИТЕЛЬНЫЕ РАСТЕНИЯ (41 штука) для достижения минимум 60
-- =====================================================

-- 21. Дерен белый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Дерен белый "Элегантиссима"', 'Cornus alba "Elegantissima"', 2,
 'Кустарник с яркими красными побегами зимой и пестрыми бело-зелеными листьями. Неприхотлив, отлично стрижется.',
 '2a', '7b', 1, 1, 2, 200, 250, 200, 250, 2, 3, 6, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/cornus_elegantissima.jpg');

-- 22. Пузыреплодник калинолистный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Пузыреплодник калинолистный "Диаболо"', 'Physocarpus opulifolius "Diabolo"', 2,
 'Мощный кустарник с темно-пурпурной листвой и белыми щитками цветов. Декоративен весь сезон.',
 '3a', '7b', 1, 1, 2, 250, 300, 200, 250, 3, 4, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/physocarpus_diabolo.jpg');

-- 23. Чубушник венечный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Чубушник венечный "Ауреус"', 'Philadelphus coronarius "Aureus"', 2,
 'Листопадный кустарник с золотисто-желтой листвой весной и ароматными белыми цветами в начале лета.',
 '4a', '7b', 1, 1, 2, 150, 200, 120, 180, 3, 3, 5, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/philadelphus_aureus.jpg');

-- 24. Вейгела цветущая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Вейгела цветущая "Нана Вариегата"', 'Weigela florida "Nana Variegata"', 2,
 'Карликовый кустарник с кремово-окаймленными листьями и нежно-розовыми колокольчатыми цветами.',
 '4a', '8a', 1, 1, 2, 60, 100, 80, 120, 2, 3, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/weigela_nana_variegata.jpg');

-- 25. Сирень обыкновенная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Сирень обыкновенная "Красавица Москвы"', 'Syringa vulgaris "Krasavitsa Moskvy"', 2,
 'Классическая сирень с махровыми бело-розовыми ароматными соцветиями. Морозостойка.',
 '3a', '7b', 1, 1, 2, 300, 400, 200, 300, 2, 2, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/syringa_beauty_moscow.jpg');

-- 26. Калина обыкновенная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Калина обыкновенная "Розеум"', 'Viburnum opulus "Roseum"', 2,
 'Декоративная форма с шаровидными соцветиями, напоминающими снежные комья. Осенью листва краснеет.',
 '3a', '7b', 1, 1, 3, 250, 350, 250, 350, 2, 3, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/viburnum_roseum.jpg');

-- 27. Бересклет крылатый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Бересклет крылатый "Компактус"', 'Euonymus alatus "Compactus"', 2,
 'Кустарник с пробковыми наростами на ветвях и пламенеющей осенней окраской листвы.',
 '4a', '7b', 1, 1, 2, 100, 150, 100, 150, NULL, NULL, 5, 1, TRUE, FALSE, TRUE,
 'https://example.com/images/euonymus_compactus.jpg');

-- 28. Кизильник блестящий
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Кизильник блестящий', 'Cotoneaster lucidus', 2,
 'Густой кустарник с глянцевой темно-зеленой листвой и черными ягодами. Идеален для живой изгороди.',
 '3a', '7b', 1, 1, 1, 150, 200, 150, 200, 2, 3, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/cotoneaster_lucidus.jpg');

-- 29. Снежноягодник белый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Снежноягодник белый', 'Symphoricarpos albus', 2,
 'Кустарник с округлыми белыми плодами, сохраняющимися зимой. Теневынослив и неприхотлив.',
 '3a', '7b', 2, 1, 1, 100, 150, 100, 150, 3, 4, 6, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/symphoricarpos_albus.jpg');

-- 30. Магония падуболистная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Магония падуболистная', 'Mahonia aquifolium', 2,
 'Вечнозеленый кустарник с колючими блестящими листьями и желтыми ароматными соцветиями.',
 '5a', '8b', 2, 1, 2, 80, 120, 80, 120, 1, 2, 8, 2, TRUE, TRUE, FALSE,
 'https://example.com/images/mahonia_aquifolium.jpg');

-- 31. Лапчатка кустарниковая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Лапчатка кустарниковая "Голдфингер"', 'Potentilla fruticosa "Goldfinger"', 2,
 'Компактный кустарник с ярко-желтыми цветами, цветущий с июня до заморозков. Засухоустойчив.',
 '3a', '7b', 1, 1, 1, 60, 80, 80, 100, 3, 6, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/potentilla_goldfinger.jpg');

-- 32. Форзиция промежуточная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Форзиция промежуточная "Линвуд"', 'Forsythia x intermedia "Lynwood"', 2,
 'Один из первых вестников весны: ярко-желтые цветы появляются до листьев. Хорошо зимует под снегом.',
 '4a', '7b', 1, 1, 2, 200, 250, 150, 200, 1, 1, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/forsythia_lynwood.jpg');

-- 33. Рябинник рябинолистный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Рябинник рябинолистный "Сэм"', 'Sorbaria sorbifolia "Sem"', 2,
 'Быстрорастущий кустарник с ажурными листьями, меняющими окраску от розово-оранжевой до зеленой.',
 '2a', '7b', 1, 1, 2, 100, 150, 150, 200, 4, 5, 5, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/sorbaria_sem.jpg');

-- 34. Барвинок малый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Барвинок малый "Атропурпуреа"', 'Vinca minor "Atropurpurea"', 6,
 'Вечнозеленый почвопокровник с темно-пурпурными цветами. Отлично растет в тени.',
 '4a', '8a', 2, 1, 2, 10, 15, 50, 80, 2, 3, 8, 1, TRUE, TRUE, TRUE,
 'https://example.com/images/vinca_atropurpurea.jpg');

-- 35. Живучка ползучая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Живучка ползучая "Бургунди Глоу"', 'Ajuga reptans "Burgundy Glow"', 6,
 'Почвопокровное растение с пестрыми листьями (зеленые, кремовые, розовые) и синими соцветиями.',
 '3a', '8b', 2, 1, 2, 10, 15, 30, 60, 2, 3, 7, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/ajuga_burgundy_glow.jpg');

-- 36. Гейхера
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Гейхера "Палас Пёрпл"', 'Heuchera "Palace Purple"', 1,
 'Многолетник с крупными пурпурными листьями и ажурными кремовыми соцветиями на высоких цветоносах.',
 '4a', '8a', 2, 1, 2, 30, 40, 30, 40, 3, 4, 7, 2, TRUE, TRUE, FALSE,
 'https://example.com/images/heuchera_palace_purple.jpg');

-- 37. Гвоздика перистая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Гвоздика перистая "Моцарт"', 'Dianthus plumarius "Mozart"', 1,
 'Подушковидный многолетник с сизо-зелеными листьями и ароматными розово-красными цветами.',
 '3a', '7b', 1, 1, 1, 15, 20, 25, 30, 2, 4, 7, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/dianthus_mozart.jpg');

-- 38. Колокольчик карпатский
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Колокольчик карпатский "Блю Клипс"', 'Campanula carpatica "Blue Clips"', 1,
 'Компактный многолетник с крупными синими колокольчиками. Цветет все лето.',
 '3a', '8a', 1, 1, 2, 20, 30, 30, 40, 3, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/campanula_blue_clips.jpg');

-- 39. Рудбекия блестящая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Рудбекия блестящая "Голдштурм"', 'Rudbeckia fulgida "Goldsturm"', 1,
 'Солнечный многолетник с золотисто-желтыми ромашками и черной серединой. Длительное цветение.',
 '4a', '8a', 1, 1, 2, 60, 80, 40, 50, 4, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/rudbeckia_goldsturm.jpg');

-- 40. Эхинацея пурпурная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Эхинацея пурпурная "Магнус"', 'Echinacea purpurea "Magnus"', 1,
 'Лекарственное и декоративное растение с крупными пурпурно-розовыми соцветиями.',
 '4a', '8a', 1, 1, 1, 80, 100, 40, 50, 4, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/echinacea_magnus.jpg');

-- 41. Котовник Фассена
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Котовник Фассена "Сикс Хиллз Джайнт"', 'Nepeta x faassenii "Six Hills Giant"', 1,
 'Ароматный многолетник с лавандово-синими соцветиями и серо-зеленой листвой. Привлекает пчел.',
 '4a', '8a', 1, 1, 1, 60, 90, 60, 80, 3, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/nepeta_six_hills.jpg');

-- 42. Тысячелистник обыкновенный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Тысячелистник обыкновенный "Ред Вельвет"', 'Achillea millefolium "Red Velvet"', 1,
 'Засухоустойчивый многолетник с ажурной листвой и бархатистыми красными щитками соцветий.',
 '3a', '8a', 1, 1, 1, 60, 80, 40, 60, 3, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/achillea_red_velvet.jpg');

-- 43. Дельфиниум культурный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Дельфиниум культурный "Блю Бёрд"', 'Delphinium cultorum "Blue Bird"', 1,
 'Величественный многолетник с высокими свечами ярко-синих цветов. Требует опоры.',
 '3a', '7b', 1, 1, 2, 150, 180, 40, 60, 3, 4, 7, 4, TRUE, FALSE, TRUE,
 'https://example.com/images/delphinium_blue_bird.jpg');

-- 44. Аквилегия обыкновенная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Аквилегия обыкновенная "Нора Барлоу"', 'Aquilegia vulgaris "Nora Barlow"', 1,
 'Необычный сорт водосбора с махровыми зелено-розово-белыми цветками без шпорцев.',
 '3a', '8a', 2, 1, 2, 60, 80, 30, 40, 2, 3, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/aquilegia_nora_barlow.jpg');

-- 45. Люпин многолистный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Люпин многолистный "Галерея Ред"', 'Lupinus polyphyllus "Gallery Red"', 1,
 'Карликовый люпин с плотными соцветиями насыщенного красного цвета. Предпочитает кислые почвы.',
 '4a', '7b', 1, 5, 2, 50, 60, 30, 40, 3, 4, 7, 3, TRUE, FALSE, FALSE,
 'https://example.com/images/lupinus_gallery_red.jpg');

-- 46. Мак восточный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Мак восточный "Бьюти оф Ливермор"', 'Papaver orientale "Beauty of Livermore"', 1,
 'Крупный многолетник с огромными кроваво-красными цветами и черными пятнами в центре.',
 '3a', '7b', 1, 1, 1, 80, 100, 50, 60, 2, 2, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/papaver_beauty_livermore.jpg');

-- 47. Вербейник монетчатый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Вербейник монетчатый "Ауреа"', 'Lysimachia nummularia "Aurea"', 6,
 'Почвопокровное растение с золотистыми монетками листьев и желтыми цветами. Любит влагу.',
 '3a', '8a', 1, 1, 3, 5, 10, 50, 100, 3, 4, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/lysimachia_aurea.jpg');

-- 48. Камнеломка Арендса
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Камнеломка Арендса "Пурпурный ковер"', 'Saxifraga x arendsii "Purpurteppich"', 6,
 'Вечнозеленый почвопокровник с розетками резных листьев и пурпурно-розовыми цветками.',
 '4a', '7b', 2, 1, 2, 15, 20, 20, 30, 2, 3, 8, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/saxifraga_purpurteppich.jpg');

-- 49. Обриета культурная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Обриета культурная "Каскад Ред"', 'Aubrieta x cultorum "Cascade Red"', 6,
 'Каскадное растение для каменистых горок с пурпурно-красными цветами. Цветет в апреле-мае.',
 '4a', '8a', 1, 1, 1, 10, 15, 40, 60, 1, 2, 7, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/aubrieta_cascade_red.jpg');

-- 50. Молодило кровельное
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Молодило кровельное', 'Sempervivum tectorum', 6,
 'Сукулент с розетками мясистых листьев. Крайне засухоустойчив, зимует без укрытия.',
 '3a', '8b', 1, 2, 1, 10, 20, 20, 30, 3, 4, 8, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/sempervivum_tectorum.jpg');

-- 51. Ясколка войлочная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Ясколка войлочная', 'Cerastium tomentosum', 6,
 'Серебристый ковер из мелких листьев, усыпанный белыми цветами в начале лета. Быстро разрастается.',
 '3a', '7b', 1, 1, 1, 15, 20, 50, 80, 2, 3, 7, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/cerastium_tomentosum.jpg');

-- 52. Флокс шиловидный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Флокс шиловидный "Скарлет Флейм"', 'Phlox subulata "Scarlet Flame"', 6,
 'Вечнозеленый почвопокровник с игольчатыми листьями и яркими розово-красными цветами.',
 '3a', '8a', 1, 1, 1, 10, 15, 40, 60, 2, 2, 8, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/phlox_scarlet_flame.jpg');

-- 53. Горец стеблеобъемлющий
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Горец стеблеобъемлющий "Альба"', 'Persicaria amplexicaulis "Alba"', 1,
 'Мощный многолетник с белыми колосовидными соцветиями, цветущий с июля до заморозков.',
 '4a', '8a', 1, 1, 2, 100, 120, 80, 100, 4, 6, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/persicaria_alba.jpg');

-- 54. Кровохлебка лекарственная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Кровохлебка лекарственная "Танна"', 'Sanguisorba officinalis "Tanna"', 1,
 'Ажурный многолетник с темно-красными "шишечками" соцветий на тонких стеблях. Долго цветет.',
 '3a', '8a', 1, 1, 2, 80, 100, 40, 50, 4, 5, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/sanguisorba_tanna.jpg');

-- 55. Василистник водосборолистный
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Василистник водосборолистный "Альбум"', 'Thalictrum aquilegifolium "Album"', 1,
 'Высокий многолетник с ажурной листвой и пушистыми белыми соцветиями. Прекрасен в тени.',
 '3a', '7b', 2, 1, 2, 120, 150, 60, 80, 3, 4, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/thalictrum_album.jpg');

-- 56. Вероника колосковая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Вероника колосковая "Ротфучс"', 'Veronica spicata "Rotfuchs"', 1,
 'Компактный многолетник с вертикальными соцветиями темно-розового цвета. Засухоустойчив.',
 '3a', '8a', 1, 1, 1, 30, 40, 30, 40, 3, 4, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/veronica_rotfuchs.jpg');

-- 57. Манжетка мягкая
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Манжетка мягкая', 'Alchemilla mollis', 1,
 'Почвопокровный многолетник с округлыми опушенными листьями и желто-зелеными соцветиями.',
 '3a', '7b', 1, 1, 2, 30, 50, 40, 60, 3, 4, 7, 1, TRUE, FALSE, FALSE,
 'https://example.com/images/alchemilla_mollis.jpg');

-- 58. Пахизандра верхушечная
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Пахизандра верхушечная', 'Pachysandra terminalis', 6,
 'Вечнозеленый почвопокровник для тенистых мест. Образует плотный ковер из глянцевых листьев.',
 '4a', '8a', 3, 1, 2, 20, 30, 40, 60, 2, 3, 8, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/pachysandra_terminalis.jpg');

-- 59. Иберис вечнозеленый
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Иберис вечнозеленый "Сноуфлейк"', 'Iberis sempervirens "Snowflake"', 6,
 'Низкий вечнозеленый кустарничек, весной покрытый шапками белых цветов.',
 '4a', '8a', 1, 1, 1, 20, 30, 40, 60, 1, 2, 8, 1, TRUE, TRUE, FALSE,
 'https://example.com/images/iberis_snowflake.jpg');

-- 60. Астра новобельгийская
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Астра новобельгийская "Мари Баллард"', 'Aster novi-belgii "Marie Ballard"', 1,
 'Позднецветущий многолетник с крупными махровыми сиренево-голубыми соцветиями.',
 '4a', '8a', 1, 1, 2, 90, 110, 50, 60, 5, 6, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/aster_marie_ballard.jpg');

-- 61. Хризантема корейская
INSERT INTO plants (name_ru, name_latin, plant_type_id, description, climate_zone_min, climate_zone_max,
                    light_condition_id, soil_type_id, moisture_condition_id, height_min, height_max,
                    width_min, width_max, flowering_start_season_id, flowering_end_season_id,
                    foliage_season_id, care_complexity, is_perennial, is_evergreen, is_toxic, image_url) VALUES
('Хризантема корейская "Осеннее солнышко"', 'Chrysanthemum x koreanum "Autumn Sun"', 1,
 'Зимостойкая хризантема с ярко-желтыми махровыми соцветиями. Цветет до снега.',
 '4a', '8a', 1, 1, 2, 50, 70, 40, 60, 5, 6, 7, 2, TRUE, FALSE, FALSE,
 'https://example.com/images/chrysanthemum_autumn_sun.jpg');

-- =====================================================
-- СВЯЗИ РАСТЕНИЙ С ЦВЕТАМИ (для 41 нового растения)
-- =====================================================
INSERT INTO plant_colors (plant_id, color_id, color_type, intensity) VALUES
-- 21. Дерен белый
(21, 1, 'foliage', 7), (21, 5, 'bark', 9), -- бело-пестрая листва, красная кора
-- 22. Пузыреплодник
(22, 6, 'foliage', 9), (22, 1, 'flower', 6),
-- 23. Чубушник
(23, 11, 'foliage', 7), (23, 1, 'flower', 8),
-- 24. Вейгела
(24, 1, 'foliage', 6), (24, 3, 'flower', 8),
-- 25. Сирень
(25, 7, 'flower', 9), (25, 3, 'flower', 7),
-- 26. Калина
(26, 1, 'flower', 9), (26, 5, 'foliage', 8),
-- 27. Бересклет
(27, 5, 'foliage', 10),
-- 28. Кизильник
(28, 17, 'foliage', 7), (28, 5, 'berry', 8),
-- 29. Снежноягодник
(29, 1, 'berry', 9),
-- 30. Магония
(30, 11, 'flower', 8), (30, 17, 'foliage', 7),
-- 31. Лапчатка
(31, 11, 'flower', 9),
-- 32. Форзиция
(32, 11, 'flower', 10),
-- 33. Рябинник
(33, 3, 'foliage', 8), (33, 1, 'flower', 7),
-- 34. Барвинок
(34, 8, 'flower', 7), (34, 17, 'foliage', 6),
-- 35. Живучка
(35, 6, 'foliage', 7), (35, 9, 'flower', 8),
-- 36. Гейхера
(36, 6, 'foliage', 9), (36, 2, 'flower', 5),
-- 37. Гвоздика
(37, 3, 'flower', 8), (37, 14, 'foliage', 6),
-- 38. Колокольчик
(38, 9, 'flower', 9),
-- 39. Рудбекия
(39, 11, 'flower', 10), (39, 5, 'flower', 6),
-- 40. Эхинацея
(40, 18, 'flower', 9),
-- 41. Котовник
(41, 9, 'flower', 8), (41, 15, 'foliage', 6),
-- 42. Тысячелистник
(42, 5, 'flower', 9),
-- 43. Дельфиниум
(43, 9, 'flower', 10),
-- 44. Аквилегия
(44, 3, 'flower', 7), (44, 1, 'flower', 7), (44, 16, 'flower', 6),
-- 45. Люпин
(45, 5, 'flower', 9),
-- 46. Мак восточный
(46, 5, 'flower', 10),
-- 47. Вербейник
(47, 11, 'flower', 8), (47, 11, 'foliage', 8),
-- 48. Камнеломка
(48, 18, 'flower', 7),
-- 49. Обриета
(49, 6, 'flower', 9),
-- 50. Молодило
(50, 17, 'foliage', 7),
-- 51. Ясколка
(51, 14, 'foliage', 8), (51, 1, 'flower', 9),
-- 52. Флокс шиловидный
(52, 5, 'flower', 9),
-- 53. Горец
(53, 1, 'flower', 8),
-- 54. Кровохлебка
(54, 6, 'flower', 8),
-- 55. Василистник
(55, 1, 'flower', 7),
-- 56. Вероника
(56, 3, 'flower', 8),
-- 57. Манжетка
(57, 16, 'flower', 6), (57, 17, 'foliage', 6),
-- 58. Пахизандра
(58, 17, 'foliage', 7),
-- 59. Иберис
(59, 1, 'flower', 10),
-- 60. Астра
(60, 9, 'flower', 8),
-- 61. Хризантема
(61, 11, 'flower', 9);

-- =====================================================
-- СВЯЗИ РАСТЕНИЙ СО СТИЛЯМИ САДА
-- =====================================================
INSERT INTO plant_garden_styles (plant_id, style_id, suitability) VALUES
-- Дерен (21) - Деревенский, Современный, Эко-сад
(21, 5, 8), (21, 2, 7), (21, 6, 8),
-- Пузыреплодник (22) - Современный, Деревенский
(22, 2, 9), (22, 5, 7),
-- Чубушник (23) - Английский, Деревенский
(23, 1, 9), (23, 5, 8),
-- Вейгела (24) - Английский, Деревенский
(24, 1, 8), (24, 5, 7),
-- Сирень (25) - Английский, Деревенский
(25, 1, 9), (25, 5, 8),
-- Калина (26) - Деревенский, Эко-сад
(26, 5, 9), (26, 6, 7),
-- Бересклет (27) - Японский, Современный
(27, 3, 8), (27, 2, 8),
-- Кизильник (28) - Современный, Средиземноморский
(28, 2, 8), (28, 4, 6),
-- Снежноягодник (29) - Эко-сад, Деревенский
(29, 6, 7), (29, 5, 7),
-- Магония (30) - Японский, Современный
(30, 3, 9), (30, 2, 7),
-- Лапчатка (31) - Средиземноморский, Современный
(31, 4, 8), (31, 2, 8),
-- Форзиция (32) - Английский, Деревенский
(32, 1, 8), (32, 5, 7),
-- Рябинник (33) - Деревенский, Эко-сад
(33, 5, 8), (33, 6, 8),
-- Барвинок (34) - Японский, Современный
(34, 3, 9), (34, 2, 7),
-- Живучка (35) - Японский, Современный
(35, 3, 8), (35, 2, 7),
-- Гейхера (36) - Современный, Английский
(36, 2, 9), (36, 1, 8),
-- Гвоздика (37) - Средиземноморский, Английский
(37, 4, 8), (37, 1, 9),
-- Колокольчик (38) - Английский, Деревенский
(38, 1, 8), (38, 5, 8),
-- Рудбекия (39) - Деревенский, Эко-сад
(39, 5, 9), (39, 6, 8),
-- Эхинацея (40) - Деревенский, Эко-сад
(40, 5, 9), (40, 6, 8),
-- Котовник (41) - Средиземноморский, Английский
(41, 4, 10), (41, 1, 9),
-- Тысячелистник (42) - Средиземноморский, Эко-сад
(42, 4, 9), (42, 6, 8),
-- Дельфиниум (43) - Английский, Деревенский
(43, 1, 10), (43, 5, 8),
-- Аквилегия (44) - Английский, Деревенский
(44, 1, 9), (44, 5, 7),
-- Люпин (45) - Английский, Деревенский
(45, 1, 8), (45, 5, 8),
-- Мак (46) - Средиземноморский, Деревенский
(46, 4, 7), (46, 5, 8),
-- Вербейник (47) - Японский, Эко-сад
(47, 3, 8), (47, 6, 7),
-- Камнеломка (48) - Японский, Современный
(48, 3, 9), (48, 2, 7),
-- Обриета (49) - Средиземноморский, Современный
(49, 4, 9), (49, 2, 7),
-- Молодило (50) - Средиземноморский, Современный
(50, 4, 10), (50, 2, 8),
-- Ясколка (51) - Средиземноморский, Современный
(51, 4, 9), (51, 2, 8),
-- Флокс шиловидный (52) - Современный, Средиземноморский
(52, 2, 8), (52, 4, 9),
-- Горец (53) - Деревенский, Эко-сад
(53, 5, 8), (53, 6, 8),
-- Кровохлебка (54) - Эко-сад, Деревенский
(54, 6, 8), (54, 5, 8),
-- Василистник (55) - Английский, Японский
(55, 1, 8), (55, 3, 7),
-- Вероника (56) - Средиземноморский, Современный
(56, 4, 8), (56, 2, 8),
-- Манжетка (57) - Английский, Деревенский
(57, 1, 9), (57, 5, 8),
-- Пахизандра (58) - Японский, Современный
(58, 3, 10), (58, 2, 8),
-- Иберис (59) - Средиземноморский, Современный
(59, 4, 9), (59, 2, 7),
-- Астра (60) - Английский, Деревенский
(60, 1, 9), (60, 5, 8),
-- Хризантема (61) - Деревенский, Современный
(61, 5, 9), (61, 2, 7);

-- =====================================================
-- СВЯЗИ РАСТЕНИЙ С СЕЗОНАМИ ДЕКОРАТИВНОСТИ
-- =====================================================
INSERT INTO plant_seasons (plant_id, season_id, decorative_aspect) VALUES
-- Дерен (21) - листва весна-осень, побеги зима
(21, 2, 'foliage'), (21, 5, 'foliage'), (21, 7, 'bark'),
-- Пузыреплодник (22) - листва, цветение лето
(22, 3, 'flowering'), (22, 5, 'foliage'),
-- Чубушник (23) - цветение лето, листва
(23, 3, 'flowering'), (23, 5, 'foliage'),
-- Вейгела (24) - цветение весна-лето
(24, 2, 'flowering'), (24, 3, 'flowering'),
-- Сирень (25) - цветение весна
(25, 2, 'flowering'),
-- Калина (26) - цветение весна, плоды осень
(26, 2, 'flowering'), (26, 5, 'berry'),
-- Бересклет (27) - осенняя листва
(27, 5, 'foliage'),
-- Кизильник (28) - ягоды осень-зима
(28, 5, 'berry'), (28, 6, 'berry'),
-- Снежноягодник (29) - ягоды осень-зима
(29, 5, 'berry'), (29, 6, 'berry'),
-- Магония (30) - цветение весна, листва весь год
(30, 1, 'flowering'), (30, 8, 'foliage'),
-- Лапчатка (31) - цветение лето-осень
(31, 3, 'flowering'), (31, 5, 'flowering'),
-- Форзиция (32) - цветение ранняя весна
(32, 1, 'flowering'),
-- Рябинник (33) - листва весна-осень, цветение лето
(33, 2, 'foliage'), (33, 4, 'flowering'), (33, 5, 'foliage'),
-- Барвинок (34) - цветение весна, листва весь год
(34, 2, 'flowering'), (34, 8, 'foliage'),
-- Живучка (35) - цветение весна, листва весь сезон
(35, 2, 'flowering'), (35, 7, 'foliage'),
-- Гейхера (36) - листва весь сезон, цветение лето
(36, 4, 'flowering'), (36, 7, 'foliage'),
-- Гвоздика (37) - цветение лето, листва весь год
(37, 3, 'flowering'), (37, 8, 'foliage'),
-- Колокольчик (38) - цветение лето-осень
(38, 3, 'flowering'), (38, 5, 'flowering'),
-- Рудбекия (39) - цветение лето-осень
(39, 4, 'flowering'), (39, 5, 'flowering'),
-- Эхинацея (40) - цветение лето-осень
(40, 4, 'flowering'), (40, 5, 'flowering'),
-- Котовник (41) - цветение лето-осень
(41, 3, 'flowering'), (41, 5, 'flowering'),
-- Тысячелистник (42) - цветение лето
(42, 3, 'flowering'), (42, 4, 'flowering'),
-- Дельфиниум (43) - цветение лето
(43, 3, 'flowering'), (43, 4, 'flowering'),
-- Аквилегия (44) - цветение весна-лето
(44, 2, 'flowering'), (44, 3, 'flowering'),
-- Люпин (45) - цветение лето
(45, 3, 'flowering'),
-- Мак (46) - цветение весна-лето
(46, 2, 'flowering'), (46, 3, 'flowering'),
-- Вербейник (47) - цветение лето, листва весь сезон
(47, 3, 'flowering'), (47, 7, 'foliage'),
-- Камнеломка (48) - цветение весна, листва весь год
(48, 2, 'flowering'), (48, 8, 'foliage'),
-- Обриета (49) - цветение ранняя весна
(49, 1, 'flowering'),
-- Молодило (50) - листва весь год
(50, 8, 'foliage'),
-- Ясколка (51) - цветение весна, листва весь сезон
(51, 2, 'flowering'), (51, 7, 'foliage'),
-- Флокс шиловидный (52) - цветение весна, листва весь год
(52, 2, 'flowering'), (52, 8, 'foliage'),
-- Горец (53) - цветение лето-осень
(53, 4, 'flowering'), (53, 6, 'flowering'),
-- Кровохлебка (54) - цветение лето
(54, 4, 'flowering'),
-- Василистник (55) - цветение лето
(55, 3, 'flowering'),
-- Вероника (56) - цветение лето
(56, 3, 'flowering'), (56, 4, 'flowering'),
-- Манжетка (57) - цветение лето, листва весь сезон
(57, 3, 'flowering'), (57, 7, 'foliage'),
-- Пахизандра (58) - листва весь год
(58, 8, 'foliage'),
-- Иберис (59) - цветение весна, листва весь год
(59, 2, 'flowering'), (59, 8, 'foliage'),
-- Астра (60) - цветение осень
(60, 5, 'flowering'),
-- Хризантема (61) - цветение осень
(61, 5, 'flowering'), (61, 6, 'flowering');