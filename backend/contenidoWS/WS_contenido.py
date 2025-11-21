from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
import requests
from typing import Dict, List, Optional, Any
import firebase_admin
from firebase_admin import credentials, db
import json
import os
from models.Modelos import ProductoCreate, ProductoUpdate, ResponseModel, Detalles

# Inicializar Firebase
cred = credentials.Certificate(os.path.join(os.path.dirname(__file__), "../firebase/JSON_key/Contenido/contenidoconectbuap-firebase-adminsdk-fbsvc-8c1c9acf4d.json"))
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://contenidoconectbuap-default-rtdb.firebaseio.com/'
})

app = FastAPI()

@app.get("/contenido", response_model=ResponseModel)
async def obtener_productos():
    try:
        ref = db.reference('Productos')
        productos = ref.get()
        
        return {
            "status": "success",
            "message": "Productos obtenidos correctamente",
            "data": productos if productos else {}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener productos: {str(e)}"
        )

@app.get("/contenido/{nombre}", response_model=ResponseModel)
async def buscar_producto(nombre: str):
    try:
        ref = db.reference('Productos')
        productos = ref.get()
        
        resultados = []
        termino = nombre.lower()
        
        if productos:
            for categoria, items in productos.items():
                if items:
                    for id_producto, nombre_producto in items.items():
                        if termino in nombre_producto.lower():
                            resultados.append({
                                'id': id_producto,
                                'categoria': categoria,
                                'nombre': nombre_producto,
                                'tipo': categoria
                            })
        
        return {
            "status": "success",
            "message": f"{len(resultados)} resultados encontrados para '{termino}'",
            "termino_busqueda": termino,
            "total_resultados": len(resultados),
            "data": resultados
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error en la búsqueda: {str(e)}"
        )

@app.get("/contenido/categoria/{categoria}", response_model=ResponseModel)
async def obtener_por_categoria(categoria: str):
    try:
        ref = db.reference(f'Productos/{categoria}')
        productos = ref.get()
        
        return {
            "status": "success",
            "message": f"Productos en la categoría {categoria} obtenidos correctamente",
            "data": productos if productos else {}
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al obtener productos por categoría: {str(e)}"
        )

@app.post("/contenido", response_model=ResponseModel, status_code=status.HTTP_201_CREATED)
async def crear_producto(producto: ProductoCreate):
    try:
        # Validar categoría
        categorias_validas = ['libros', 'revistas', 'periodicos']
        if producto.categoria not in categorias_validas:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Categoría inválida. Las categorías válidas son: {', '.join(categorias_validas)}"
            )
        
        # Verificar si el ISBN ya existe
        ref_productos = db.reference(f'Productos/{producto.categoria}/{producto.isbn}')
        ref_detalles = db.reference(f'Detalles/{producto.isbn}')
        
        producto_existente = ref_productos.get()
        detalle_existente = ref_detalles.get()
        
        if producto_existente or detalle_existente:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"El ISBN {producto.isbn} ya existe en el sistema"
            )
        
        # Agregar a Productos
        ref_productos.set(producto.nombre)
        
        # Agregar a Detalles
        ref_detalles.set(producto.detalles.dict())

        # =====================================
        #        DISPARAR WEBHOOK AQUÍ
        # =====================================
        payload = {
            "categoria": producto.categoria,
            "accion": "nuevo_contenido",
            "isbn": producto.isbn,
            "nombre": producto.nombre
        }

        webhook_url = "http://localhost/Servicios Web/Proyecto Final/backend/webhookWS/WS_Webhook.php"

        try:
            response = requests.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=5
            )
            # (Opcional) imprimir respuesta del webhook
            print("Webhook status:", response.status_code)
            print("Webhook response:", response.text)

        except Exception as werror:
            print("⚠️ Error enviando webhook:", str(werror))
        # =====================================

        # Respuesta final a cliente
        return {
            "status": "success",
            "message": "Contenido agregado correctamente",
            "data": {
                "isbn": producto.isbn,
                "categoria": producto.categoria,
                "nombre": producto.nombre,
                "detalles": producto.detalles.dict()
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al agregar contenido: {str(e)}"
        )

@app.put("/contenido/{isbn}", response_model=ResponseModel)
async def actualizar_producto(isbn: str, producto_update: ProductoUpdate):
    try:
        # Buscar el producto en todas las categorías
        ref_productos = db.reference('Productos')
        productos = ref_productos.get()
        
        categoria_actual = None
        nombre_actual = None
        
        if productos:
            for categoria, items in productos.items():
                if items and isbn in items:
                    categoria_actual = categoria
                    nombre_actual = items[isbn]
                    break
        
        if not categoria_actual:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ISBN {isbn} no encontrado"
            )
        
        # Actualizar en Productos si se proporciona nombre o categoría
        if producto_update.nombre or producto_update.categoria:
            nueva_categoria = producto_update.categoria if producto_update.categoria else categoria_actual
            nuevo_nombre = producto_update.nombre if producto_update.nombre else nombre_actual
            
            # Si cambió la categoría
            if nueva_categoria != categoria_actual:
                # Eliminar de la categoría anterior
                db.reference(f'Productos/{categoria_actual}/{isbn}').delete()
                # Agregar a la nueva categoría
                db.reference(f'Productos/{nueva_categoria}/{isbn}').set(nuevo_nombre)
            else:
                # Actualizar nombre en la misma categoría
                db.reference(f'Productos/{categoria_actual}/{isbn}').set(nuevo_nombre)
        
        # Actualizar en Detalles si se proporcionan detalles
        if producto_update.detalles:
            ref_detalles = db.reference(f'Detalles/{isbn}')
            detalles_actuales = ref_detalles.get() or {}
            
            # Fusionar detalles actuales con los nuevos
            detalles_actualizados = {**detalles_actuales, **producto_update.detalles}
            ref_detalles.update(detalles_actualizados)
        
        return {
            "status": "success",
            "message": f"Contenido con ISBN {isbn} actualizado correctamente",
            "data": {
                "isbn": isbn,
                "categoria_actual": producto_update.categoria if producto_update.categoria else categoria_actual,
                "actualizaciones": producto_update.dict(exclude_unset=True)
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al actualizar contenido: {str(e)}"
        )

@app.delete("/contenido/{isbn}", response_model=ResponseModel)
async def eliminar_producto(isbn: str):
    try:
        # Buscar el producto en todas las categorías
        ref_productos = db.reference('Productos')
        productos = ref_productos.get()
        
        categoria_encontrada = None
        
        if productos:
            for categoria, items in productos.items():
                if items and isbn in items:
                    categoria_encontrada = categoria
                    break
        
        if not categoria_encontrada:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Producto con ISBN {isbn} no encontrado"
            )
        
        # Eliminar de Productos
        db.reference(f'Productos/{categoria_encontrada}/{isbn}').delete()
        
        # Eliminar de Detalles
        db.reference(f'Detalles/{isbn}').delete()
        
        return {
            "status": "success",
            "message": f"Contenido con ISBN {isbn} eliminado correctamente de ambas colecciones",
            "data": {
                "isbn_eliminado": isbn,
                "categoria": categoria_encontrada
            }
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error al eliminar contenido: {str(e)}"
        )
        
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)