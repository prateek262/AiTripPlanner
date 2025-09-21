document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('planner-form');
    const loadingDiv = document.getElementById('loading');
    const resultDiv = document.getElementById('itinerary-result');
    const generateBtn = document.getElementById('generate-btn');

    form.addEventListener('submit', async (e) => {
        e.preventDefault(); // Prevent default form submission

        // 1. Get user inputs from the form
        const destination = document.getElementById('destination').value;
        const budget = document.getElementById('budget').value;
        const days = document.getElementById('days').value;
        const interests = document.getElementById('interests').value;

        // 2. Show loading indicator and disable the button
        resultDiv.classList.add('hidden');
        resultDiv.innerHTML = ''; // Clear previous results
        loadingDiv.classList.remove('hidden');
        generateBtn.disabled = true;
        generateBtn.querySelector('.btn-text').textContent = 'Generating...';

        try {
            // 3. Call the backend API
            const response = await fetch('/generate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ destination, budget, days, interests }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Something went wrong on the server.');
            }

            const data = await response.json();
            
            // 4. Render the AI-generated itinerary
            displayItinerary(data);

        } catch (error) {
            console.error('Error:', error);
            resultDiv.innerHTML = `<div class="itinerary-card"><p style="color:red;">Error: ${error.message}</p></div>`;
        } finally {
            // 5. Hide loading indicator and re-enable the button
            loadingDiv.classList.add('hidden');
            resultDiv.classList.remove('hidden');
            generateBtn.disabled = false;
            generateBtn.querySelector('.btn-text').textContent = 'Generate Itinerary';
        }
    });

    // --- Helper function to render the itinerary ---
    function displayItinerary(data) {
        let html = '';

        // Main Itinerary Card
        html += `<div class="itinerary-card">`;
        html += `<div class="itinerary-header"><h2>${data.tripTitle}</h2>`;
        html += `<p><strong>Total Estimated Cost:</strong> ₹${data.totalEstimatedCost.toLocaleString('en-IN')}</p></div>`;
        html += `<p class="itinerary-summary">${data.summary}</p>`;
        html += `</div>`;

        // Accommodation Card
        html += `<div class="itinerary-card">`;
        html += `<h3>🏠 Accommodation Suggestion</h3>`;
        html += `<p><strong>Type:</strong> ${data.accommodationSuggestion.type}</p>`;
        html += `<p><strong>Suggested:</strong> ${data.accommodationSuggestion.name}</p>`;
        html += `<p><strong>Estimated Cost per Night:</strong> ₹${data.accommodationSuggestion.estimatedCostPerNight.toLocaleString('en-IN')}</p>`;
        html += `</div>`;


        // Daily Plan
        data.itinerary.forEach(day => {
            html += `<div class="day-plan itinerary-card">`;
            html += `<h3>Day ${day.day}: ${day.theme}</h3>`;
            day.activities.forEach(activity => {
                html += `
                    <div class="activity">
                        <p><strong>${activity.time}:</strong> ${activity.activity}</p>
                        <p>${activity.description}</p>
                        <p><em>Estimated Cost: ₹${activity.estimatedCost.toLocaleString('en-IN')}</em></p>
                    </div>
                `;
            });
            html += `<p style="text-align:right; font-weight:bold;">Daily Total: ₹${day.dailyTotalCost.toLocaleString('en-IN')}</p>`;
            html += `</div>`;
        });

        resultDiv.innerHTML = html;
    }
});
