-- Климатические зоны USDA (пример для России)
CREATE TABLE climate_zones (
    id SERIAL PRIMARY KEY,
    zone_code VARCHAR(10) UNIQUE NOT NULL,
    min_temp_c INTEGER NOT NULL,
    max_temp_c INTEGER NOT NULL
);

INSERT INTO climate_zones (zone_code, min_temp_c, max_temp_c) VALUES
('3a', -40, -37),
('3b', -37, -34),
('4a', -34, -32),
('4b', -32, -29),
('5a', -29, -26),
('5b', -26, -23),
('6a', -23, -21),
('6b', -21, -18),
('7a', -18, -15),
('7b', -15, -12),
('8a', -12, -9),
('8b', -9, -7),
('9a', -7, -4),
('9b', -4, -1),
('10a', -1, 2);

-- Типы почв
CREATE TABLE soil_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

INSERT INTO soil_types (name) VALUES
('Суглинок'),
('Песчаная'),
('Глинистая'),
('Чернозём'),
('Торфяная');

-- Растения
CREATE TABLE plants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    height_cm INTEGER,
    width_cm INTEGER,
    care_difficulty VARCHAR(20) CHECK (care_difficulty IN ('Легко', 'Средне', 'Сложно')),
    image_url TEXT,
    climate_zone_min VARCHAR(10) NOT NULL,
    climate_zone_max VARCHAR(10) NOT NULL,
    soil_type_id INTEGER REFERENCES soil_types(id) ON DELETE CASCADE
);

-- Цвета растений
CREATE TABLE colors (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    hex_code CHAR(7) NOT NULL,
    rgb_r INTEGER NOT NULL,
    rgb_g INTEGER NOT NULL,
    rgb_b INTEGER NOT NULL
);

-- Связь многие-ко-многим растений и цветов с интенсивностью
CREATE TABLE plant_colors (
    id SERIAL PRIMARY KEY,
    plant_id INTEGER REFERENCES plants(id) ON DELETE CASCADE,
    color_id INTEGER REFERENCES colors(id) ON DELETE CASCADE,
    intensity FLOAT DEFAULT 1.0 CHECK (intensity >= 0 AND intensity <= 1)
);

-- Города и их климатические зоны
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    climate_zone_id INTEGER REFERENCES climate_zones(id) ON DELETE CASCADE
);

-- Индексы для оптимизации запросов
CREATE INDEX idx_plants_zones ON plants(climate_zone_min, climate_zone_max);
CREATE INDEX idx_plants_soil ON plants(soil_type_id);
CREATE INDEX idx_plant_colors_plant ON plant_colors(plant_id);
CREATE INDEX idx_plant_colors_color ON plant_colors(color_id);
CREATE INDEX idx_cities_name ON cities(name);

-- Тестовые данные
INSERT INTO colors (name, hex_code, rgb_r, rgb_g, rgb_b) VALUES
('Красный', '#FF0000', 255, 0, 0),
('Оранжевый', '#FFA500', 255, 165, 0),
('Жёлтый', '#FFFF00', 255, 255, 0),
('Зелёный', '#00FF00', 0, 255, 0),
('Голубой', '#00BFFF', 0, 191, 255),
('Синий', '#0000FF', 0, 0, 255),
('Фиолетовый', '#8B00FF', 139, 0, 255),
('Белый', '#FFFFFF', 255, 255, 255),
('Розовый', '#FFC0CB', 255, 192, 203),
('Бордовый', '#800000', 128, 0, 0);

INSERT INTO plants (name, description, height_cm, width_cm, care_difficulty, image_url, climate_zone_min, climate_zone_max, soil_type_id) VALUES
('Роза флорибунда', 'Обильноцветущая роза с яркими цветами', 80, 60, 'Средне', 'https://example.com/rose.jpg', '4a', '9b', 1),
('Лаванда узколистная', 'Ароматный многолетник с фиолетовыми соцветиями', 40, 50, 'Легко', 'https://example.com/lavender.jpg', '5a', '9a', 2),
('Гортензия крупнолистная', 'Кустарник с крупными шаровидными соцветиями', 150, 150, 'Средне', 'https://example.com/hydrangea.jpg', '6a', '9b', 1),
('Хоста', 'Декоративно-лиственное растение для тени', 50, 70, 'Легко', 'https://example.com/hosta.jpg', '3a', '8b', 4),
('Барбарис Тунберга', 'Кустарник с пурпурной листвой', 120, 100, 'Легко', 'https://example.com/barberry.jpg', '4a', '8a', 2),
('Клематис', 'Вьющаяся лиана с крупными цветками', 250, 100, 'Средне', 'https://example.com/clematis.jpg', '4a', '9a', 1),
('Ирис сибирский', 'Изысканные цветы и мечевидные листья', 70, 40, 'Легко', 'https://example.com/iris.jpg', '3a', '8b', 3),
('Пион молочноцветковый', 'Крупные ароматные цветы', 90, 80, 'Легко', 'https://example.com/peony.jpg', '3a', '8a', 1),
('Туя западная Смарагд', 'Вечнозелёное хвойное дерево', 400, 150, 'Легко', 'https://example.com/thuja.jpg', '3a', '7b', 1),
('Спирея японская', 'Неприхотливый кустарник с розовыми щитками', 60, 80, 'Легко', 'https://example.com/spirea.jpg', '4a', '8b', 2);

-- Связь растений и цветов
INSERT INTO plant_colors (plant_id, color_id, intensity) VALUES
(1, 1, 1.0), -- Роза красная
(1, 9, 0.8), -- и розовая
(2, 7, 1.0), -- Лаванда фиолетовая
(3, 5, 0.9), -- Гортензия голубая
(3, 9, 0.9), -- и розовая
(4, 4, 1.0), -- Хоста зелёная
(5, 10, 1.0),-- Барбарис бордовый
(6, 7, 1.0), -- Клематис фиолетовый
(7, 6, 1.0), -- Ирис синий
(8, 9, 1.0), -- Пион розовый
(9, 4, 1.0), -- Туя зелёная
(10, 9, 1.0);-- Спирея розовая

-- Города РФ с климатическими зонами (приблизительные)
INSERT INTO cities (name, climate_zone_id) VALUES
('Москва', (SELECT id FROM climate_zones WHERE zone_code = '5a')),
('Санкт-Петербург', (SELECT id FROM climate_zones WHERE zone_code = '5a')),
('Краснодар', (SELECT id FROM climate_zones WHERE zone_code = '7b')),
('Новосибирск', (SELECT id FROM climate_zones WHERE zone_code = '3b')),
('Екатеринбург', (SELECT id FROM climate_zones WHERE zone_code = '4b')),
('Сочи', (SELECT id FROM climate_zones WHERE zone_code = '9a')),
('Владивосток', (SELECT id FROM climate_zones WHERE zone_code = '6a')),
('Ростов-на-Дону', (SELECT id FROM climate_zones WHERE zone_code = '6b')),
('Казань', (SELECT id FROM climate_zones WHERE zone_code = '5a')),
('Нижний Новгород', (SELECT id FROM climate_zones WHERE zone_code = '5a'));