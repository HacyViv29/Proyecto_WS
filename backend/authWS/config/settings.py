from dotenv import find_dotenv, dotenv_values
from typing import List
from datetime import timedelta

env_path = find_dotenv()
env_config = dotenv_values(env_path)

class Config:
    # Configuración de Firebase (Reemplazando DB_URL de MySQL)
    # Usamos el proyecto que mencionaste en tus scripts PHP
    FIREBASE_PROJECT: str = 'authconectbuap-default-rtdb' 
    FIREBASE_URL: str = f"https://{FIREBASE_PROJECT}.firebaseio.com"
    FIREBASE_COLLECTION: str = 'Usuarios'
    
    # DB_MODELS ya no es necesario para Tortoise, pero lo dejamos vacío para evitar errores de importación si algo lo llama
    DB_MODELS: List[str] = []
    
    SECRET: str = '9f82d3e994583f84509a7ddedf3bf4431cdb343786753386f65724ab92653a98'
    ALGORITHM: str = 'HS256'
    JWT_ACCESS_EXP: timedelta = timedelta(minutes=60)
    JWT_REFRESH_EXP: timedelta = timedelta(days=7)