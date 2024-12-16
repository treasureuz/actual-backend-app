# generate_completion.py

from firebase_functions import https_fn
from firebase_admin import initialize_app, firestore
from openai import OpenAI
from dotenv import load_dotenv
import stripe
import os


# Load environment variables from .env file
load_dotenv()

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

# Get OpenAI API Key from .env
openai_api_key = os.getenv("OPENAI_API_KEY")
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY is not set in the .env file")

# Initialize Firebase Admin SDK
initialize_app()
db = firestore.client()

# Initialize OpenAI Client
client = OpenAI(api_key=openai_api_key)

@https_fn.on_call()
def generate_completion(req: https_fn.CallableRequest) -> dict:
    try:
        # Ensure the user is authenticated
        if not req.auth:
            return {"error": "Authentication required."}

        uid = req.auth.uid
        if not uid:
            return {"error": "User UID not found."}

        # Extract the user prompt from the request
        user_prompt = req.data.get("userPrompt", "")
        if not user_prompt:
            return {"error": "userPrompt is required"}

        # Call OpenAI API for chat completion
        response = client.chat.completions.create(
            model="gpt-4",  # Corrected model name from "gpt-4o" to "gpt-4"
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": user_prompt}
            ]
        )

        # Extract the assistant's message
        assistant_message = response.choices[0].message.content.strip()

        # Log the message to the console
        print(f"OpenAI Response: {assistant_message}")

        # Store the assistant's message in Firestore under the user's 'AIanswers' array
        user_doc_ref = db.collection('users').document(uid)
        user_doc_ref.update({
            'AIanswers': firestore.ArrayUnion([assistant_message])
        })

        # Return the assistant's message as a response
        return {"message": assistant_message}

    except Exception as e:
        print(f"Error: {str(e)}")
        return {"error": str(e)}


@https_fn.on_call()
def startPaymentSession(req: https_fn.CallableRequest) -> dict:
    try:
        # Ensure the user is authenticated
        if not req.auth:
            return {"error": "Authentication required."}
        
        uid = req.auth.uid
        if not uid:
            return {"error": "User UID not found."}
        
        # Create a Stripe Checkout Session with metadata
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price": "price_1QWP6xGjBypHkVTGldP28xzF",
                "quantity": 1,
            }],
            mode="payment",
            success_url="http://localhost:3000/dashboard", 
            cancel_url="http://localhost:3000/dashboard",
            metadata={"uid": uid}  # Add the UID here
        )

        return {"sessionId": session.id}

    except Exception as e:
        print(f"Error creating payment session: {str(e)}")
        return {"error": str(e)}


@https_fn.on_request()
def handle_stripe_webhook(req: https_fn.Request):
    # Retrieve the endpoint secret from environment variables
    endpoint_secret = os.getenv("STRIPE_WEBHOOK_SECRET")
    if not endpoint_secret:
        return ("Endpoint secret not set", 500)

    # Retrieve the raw payload and Stripe signature from request headers
    payload = req.get_data(as_text=True)
    sig = req.headers.get("Stripe-Signature", None)

    try:
        # Verify the event with the endpoint secret
        event = stripe.Webhook.construct_event(
            payload, sig, endpoint_secret
        )
    except ValueError:
        # Invalid payload
        return ("Invalid payload", 400)
    except stripe.error.SignatureVerificationError:
        # Invalid signature
        return ("Invalid signature", 400)

    # Handle the checkout.session.completed event
    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]
        # Retrieve the UID from metadata that was set when creating the session
        uid = session.get("metadata", {}).get("uid")

        if uid:
            # Add 100 credits to the user's Firestore document
            user_doc_ref = db.collection('users').document(uid)
            user_doc_ref.update({
                "credits": firestore.Increment(100)
            })
            print(f"User {uid} has been granted 100 credits.")
        else:
            print("No UID found in session metadata.")

    # Return a successful response to Stripe
    return ("", 200)
