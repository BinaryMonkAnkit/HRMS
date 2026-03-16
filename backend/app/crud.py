from datetime import date
from typing import List, Optional, Tuple

from sqlalchemy import select, func
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from . import schemas
from . import models


def get_employees(db: Session) -> List[models.Employee]:
    stmt = select(models.Employee).order_by(models.Employee.created_at.desc())
    return list(db.scalars(stmt).all())


def create_employee(db: Session, employee_in: schemas.EmployeeCreate) -> models.Employee:
    employee = models.Employee(
        employee_id=employee_in.employee_id.strip(),
        full_name=employee_in.full_name.strip(),
        email=employee_in.email.lower(),
        department=employee_in.department.strip(),
    )
    db.add(employee)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(employee)
    return employee


def delete_employee(db: Session, employee_db_id: int) -> bool:
    employee = db.get(models.Employee, employee_db_id)
    if not employee:
        return False
    db.delete(employee)
    db.commit()
    return True


def create_attendance(db: Session, attendance_in: schemas.AttendanceCreate) -> models.Attendance:
    employee = db.get(models.Employee, attendance_in.employee_id)
    if not employee:
        raise ValueError("Employee not found")

    attendance = models.Attendance(
        employee_id=attendance_in.employee_id,
        date=attendance_in.date,
        status=attendance_in.status,
    )

    db.add(attendance)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise
    db.refresh(attendance)
    return attendance


def get_attendance_for_employee(
    db: Session,
    employee_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> List[models.Attendance]:
    stmt = select(models.Attendance).where(models.Attendance.employee_id == employee_id)

    if from_date:
        stmt = stmt.where(models.Attendance.date >= from_date)
    if to_date:
        stmt = stmt.where(models.Attendance.date <= to_date)

    stmt = stmt.order_by(models.Attendance.date.desc())
    return list(db.scalars(stmt).all())


def get_attendance_summary(
    db: Session,
    employee_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
) -> Tuple[int, int]:
    stmt = select(
        models.Attendance.status,
        func.count(models.Attendance.id),
    ).where(models.Attendance.employee_id == employee_id)

    if from_date:
        stmt = stmt.where(models.Attendance.date >= from_date)
    if to_date:
        stmt = stmt.where(models.Attendance.date <= to_date)

    stmt = stmt.group_by(models.Attendance.status)
    rows = db.execute(stmt).all()

    present = 0
    absent = 0
    for status, count in rows:
        if status == models.AttendanceStatusEnum.PRESENT:
            present = count
        elif status == models.AttendanceStatusEnum.ABSENT:
            absent = count

    return present, absent

