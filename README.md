# Regex Playground

An interactive regex testing tool built with React and Tailwind CSS.

## Features

- Real-time regex pattern matching
- Support for regex flags (g, i, m, s)
- Display of match details including capture groups
- Regex cheat sheet for quick reference
- Error handling for invalid regex patterns

## Getting Started

### Prerequisites

- Node.js (v16 or higher recommended)
- npm or yarn

### Installation

1. Clone the repository
```bash
git clone https://github.com/yourusername/regex-playground.git
cd regex-playground
```

2. Install dependencies
```bash
npm install
# or
yarn
```

3. Start the development server
```bash
npm run dev
# or
yarn dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Usage

1. Enter a regex pattern in the "Pattern" field
2. Set any flags you want to use (g, i, m, s)
3. Enter text to test against in the "Test String" field
4. View matches in real-time in the "Results" section

## Favicons

The project includes an SVG favicon that adapts to light and dark mode. To generate PNG versions of the favicon for various devices:

1. Make sure you have the dependencies installed:
```bash
npm install
```

2. Run the favicon generation script:
```bash
npm run generate-favicons
```

This will create:
- favicon.png (32x32)
- apple-touch-icon.png (180x180)
- icon-192.png (192x192)
- icon-512.png (512x512)

If you want to modify the favicon, edit the SVG file in `public/favicon.svg` and then run the generation script again.

## Built With

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS v4](https://tailwindcss.com/)

## License

This project is open source and available under the [MIT License](LICENSE).
