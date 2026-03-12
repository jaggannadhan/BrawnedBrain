from pydantic import BaseModel


class EmployeeCreate(BaseModel):
    name: str
    address: str | None = None
    designation: str | None = None
    team: str | None = None
    salary: float | None = None


class EmployeeUpdate(BaseModel):
    name: str | None = None
    address: str | None = None
    designation: str | None = None
    team: str | None = None
    salary: float | None = None


class EmployeeResponse(BaseModel):
    id: int
    name: str
    address: str | None
    designation: str | None
    team: str | None
    salary: float | None

    model_config = {"from_attributes": True}


class PaginatedEmployeeResponse(BaseModel):
    items: list[EmployeeResponse]
    next_offset: int | None
    has_more: bool
