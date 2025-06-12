# CPD360 NexGen Suite

A modern web application for managing medical practice workflows, with separate provider and patient experiences.

## Table of Contents

* [Overview](#overview)
* [Features](#features)
* [Architecture & Folder Structure](#architecture--folder-structure)
* [Installation](#installation)
* [Configuration](#configuration)
* [Usage](#usage)
* [Roadmap](#roadmap)
* [Contributing](#contributing)
* [License](#license)

## Overview

CPD360 NexGen Suite streamlines scheduling, patient management, and provider analytics in a unified platform. It consists of a Node/Express backend and a React-based frontend.

## Features

* Role-based authentication and routing (provider vs. patient)
* Appointments CRUD operations
* Scribe note integration
* Provider analytics dashboard
* Patient portal with messaging

## Architecture & Folder Structure

```bash
CPD360/
├── Backend_Rebuilt/        # Express API server
│   ├── controllers/
│   ├── dump/
│   ├── logs/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── scripts/
│   ├── worker/
│   ├── .env
│   ├── .env.example
│   ├── .gitignore
│   ├── package.json
│   └── server.js
└── Frontend_Rebuilt/       # React application
    └── src/
        ├── components/    # Reusable UI components
        ├── layouts/       # Page layouts
        ├── pages/         # Route-based pages
        ├── services/      # API call wrappers
        ├── utils/         # Helper functions
        ├── .env           # Environment variables
        ├── App.js         # Root component
        ├── index.js       # React entry point
        └── main.js        # App bootstrap
```

## Installation

1. **Backend**

   ```bash
   cd Backend_Rebuilt
   npm install
   ```
2. **Frontend**

   ```bash
   cd Frontend_Rebuilt
   npm install
   ```

## Configuration

Copy `.env.example` to `.env` in each project and set the following:

```
# Backend_Rebuilt/.env
PORT=4000
MONGODB_URI=mongodb://<your-uri>
JWT_SECRET=<your-secret>

# Frontend_Rebuilt/.env
REACT_APP_API_URL=http://localhost:4000/api
```

## Usage

```bash
# Start backend
cd Backend_Rebuilt
npm run dev

# Start frontend
cd ../Frontend_Rebuilt
npm start
```

Open your browser at `http://localhost:3000`.

## Roadmap

* [x] Authentication & role routing
* [ ] Appointments interfaces
* [ ] Scribe upload & parsing
* [ ] Analytics dashboard enhancements
* [ ] Patient messaging improvements

## Contributing

1. Fork the repo
2. Create a feature branch (`git checkout -b feature/YourFeature`)
3. Commit your changes (\`git commit -m "Add feature"
4. Push to the branch (`git push origin feature/YourFeature`)
5. Open a Pull Request

## License

MIT
