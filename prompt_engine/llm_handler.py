import os
import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY", ""))

def enhance_text(raw_prompt):
    system_instruction = (
        "You are an expert prompt engineer. Enhance the following vague request "
        "into a highly structured, context-rich prompt suitable for an LLM. "
        "Return ONLY the enhanced prompt text, without any conversational filler."
    )
    
    model = genai.GenerativeModel(
        model_name="gemini-2.0-flash",
        system_instruction=system_instruction
    )
    
    try:
        response = model.generate_content(raw_prompt)
        return response.text
    except Exception as e:
        error_msg = str(e)
        if "Quota exceeded" in error_msg or "429" in error_msg:
            return "❌ API Error: Your Gemini API key has exceeded its quota or is not enabled for this model. Please check your Google AI Studio billing/plan."
        return f"❌ API Error: {error_msg}"