# smartQueryAssistant

A natural-language query assistant for spreadsheet data. Upload CSV or Excel files, define column types, and chat with your data—ask questions, view tables, generate charts, or download results. Powered by **Google Gemini** for SQL generation, answer summarization, and chart selection.

![SHEET:chat](https://img.shields.io/badge/SHEET-chat-violet?style=flat-square)

---

## Features

- **Upload & Ingest** — Upload CSV or XLSX files (up to 200MB). Assign data types (int, varchar, Date) per column.
- **Natural Language Queries** — Ask questions in plain English; the assistant generates and runs SQL against your data.
- **Smart Answers** — Gemini summarizes query results into readable answers.
- **Visualizations** — Request line, bar, or scatter charts; the AI picks columns and chart type from your question.
- **Show Tables** — Get result sets displayed as interactive dataframes.
- **Export** — Download full dataset or filtered results as Excel (`.xlsx`).

---

## Architecture

| Component | Stack |
|-----------|--------|
| **Server** | Node.js 18, Express, TypeScript, MySQL2, Google Generative AI (Gemini) |
| **UI** | Python 3, Streamlit, Pandas, Requests |
| **Database** | MySQL (stores uploaded data + metadata) |
| **AI** | Gemini 1.5 Pro (SQL + plot logic), Gemini 1.5 Flash (answers) |

The **Server** handles metadata ingestion, table creation, query execution, and Gemini calls. The **UI** handles file upload, type selection, and chat (questions, plots, show, download).

---

## Project Structure

```
smartQueryAssistant/
├── Server/                 # Node.js API
│   ├── src/
│   │   ├── app.ts          # Express app, routes, middleware
│   │   ├── index.ts        # Entry point
│   │   ├── config/         # MySQL connection
│   │   ├── controller/     # db, metadata, patients
│   │   ├── geminiPrompt/   # SQL, answer, and plot prompts (Gemini)
│   │   ├── routes/         # API routes
│   │   └── ...
│   ├── package.json
│   └── tsconfig.json
├── UI/                     # Streamlit app
│   ├── app.py              # (optional entry; see below)
│   ├── myFirstApp.py       # Main app: upload, types, submit → chat
│   ├── pages/
│   │   └── chatPage.py     # Chat: questions, plot, show, download
│   ├── fileInfoConnector.py
│   ├── packagingData.py
│   └── requirements.txt
└── README.md
```

---

## Prerequisites

- **Node.js** 18.x (e.g. 18.20.4)
- **Python** 3.10+
- **MySQL** (local or cloud; e.g. Google Cloud SQL)
- **Google AI API key** (Gemini) — [Get one here](https://ai.google.dev/)

---

## Setup

### 1. Clone and install

```bash
git clone <repo-url>
cd smartQueryAssistant
```

### 2. Server (Node.js)

```bash
cd Server
npm install
```

Create a `.env` in `Server/` (or project root, depending on where you run from):

```env
SERVER_PORT=3000
DB_HOST=localhost
DB_USER=your_db_user
DB_PASSWORD=your_db_password
DB_NAME=your_database_name
API_KEY=your_google_gemini_api_key
```

Optional: `DB_PORT`, `DB_CONNECTION_LIMIT` if you need to override defaults.

**Run:**

```bash
npm run dev    # development (nodemon + ts-node)
# or
npm run build && npm start
```

Server listens on `http://<your-ip>:3000` (e.g. `http://localhost:3000`).

### 3. UI (Streamlit)

```bash
cd UI
python -m venv venv
source venv/bin/activate   # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` in `UI/` (or same directory as `myFirstApp.py`):

```env
NODE_API=http://localhost:3000
```

Use your machine’s IP (or `localhost`) and the same port as `SERVER_PORT` if the server runs on another host.

**Run:**

```bash
streamlit run myFirstApp.py
```

Then open the URL shown in the terminal (e.g. `http://localhost:8501`).

---

## Usage

1. **Upload** — In the Streamlit app, upload a CSV or XLSX file.
2. **Types** — For each column, choose a data type (int, varchar(100), Date).
3. **Submit** — Click **Submit**. The app sends schema + data to the server, which creates a MySQL table and stores metadata, then redirects to the chat page.
4. **Chat** — On the chat page you can:
   - **Ask** — e.g. “What is the average age?” → SQL is generated, run, and Gemini returns a short answer.
   - **Show** — e.g. “Show all records” → results shown as a table.
   - **Plot** — e.g. “Plot bar chart for sales by region” → line/bar/scatter chart.
   - **Download** — e.g. “download” → Excel download of the table data.

---

## API Overview

| Method | Path | Description |
|--------|------|-------------|
| GET | `/` | Welcome / health |
| POST | `/metaData` | Ingest metadata + data, create table |
| POST | `/dbQuery` | Natural language → SQL → result → Gemini answer |
| POST | `/dbQuery/show` | Natural language → SQL → raw result rows |
| POST | `/dbQuery/plot` | Natural language → plot type + columns + data |
| * | `/patients` | Patient-related routes (if used) |

Request/response formats are JSON; see `Server/src/controller/` and `Server/src/routes/` for details.

---

## Environment Variables

**Server (`.env` in `Server/` or project root):**

| Variable | Description |
|----------|-------------|
| `SERVER_PORT` | Port for the API (default: 3000) |
| `DB_HOST` | MySQL host |
| `DB_USER` | MySQL user |
| `DB_PASSWORD` | MySQL password |
| `DB_NAME` | MySQL database name |
| `API_KEY` | Google Gemini API key |

**UI (`.env` in `UI/`):**

| Variable | Description |
|----------|-------------|
| `NODE_API` | Base URL of the Server API (e.g. `http://localhost:3000`) |

---

## Security Notes

- Do **not** commit `.env` or real credentials (they are in `.gitignore`).
- The server uses parameterized queries and input validation to reduce SQL injection risk.
- Gemini prompts sanitize inputs; only read-only `SELECT` queries are allowed from the generated SQL.

---

## License

ISC.

---

## Author

Shubham Pandey
