from backend.app.main import app

if __name__ == "__main__":
    import uvicorn
    from backend.app.config import settings

    uvicorn.run("main:app", host=settings.HOST, port=settings.PORT, reload=settings.DEBUG)
