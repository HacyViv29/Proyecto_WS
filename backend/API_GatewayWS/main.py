import time
import httpx
from fastapi import FastAPI, Request, status, Response
from fastapi.responses import JSONResponse
from jose import jwt, JWTError

# --- Configuración ---
SECRET_KEY = "9f82d3e994583f84509a7ddedf3bf4431cdb343786753386f65724ab92653a98"
ALGORITHM = "HS256"

# URLs base de tus servicios
MICROSERVICES = {
    "auth": "http://localhost:8001",
    "contenido": "http://localhost:8002",
    # Base común para tus archivos en XAMPP
    "php_base": "http://localhost/Servicios Web/Proyecto Final/backend"
}

app = FastAPI(title="API Gateway ConectBUAP")
client = httpx.AsyncClient()

# Rutas públicas (No requieren token)
PUBLIC_ROUTES = [
    "/api/v1/login",
    "/api/v1/register",
    "/docs",
    "/openapi.json",
    "/webhook" # Generalmente los webhooks son públicos o tienen su propia firma
]

async def renew_token_if_needed(access_token: str, refresh_token: str):
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp = payload.get("exp")
        current_time = time.time()
        
        # Si expira en menos de 5 minutos
        if exp and (exp - current_time) < 300:
            print("🔄 Renovando token...")
            try:
                renew_response = await client.post(
                    f"{MICROSERVICES['auth']}/api/v1/refresh_token",
                    headers={"Authorization": f"Bearer {refresh_token}"}
                )
                if renew_response.status_code == 200:
                    new_data = renew_response.json()
                    return new_data.get("access_token"), new_data.get("refresh_token")
            except Exception as e:
                print(f"⚠️ Error renovando token: {e}")
    except JWTError:
        pass
    return None, None

@app.middleware("http")
async def gateway_middleware(request: Request, call_next):
    path = request.url.path
    
    # --- 1. Determinar el destino (Routing) ---
    url = None
    
    # A) Rutas de Python (Auth y Contenido)
    if path.startswith("/api/v1"):
        url = f"{MICROSERVICES['auth']}{path}"
        
    elif path.startswith("/contenido"):
        url = f"{MICROSERVICES['contenido']}{path}"

    # B) Rutas de PHP (Mapeo de URLs bonitas a las largas de XAMPP)
    
    # Caso: /suscripciones -> WS_suscripciones.php/suscripciones
    # El Slim framework en PHP espera que la ruta completa incluya el nombre del archivo
    elif path.startswith("/suscripciones"):
        # Construimos: Base + carpeta + archivo + ruta solicitada
        url = f"{MICROSERVICES['php_base']}/suscripcionesWS/WS_suscripciones.php{path}"
        
    # Caso: /webhook -> WS_Webhook.php
    elif path.startswith("/webhook"):
        url = f"{MICROSERVICES['php_base']}/webhookWS/WS_Webhook.php"

    else:
        # Si no coincide con nada, dejamos que FastAPI maneje el 404 local o Docs
        if path in ["/docs", "/openapi.json"]:
            return await call_next(request)
        return JSONResponse(status_code=404, content={"detail": "Ruta no encontrada en el Gateway"})

    # --- 2. Seguridad (Autenticación) ---
    # Si NO es pública y NO es OPTIONS, verificamos token
    if path not in PUBLIC_ROUTES and request.method != "OPTIONS":
        auth_header = request.headers.get("Authorization")
        refresh_token_header = request.headers.get("X-Refresh-Token")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Token faltante"})

        token = auth_header.split(" ")[1]
        new_access_token = None
        new_refresh_token = None

        try:
            # Intento de renovación automática
            if refresh_token_header:
                new_a, new_r = await renew_token_if_needed(token, refresh_token_header)
                if new_a:
                    token = new_a
                    new_access_token = new_a
                    new_refresh_token = new_r

            # Validar token (actual o renovado)
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Token inválido o expirado"})

        # Inyectar token validado en headers para el microservicio
        # (Es necesario recrear los headers porque el objeto original es inmutable)
        request_headers = dict(request.headers)
        request_headers["Authorization"] = f"Bearer {token}"
        request_headers.pop("host", None) 
        request_headers.pop("content-length", None)
    else:
        # Si es pública, pasamos headers limpios
        request_headers = dict(request.headers)
        request_headers.pop("host", None)
        request_headers.pop("content-length", None)
        new_access_token = None
        new_refresh_token = None

    # --- 3. Proxy Reverso (Reenvío) ---
    try:
        body = await request.body()
        
        microservice_response = await client.request(
            method=request.method,
            url=url,
            headers=request_headers,
            content=body,
            params=request.query_params,
            timeout=10.0
        )

        # Construir respuesta para el cliente
        response = Response(
            content=microservice_response.content,
            status_code=microservice_response.status_code,
            headers=dict(microservice_response.headers)
        )

        # Si renovamos token, avisar al frontend
        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
            response.headers["X-New-Refresh-Token"] = new_refresh_token

        return response

    except httpx.RequestError as exc:
        return JSONResponse(status_code=503, content={"detail": f"Error conectando con microservicio: {str(exc)}"})

# Ejecutar con: uvicorn main:app --reload --port 8000