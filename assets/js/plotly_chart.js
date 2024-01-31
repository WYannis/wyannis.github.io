// plotly_charts.js

// Function to calculate linear regression
function linearRegression(x, y) {
    const n = x.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

    for (let i = 0; i < n; i++) {
        sumX += x[i];
        sumY += y[i];
        sumXY += x[i] * y[i];
        sumXX += x[i] * x[i];
    }

    const m = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const b = (sumY - m * sumX) / n;

    const trendline = x.map(x => m * x + b);

    return {trendline, m, b};
}

// Function to get a color scale
// Define a custom array of bright and distinct colors
const customColors = ['#1f78b4', '#33a02c', '#e31a1c', '#ff7f00'];

// Function to get a color scale with custom colors
function getColorScale(numColors) {
  // Use the customColors array as the range
  const colorScale = d3.scaleOrdinal().domain([...Array(numColors).keys()]).range(customColors);
  return Array.from({ length: numColors }, (_, index) => colorScale(index));
}

// Load data from data.json
fetch('../data/data_emails.json')
    .then(response => response.json())
    .then(data => {
        // Populate the dropdown selector with unique values from column D
        const selector = document.getElementById('category-selector');
        const uniqueCategories = [...new Set(data.map(entry => entry.hotel))];
        // Define colorScale outside the updatePlot function
         // Group data by unique values of column C
        const uniqueCValuesTotal = [...new Set(data.map(entry => entry.sentiment_label))];
        const colorScale = getColorScale(uniqueCValuesTotal.length);

        uniqueCategories.forEach(category => {
            const option = document.createElement('option');
            option.value = category;
            option.text = category;
            selector.appendChild(option);
        });

        // Set the default value for the category-selector (e.g., the first category)
        selector.value = uniqueCategories[0];

        // Define the updatePlot function
        function updatePlot() {
            // Remove existing plot
            Plotly.purge('scatter-plot');

            const selectedCategory = selector.value;
            const filteredData = data.filter(entry => entry.hotel === selectedCategory);

            // Group data by unique values of column C
            const traces = [];

            uniqueCValuesTotal.forEach((cValue, index) => {
                const traceData = filteredData.filter(entry => entry.sentiment_label === cValue);

                traces.push({
                    x: traceData.map(entry => entry.formality_score),
                    y: traceData.map(entry => entry.click_to_open_rate),
                    mode: 'markers',
                    name: cValue,
                    marker: {
                        size: 10,
                        color: colorScale[index],
                    },
                    type: 'scatter'
                });
            });

            // Add a trace for the linear regression trend line
            const allData = filteredData.reduce((acc, curr) => {
                acc.x.push(curr.formality_score);
                acc.y.push(curr.click_to_open_rate);
                return acc;
            }, {x: [], y: []});

            const {trendline, m, b} = linearRegression(allData.x, allData.y);

            const trendlineTrace = {
                x: allData.x,
                y: trendline,
                mode: 'lines',
                name: 'Linear Regression',
                hovertemplate: `Equation: y = ${m.toFixed(2)}x + ${b.toFixed(2)}`,
                line: {
                    dash: 'dash',
                    width: 2,
                },
                type: 'scatter'
            };

            traces.push(trendlineTrace);


            const layout = {
                title: `<b>${selectedCategory}</b> hotel - Relationship between formality <br> and customer engagement for different sentiment classes`,
                xaxis: {title: 'Formality score'},
                yaxis: {title: 'Click when opened rate (%)'},
                legend: {
                    title: {
                        text: 'Sentiment class',
                        side: 'top',
                    },
                },
                showlegend: true
            };

            // Update the selected category info
            const selectedCategoryInfo = document.getElementById('hotel-selected-description')
            if (selectedCategory === 'Apex') {
                selectedCategoryInfo.innerHTML = "<b><i>• APEX </i></b>: A range of high-standards hotels in many cities around the UK. Its target audience remains in the upper bracket, with some very exclusive rooms and others more accessible.";
            } else if (selectedCategory === 'Crieff Hydro') {
                selectedCategoryInfo.innerHTML = "<b><i>• Crieff Hydro </i></b>: 4-stars hotel situated in Perthshire, the property is luxurious and proposes many extra services in addition of lodging. Probably the most selective hotel with the wealthiest clientele among the four.";
            } else if (selectedCategory === 'Town and Country'){
                selectedCategoryInfo.innerHTML = "<b><i>• Town and Country </i></b>: Small collective which acquired several traditional properties to offer lodging and organise events. It is the most accessible and convivial out of the 4 hotels in the data.";
            }
            else {
                selectedCategoryInfo.innerHTML = "<b><i>• Qhotels </i></b>: They have the largest client base out of the 4 hotels in the dataset, and by far. Its hotels and services are aimed to be accessible for a middle bracket audience.";
            }

            Plotly.newPlot('scatter-plot', traces, layout);
        }

        // Create initial scatter plot with the default category
        updatePlot();

        // Add event listener for dropdown selector
        selector.addEventListener('change', updatePlot);
    })
    .catch(error => console.error('Error fetching data:', error));



