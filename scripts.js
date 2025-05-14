/* Web Development 2.1 – Project
    Restcountries.com API: https://restcountries.com/#rest-countries
    The webpage should access the API and display an appropriate subset of the
    country   information. It should have features to search by various attributes e.g. country
    name, language, capital city, currency etc.

    Open-Meteo API (Free Weather API): https://open-meteo.com/
    Use this API to add weather information to the countries data above. Use Chart.js to
    plot chart data e.g. min and max temperatures for the next week. (See Appendix for
    ore information on Chart.js).

    Author - Nagasai  (a00316625)
    2024 TUS Athlone  
   
*/
// This function will load and display a list of all countries using the REST Countries API.
async function loadAllCountries() {
    
    const countryInfoDiv = document.getElementById('country-info');
    const response = await fetch('https://restcountries.com/v3.1/all');
    const countries = await response.json();

    countryInfoDiv.innerHTML = countries.map(country => {
        const flag = country.flags ? country.flags.png : ''; // the way im getting each flag without having an image folder as its getting the flags straight from the REST api
        return `
            <div class="country-item">
                <img src="${flag}" alt="${country.name.common} flag" class="country-flag">
                <h2>${country.name.common}</h2>
            </div>
        `;
    }).join('');

     // these are the event listeners after the DOM is updated
     document.querySelectorAll('.country-item').forEach(item => {
        item.addEventListener('click', () => {
            const countryName = item.querySelector('h2').textContent;
            console.log('Country clicked:', countryName);
            showModal(countryName);
        });
    });
}

let weatherChart;

// Function to show a modal with detailed information about a choosen country.
function showModal(countryName) {
    // Get the modal and its elements from the HTML.
    const modal = document.getElementById('country-modal');
    const modalCountryInfo = document.getElementById('modal-country-info');
    const modalWeatherChartCanvas = document.getElementById('modal-weather-chart');

    // Fetch country details using the country name from the REST Countries API.
    fetch(`https://restcountries.com/v3.1/name/${countryName}`)
        .then(response => response.json()) // this will change the API response to JSON format.
        .then(countryData => {
            // Find the country that matches the given name. Use the first country if no exact match.
            const country = countryData.find(c => c.name.common.toLowerCase() === countryName.toLowerCase()) || countryData[0];
            
            // Get the country's capital, latitude/longitude, and flag image. Use defaults if not available.
            const capital = country.capital ? country.capital[0] : 'N/A';
            const latlng = country.latlng ? country.latlng : [0, 0];
            const flag = country.flags ? country.flags.png : '';

            // Update the modal with the country's details.
            modalCountryInfo.innerHTML = `
                <h2>${country.name.common}</h2>
                <img src="${flag}" alt="${country.name.common} flag">
                <div style="display: flex; flex-wrap: wrap;">
                    <div style="flex: 1; min-width: 150px; padding: 5px;">
                        <strong>Capital:</strong> ${capital}
                    </div>
                    <div style="flex: 1; min-width: 150px; padding: 5px;">
                        <strong>Region:</strong> ${country.region}
                    </div>
                    <div style="flex: 1; min-width: 150px; padding: 5px;">
                        <strong>Population:</strong> ${country.population.toLocaleString()}
                    </div>
                    <div style="flex: 1; min-width: 150px; padding: 5px;">
                        <strong>Languages:</strong> ${Object.values(country.languages || {}).join(', ')}
                    </div>
                    <div style="flex: 1; min-width: 150px; padding: 5px;">
                        <strong>Currency:</strong> ${Object.values(country.currencies || {}).map(c => c.name).join(', ')}
                    </div>
                </div>
                <h3>Weather Data for 7 Days</h3>
            `;

            // Fetch the 7-day weather data for the country's location (latitude and longitude).
            return fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latlng[0]}&longitude=${latlng[1]}&daily=temperature_2m_max,temperature_2m_min&timezone=auto`);
        })
        .then(weatherResponse => weatherResponse.json()) // Convert the weather API response to JSON.
        .then(weatherData => {
            // Get the weather data: dates, maximum, and minimum temperatures.
            const labels = weatherData.daily.time;
            const maxTemps = weatherData.daily.temperature_2m_max;
            const minTemps = weatherData.daily.temperature_2m_min;

            // If there's an existing weather chart, remove it before creating a new one.
            if (weatherChart) {
                weatherChart.destroy();
            }

            // Create a new line chart for the weather data using Chart.js.
            weatherChart = new Chart(modalWeatherChartCanvas, {
                type: 'line', 
                data: {
                    labels: labels, 
                    datasets: [
                        {
                            label: 'Max Temperature', 
                            data: maxTemps, 
                            borderColor: 'rgba(255, 99, 132, 1)', 
                            borderWidth: 1, 
                            fill: false
                        },
                        {
                            label: 'Min Temperature', 
                            data: minTemps, 
                            borderColor: 'rgba(54, 162, 235, 1)', 
                            borderWidth: 1, 
                            fill: false 
                        }
                    ]
                },
                options: {
                    responsive: true, 
                    maintainAspectRatio: false, 
                    scales: {
                        x: {
                            type: 'time', 
                            time: {
                                unit: 'day', 
                                tooltipFormat: 'MMM dd', 
                                displayFormats: {
                                    day: 'MMM dd' 
                                }
                            },
                            title: {
                                display: true, 
                                text: 'Date'
                            }
                        },
                        y: {
                            title: {
                                display: true, 
                                text: 'Temperature (°C)' 
                            },
                            // Set the y-axis range a bit bigger than the min and max temperatures.
                            min: Math.min(...minTemps) - 5,
                            max: Math.max(...maxTemps) + 5,
                            ticks: {
                                stepSize: 5 // Set steps of 5 for the y-axis labels.
                            }
                        }
                    }
                }
            });

            // Show the modal on the screen.
            modal.style.display = 'block';
        })
        .catch(error => console.error('Error fetching data:', error)); // Log any errors that occur.
}


// Close the country information modal
function closeModal() {
    const modal = document.getElementById('country-modal');
    modal.style.display = 'none';
}


/*
 * this changes through the displayed countries based on the search input and type.
 * and also uptades the country list and fixes event listeners.
 */
async function filterCountries() {
    const query = document.getElementById('search-input').value.toLowerCase();
    const searchType = document.getElementById('search-type').value;
    const countryInfoDiv = document.getElementById('country-info');

    // this is a variable for the API endpoint.
let endpoint;
// I used a switch statement to find the API endpoint based on the search type.
switch (searchType) {
    case 'name': // If the search type is 'name'.
        endpoint = `name/${query}`; // Use the 'name' endpoint with the value.
        break;
    case 'capital': // If the search type is 'capital'.
        endpoint = `capital/${query}`; // Use the 'capital' endpoint with the query value.
        break;
    case 'currency': // If the search type is 'currency'.
        endpoint = `currency/${query}`; // Use the 'currency' endpoint with the query value.
        break;
    case 'language': // If the search type is 'language'.
        endpoint = `lang/${query}`; // Use the 'language' endpoint with the query value.
        break;
    default: // If the search type does not match any of the given options.
        console.error('Invalid search type'); // it will show an error for the invalid search type.
        return; 
}
// I then fetch the data from the API using this endpoint.
const response = await fetch(`https://restcountries.com/v3.1/${endpoint}`);
const countries = await response.json(); // this converts the response to JSON format.

// If the search is for the capital 'Dublin'.
if (searchType === 'capital' && query === 'dublin') {
    // it will find the country where the common name is 'Ireland'.
    const correctCountry = countries.find(country => country.name.common.toLowerCase() === 'ireland');

    // Then display the country's information if found, or show No country found.
    countryInfoDiv.innerHTML = correctCountry ? `
        <div class="country-item">
            <img src="${correctCountry.flags ? correctCountry.flags.png : ''}" alt="${correctCountry.name.common} flag" class="country-flag">
            <h2>${correctCountry.name.common}</h2>
        </div>
    ` : '<p>No country found.</p>';

    // I then log the number of items loaded (1 if the country is found, 0 otherwise).
    console.log('Country items loaded:', correctCountry ? 1 : 0);
} else {
    // For other cases, it will display a list of countries returned by the API.
    countryInfoDiv.innerHTML = countries.map(country => {
        const flag = country.flags ? country.flags.png : ''; 
        return `
            <div class="country-item">
                <img src="${flag}" alt="${country.name.common} flag" class="country-flag">
                <h2>${country.name.common}</h2>
            </div>
        `;
    }).join(''); 

    // Log the total number of country items loaded.
    console.log('Country items loaded:', document.querySelectorAll('.country-item').length);
}

    // fixes event listeners after changing
    document.querySelectorAll('.country-item').forEach(item => {
        item.addEventListener('click', () => {
            const countryName = item.querySelector('h2').textContent;
            console.log('Country clicked:', countryName);
            showModal(countryName);
        });
    });
}

// Add a click event listener to the search button.
document.getElementById('search-button').addEventListener('click', async () => {
    // Get the value entered in the search input field and remove extra spaces.
    const searchInput = document.getElementById('search-input').value.trim();
    // Get the selected search type (e.g., name, capital, etc.).
    const searchType = document.getElementById('search-type').value;

    // If the search input is empty, show an error and stop the function.
    if (!searchInput) {
        alert('Please enter a search term.');
        return;
    }

    // If no valid search type is selected, show an error and stop the function.
    if (!searchType || searchType === 'default') {
        alert('Please select a valid search type.');
        return;
    }

    try {
        await filterCountries();
    } catch (error) {
        // If there's an error during the search, show an alert to the user.
        alert('An error occurred while searching. Please try again.');
    }

    // Clear the search input field after the search is completed.
    document.getElementById('search-input').value = '';

    // Re-add click event listeners to all country items after updating the list.
    document.querySelectorAll('.country-item').forEach(item => {
        item.addEventListener('click', () => {
            // Get the name of the clicked country from its heading (h2).
            const countryName = item.querySelector('h2').textContent;
            // Open a modal to show more details about the clicked country.
            showModal(countryName);
        });
    });
});

// Add a click event listener to the modal's close button to close the modal.
document.querySelector('.close-button').addEventListener('click', closeModal);

// Add a click event listener to the window to close the modal if it clicks outside it.
window.addEventListener('click', (event) => {
    const modal = document.getElementById('country-modal');
    // If it clicks anywhere outside the modal, close it.
    if (event.target === modal) {
        closeModal();
    }
});

// Call the loadAllCountries function when the page loads so that its able to display all countries at the start.
window.onload = loadAllCountries;