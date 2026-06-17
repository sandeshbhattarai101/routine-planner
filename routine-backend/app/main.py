from fastapi import FastAPI, Depends
from app.api.routes import auth
from app.api.routes import upload
from app.api.routes import mappings
from app.api.routes import imports
from app.api.routes import timetable
from app.api.routes import users

from app.api.routes import schools
from app.api.routes import registration

from fastapi.middleware.cors import CORSMiddleware




app = FastAPI(title="School SaaS")


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)



app.include_router(auth.router)
app.include_router(imports.router)
app.include_router(upload.router)
app.include_router(mappings.router)
app.include_router(timetable.router)
app.include_router(
    users.router
)
app.include_router(
    schools.router
)

app.include_router(
    registration.router
)


@app.get("/")
def health():
    return {"status": "ok"}

# @app.get("/test-db")
# def test(db: Session = Depends(get_db)):
#     return {"status": "database connected"}