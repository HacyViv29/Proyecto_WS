import json
import urllib.request
import urllib.error
import asyncio
from typing import Optional, Dict, Any
from config.settings import Config

# Helper para manejar la petición HTTP de forma asíncrona
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
            # Retorna None si no existe (404) o hay error
            return None
        except Exception as e:
            print(f"Error connecting to Firebase: {e}")
            return None

    return await loop.run_in_executor(None, _request)

class User:
    def __init__(self, **kwargs):
        self.id = kwargs.get('id', 0)
        self.email = kwargs.get('email')
        self.first_name = kwargs.get('first_name')
        self.last_name = kwargs.get('last_name')
        self.password_hash = kwargs.get('password_hash')
        self.refresh_token = kwargs.get('refresh_token')

    @staticmethod
    def _sanitize_email(email: str) -> str:
        # Reemplaza puntos por comas para la clave de Firebase
        return email.replace('.', ',')

    # CORRECCIÓN: Quitamos 'async' para que devuelva el QuerySet inmediatamente
    @classmethod
    def filter(cls, email: str = None, **kwargs):
        # Permitimos pasar email como argumento o dentro de kwargs
        target_email = email if email else kwargs.get('email')
        return UserQuerySet(target_email)

    @classmethod
    async def create(cls, **kwargs):
        email = kwargs.get('email')
        sanitized_email = cls._sanitize_email(email)
        
        if 'id' not in kwargs:
            kwargs['id'] = int(asyncio.get_event_loop().time()) 
            
        path = f"{Config.FIREBASE_COLLECTION}/{sanitized_email}.json"
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