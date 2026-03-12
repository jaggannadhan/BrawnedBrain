import strawberry
from strawberry.fastapi import GraphQLRouter
from sqlalchemy.orm import Session

from database import Employee, Team, get_db


@strawberry.type
class EmployeeType:
    id: int
    name: str
    address: str | None
    designation: str | None
    team: "TeamType | None"
    salary: float | None

    @staticmethod
    def from_model(e: Employee) -> "EmployeeType":  # type: ignore[type-arg]
        return EmployeeType(
            id=int(e.id), name=str(e.name),  # type: ignore[arg-type]
            address=str(e.address) if e.address else None,  # type: ignore[arg-type]
            designation=str(e.designation) if e.designation else None,  # type: ignore[arg-type]
            team=TeamType.from_model(e.team) if e.team else None,  # type: ignore[arg-type]
            salary=float(e.salary) if e.salary else None,  # type: ignore[arg-type]
        )

@strawberry.type
class TeamType:
    id: int
    name: str
    location: str | None
    budget: float | None
    head: str | None

    @staticmethod
    def from_model(d: Team) -> "TeamType":  # type: ignore[type-arg]
        return TeamType(
            id=int(d.id), name=str(d.name),  # type: ignore[arg-type]
            location=str(d.location) if d.location else None,  # type: ignore[arg-type]
            budget=float(d.budget) if d.budget else None,  # type: ignore[arg-type]
            head=str(d.head) if d.head else None,  # type: ignore[arg-type]
        )


@strawberry.type
class PaginatedTeams:
    items: list[TeamType]
    next_offset: int | None
    has_more: bool


@strawberry.type
class PaginatedEmployees:
    items: list[EmployeeType]
    next_offset: int | None
    has_more: bool


@strawberry.type
class Query:
    @strawberry.field
    def employees(self, offset: int = 0, limit: int = 10) -> PaginatedEmployees:
        db: Session = next(get_db())
        try:
            total = db.query(Employee).count()
            rows = (
                db.query(Employee)
                .order_by(Employee.id)
                .offset(offset)
                .limit(limit)
                .all()
            )
            items = [EmployeeType.from_model(e) for e in rows]
            has_more = (offset + limit) < total
            return PaginatedEmployees(
                items=items,
                next_offset=offset + limit if has_more else None,
                has_more=has_more,
            )
        finally:
            db.close()

    @strawberry.field
    def employee(self, id: int) -> EmployeeType | None:
        db: Session = next(get_db())
        try:
            e = db.query(Employee).filter(Employee.id == id).first()
            if not e:
                return None
            return EmployeeType.from_model(e)
        finally:
            db.close()

    @strawberry.field
    def search_employees(self, query: str) -> list[EmployeeType]:
        db: Session = next(get_db())
        try:
            pattern = f"%{query}%"
            rows = (
                db.query(Employee)
                .outerjoin(Team, Employee.team_id == Team.id)
                .filter(
                    Employee.name.ilike(pattern)
                    | Employee.designation.ilike(pattern)
                    | Team.name.ilike(pattern)
                    | Employee.address.ilike(pattern)
                )
                .order_by(Employee.id)
                .limit(50)
                .all()
            )
            return [EmployeeType.from_model(e) for e in rows]
        finally:
            db.close()

    @strawberry.field
    def teams(self, offset: int = 0, limit: int = 10) -> PaginatedTeams:
        db: Session = next(get_db())
        try:
            total = db.query(Team).count()
            rows = (
                db.query(Team)
                .order_by(Team.id)
                .offset(offset)
                .limit(limit)
                .all()
            )
            items = [TeamType.from_model(d) for d in rows]
            has_more = (offset + limit) < total
            return PaginatedTeams(
                items=items,
                next_offset=offset + limit if has_more else None,
                has_more=has_more,
            )
        finally:
            db.close()

    @strawberry.field
    def team(self, id: int) -> TeamType | None:
        db: Session = next(get_db())
        try:
            d = db.query(Team).filter(Team.id == id).first()
            if not d:
                return None
            return TeamType.from_model(d)
        finally:
            db.close()

    @strawberry.field
    def search_teams(self, query: str) -> list[TeamType]:
        db: Session = next(get_db())
        try:
            pattern = f"%{query}%"
            rows = (
                db.query(Team)
                .filter(
                    Team.name.ilike(pattern)
                    | Team.location.ilike(pattern)
                    | Team.head.ilike(pattern)
                )
                .order_by(Team.id)
                .limit(50)
                .all()
            )
            return [TeamType.from_model(d) for d in rows]
        finally:
            db.close()


@strawberry.input
class EmployeeInput:
    name: str
    address: str | None = None
    designation: str | None = None
    team_id: int | None = None
    salary: float | None = None


@strawberry.input
class EmployeeUpdateInput:
    name: str | None = None
    address: str | None = None
    designation: str | None = None
    team_id: int | None = None
    salary: float | None = None


@strawberry.input
class TeamInput:
    name: str
    location: str | None = None
    budget: float | None = None
    head: str | None = None


@strawberry.input
class TeamUpdateInput:
    name: str | None = None
    location: str | None = None
    budget: float | None = None
    head: str | None = None


@strawberry.type
class DeleteResult:
    success: bool
    message: str


@strawberry.type
class Mutation:
    @strawberry.mutation
    def create_employee(self, input: EmployeeInput) -> EmployeeType:
        db: Session = next(get_db())
        try:
            employee = Employee(
                name=input.name,
                address=input.address,
                designation=input.designation,
                team_id=input.team_id,
                salary=input.salary,
            )
            db.add(employee)
            db.commit()
            db.refresh(employee)
            return EmployeeType.from_model(employee)
        finally:
            db.close()

    @strawberry.mutation
    def update_employee(self, id: int, input: EmployeeUpdateInput) -> EmployeeType:
        db: Session = next(get_db())
        try:
            employee = db.query(Employee).filter(Employee.id == id).first()
            if not employee:
                raise ValueError(f"Employee with id {id} not found")

            if input.name is not None:
                employee.name = input.name
            if input.address is not None:
                employee.address = input.address
            if input.designation is not None:
                employee.designation = input.designation
            if input.team_id is not None:
                employee.team_id = input.team_id
            if input.salary is not None:
                employee.salary = input.salary

            db.commit()
            db.refresh(employee)
            return EmployeeType.from_model(employee)
        finally:
            db.close()

    @strawberry.mutation
    def delete_employee(self, id: int) -> DeleteResult:
        db: Session = next(get_db())
        try:
            employee = db.query(Employee).filter(Employee.id == id).first()
            if not employee:
                return DeleteResult(success=False, message=f"Employee with id {id} not found")

            db.delete(employee)
            db.commit()
            return DeleteResult(success=True, message=f"Employee {id} deleted")
        finally:
            db.close()

    @strawberry.mutation
    def create_team(self, input: TeamInput) -> TeamType:
        db: Session = next(get_db())
        try:
            dept = Team(
                name=input.name,
                location=input.location,
                budget=input.budget,
                head=input.head,
            )
            db.add(dept)
            db.commit()
            db.refresh(dept)
            return TeamType.from_model(dept)
        finally:
            db.close()

    @strawberry.mutation
    def update_team(self, id: int, input: TeamUpdateInput) -> TeamType:
        db: Session = next(get_db())
        try:
            dept = db.query(Team).filter(Team.id == id).first()
            if not dept:
                raise ValueError(f"Team with id {id} not found")

            if input.name is not None:
                dept.name = input.name
            if input.location is not None:
                dept.location = input.location
            if input.budget is not None:
                dept.budget = input.budget
            if input.head is not None:
                dept.head = input.head

            db.commit()
            db.refresh(dept)
            return TeamType.from_model(dept)
        finally:
            db.close()

    @strawberry.mutation
    def delete_team(self, id: int) -> DeleteResult:
        db: Session = next(get_db())
        try:
            dept = db.query(Team).filter(Team.id == id).first()
            if not dept:
                return DeleteResult(success=False, message=f"Team with id {id} not found")

            db.delete(dept)
            db.commit()
            return DeleteResult(success=True, message=f"Team {id} deleted")
        finally:
            db.close()


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_router = GraphQLRouter(schema)
