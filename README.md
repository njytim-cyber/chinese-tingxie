# Chinese Tingxie (星空听写)

A beautiful Chinese character dictation practice app with audio guidance and mastery tracking.

## Features

- 🎧 **Audio Dictation** - Hear words spoken in Mandarin
- ✍️ **Stroke Practice** - Write characters with stroke-by-stroke feedback  
- ⭐ **Mastery Scores** - Track progress (0-5) for each word
- 👤 **Personalized** - Saves your name and progress
- 🎨 **Beautiful UI** - Galaxy-themed dark mode design
- 📱 **Mobile Friendly** - Works on phones and tablets

## Usage

1. Open `index.html` in a browser
2. Enter your name and click Start
3. Listen to the word and write the characters
4. Track your mastery as you practice

## Development

This is a static site with no build step required.

```
chinese-tingxie/
├── index.html        # Main HTML
├── styles.css        # All styles
└── js/
    ├── data.js       # Word data with scores
    ├── audio.js      # Speech synthesis
    ├── particles.js  # Visual effects
    ├── game.js       # Game logic
    └── main.js       # Entry point
```

## Deployment

Pushes to `main` branch automatically deploy to GitHub Pages via the workflow in `.github/workflows/deploy.yml`.

## License

MIT
