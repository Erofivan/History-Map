# History Map

An interactive graph visualization tool for mapping historical relationships between people, events, artworks, documents and other entities.

---

## How to Run

### Prerequisites

- Docker and Docker Compose installed

### Start the Application

```bash
docker-compose up --build
```

Then open **http://localhost** in your browser.

All five services will start automatically:

| Service    | Port  |
|------------|-------|
| Frontend   | 80    |
| Backend    | 8080  |
| PostgreSQL | 5432  |
| ArangoDB   | 8529  |
| Redis      | 6379  |

Data is persisted in Docker volumes and survives restarts.

### ArangoDB Web UI (optional)

Visit http://localhost:8529 — login with `root` / `historymap`.

---

## Architecture

### Three-Layer Architecture

The backend follows a three-layer architecture because Spring Boot and JPA entities make this a natural fit — it eliminates the need for manual mapping between a "pure domain" and persistence models:

```
presentation/   REST controllers, DTOs, WebSocket handlers
application/    Application services, orchestration, DTO assembly
domain/         JPA entities (User, MapEntity), ArangoDB entities (HistoricalNode, HistoricalEdge),
                repository interfaces, domain services with business logic
infrastructure/ Spring Data JPA/ArangoDB/Redis implementations, JWT security, configs
```

### Rich Domain Model

Entities contain behaviour, not just data:

- `User.createMap(name)` — creates a map attached to the user
- `MapEntity.rename(name)` — validates and renames a map
- `HistoricalNode.addTag / removeTag / setAttribute / update / updatePosition` — encapsulate business rules
- `HistoricalEdge.updateDescription / updateDirection` — edge mutation methods
- `NodeDomainService.calculateNodeSize` — computes visual size from edge count using the formula `baseSize * (1 + log(edgeCount + 1))`
- `EdgeDomainService.createEdge / validateEdge / isSelfLoop` — edge creation with validation

### Storage Strategy

| Store      | Purpose                           |
|------------|-----------------------------------|
| PostgreSQL | Users, map metadata (JPA)         |
| ArangoDB   | Graph entities and edges (native graph DB) |
| Redis      | 30-minute cache for graph reads   |

### Real-time Collaboration

WebSocket (STOMP over SockJS) broadcasts changes to all clients subscribed to a map via `/topic/map/{mapId}`. Supported events: `NODE_CREATED`, `NODE_UPDATED`, `NODE_MOVED`, `NODE_DELETED`, `EDGE_CREATED`, `EDGE_UPDATED`, `EDGE_DELETED`.

---

## Features

### Graph Interaction

- **Double-click** empty canvas — create a new entity at that position
- **Shift+click** two nodes — create an edge between them
- **Click** a node or edge — open its detail sidebar
- **Delete** key — delete selected nodes/edges
- **Drag** nodes — reposition them (position saved to backend)
- **Scroll** — zoom the canvas
- **Pan** — drag the background

### Entity (Node) Features

- Types: PERSON, EVENT, ARTWORK, DOCUMENT, ORGANIZATION, BUILDING, IDEA, STYLE, CUSTOM
- Each type has a distinct colour on the canvas
- Attributes: name, description, image URL, article, tags, custom key-value attributes
- Type-specific fields: birth/death year (PERSON), creation year (ARTWORK), start/end dates (EVENT)
- Node size scales automatically with edge count

### Edge Features

- BIDIRECTIONAL (↔, no arrow) or UNIDIRECTIONAL (→, with arrow)
- Optional description
- Visual distinction in canvas style

### Catalog Panel

- Groups entities by tag
- Nodes with outgoing unidirectional edges are expandable as sub-groups
- Click a tag to filter the graph
- Entity search by name

### Layouts

- Force-directed (COSE)
- Tree (Breadth-first)
- Grid
- Circle
- Concentric

### Authentication

- JWT-based, stored in localStorage
- Before registration, the app works locally (no persistence)
- All map data is linked to the authenticated user

---

## Decisions Made

| Decision | Reason |
|---|---|
| Three-layer over Onion | Spring JPA entities are infrastructure-aware; splitting into a "pure domain" layer would require extra mapping code with no benefit for this project size |
| ArangoDB for graph data | Native graph operations (traversal, edge collections) suit the domain better than relational modeling |
| Redis cache TTL = 30 min | Balances freshness with performance; invalidated on every write |
| JWT expiry = 24h | Standard for single-page apps; refresh tokens out of scope for this prototype |
| COSE as default layout | Best general-purpose force-directed layout available in Cytoscape core without extra deps |
| WebSocket for collaboration | STOMP over SockJS provides good browser compatibility with simple pub/sub semantics |
| Gradle Groovy DSL | Matches the requirement; lighter syntax than Kotlin DSL for this project size |

---

## Testing

Unit and integration tests use the AAA pattern (Arrange / Act / Assert).

Run backend tests (requires no external services — H2 in-memory DB):

```bash
cd backend
./gradlew test
```

Test coverage:
- `NodeDomainServiceTest` — size calculation, validation rules
- `EdgeDomainServiceTest` — edge creation, self-loop detection, validation
- `UserApplicationServiceTest` — registration flow with mocks
- `HistoricalNodeTest` — entity behaviour (tags, attributes, position, update)
- `MapEntityTest` — rename, user.createMap

---

## Project Structure

```
├── backend/                Java 21 + Spring Boot 3.2 + Gradle
│   ├── src/main/java/com/historymap/
│   │   ├── domain/         Entities + repository interfaces + domain services
│   │   ├── infrastructure/ JPA/ArangoDB/Redis impls, JWT, security config
│   │   ├── application/    Application services + DTOs
│   │   └── presentation/   REST controllers + WebSocket controller
│   └── Dockerfile
├── frontend/               React 18 + TypeScript + Cytoscape.js
│   ├── src/
│   │   ├── components/     GraphCanvas, NodeSidebar, EdgeSidebar, Catalog, Toolbar
│   │   ├── pages/          Login, Register, Maps list, Map editor
│   │   ├── hooks/          useGraph (state + WebSocket sync)
│   │   ├── services/       API client (Axios), WebSocket client (STOMP)
│   │   └── types/          TypeScript interfaces
│   ├── nginx.conf
│   └── Dockerfile
└── docker-compose.yml      Orchestrates all 5 services
```


# Проблематика

История — это сеть взаимосвязанных событий, личностей и артефактов. Невозможно в полной мере отделить какое-либо историческое событие — все переплетено. Некоторые личности или события могут быть связаны самым неочевидным на первый взгляд способом.

Традиционные линейные тексты и статичные схемы не позволяют полноценно отразить эту сложность. Существующие инструменты либо слишком сложны для неспециалистов, либо не дают свободы в создании связей. Например википедия, не даёт нужного уровня визуализации. 

Человек усваивает визуальную информацию до нескольких раз лучше, чем простой текст, а поэтому данный проект позволит ускорить процесс обучения и понимания истории, а также простым образом отслеживать связанные события и сущности, путём перехода по связем.

# Задания проекта

- [x] Разработать модель веб-приложения (backend)
- [ ] Реализовать представление полученной модели (frontend)
- [ ] Выгрузить полученное решение на сервер
- [ ] Продемонстрировать работу систему, путём добавления информации о семье Васнецовых

# Функциональные требования

## Карта

Карта представляет собой интерактивное пространство, содержащее сущности и связи между ними.

Карта должна позволять:

- свободное перемещение по пространству
- масштабирование
- размещение сущностей
- создание связей между сущностями
- применение фильтров
- применение алгоритмов раскладки графа
- совместное редактирование

## Сущность

Сущность представляет любой объект, который может участвовать в исторических связях.

Примеры сущностей:

- историческая личность
- событие
- произведение искусства
- документ
- организация
- здание
- идея
- стиль

### Атрибуты сущности

Каждая сущность может или должна иметь следующие атрибуты:

- название (есть у всех сущностей)
- краткое описание (опционально, отображается на лицевой стороне карточки)
- изображение (опционально, отображается на карточке)
- статья (опционально, открывается в боковой панели).
- теги (опционально, пользовательские строки, неограниченное количество).
- прочие атрибуты и пользовательские характеристик (опционально)

Должна быть возможность перейти к статье, ассоциированной с сущностью, при её наличии

#### Прочие атрибуты

Помимо перечисленных выше атрибутов также можно добавлять следующие, атрибуты:

- годы жизни
- год создания
- дата начала и окончания события

***Все*** перечисленные выше атрибуты должны быть реализованы в системе по умолчанию

#### Пользовательские характеристики

Пользователь может создавать и добавлять произвольные атрибуты сущности.

Примеры:

- место рождения
- техника живописи
- исторический период

Такая система чем-то похожа на систему тегов, но в рамках атрибутов.

Система не накладывает ограничений на набор характеристик.


### Типы сущностей

Все сущности являются универсальными (то есть могут иметь любые атрибуты), однако система поддерживает шаблоны карточек для удобства создания.

Тип карточки влияет только на оформление лицевой стороны и набор изначальные атрибутов, которые можно заполнить при создании

Примеры шаблонов:

- личность — дополнительно годы жизни.
- картина — дополнительно автор и год создания.
- событие — дополнительно дата.
- место — дополнительно город и страна.

Пользователь может создавать собственные шаблоны карточек.

Шаблоны нужны только для удобства создания частовстречающихся сущностей и влияют только на интерфейс создания и отображения карточки, но не ограничивают структуру сущности. Пользователь может в любой момент добавить к сущности новые характеристики и атрибуты

### Отображение сущностей на карте

Сущности отображаются в виде карточек.

Карточка должна содержать:

- изображение (если есть)
- название
- основные характеристики

Размер карточки зависит от количества связей сущности.

Чем больше связей имеет сущность, тем больше её визуальный размер.

### Создание сущностей

Создание новой сущности возможно следующими способами:

- двойной клик по пустому месту карты
- горячая клавиша (сущность создаётся на месте текущего положения курсора)

При создании сущности пользователю предлагается выбрать шаблон карточки.

### Перемещение сущностей

Сущности можно перемещать по карте

### Удаление сущности

Сущность можно удалить.

При удалении сущности автоматически удаляются все связи, связанные с ней.

### Просмотр сущности

При двойном нажатии на карточку сущности на карте сущность — приближается центрирует холст на ней

На лицевой стороне должны отображаться все указанные атрибуты

При одиночном нажатии на карточку и должна быть возможность масштабировать ее размер на карте колёсиком мыши

## Статья

Любая сущность может иметь статью.

Статья представляет собой расширенное текстовое описание сущности.

Статья может содержать:

- текст
- изображения

В конце статьи автоматически отображается список связанных сущностей.

## Связь

Связь соединяет две сущности и отражает отношение между ними.

### Атрибуты связи

Связь должна иметь:

- исходную сущность
- целевую сущность
- описание
- направление

Описание и направление связи задаётся пользователем.

### Типы связей

Поддерживаются два типа связей:

#### Двусторонняя связь

Связывает две равноправные сущности.

Пример:

```mermaid
flowchart TD
    АлександрII["Александр II"]:::person <--> |"Указ 1865 года разрешил архиереям переводить окончивших семинарии в светское звание, если те не заняли духовной должности и подали прошение. Благодаря этому указу Васнецов, сын священника, в августе 1867 года, за полтора года до выпуска, с благословения отца и ректора семинарии уехал в Петербург сдавать экзамены в Академию художеств."| ВаснецовВМ["Васнецов В. М."]:::person

classDef person fill:#ffd9b3,stroke:#b35a00,stroke-width:2px,color:#663300,font-weight:bold;
```


#### Односторонняя связь

Используется в случаях, когда одна сущность логически принадлежит другой.

Пример:

```mermaid
flowchart TD
    ШишкинИИ["Шишкин И. И."]:::artist --> | | УтроВСосновомЛесу["Утро в сосновом лесу"]
    СавицкийКА["Савицкий К. А."]:::artist --> |"Рисовал медведей"| УтроВСосновомЛесу

classDef artist fill:#cce5ff,stroke:#003366,stroke-width:2px,color:#003366,font-weight:bold;
```

Описание такой связи может отсутствовать.


### Создание связей

Связь создаётся следующим образом:

1. пользователь выбирает первую сущность
2. удерживает клавишу Shift
3. выбирает вторую сущность

После этого создаётся связь между сущностями.

Пользователь может добавить описание связи.

### Редактирование связи

Клик по линии связи, открывается боковая панель с возможностью изменить описание и тип.

### Удаление связи

Клик по линии, нажать `Delete`.

### Визуализация

Двусторонние связи отображаются линией без стрелки, односторонние — стрелкой от «источника» к «цели».


## Фильтрация

Карта должна поддерживать фильтрацию.

Фильтры могут включать:

- фильтрацию по тегам
- фильтрацию по времени
- фильтрацию по расстоянию в графе

При применении фильтра отображаются только соответствующие сущности.

## Алгоритмы раскладки графа

Пользователь может применить автоматическую раскладку карты.

Поддерживаются различные алгоритмы раскладки:

- force-directed layout
- tree layout
- grid layout

Это позволяет автоматически организовывать структуру карты.

## Кластеризация

При большом количестве сущностей карта может группировать связанные узлы.

Пользователь может:

- скрывать кластеры
- разворачивать кластеры

## Совместная работа

Пользователь может пригласить других пользователей для совместного редактирования карты.

Редактирование происходит в реальном времени.

Система должна поддерживать синхронную работу нескольких пользователей.

## Взаимодействие с приложением

### Карта

- Бесконечная в обе стороны (поддерживается панорамирование зажатием пробела или перетаскиванием фона).
- Масштабирование колесом мыши (глобальное).
- Приближение к карточке: двойной клик по карточке (или кнопка на ней) — центрирует холст на ней
- Изменение размера отдельной карточки: навести курсор на карточку, крутить колёсико мыши — размер меняется (пропорционально тексту и изображению).
  
### Выделение:

- Клик по карточке — выделение (подсветка границ).
- Клик по пустому месту — сброс выделения.
- Множественное выделение: зажатый Ctrl + клики по карточкам (или рамка выделения).
- Перемещение выделенных карточек перетаскиванием.

### Работа с графом

Размер карточки автоматически зависит от количества связей (чем больше связей, тем крупнее карточка). 
- Формула: `базовый_размер` * (1 + log(`количество_связей` + 1)). 
  
Односторонние связи учитываются с половинным весом (или как 0.5).

Должны поддерживаться стандартные горячие клавиши

### Регистрация и сохранение

До регистрации карта хранится только в кеше. При выходе из браузера или перезагрузке созданная карта может потеряться

Для сохранения карты необходимо зарегистрироваться

## Каталог

Каталог содержит в себе список всех сущностей, автоматически группирует их по тегам и позволяет переходить по сущностям.

- Отдельная панель со списком всех сущностей, сгруппированных по тегам.
- По клику на тег — фильтрация карты по этому тегу.
- По клику на сущность — переход к ней на карте и открытие боковой панели.

Например, там могут быть следующие группы: "Личность", "Картина", "Событие". Пользователь может нажать на "Личность" и ему откроется список всех сущностей с соответствующим тегом. 

Если сущность имеет односторонние связи (например, добавляем художнику картины), то она сама становится подгруппой в каталоге и при нажатии на нее развернется список ассоциируемых "подсущностей"


# Нефункциональные требования

- Карта должна поддерживать *практически неограниченный размер*.
- Добавление и удаление атрибутов сущности должно ощущаться как конструктор и быть простым
- Приложение должно иметь луковую архитектуру с богатой доменной моделью. Бизнес-логика должна быть изолирована от инфраструктуры.
- Приложение должно следовать основным принципам разработки ПО, GRASP, SOLID, паттерны при необходимость

Система должна позволять:

- легко добавлять новые типы карточек
- легко добавлять связи между ними
- легко добавлять новые характеристики сущностей

Приложение должно сохранять производительность при большом количестве сущностей и связей.

Для этого могут использоваться:

- кеширование
- частичная подгрузка графа
- выгрузка неиспользуемых данных из памяти

Система должна поддерживать работу с графами большого размера.

Карта должна оставаться читаемой даже при большом количестве сущностей.

Для этого используются:

- изменение размеров карточек
- фильтрация
- кластеризация
- алгоритмы раскладки

# Технологический стек

## Frontend

- React
- TypeScript
- Cytoscape.js

## Backend

- Java
- Spring Boot

## Хранение данных

- ArangoDB — хранение графовой структуры
- PostgreSQL — хранение пользователей
- Redis — кеширование
