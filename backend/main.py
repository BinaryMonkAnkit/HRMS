from datetime import date
from typing import List, Optional

from fastapi import Depends, FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app import schemas

from app import crud, models
from app.database import Base, engine, get_db


Base.metadata.create_all(bind=engine)

app = FastAPI(title="HRMS Lite API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For production, restrict to your frontend domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health_check():
    return {"status": "ok"}


@app.get("/employees", response_model=List[schemas.Employee])
def list_employees(db: Session = Depends(get_db)):
    return crud.get_employees(db)


@app.post(
    "/employees",
    response_model=schemas.Employee,
    status_code=status.HTTP_201_CREATED,
)
def create_employee(employee: schemas.EmployeeCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_employee(db, employee)
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Employee with this ID or email already exists.",
        )


@app.delete("/employees/{employee_db_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_employee(employee_db_id: int, db: Session = Depends(get_db)):
    deleted = crud.delete_employee(db, employee_db_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")


@app.post(
    "/attendance",
    response_model=schemas.Attendance,
    status_code=status.HTTP_201_CREATED,
)
def mark_attendance(attendance: schemas.AttendanceCreate, db: Session = Depends(get_db)):
    try:
        return crud.create_attendance(db, attendance)
    except ValueError as exc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc))
    except IntegrityError:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Attendance for this employee and date already exists.",
        )


@app.get(
    "/employees/{employee_id}/attendance",
    response_model=schemas.EmployeeWithSummary,
)
def get_employee_attendance(
    employee_id: int,
    from_date: Optional[date] = None,
    to_date: Optional[date] = None,
    db: Session = Depends(get_db),
):
    employee = db.get(models.Employee, employee_id)
    if not employee:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Employee not found.")

    records = crud.get_attendance_for_employee(db, employee_id, from_date, to_date)
    total_present, total_absent = crud.get_attendance_summary(db, employee_id, from_date, to_date)

    return schemas.EmployeeWithSummary(
        **schemas.Employee.model_validate(employee).model_dump(),
        attendance_summary=schemas.AttendanceSummary(
            total_present=total_present,
            total_absent=total_absent,
            records=[schemas.Attendance.model_validate(r) for r in records],
        ),
    )
