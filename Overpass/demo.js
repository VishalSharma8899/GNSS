 
// const axios = require('axios');
// const readline = require('readline');

// // Create an interface to read input from the command line
// const rl = readline.createInterface({
//   input: process.stdin,
//   output: process.stdout
// });

// // Function to ask a question and get user input
// function askQuestion(query) {
//   return new Promise(resolve => rl.question(query, resolve));
// }

// // Main function to run the program
// async function main() {
//   try {
//     // Get latitude and longitude from user
//     const lat = await askQuestion('Enter latitude: ');
//     const lon = await askQuestion('Enter longitude: ');

//     // Close the readline interface
//     rl.close();

//     // Overpass API query
//     const overpassQuery = `
//       [out:json];
//       (
//         node(around:50, ${lat}, ${lon})["highway"];
//         way(around:50, ${lat}, ${lon})["highway"];
//       );
//       out body;
//     `;

//     // Call Overpass API
//     const overpassResponse = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
//       headers: { 'Content-Type': 'text/plain' }
//     });

//     // Process and filter the Overpass API response
//     const elements = overpassResponse.data.elements;
//     const roads = elements
//       .map(element => {
//         const roadType = element.tags?.highway || 'unknown';
//         let roadCategory = 'Unknown';

//         if (['motorway', 'trunk'].includes(roadType)) {
//           roadCategory = 'National Highway';
//         } else if (['primary', 'secondary', 'tertiary', 'residential', 'service'].includes(roadType)) {
//           roadCategory = roadType.charAt(0).toUpperCase() + roadType.slice(1).replace(/_/g, ' ');
//         }

//         return {
//           id: element.id,
//           type: element.type,
//           roadType: roadType,
//           roadCategory
//         };
//       })
//       .filter(road => road.roadCategory !== 'Unknown'); // Filter out unknown categories

//     // Reverse geocoding for the coordinate
//     const place = await getPlaceNameFromCoordinates(lat, lon);

//     // Log the filtered results
//     console.log(JSON.stringify({
//       roads,
//       place
//     }, null, 2));

//   } catch (error) {
//     console.error('Error:', error.message);
//   }
// }

// // Reverse geocoding function
// async function getPlaceNameFromCoordinates(lat, lon) {
//   try {
//     const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
//       params: {
//         lat: encodeURIComponent(lat),
//         lon: encodeURIComponent(lon),
//         format: 'json'
//       }
//     });
//     return response.data.address;
//   } catch (error) {
//     console.error('Error with reverse geocoding:', error.response ? error.response.data : error.message);
//     return null;
//   }
// }

// // Run the main function
// main();
const axios = require('axios');
const readline = require('readline');

// Create an interface to read input from the command line
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Function to ask a question and get user input
function askQuestion(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

// Function to get multiple coordinates
async function getCoordinates() {
  const coordinates = [];
  let moreCoordinates = true;

  while (moreCoordinates) {
    const lat = await askQuestion('Enter latitude (or type "done" to finish): ');
    if (lat.toLowerCase() === 'done') {
      moreCoordinates = false;
    } else {
      const lon = await askQuestion('Enter longitude: ');
      coordinates.push({ lat, lon });
    }
  }

  rl.close();
  return coordinates;
}

// Main function to run the program
async function main() {
  try {
    const waypoints = await getCoordinates();

    for (const { lat, lon } of waypoints) {
      console.log(`Processing coordinates: Latitude ${lat}, Longitude ${lon}`);

      // Overpass API query
      const overpassQuery = `
        [out:json];
        (
          node(around:50, ${lat}, ${lon})["highway"];
          way(around:50, ${lat}, ${lon})["highway"];
        );
        out body;
      `;

      // Call Overpass API
      const overpassResponse = await axios.post('https://overpass-api.de/api/interpreter', overpassQuery, {
        headers: { 'Content-Type': 'text/plain' }
      });

      // Process and filter the Overpass API response
      const elements = overpassResponse.data.elements;
      const roads = elements
        .map(element => {
          const roadType = element.tags?.highway || 'unknown';
          let roadCategory = 'Unknown';

          if (['motorway', 'trunk'].includes(roadType)) {
            roadCategory = 'National Highway';
          } else if (['primary', 'secondary', 'tertiary', 'residential', 'service'].includes(roadType)) {
            roadCategory = roadType.charAt(0).toUpperCase() + roadType.slice(1).replace(/_/g, ' ');
          }

          return {
            id: element.id,
            type: element.type,
            roadType: roadType,
            roadCategory
          };
        })
        .filter(road => road.roadCategory !== 'Unknown'); // Filter out unknown categories

      // Reverse geocoding for the coordinate
      const place = await getPlaceNameFromCoordinates(lat, lon);

      // Log the filtered results
      console.log(JSON.stringify({
        coordinates: { lat, lon },
        roads,
        place
      }, null, 2));
    }

  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Reverse geocoding function
async function getPlaceNameFromCoordinates(lat, lon) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat: encodeURIComponent(lat),
        lon: encodeURIComponent(lon),
        format: 'json'
      }
    });
    return response.data.address;
  } catch (error) {
    console.error('Error with reverse geocoding:', error.response ? error.response.data : error.message);
    return null;
  }
}

// Run the main function
main();
