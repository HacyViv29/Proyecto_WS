import time
import httpx
from fastapi import FastAPI, Request, Response
from fastapi.responses import JSONResponse
from jose import jwt, JWTError

# --- Configuración ---
SECRET_KEY = "9f82d3e994583f84509a7ddedf3bf4431cdb343786753386f65724ab92653a98"
ALGORITHM = "HS256"

# URLs base de tus servicios
MICROSERVICES = {
    "auth": "http://localhost:8001",
    "contenido": "http://localhost:8002",
    "php_base": "http://localhost/Servicios Web/Proyecto Final/backend"
}

app = FastAPI(title="API Gateway ConectBUAP")
client = httpx.AsyncClient()

# Rutas públicas
PUBLIC_ROUTES = [
    "/api/v1/login",
    "/api/v1/register",
    "/docs",
    "/openapi.json",
    "/webhook"
]

async def renew_token_if_needed(access_token: str, refresh_token: str):
    try:
        payload = jwt.decode(access_token, SECRET_KEY, algorithms=[ALGORITHM], options={"verify_exp": False})
        exp = payload.get("exp")
        current_time = time.time()
        
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
    # ==========================================
    # 1. MANEJO DE CORS (Solución al error)
    # ==========================================
    # Si es una petición OPTIONS, respondemos OK inmediatamente
    if request.method == "OPTIONS":
        return Response(
            status_code=200,
            headers={
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Authorization, Content-Type, X-Refresh-Token",
            }
        )

    path = request.url.path
    url = None
    
    # ==========================================
    # 2. ENRUTAMIENTO (Routing)
    # ==========================================
    
    # A) Rutas Python
    if path.startswith("/api/v1"):
        url = f"{MICROSERVICES['auth']}{path}"
    elif path.startswith("/contenido"):
        url = f"{MICROSERVICES['contenido']}{path}"

    # B) Rutas PHP
    elif path.startswith("/suscripciones"):
        url = f"{MICROSERVICES['php_base']}/suscripcionesWS/WS_suscripciones.php{path}"
    elif path.startswith("/notificaciones"):
        url = f"{MICROSERVICES['php_base']}/suscripcionesWS/WS_suscripciones.php{path}"
    elif path.startswith("/webhook"):
        url = f"{MICROSERVICES['php_base']}/webhookWS/WS_Webhook.php"

    else:
        if path in ["/docs", "/openapi.json"]:
            return await call_next(request)
        return JSONResponse(status_code=404, content={"detail": "Ruta no encontrada en el Gateway"})

    # ==========================================
    # 3. SEGURIDAD (Validación JWT)
    # ==========================================
    if path not in PUBLIC_ROUTES:
        auth_header = request.headers.get("Authorization")
        refresh_token_header = request.headers.get("X-Refresh-Token")

        if not auth_header or not auth_header.startswith("Bearer "):
            return JSONResponse(status_code=401, content={"detail": "Token faltante"})

        token = auth_header.split(" ")[1]
        new_access_token = None
        new_refresh_token = None

        try:
            # Intento de renovación
            if refresh_token_header:
                new_a, new_r = await renew_token_if_needed(token, refresh_token_header)
                if new_a:
                    token = new_a
                    new_access_token = new_a
                    new_refresh_token = new_r

            # Validar firma
            jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])

        except JWTError:
            return JSONResponse(status_code=401, content={"detail": "Token inválido o expirado"})

        # Preparamos headers limpios para el microservicio
        request_headers = dict(request.headers)
        request_headers["Authorization"] = f"Bearer {token}"
        request_headers.pop("host", None) 
        request_headers.pop("content-length", None)
    else:
        request_headers = dict(request.headers)
        request_headers.pop("host", None)
        request_headers.pop("content-length", None)
        new_access_token = None
        new_refresh_token = None

    # ==========================================
    # 4. PROXY (Reenvío)
    # ==========================================
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

        # Construir respuesta final
        response = Response(
            content=microservice_response.content,
            status_code=microservice_response.status_code,
            headers=dict(microservice_response.headers)
        )

        # AGREGAR SIEMPRE HEADERS CORS A LA RESPUESTA FINAL
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type, X-Refresh-Token"
        # Exponer headers personalizados para que JS pueda leer los nuevos tokens
        response.headers["Access-Control-Expose-Headers"] = "X-New-Access-Token, X-New-Refresh-Token"

        if new_access_token:
            response.headers["X-New-Access-Token"] = new_access_token
            response.headers["X-New-Refresh-Token"] = new_refresh_token

        return response

    except httpx.RequestError as exc:
        return JSONResponse(status_code=503, content={"detail": f"Error conectando con microservicio: {str(exc)}"})