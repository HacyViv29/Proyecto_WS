from pydantic import BaseModel
from typing import Dict, List, Optional, Any

class Detalles(BaseModel):
    Autor: Optional[str] = None
    Descripcion: Optional[str] = None
    Editorial: Optional[str] = None
    Fecha: Optional[str] = None
    Publisher: Optional[str] = None
    Titulo: Optional[str] = None
    img: Optional[str] = None

class ProductoCreate(BaseModel):
    isbn: str
    categoria: str
    nombre: str
    detalles: Detalles

class ProductoUpdate(BaseModel):
    categoria: Optional[str] = None
    nombre: Optional[str] = None
    detalles: Optional[Dict[str, Any]] = None

class ResponseModel(BaseModel):
    status: str
    message: str
    data: Optional[Any] = None
