import json
import time
from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
import cv2
import numpy as np

try:
    from app.models.schemas import RecognitionRequest, RecognitionResponse
    from app.services.prediction_service import prediction_service
    from app.database.database import get_db, save_prediction_record, SessionLocal
except ModuleNotFoundError:  # pragma: no cover - fallback for root-level imports
    from backend.app.models.schemas import RecognitionRequest, RecognitionResponse
    from backend.app.services.prediction_service import prediction_service
    from backend.app.database.database import get_db, save_prediction_record, SessionLocal

router = APIRouter(tags=["Recognition"])


@router.post("/api/recognize", response_model=RecognitionResponse)
async def recognize_gesture_endpoint(
    request: RecognitionRequest,
    db: Session = Depends(get_db)
):
    """
    HTTP REST endpoint to recognize hand gesture from a base64 encoded image.
    Optionally logs prediction into the database.
    """
    if not request.image:
        raise HTTPException(status_code=400, detail="Image field is required.")

    img = prediction_service.decode_base64_image(request.image)
    if img is None:
        raise HTTPException(status_code=400, detail="Failed to decode base64 image data.")

    result = prediction_service.predict_from_image(img)

    # Save to history if hand was detected and confidence meets threshold
    if request.save_history and result["hand_detected"] and result["gesture"] not in ("Uncertain", "Processing Error", "No Hand Detected"):
        try:
            save_prediction_record(
                db=db,
                gesture=result["raw_gesture"] if "raw_gesture" in result else result["gesture"],
                confidence=result["confidence"],
                session_id=request.session_id,
                hand_detected=True
            )
        except Exception as e:
            print(f"Failed to record prediction in DB: {e}")

    return RecognitionResponse(**result)


@router.post("/api/recognize/file")
async def recognize_file_endpoint(
    file: UploadFile = File(...),
    session_id: str = "default_session",
    db: Session = Depends(get_db)
):
    """
    Upload an image file directly (JPEG, PNG) for gesture recognition.
    """
    contents = await file.read()
    nparr = np.frombuffer(contents, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img is None:
        raise HTTPException(status_code=400, detail="Invalid image file.")

    result = prediction_service.predict_from_image(img)
    if result["hand_detected"] and result["gesture"] not in ("Uncertain", "Processing Error", "No Hand Detected"):
        save_prediction_record(
            db=db,
            gesture=result.get("raw_gesture", result["gesture"]),
            confidence=result["confidence"],
            session_id=session_id,
            hand_detected=True
        )

    return RecognitionResponse(**result)


@router.websocket("/ws/recognize")
async def websocket_recognize_stream(websocket: WebSocket):
    """
    High-speed real-time WebSocket connection for live camera frames.
    Client sends JSON: {"image": "<base64>", "session_id": "...", "save_history": bool}
    Backend replies with live prediction, confidence, FPS, and landmarks.
    """
    await websocket.accept()
    db = SessionLocal()
    last_db_save_time = 0.0
    last_saved_gesture = ""

    try:
        while True:
            data_text = await websocket.receive_text()
            try:
                data = json.loads(data_text)
            except Exception:
                continue

            base64_str = data.get("image")
            session_id = data.get("session_id", "live_session")
            save_history = data.get("save_history", True)

            if not base64_str:
                await websocket.send_text(json.dumps({
                    "gesture": "No Frame",
                    "confidence": 0.0,
                    "hand_detected": False,
                    "status": "error"
                }))
                continue

            img = prediction_service.decode_base64_image(base64_str)
            if img is None:
                await websocket.send_text(json.dumps({
                    "gesture": "Decode Error",
                    "confidence": 0.0,
                    "hand_detected": False,
                    "status": "error"
                }))
                continue

            result = prediction_service.predict_from_image(img)

            # Throttle database writes (at most once every 1.5 seconds if gesture is steady)
            now = time.time()
            gesture_name = result.get("raw_gesture", result.get("gesture"))
            if (
                save_history
                and result["hand_detected"]
                and result["gesture"] not in ("Uncertain", "Processing Error", "No Hand Detected")
                and result["confidence"] >= 0.70
                and (now - last_db_save_time > 1.5 or gesture_name != last_saved_gesture)
            ):
                try:
                    save_prediction_record(
                        db=db,
                        gesture=gesture_name,
                        confidence=result["confidence"],
                        session_id=session_id,
                        hand_detected=True
                    )
                    last_db_save_time = now
                    last_saved_gesture = gesture_name
                except Exception as e:
                    print(f"WebSocket DB save error: {e}")

            await websocket.send_text(json.dumps(result))

    except WebSocketDisconnect:
        print("[WebSocket] Client disconnected.")
    except Exception as e:
        print(f"[WebSocket] Error: {e}")
    finally:
        db.close()
