# Manga Reader

A simple and modern web-based manga reader for your `.cbz` files. This application runs entirely in your browser, using `localStorage` to save your library and reading progress.

## Features

-   **Local File Reading**: Reads `.cbz` manga files directly in your browser.
-   **Library Management**: Organizes your uploaded manga into a personal library.
-   **Progress Tracking**: Remembers your reading progress for each manga.
-   **Multiple View Modes**: Supports both single-page and double-page (book-style) reading.
-   **Navigation**:
    -   Click on the left/right edges of the page to navigate.
    -   Use arrow keys (`←`, `→`) or `spacebar` to change pages.
-   **Zoom Controls**: Zoom in and out of pages for better readability.
-   **Fullscreen Mode**: Immerse yourself with a fullscreen reading experience (press `F`).
-   **Theming**: Switch between light and dark modes.
-   **Drag & Drop**: Easily upload files by dragging them onto the page.
-   **Responsive Design**: Works on different screen sizes.

## How to Use

1.  **Clone the repository**:
    ```bash
    git clone https://github.com/your-username/manga-reader.git
    cd manga-reader
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the development server**:
    ```bash
    npm run dev
    ```
4.  Open your browser and navigate to the local URL provided by Vite.
5.  Drag and drop a `.cbz` file to start reading.

## Technologies Used

-   **React**: For building the user interface.
-   **Vite**: As the build tool and development server.
-   **Tailwind CSS**: For styling the application.
-   **JSZip**: For reading `.cbz` files.
