from datetime import date, datetime
from typing import List, Optional

from pydantic import BaseModel, EmailStr, Field, field_validator


class EmployeeBase(BaseModel):
    employee_id: str = Field(..., min_length=1, max_length=50)
    full_name: str = Field(..., min_length=1, max_length=255)
    email: EmailStr
    department: str = Field(..., min_length=1, max_length=255)


class EmployeeCreate(EmployeeBase):
    pass


class Employee(EmployeeBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True


class AttendanceBase(BaseModel):
    date: date
    status: str = Field(..., pattern="^(Present|Absent)$")

    @field_validator("date")
    @classmethod
    def date_cannot_be_in_future(cls, value: date) -> date:
        today = date.today()
        if value > today:
            raise ValueError("Attendance date cannot be in the future.")
        return value


class AttendanceCreate(AttendanceBase):
    employee_id: int


class Attendance(AttendanceBase):
    id: int
    employee_id: int

    class Config:
        from_attributes = True


class AttendanceSummary(BaseModel):
    total_present: int
    total_absent: int
    records: List[Attendance]


class EmployeeWithSummary(Employee):
    attendance_summary: Optional[AttendanceSummary] = None

