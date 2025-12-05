from pydantic import Field, EmailStr, BaseModel
from typing import Optional
from models.user import User 

# UserGet para respuestas (ID ahora es string)
class UserGet(BaseModel):
    id: str  
    email: EmailStr
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    
    class Config:
        from_attributes = True 

    @classmethod
    async def from_tortoise_orm(cls, obj):
        return cls(**obj.__dict__)

class UserPost(BaseModel):
    email: EmailStr
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    password_hash: str = Field(alias='password', min_length=8, max_length=100)
    role: Optional[str] = Field('client')

class UserUpdate(BaseModel):
    first_name: Optional[str] = Field(None, max_length=50)
    last_name: Optional[str] = Field(None, max_length=50)
    role: Optional[str] = None
    telephone: Optional[str] = None
    # Permitimos actualizar password opcionalmente
    password: Optional[str] = Field(None, min_length=8, max_length=100)

class UserLogin(BaseModel):
    email: EmailStr
    password: str