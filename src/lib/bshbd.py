import base64
import json
from PIL import Image
from io import BytesIO

def resize_and_encode(image_path, max_dimension=2048):
    """
    Resizes an image so its longest side is no larger than max_dimension,
    then converts it to base64.
    """
    with Image.open(image_path) as img:
        # 1. Calculate new size maintaining aspect ratio
        width, height = img.size
        if max(width, height) > max_dimension:
            scale_factor = max_dimension / max(width, height)
            new_width = int(width * scale_factor)
            new_height = int(height * scale_factor)
            img = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
        
        # 2. Convert image to bytes in memory (not saving to disk)
        buffered = BytesIO()
        # Convert to RGB to avoid issues if input is CMYK or PNG with alpha
        img = img.convert("RGB") 
        # Save as JPEG to buffer (JPEG is efficient for OCR uploads)
        img.save(buffered, format="JPEG", quality=85)
        
        # 3. Encode to Base64
        return base64.b64encode(buffered.getvalue()).decode('utf-8')



base64_image = resize_and_encode("huge_scan.png") 

try:
    response = client.chat.completions.create(
        model="gpt-5.1",
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": "Extract JSON data..."},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:image/jpeg;base64,{base64_image}",
                          
                            "detail": "auto" 
                        }
                    },
                ],
            }
        ],
        response_format={"type": "json_object"}
    )
    print(json.loads(response.choices[0].message.content))

except Exception as e:
    print(f"Error: {e}")