export type AttendanceStatus = 'P' | 'A';

export interface AttendanceRecord {
  [dateIsoString: string]: AttendanceStatus;
}

export interface Child {
  id?: number;
  fullName: string;
  age: number;
  gender: 'Male' | 'Female';
  village: string;
  mobileNumber: string;
  attendance: AttendanceRecord;
}

export interface DailyStats {
  present: number;
  absent: number;
  total: number;
}

export type ViewState = 'dashboard' | 'attendance' | 'students' | 'report';