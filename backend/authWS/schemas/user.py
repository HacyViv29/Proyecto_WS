from pydantic import Field, EmailStr, BaseModel
from typing import Optional
# ESTA LÍNEA FALTABA: Importamos User para que auth_route pueda tomarlo de aquí
from models.user import User 

# UserGet manual (Reemplaza a pydantic_model_creator)
class UserGet(BaseModel):
    id: int
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    
    class Config:
        from_attributes = True 

    # Método helper para compatibilidad con el código existente que usa .from_tortoise_orm
    @classmethod
    async def from_tortoise_orm(cls, obj):
        return cls(**obj.__dict__)

class UserPost(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    password_hash: str = Field(alias='password', min_length=8, max_length=100) 
    
class UserLogin(BaseModel):
    email: EmailStr
    password: str