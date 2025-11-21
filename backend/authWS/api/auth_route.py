from fastapi.routing import APIRouter
from fastapi import Depends, status, HTTPException
from config.auth import verified_user, authorize, pwd_context, create_access_jwt, create_refresh_jwt
from schemas.user import User, UserGet, UserPost, UserLogin

auth_router = APIRouter(prefix='/api/v1', tags=['Auth'])

@auth_router.post('/register', status_code=status.HTTP_201_CREATED)
async def register(body: UserPost):
    # encrypt password
    body.password_hash = pwd_context.hash(body.password_hash)
    # turn play_load into dict
    data = body.model_dump(by_alias=False, exclude_unset=True)
    # check if email is taken
    existing = await User.filter(email=body.email).exists()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="email already taken"
        )
    # create the user
    user_object = await User.create(**data)
    # return created user
    user = await UserGet.from_tortoise_orm(user_object)
    # get the created user:id
    user_id = user.model_dump()['id']
    return {"message": "user created successfully", "user_id": user_id}

@auth_router.post('/login')
async def login(body: UserLogin):
    # prepare error response
    error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail='wrong credentials'
    )
    # check if email exists
    user = await User.filter(email=body.email).first()
    if not user:
        raise error
    # check if password matches
    matches = pwd_context.verify(body.password, user.password_hash)
    if not matches:
        raise error
    # create jwt access token
    data = {'user_name': user.email}
    access_token = create_access_jwt(data)
      
    # create jwt refresh token
    refresh_token = create_refresh_jwt(data)
    
    # store the refresh token in memory || database || any storage
    # users-table - database
    await User.filter(email=body.email).update(**{'refresh_token': refresh_token})
    
    return {
        'message': 'Login Successful',
        'first_name': user.first_name,
        'last_name': user.last_name,
        'email': user.email,
        'access_token': access_token,
        'refresh_token': refresh_token,
        'type': 'bearer'
    }

@auth_router.post('/refresh_token')
async def refresh(token_data: dict = Depends(authorize)):
    return token_data

@auth_router.get('/data')
async def protected_data(user: User = Depends(verified_user)):
    return {'status': 'authorized', 'user': user}