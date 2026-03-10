from fastapi import APIRouter, File, UploadFile


router = APIRouter(prefix='/api/v1/images', tags=['images'])

@router.post("/file/upload-bytes")
def upload_file_bytes(file_bytes: bytes = File()):
  return {'file_bytes': str(file_bytes)}


@router.post("/file/upload-file")
def upload_file(file: UploadFile):
  return file
