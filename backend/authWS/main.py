from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
# from tortoise.contrib.fastapi import register_tortoise  <-- ELIMINAR O COMENTAR
from config.settings import Config
from api.auth_route import auth_router

app = FastAPI()

origins = [
    "http://localhost",           
    "http://localhost:3000",      
    "http://localhost:8080",      
    "http://127.0.0.1"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,        
    allow_credentials=True,       
    allow_methods=["*"],          
    allow_headers=["*"],          
)

app.include_router(auth_router)

# ELIMINAMOS EL BLOQUE DE register_tortoise YA NO ES NECESARIO
# register_tortoise(
#     app,
#     db_url=Config.DB_URL,
#     add_exception_handlers=True,
#     generate_schemas=False,
#     modules={"models": Config.DB_MODELS}
# )