// Import necessary packages
const express = require('express');
const cors = require('cors');
const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config(); // Load environment variables from .env file

// --- Basic Setup ---
const app = express();
// Use the PORT environment variable provided by Cloud Run, or default to 8080
const PORT = process.env.PORT || 8080;

// --- Middleware ---
// Enable CORS for all routes to allow frontend-backend communication
app.use(cors());
// Enable parsing of JSON bodies in POST requests
app.use(express.json());
// Serve the static frontend files (HTML, CSS, JS) from the 'public' directory
app.use(express.static('public'));

// --- Gemini API Initialization ---
// Get the API key from environment variables
const geminiApiKey = process.env.GEMINI_API_KEY;
if (!geminiApiKey) {
  console.error("Error: GEMINI_API_KEY is not defined in the .env file.");
  process.exit(1); // Exit if the API key is missing
}
// Initialize the GoogleGenerativeAI with the API key
const genAI = new GoogleGenerativeAI(geminiApiKey);
const model = genAI.getGenerativeModel({ model: "gemini-2.5-pro" });

// --- API Endpoint for Itinerary Generation ---
app.post('/generate', async (req, res) => {
  try {
    // Extract user inputs from the request body
    const { destination, budget, days, interests } = req.body;

    // --- Prompt Engineering: The Art of Asking the AI ---
    // We create a detailed prompt to guide the AI to give us the best response,
    // specifying the exact format we want (JSON).
    const prompt = `
      You are an expert travel planner specializing in creating personalized itineraries in India.
      Your goal is to generate a detailed, day-by-day travel plan based on user preferences.
      The output MUST be a valid JSON object, with no markdown formatting or any text outside the JSON structure.

      User Preferences:
      - Destination: ${destination}
      - Trip Duration: ${days} days
      - Total Budget: INR ${budget}
      - Key Interests: ${interests}

      JSON Output Structure Requirements:
      {
        "tripTitle": "A Wonderful X-Day Trip to [Destination]",
        "totalEstimatedCost": <total_estimated_cost_in_inr>,
        "itinerary": [
          {
            "day": 1,
            "theme": "<A theme for the day, e.g., 'Arrival & Local Exploration'>",
            "activities": [
              {
                "time": "<e.g., 'Morning' or '2:00 PM'>",
                "activity": "<Name of the activity>",
                "description": "<A brief, engaging description of the activity>",
                "estimatedCost": <cost_in_inr>
              }
            ],
            "dailyTotalCost": <estimated_cost_for_the_day>
          }
        ],
        "accommodationSuggestion": {
          "type": "<e.g., 'Mid-Range Hotel' or 'Boutique Homestay'>",
          "name": "<A suggested name>",
          "estimatedCostPerNight": <cost_in_inr>
        },
        "summary": "<A concluding summary of the trip plan>"
      }
    `;

    // Send the prompt to the Gemini model
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();

    // Clean the response to ensure it's valid JSON
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Log the AI's raw response for debugging
    console.log("AI Response:", text);

    // Parse the cleaned text as JSON and send it to the frontend
    res.json(JSON.parse(text));

  } catch (error) {
    // Handle any errors during the API call
    console.error("Error generating itinerary:", error);
    res.status(500).json({ error: "Failed to generate itinerary. The AI may be experiencing high traffic." });
  }
});

// --- Start the Server ---
app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});