# LaxPlan - Lacrosse Game Scheduler

A comprehensive web application for scheduling lacrosse games for youth leagues. Built with Next.js, TypeScript, and shadcn/ui.

## Features

- **Team Management**: Add and manage 6-12 teams with coach contact information
- **Field Configuration**: Configure 2-4 fields with split-field support for younger age groups
- **Flexible Scheduling**:
  - Full field games for older players (U12+)
  - Half or third field games for younger players (U8, U10)
- **Date & Time Slots**: Set up game dates with customizable time slots
- **Auto-Generate Schedules**: Intelligent algorithm that:
  - Matches teams by age group
  - Avoids back-to-back games
  - Balances home/away games
  - Assigns appropriate field sizes based on age
- **Weekly Schedule View**: Calendar and list views with filtering options
- **Email Coaches**: Send weekly schedules directly to team coaches
- **Data Persistence**: All data saved locally in browser storage
- **Import/Export**: Backup and restore your data

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd LaxPlan
```

2. Install dependencies:
```bash
npm install
```

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage Guide

### 1. Add Teams
Navigate to the Teams page and add your teams with:
- Team name
- Age group (U8, U10, U12, U14, HS, Adult)
- Team color
- Coach contact information (name, email, phone)

### 2. Configure Fields
Set up your playing fields:
- Field name and location
- Enable splitting for younger age groups
- Configure max splits (2 for half-field, 3 for third-field)

### 3. Set Up Dates
Add your game dates:
- Select dates on the calendar
- Add time slots for each date
- Use quick-add for standard time slots (9am-3pm)

### 4. Generate Schedule
Choose between:
- **Auto Generate**: Let the system create an optimal schedule
- **Manual Add**: Create individual games

### 5. Review Schedule
View your schedule in multiple formats:
- Calendar view (weekly grid)
- List view (chronological)
- By team view (per-team schedules)

### 6. Email Coaches
Send schedules to coaches:
- Select teams to email
- Customize email subject and introduction
- Preview before sending
- Opens your default email client

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui (Radix UI primitives)
- **State Management**: Zustand with persistence
- **Date Handling**: date-fns

## Project Structure

```
src/
├── app/                 # Next.js app router pages
│   ├── teams/          # Team management
│   ├── fields/         # Field configuration
│   ├── dates/          # Date & time slot management
│   ├── games/          # Game scheduling
│   ├── schedule/       # Weekly schedule view
│   ├── email/          # Email coaches
│   └── settings/       # App settings
├── components/
│   ├── layout/         # Layout components
│   └── ui/             # shadcn/ui components
├── lib/
│   ├── utils.ts        # Utility functions
│   └── schedule-generator.ts  # Scheduling algorithm
├── store/              # Zustand state management
└── types/              # TypeScript type definitions
```

## License

MIT
