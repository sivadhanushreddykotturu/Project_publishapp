import { TestApp, BugReport, Tester, AndroidDevice } from './types';

export const INITIAL_APPS: TestApp[] = [
  {
    id: 'app-1',
    name: 'FitTrack Pro',
    version: 'v2.4.0',
    status: 'Testing',
    testersCount: 0,
    bugsFound: 0,
    launchDate: '2026-08-15',
    category: 'Health & Fitness',
    progress: 0,
    devices: ['Google Pixel 8 Pro', 'Samsung Galaxy S24 Ultra', 'OnePlus 12', 'Xiaomi 14']
  }
];

export const INITIAL_BUGS: BugReport[] = [];

export const MOCK_TESTERS: Tester[] = [
  {
    id: 'tester-1',
    name: 'Arjun Mehta',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAd4DobtQhtBLqI2y6OKlewxLeYjt-2dWb4zwElRSw3AkyelrVX03GtqcPvaHfiHqBmJ0Vx1zl7HAPThzZFmtQMgzZtTneML_NYjSYU4vG6RBX4fSntKJVcLe6LynQ6fA_uX-2DwS17Tmhy_HeV9OTXke2fR_wxp0Hd8o2jQ8o_JyxlSk8JWlPZB0xIZZFOIlL_M7TFexHbiDgLji027458If5kijP8M31CdMtcgRKCfBSIWIi36ck6kA',
    country: 'India — Bengaluru',
    devices: ['Samsung Galaxy S24 Ultra', 'Google Pixel 8', 'OnePlus 12'],
    bugsFoundCount: 142,
    rating: 4.9,
    specialty: 'BLE Integrations & Network Sync',
    status: 'Testing',
    walletBalance: 0
  },
  {
    id: 'tester-2',
    name: 'Priya Sharma',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCeMnJ14jr0V7SzwZ3U_jeyckwZi76p7GcAEq3ZycZ-ceuZRsxMwM907WEBtixD_b2Ouq4NkJZhu5rHOc96167FPyHwUD9EXlTjbcYiPA1S9XV-6kl3A54M3kzVuOc0O-YnD876Jn5fZiRXN1lH0aXpzBhaJ93hGE_LJJoM4JUXlsDAiDrRtfGCIS24veeL4w0ehNMEwgkh2eO1QEhrR0MlzzJ7eF-cPzcAr-UPZ1LIh-U91qjaidXjKg',
    country: 'India — Mumbai',
    devices: ['Google Pixel 8 Pro', 'Xiaomi 14', 'Realme GT5'],
    bugsFoundCount: 98,
    rating: 4.8,
    specialty: 'Performance Profiling & Memory Leak Diagnostics',
    status: 'Testing',
    walletBalance: 0
  },
  {
    id: 'tester-3',
    name: 'Rahul Verma',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAe2gqVj6Cm8l07QY0UB0DIaN1ipVzuQW60mmtcmEMTsOr-prVMjYr-E5XubYlohHBWuuY7ACpvPG4w02I-oBg7RTGeGrQK2t0t4UUKkf8P4wQnsTfy-iz2O3p4d29aDJbK1GmzLbKLmcvcNGuKo4Wf-BrzOyXv3BBna7qwT8Y6nvlWtdDpfVrHxqFez7Fdzh6MPd1Xugqcb98Rz-vI9X6G9aBQiCGhEfzOEr_MxjER3e4IS2fxZoMowg',
    country: 'India — Delhi NCR',
    devices: ['OnePlus Open', 'Samsung Galaxy S23', 'Nothing Phone (2)'],
    bugsFoundCount: 204,
    rating: 5.0,
    specialty: 'Security, Cryptography & Biometrics',
    status: 'Idle',
    walletBalance: 0
  },
  {
    id: 'tester-4',
    name: 'Sneha Reddy',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD4VwLPP9fkaK84YVDuydf78JyfwEHQYVv1WbWoCkuXWmtlHgBx_76NMIcGN376PxFq88ToaidXvP9qVOe3Txcq7quPj06ZYymhPFg3uaXyeR9oAYGrWnqitPVirdAly8HoPXvX5og8UeXfZ9KtM3PVc8sv6MN19v0mEUR0ya2hjNhShp2Z2VDjmo7MPHOdtMYxjfWm-SXyGQ9D41HJsTmqxr39aX8UNrSFR0S4QZugHNjNA8xQ9IFwzg',
    country: 'India — Hyderabad',
    devices: ['Samsung Galaxy Z Fold 5', 'Vivo X100 Pro', 'iQOO 12'],
    bugsFoundCount: 76,
    rating: 4.7,
    specialty: 'Foldables & Dynamic Aspect Ratios',
    status: 'Testing',
    walletBalance: 0
  },
  {
    id: 'tester-5',
    name: 'Karthik Nair',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAzYzmWaOjBwarGF2oxlxZSlJd2KelkO0MiG6T_zgcCateBv-tLBlSpL7veLd22nTAbvLK5nD6UbarhdHOGS5BjtZH3H6jV_WjAgTH95HEaXPtNPeVWJDhHuSGwqPOnOaSnMBtMAsl-FpmrV_rg1DU5y2n_lLcEnX-Ehk5zs-Tgh_bd0ftQqdO4l9s_8L9aql6TYdhSqZTLTyPuuZyKMbQ0o_zzDajCdu7eegHdFSyjWgxLQG2AdwiONQ',
    country: 'India — Chennai',
    devices: ['Samsung Galaxy S24', 'Google Pixel 7 Pro', 'OnePlus Nord 3'],
    bugsFoundCount: 119,
    rating: 4.9,
    specialty: 'Localization, Fonts & Accent Overflows',
    status: 'Online',
    walletBalance: 0
  }
];

export const MOCK_DEVICES: AndroidDevice[] = [
  { id: 'dev-1', name: 'Galaxy S24 Ultra', brand: 'Samsung', osVersion: 'Android 14 (OneUI 6.1)', screenSize: '6.8" Dynamic AMOLED 2X', status: 'Active Test' },
  { id: 'dev-2', name: 'Pixel 8 Pro', brand: 'Google', osVersion: 'Android 14 (Stock)', screenSize: '6.7" Super Actua Display', status: 'Active Test' },
  { id: 'dev-3', name: 'OnePlus 12', brand: 'OnePlus', osVersion: 'Android 14 (OxygenOS 14)', screenSize: '6.82" AMOLED', status: 'Available' },
  { id: 'dev-4', name: 'Galaxy Z Fold 5', brand: 'Samsung', osVersion: 'Android 14 (OneUI 6.0)', screenSize: '7.6" Main, 6.2" Cover', status: 'Available' },
  { id: 'dev-5', name: 'Xperia 1 V', brand: 'Sony', osVersion: 'Android 13', screenSize: '6.5" 4K HDR OLED', status: 'Maintenance' },
  { id: 'dev-6', name: 'Pixel 7a', brand: 'Google', osVersion: 'Android 13', screenSize: '6.1" OLED 90Hz', status: 'Available' },
  { id: 'dev-7', name: 'Galaxy A54 5G', brand: 'Samsung', osVersion: 'Android 13', screenSize: '6.4" Super AMOLED', status: 'Available' },
  { id: 'dev-8', name: 'Edge 40 Pro', brand: 'Motorola', osVersion: 'Android 13', screenSize: '6.67" pOLED 165Hz', status: 'Available' }
];
