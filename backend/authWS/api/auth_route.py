from fastapi.routing import APIRouter
from fastapi import Depends, status, HTTPException
from config.auth import verified_user, authorize, pwd_context, create_access_jwt, create_refresh_jwt
from schemas.user import UserPost, UserLogin, UserGet, UserUpdate, UserChangePassword, UserCompanyStatus
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
        
    # 3. Crear usuario (Ahora incluye id_empresa si viene en data)
    user_object = await User.create(**data)
    
    sanitized_email = user_object.id
    
    # 4. Integracion Suscripciones
    try:
        requests.post(
            SUSCRIPCIONES_URL, 
            json={"correo": sanitized_email},
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
            "nuevo_usuario": sanitized_email,
            "id_empresa": getattr(user_object, 'id_empresa', None) # Enviamos empresa si existe
        }
        requests.post(
            WEBHOOK_URL,
            json=webhook_payload,
            headers={"Content-Type": "application/json"},
            timeout=5
        )
    except Exception as e:
        print(f"[Error] Conectando con Webhook: {e}")

    # 6. Retorno
    return {
        "message": "Usuario creado exitosamente", 
        "user_id": user_object.id, 
        "email": user_object.email,
        "id_empresa": getattr(user_object, 'id_empresa', None)
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

@auth_router.get('/users/detail/{user_id}', response_model=UserGet)
async def get_user_by_id(user_id: str):
    """
    Obtiene la información detallada de un usuario buscando por su ID (ej: correo sanitizado).
    """
    user = await User.filter(id=user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con ID {user_id} no encontrado"
        )
    return user

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

@auth_router.get('/users', response_model=list[UserGet])
async def get_all_users():
    """
    Retorna la lista de todos los usuarios registrados.
    Usa UserGet para filtrar password y tokens de la respuesta.
    """
    users = await User.all()
    return users

@auth_router.put('/users/{email}', response_model=UserGet)
async def update_user(email: str, body: UserUpdate):
    """
    Actualiza la informacion de un usuario.
    Permite cambiar nombre, apellido, rol, telefono, password y empresa.
    """
    # 1. Verificar si el usuario existe
    query = User.filter(email=email)
    user_obj = await query.first()
    
    if not user_obj:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con email {email} no encontrado"
        )
    
    # 2. Preparar datos para actualizar (excluyendo nulos)
    update_data = body.model_dump(exclude_unset=True)

    # Regla de Negocio: Validar cambio de empresa
    if 'id_empresa' in update_data:
        current_empresa = getattr(user_obj, 'id_empresa', None)
        new_empresa = update_data['id_empresa']
        
        # Si ya tiene una empresa Y es diferente a la nueva
        if current_empresa and new_empresa and current_empresa != new_empresa:
             # Aquí decides: Lanzar error (estricto) o permitirlo (flexible). 
             # Por defecto en sistemas de RRHH se suele prohibir el cambio directo sin desvincular.
             pass 
    
    # 3. Logica especial para la contraseña
    if 'password' in update_data:
        if update_data['password']:
            hashed_pw = pwd_context.hash(update_data['password'])
            update_data['password_hash'] = hashed_pw
        del update_data['password']

    # 4. Ejecutar la actualizacion en Firebase
    await query.update(**update_data)
    
    # 5. Obtener y retornar el usuario actualizado
    updated_user = await query.first()
    return updated_user

@auth_router.post('/change-password')
async def change_password(body: UserChangePassword, user_data: dict = Depends(verified_user)):
    """
    Cambia la contraseña verificando primero la contraseña actual.
    Requiere token de autenticación (Header Authorization).
    """
    # 1. Obtenemos el email del usuario logueado (viene del token validado por verified_user)
    # Nota: verified_user devuelve el objeto User, así que usamos user_data.email
    email = user_data.email
    
    # 2. Buscamos al usuario en BD para obtener su hash actual
    user = await User.filter(email=email).first()
    if not user or not user.password_hash:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado"
        )

    # 3. VERIFICAR: ¿La contraseña antigua coincide?
    if not pwd_context.verify(body.old_password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La contraseña actual es incorrecta"
        )

    # 4. HASHEAR: Encriptar la nueva contraseña
    new_hash = pwd_context.hash(body.new_password)

    # 5. ACTUALIZAR: Guardar en Firebase
    await User.filter(email=email).update(password_hash=new_hash)

    return {"message": "Contraseña actualizada correctamente"}

@auth_router.delete('/users/{email}')
async def delete_user(email: str):
    """
    Elimina un usuario de la base de datos basandose en su email.
    """
    # 1. Verificar si el usuario existe
    query = User.filter(email=email)
    if not await query.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Usuario con email {email} no encontrado"
        )
    
    # 2. Eliminar usuario
    await query.delete()
    
    return {"message": "Usuario eliminado correctamente", "email": email}

@auth_router.get("/users/check-company/{email}", response_model=UserCompanyStatus)
async def check_user_company(email: str):
    """
    Verifica si un correo ya está asociado a alguna empresa.
    """
    try:
        user = await User.filter(email=email).first()
        
        if user and getattr(user, 'id_empresa', None):
            return {
                "email": email,
                "pertenece_a_empresa": True,
                "id_empresa": user.id_empresa
            }
        
        return {
            "email": email,
            "pertenece_a_empresa": False,
            "id_empresa": None
        }

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al consultar empresa: {str(e)}"
        )