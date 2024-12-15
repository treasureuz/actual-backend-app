# # generate_completion.py

# from firebase_functions import https_fn
# from firebase_admin import initialize_app, firestore
# from openai import OpenAI
# from dotenv import load_dotenv
# import os

# # Load environment variables from .env file
# load_dotenv()

# # Get OpenAI API Key from .env
# openai_api_key = os.getenv("OPENAI_API_KEY")
# if not openai_api_key:
#     raise ValueError("OPENAI_API_KEY is not set in the .env file")

# # Initialize Firebase Admin SDK
# initialize_app()
# db = firestore.client()

# # Initialize OpenAI Client
# client = OpenAI(api_key=openai_api_key)

# @https_fn.on_call()
# def generate_completion(req: https_fn.CallableRequest) -> dict:
#     try:
#         # Ensure the user is authenticated
#         if not req.auth:
#             return {"error": "Authentication required."}

#         uid = req.auth.uid
#         if not uid:
#             return {"error": "User UID not found."}

#         # Extract the user prompt from the request
#         user_prompt = req.data.get("userPrompt", "")
#         if not user_prompt:
#             return {"error": "userPrompt is required"}

#         # Call OpenAI API for chat completion
#         response = client.chat.completions.create(
#             model="gpt-4",  # Corrected model name from "gpt-4o" to "gpt-4"
#             messages=[
#                 {"role": "system", "content": "You are a helpful assistant."},
#                 {"role": "user", "content": user_prompt}
#             ]
#         )

#         # Extract the assistant's message
#         assistant_message = response.choices[0].message.content.strip()

#         # Log the message to the console
#         print(f"OpenAI Response: {assistant_message}")

#         # Store the assistant's message in Firestore under the user's 'AIanswers' array
#         user_doc_ref = db.collection('users').document(uid)
#         user_doc_ref.update({
#             'AIanswers': firestore.ArrayUnion([assistant_message])
#         })

#         # Return the assistant's message as a response
#         return {"message": assistant_message}

#     except Exception as e:
#         print(f"Error: {str(e)}")
#         return {"error": str(e)}
