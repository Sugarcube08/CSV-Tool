# CSV Tool

**CSV Tool** is a React-based workspace for importing, validating, previewing, and eventually editing CSV spreadsheets right in the browser. The project focuses on a smooth onboarding experience featuring drag-and-drop uploads, type-aware validation, and progress-aware feedback before transitioning into a spreadsheet-style editor.

---

## 🚧 Project Status: Under Development

The project currently delivers a polished upload experience and routing between the upload and data sheet views. Inline table editing, transformations, and download/export flows are in active development. Feedback and ideas are welcome to help shape the remaining milestones.

---

## ✨ Key Features

- **Drag-and-Drop Uploads**
  Accepts `.csv`, `.xlsx`, and `.xls` files with instant validation and size limits defined in `src/App.tsx`.

- **Upload Progress Feedback**
  Uses the `Progress` component from `src/components/ui/progress.tsx` to visualize upload completion and gate navigation until the file is ready.

- **File Metadata Preview**
  Displays filename, extension-aware icons, and formatted file sizes for quick verification.

- **Modern UI Architecture**
  Built with React 19, TypeScript, Tailwind CSS, and Radix UI primitives for accessible, theme-ready components.

- **Foundations for Spreadsheet Editing**
  The `/upload` route (`src/dataSheet.tsx`) serves as the entry point for the upcoming grid editor and CSV mutation logic.

---

## 🧰 Tech Stack

- **React 19 + TypeScript** for component-driven UI logic.
- **Vite** for lightning-fast dev tooling and builds.
- **Tailwind CSS 4** for utility-first styling.
- **Radix UI** primitives (`@radix-ui/react-*`) for accessible UI states.
- **Sonner** for toast notifications.
- **Lucide Icons** for crisp, extendable iconography.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ (recommended LTS)
- npm 9+ (or an alternative package manager)

### Installation

```bash
git clone https://github.com/Sugarcube08/csv-tool.git
cd csv-tool
npm install
```

### Development Server

```bash
npm run dev
```

This starts Vite with HMR. Visit `http://localhost:5173` (or the port shown in your terminal).

### Production Build & Preview

```bash
npm run build
npm run preview
```

The build step compiles TypeScript (`tsconfig.app.json`) and outputs static assets to `dist/`. Preview serves the production build locally.

---

## 💡 Usage

1. Start the dev server.
2. Drag a CSV or spreadsheet file onto the drop zone or select it via the file picker.
3. Wait for the progress indicator to reach 100%. Navigation to `/upload` is enabled once the file is ready.
4. Inspect the placeholder `DataSheet` view (`src/dataSheet.tsx`). Editable grid features and export/download flows are tracked in the roadmap.

Toast feedback is handled through `sonner`, and upload state logic lives in `src/App.tsx`. For alternative upload experiences, explore the reusable pattern in `src/components/file-upload-04.tsx`.

---

## 🗂️ Project Structure

```text
src/
├── App.tsx             # Primary upload experience and routing entry
├── dataSheet.tsx       # Upcoming spreadsheet editor view
├── components/
│   ├── file-upload-04.tsx
│   └── ui/             # Shared Button, Card, Progress primitives
├── lib/utils.ts        # Tailwind + clsx helper
├── main.tsx            # Router initialization and app bootstrap
└── index.css           # Tailwind base styles
```

---

## 🗺️ Roadmap

- File parsing pipeline using `PapaParse` or `SheetJS` for CSV/XLSX ingestion.
- Spreadsheet grid with inline edits, cell selection, and undo/redo history.
- Derived column creation and quick filters.
- Export flow for downloading modified CSV files.
- Optional cloud sync for collaborative editing.

---

## 🤝 Contributing

Contributions are appreciated! Whether it’s implementing the editor grid, improving validation flows, or suggesting UX enhancements:

- **Fork** the repository and create a feature branch.
- **Open a pull request** with a clear summary and screenshots when applicable.
- **Discuss large changes** via issues before investing significant time.

---

## 🧃 Credits

Built with ❤️ by [SugarCube](https://github.com/Sugarcube08) using React, TypeScript, Vite, and Tailwind CSS. Iconography powered by [Lucide](https://lucide.dev/).

---

## 📜 License

This project is planned to ship under the **MIT License**. The full license text will be added before the first stable release.

---

## ☕ Support

If you enjoy this project, consider buying me a coffee:

[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support%20Me-orange?style=flat-square&logo=buy-me-a-coffee)](https://www.buymeacoffee.com/sugarcube08)

---

## 📣 Stay Connected

[![YouTube Banner](https://img.shields.io/badge/YouTube-%23FF0000.svg?logo=YouTube&logoColor=white)](https://www.youtube.com/@SugarCode-Z?sub_confirmation=1)
[![Instagram Banner](https://img.shields.io/badge/Instagram-%23E4405F.svg?logo=Instagram&logoColor=white)](https://www.instagram.com/sugarcodez)
[![WhatsApp Banner](https://img.shields.io/badge/WhatsApp-%25D366.svg?logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029Vb5fFdzKgsNlaxFmhg1T)

---

> 🛠️ **CSV Tool** – Bring spreadsheets to the browser with confidence and control.
