# investment-ai

Asesor de inversiones impulsado por IA para el mercado argentino.

## Requisitos

- Python 3.11+
- PostgreSQL 15+

## Setup

### 1. Clonar el repositorio

```bash
git clone https://github.com/ferblanco75/investment-ai.git
cd investment-ai
```

### 2. Crear entorno virtual e instalar dependencias

```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. Configurar variables de entorno

```bash
cp .env.example .env
# Editar .env con tus valores
```

### 4. Configurar pre-commit hooks

```bash
pre-commit install
```

### 5. Correr la aplicación

```bash
uvicorn app.main:app --reload
```

La API estará disponible en `http://localhost:8000`.

- Docs interactivas: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/api/v1/health`

## Estructura del proyecto

```
investment-ai/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── endpoints/    # Endpoints por dominio
│   │       └── router.py     # Router principal v1
│   ├── core/
│   │   └── config.py         # Configuración (pydantic-settings)
│   ├── db/
│   │   └── database.py       # Engine y sesión SQLAlchemy
│   ├── models/               # Modelos ORM
│   ├── schemas/              # Schemas Pydantic
│   ├── services/             # Lógica de negocio
│   └── main.py               # Entry point FastAPI
├── tests/
│   ├── unit/
│   └── integration/
├── scripts/                  # Scripts de utilidad
├── .env.example
├── .gitignore
├── .pre-commit-config.yaml
├── requirements.txt
└── setup.cfg
```

## Desarrollo

### Ejecutar tests

```bash
pytest
```

### Formatear código

```bash
black app tests
isort app tests
```

### Lint

```bash
flake8 app tests
```
