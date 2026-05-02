# TRT Tracker v2

Modern React + TypeScript + Vite implementation of the TRT, Peptide & Cycle Tracker.

Live demo: [https://richiec85.github.io/TRTv2/](https://richiec85.github.io/TRTv2/)

## Features

- **TRT Tracking**: Log injections, track compounds, manage protocols
- **Cycle Management**: Track cut, grow, maintenance, and cruise phases
- **Health Monitoring**: Weight & BF, blood panels with NHS reference ranges, blood pressure
- **Nutrition**: Calorie and macro tracking with MyFitnessPal CSV import
- **Training**: Strava and Garmin Connect integration via Cloudflare Worker
- **Charts**: Visualize dose history, body metrics, blood markers, and training data
- **Sync**: GitHub-backed persistence with automatic sync using personal access tokens
- **Offline**: Full functionality without internet connection

## Tech Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **State Management**: Zustand with persistence
- **Styling**: CSS Variables + inline styles
- **Testing**: Vitest + React Testing Library
- **Date Handling**: date-fns
- **Routing**: React Router DOM

## Project Structure

See README.md for details.

## Getting Started

```bash
npm install
npm run dev
```

## Configuration

### GitHub Sync

Create a fine-grained personal access token with repository permissions.

### Strava/Garmin Integration

Deploy a Cloudflare Worker for OAuth and configure the URL in the app.

### MyFitnessPal Import

Export CSV from MyFitnessPal and import via the Import button.

## License

MIT