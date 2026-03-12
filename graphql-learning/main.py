from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from rest_api import router as employee_router
from graphql_api import graphql_router

app = FastAPI(title="Employee API - REST & GraphQL Learning")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employee_router)
app.include_router(graphql_router, prefix="/graphql")


@app.on_event("startup")
def on_startup():
    init_db()


@app.get("/")
def root():
    return {"message": "Employee API is running. Visit /docs for Swagger UI."}
