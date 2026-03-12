from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Employee, get_db
from schemas import EmployeeCreate, EmployeeUpdate, EmployeeResponse, PaginatedEmployeeResponse

router = APIRouter(prefix="/employees", tags=["employees"])


@router.post("/", response_model=EmployeeResponse, status_code=201)
def create_employee(employee: EmployeeCreate, db: Session = Depends(get_db)):
    db_employee = Employee(**employee.model_dump())
    db.add(db_employee)
    db.commit()
    db.refresh(db_employee)
    return db_employee


@router.get("/", response_model=PaginatedEmployeeResponse)
def get_all_employees(offset: int = 0, limit: int = 10, db: Session = Depends(get_db)):
    total = db.query(Employee).count()
    employees = (
        db.query(Employee)
        .order_by(Employee.id)
        .offset(offset)
        .limit(limit)
        .all()
    )

    response_items = [EmployeeResponse.model_validate(e) for e in employees]
    has_more = (offset + limit) < total

    return PaginatedEmployeeResponse(items=response_items, next_offset=offset + limit if has_more else None, has_more=has_more)


@router.get("/{employee_id}", response_model=EmployeeResponse)
def get_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")
    return employee


@router.put("/{employee_id}", response_model=EmployeeResponse)
def update_employee(employee_id: int, updates: EmployeeUpdate, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    for field, value in updates.model_dump(exclude_unset=True).items():
        setattr(employee, field, value)

    db.commit()
    db.refresh(employee)
    return employee


@router.delete("/{employee_id}", status_code=204)
def delete_employee(employee_id: int, db: Session = Depends(get_db)):
    employee = db.query(Employee).filter(Employee.id == employee_id).first()
    if not employee:
        raise HTTPException(status_code=404, detail="Employee not found")

    db.delete(employee)
    db.commit()
