import json
import urllib.request
import urllib.error
import asyncio
from typing import Optional, Dict, Any
from config.settings import Config

async def firebase_request(method: str, url: str, data: Optional[Dict] = None):
    loop = asyncio.get_event_loop()
    
    def _request():
        req_url = f"{Config.FIREBASE_URL}/{url}"
        headers = {'Content-Type': 'application/json'}
        json_data = json.dumps(data).encode('utf-8') if data else None
        
        req = urllib.request.Request(req_url, data=json_data, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as response:
                resp_data = response.read()
                return json.loads(resp_data) if resp_data else None
        except urllib.error.HTTPError as e:
            return None
        except Exception as e:
            print(f"Error connecting to Firebase: {e}")
            return None

    return await loop.run_in_executor(None, _request)

class User:
    def __init__(self, **kwargs):
        self.email = kwargs.get('email')
        self.first_name = kwargs.get('first_name')
        self.last_name = kwargs.get('last_name')
        self.password_hash = kwargs.get('password_hash')
        self.refresh_token = kwargs.get('refresh_token')
        self.role = kwargs.get('role', 'client') 
        self.telephone = kwargs.get('telephone', '')
        
        # El ID logico sera el correo sanitizado (la clave en Firebase)
        # No se guarda en BD, se calcula al vuelo
        self.id = self._sanitize_email(self.email) if self.email else None

    @staticmethod
    def _sanitize_email(email: str) -> str:
        if not email: return ""
        return email.replace('.', ',')

    @classmethod
    async def all(cls) -> list['User']:
        # Pedimos el nodo raiz de la coleccion (ej. /Usuarios.json)
        path = f"{Config.FIREBASE_COLLECTION}.json"
        data = await firebase_request("GET", path)
        
        if not data:
            return []
            
        users = []
        # Firebase devuelve un diccionario { "id1": {datos}, "id2": {datos} }
        for key, user_data in data.items():
            # Creamos la instancia de User con los datos
            if isinstance(user_data, dict):
                user = cls(**user_data)
                users.append(user)
        
        return users
    
    @classmethod
    def filter(cls, email: str = None, **kwargs):
        target_email = email if email else kwargs.get('email')
        return UserQuerySet(target_email)

    @classmethod
    async def create(cls, **kwargs):
        email = kwargs.get('email')
        sanitized_email = cls._sanitize_email(email)
        
        if 'role' not in kwargs:
            kwargs['role'] = 'client'

        # Eliminamos 'id' si viniera en kwargs para no guardarlo en Firebase
        if 'id' in kwargs:
            del kwargs['id']

        path = f"{Config.FIREBASE_COLLECTION}/{sanitized_email}.json"
        
        # Guardamos en Firebase exactamente los campos del objeto (sin ID)
        await firebase_request("PUT", path, kwargs)
        
        return cls(**kwargs)

class UserQuerySet:
    def __init__(self, email: str):
        self.email = email
        self.sanitized_key = User._sanitize_email(email) if email else None

    async def first(self) -> Optional['User']:
        if not self.sanitized_key:
            return None
            
        path = f"{Config.FIREBASE_COLLECTION}/{self.sanitized_key}.json"
        data = await firebase_request("GET", path)
        
        if data:
            return User(**data)
        return None

    async def exists(self) -> bool:
        user = await self.first()
        return user is not None

    async def update(self, **kwargs):
        if not self.sanitized_key:
            return
            
        path = f"{Config.FIREBASE_COLLECTION}/{self.sanitized_key}.json"
        await firebase_request("PATCH", path, kwargs)
        
    async def delete(self):
        if not self.sanitized_key:
            return
        
        # Enviamos peticion DELETE a la ruta del usuario especifico
        path = f"{Config.FIREBASE_COLLECTION}/{self.sanitized_key}.json"
        await firebase_request("DELETE", path)