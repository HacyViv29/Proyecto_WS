from fastapi.routing import APIRouter
from fastapi import Depends, status, HTTPException
from config.auth import verified_user, authorize, pwd_context, create_access_jwt, create_refresh_jwt
from schemas.user import UserPost, UserLogin
from models.user import User 
import requests 
import json

auth_router = APIRouter(prefix='/api/v1', tags=['Auth'])

# URLs de los microservicios
WEBHOOK_URL = "http://localhost/Servicios Web/Proyecto Final/backend/webhookWS/WS_Webhook.php"
SUSCRIPCIONES_URL = "http://localhost/Servicios Web/Proyecto Final/backend/suscripcionesWS/WS_suscripciones.php/suscripciones/crear"

@auth_router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(body: UserPost):
    # 1. Hashear password
    body.password_hash = pwd_context.hash(body.password_hash)
    
    data = body.model_dump(by_alias=False, exclude_unset=True)
    
    # 2. Verificar existencia
    existing = await User.filter(email=body.email).exists()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El correo ya esta registrado."
        )
        
    # 3. Crear usuario (Sin ID numerico guardado)
    user_object = await User.create(**data)
    
    # 4. Integracion Suscripciones
    try:
        requests.post(
            SUSCRIPCIONES_URL, 
            json={"correo": body.email},
            headers={"Content-Type": "application/json"},
            timeout=5
        )
    except Exception as e:
        print(f"[Error] Conectando con Suscripciones: {e}")

    # 5. Integracion Webhook
    try:
        webhook_payload = {
            "accion": "nuevo_usuario",
            "categoria": "usuarios",
            "nuevo_usuario": body.email
        }
        requests.post(
            WEBHOOK_URL,
            json=webhook_payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
    except Exception as e:
        print(f"[Error] Conectando con Webhook: {e}")

    # 6. Retorno (user_id es el correo sanitizado)
    return {
        "message": "Usuario creado exitosamente", 
        "user_id": user_object.id, 
        "email": user_object.email
    }

@auth_router.post('/login')
async def login(body: UserLogin):
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='Credenciales incorrectas'
    )
    
    user = await User.filter(email=body.email).first()
    if not user:
        raise error
        
    if not user.password_hash:
        raise error
        
    matches = pwd_context.verify(body.password, user.password_hash)
    if not matches:
        raise error
        
    data = {'user_name': user.email}
    access_token = create_access_jwt(data)
    refresh_token = create_refresh_jwt(data)
    
    # Actualizar token en Firebase
    await User.filter(email=body.email).update(refresh_token=refresh_token)
    
    return {
        'message': 'Login Exitoso',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'role': user.role,
        'id': user.id,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'type': 'bearer'
    }

@auth_router.post('/refresh_token')
async def refresh(token_data: dict = Depends(authorize)):
    return token_data

@auth_router.get('/data')
async def protected_data(user: User = Depends(verified_user)):
    return {
        'status': 'authorized', 
        'user': {
            'id': user.id,
            'email': user.email,
            'first_name': user.first_name,
            'last_name': user.last_name,
            'role': user.role,
            'telephone': user.telephone
        }
    }