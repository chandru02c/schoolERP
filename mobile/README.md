# School ERP — Mobile Application (React Native + TypeScript)

A production-grade, multi-role React Native mobile application for the **School ERP** system. Built with an Apple Human Interface & Modern SaaS aesthetic driven by the **Sunset Orange Design System**, this unified client delivers seamless, dedicated experiences for both **Teachers** and **Parents**.

---

## 📱 Architecture & Key Features

### 1. Dual-Role Experience (Single Codebase)
- **Teacher Portal**:
  - **Dynamic Class Switcher**: Switch on-the-fly between assigned classes (`Class 8-A`, `Class 8-B`, `Class 9-A`, `Class 10-A`). Instantly updates all attendance metrics, student rosters, and schedules.
  - **Daily Attendance**: Filter by Class and Date; toggle between **Morning Session** and **Afternoon Session**; one-tap **"Mark All Present"** bulk action; Present/Absent/Late status toggles with photo and roll number.
  - **Weekly Timetable**: Interactive Day tabs (Mon–Sat) with color-coded period cards (Period number, subject, room, lecture time).
  - **Calendar**: Monthly view with color-coded categories (**Exams**, **Holidays**, **Meetings**, **Events**) and day agenda breakdown.
  - **Marks & Grading**: Class and exam selector; real-time automatic grade calculation (`A+`, `A`, `B+`, `B`, `C`, `F`); one-tap "Publish Marks" to parents.
  - **Leave Management**: Apply for Casual, Sick, or Earned leaves with date pickers; real-time approval status tracking (**Pending**, **Approved**, **Rejected**).
  - **Faculty Profile**: Employee credentials, preferences, password change dialog, and secure sign-out.

- **Parent Portal**:
  - **Instant Multi-Child Switching**: Parents with multiple enrolled children (`Rahul`, `Sneha`, `Akash`) can switch between them with a single tap. All widgets, attendance gauges, scorecards, homework, and fee trackers re-compute instantly.
  - **Attendance Analytics**: Annual attendance percentage ring, working day totals, and monthly attendance matrix (Present, Absent, Late days).
  - **Homework & Tasks**: Filter assignments by **Today**, **Week**, or **Month**; view due dates, assigned teacher, and attachment files; interactive "Mark as Submitted" action.
  - **Child Timetable**: Full weekly lecture schedule with room and teacher details.
  - **School Calendar**: View upcoming holidays, sports events, and exam schedules.
  - **Scorecards & Grades**: Assessment aggregate percentage, class rank, subject-wise progress bars, and verified PDF report card download.
  - **Child Leave Request**: Submit student absence notes and track teacher approvals.
  - **Guardian Profile**: Contact details, home address, enrolled children cards, and alert preferences.

---

## 🎨 Sunset Orange Design System

| Token | Value | Description |
|---|---|---|
| `primary` | `#FF6B35` | Vibrant Sunset Orange accent for CTAs, active icons |
| `secondary` | `#FF8C42` | Warm secondary gradient headers and badges |
| `lightOrange` | `#FFC48C` | Border highlights and soft pill backgrounds |
| `cream` | `#FFF4E6` | Surface tints, icon circle backgrounds |
| `dark` | `#2B2B2B` | Primary headings and text |
| `background` | `#FAFAFA` | Main app canvas background |
| `success` | `#22C55E` | Present student status, approved leaves |
| `error` | `#EF4444` | Absent student status, rejected requests |
| `warning` | `#F59E0B` | Late arrival, pending review badges |
| `neutral` | `#64748B` | Subheadings, input outlines, and captions |

---

## 📂 Project Structure

```
mobile/
├── android/                         # Android native project & Gradle wrapper
├── ios/                             # iOS native project structure
├── src/
│   ├── api/                         # Axios API client & endpoints
│   │   ├── client.ts                # Interceptors for JWT & tenant headers
│   │   ├── authApi.ts               # Login & authentication
│   │   ├── attendanceApi.ts         # Class & child attendance
│   │   ├── classApi.ts              # Classes & timetables
│   │   ├── marksApi.ts              # Marks entry & scorecard
│   │   ├── leaveApi.ts              # Leave submissions
│   │   └── calendarApi.ts           # School events
│   ├── store/                       # Redux Toolkit store & root reducers
│   │   ├── index.ts                 # Store configuration & typed hooks
│   │   ├── authSlice.ts             # Auth state & active role
│   │   ├── notificationSlice.ts     # Push notification simulations
│   │   └── searchSlice.ts           # Universal search
│   ├── navigation/
│   │   ├── RootNavigator.tsx        # State-driven root navigation
│   │   └── types.ts                 # TypeScript navigation types
│   ├── shared/
│   │   ├── theme/                   # Colors, typography, shadows, spacing
│   │   ├── components/              # 12+ Reusable UI components
│   │   │   ├── CustomButton.tsx
│   │   │   ├── CustomInput.tsx
│   │   │   ├── CustomCard.tsx
│   │   │   ├── Header.tsx
│   │   │   ├── Loader.tsx
│   │   │   ├── Avatar.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   ├── DatePicker.tsx
│   │   │   ├── BottomSheet.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── EmptyState.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── StatCard.tsx
│   │   │   └── QuickActionButton.tsx
│   │   ├── services/                # AsyncStorage & Push Notification services
│   │   └── utils/                   # Formatters & realistic school mock data
│   ├── teacher/
│   │   ├── screens/                 # Dashboard, Attendance, Timetable, Calendar, Marks, Leave, Profile
│   │   ├── navigation/              # TeacherTabNavigator
│   │   └── store/                   # teacherSlice
│   ├── parent/
│   │   ├── screens/                 # Dashboard, Attendance, Homework, Timetable, Calendar, Marks, Leave, Profile
│   │   ├── navigation/              # ParentTabNavigator
│   │   └── store/                   # parentSlice
│   ├── screens/                     # Global entrance screens
│   │   ├── SplashScreen.tsx         # 2-second animated logo splash
│   │   ├── RoleSelectionScreen.tsx  # Teacher vs. Parent choice
│   │   ├── TeacherLoginScreen.tsx   # Faculty login with demo filler
│   │   ├── ParentLoginScreen.tsx    # Guardian login with OTP option
│   │   ├── NotificationCenterScreen.tsx
│   │   └── GlobalSearchScreen.tsx
│   └── App.tsx                      # Root App entry with SafeArea & Redux
├── package.json
└── tsconfig.json
```

---

## 🚀 Running the Mobile Application

### 1. Install Dependencies
```bash
cd mobile
npm install --legacy-peer-deps
```

### 2. Run Type Checking
```bash
npm run type-check
```

### 3. Start Metro Bundler
```bash
npm run start
```

### 4. Launch on Android Emulator
```bash
npm run android
```
*(Make sure an Android Virtual Device like `Pixel_8` is launched via Android Studio or `emulator -avd Pixel_8`)*
