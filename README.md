# Inspection Management System

## Overview

A system for managing inspections at the university. It has capabilities such as: CRUD operations of inspection dates, Read Update inspection documents, Read inspection schedule, Udpate inspection teams.
This project is a web application that uses a local server for the frontend and a Python-based API with SQLAlchemy for the backend. The application interacts with a PostgreSQL database.

## Authors

- Jan Maciuk [JanMaciuk](https://github.com/JanMaciuk)
- Jakub Śliwka [sliweq](https://github.com/sliweq)

---

## Prerequisites

Before running the project, ensure you have the following installed on your system:

- **Localhost Server (e.g VSCode extension "Live Server" by Ritwick Dey)**
- **PostgreSQL**
    - `Windows Users: Use ImportSQL.bat to create database, structure and insert data to database (make sure you have configured this file beforehand)`
    - `Linux Users: Use ImportSQL.sh (make sure you have configured this file beforehand)`
- **Python (recommended latest version)**
- **Python Libraries:**
    - `fastapi`
    - `pydantic`
    - `sqlalchemy`
    - `uvicorn`

You can install the required Python libraries using the following command:

```bash
pip install fastapi pydantic sqlalchemy uvicorn pytest pytest-mock
```

## Run

Run python code

```bash
python Model_Database_API.py
```

Open website in live server and enjoy !

## Testing

Required: npm package jest

```bash
npm i jest
```

```bash
npm install selenium-webdriver mocha assert chromedriver
```

Run

```bash
jest
```

```bash
npx mocha .\Tests\SeleniumTests\*
```

```bash
pytest .\Model\unit_tests_model_get.py .\model\unit_tests_model_post.py
```