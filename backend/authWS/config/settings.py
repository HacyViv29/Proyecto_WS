from dotenv import find_dotenv, dotenv_values
from typing import List
from datetime import timedelta

env_path = find_dotenv()

env_config = dotenv_values(env_path)

class Config:
    DB_URL: str = env_config['DB_URL']
    DB_MODELS: List[str] = ['models.user']
    SECRET: str = '9f82d3e994583f84509a7ddedf3bf4431cdb343786753386f65724ab92653a98'
    ALGORITHM: str = 'HS256'
    JWT_ACCESS_EXP: timedelta = timedelta(minutes=60)
    JWT_REFRESH_EXP: timedelta = timedelta(days=7)